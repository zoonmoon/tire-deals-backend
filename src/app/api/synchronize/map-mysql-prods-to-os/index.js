import mysql from "mysql2/promise";
import openSearchClient from "../../setup-database/_lib/route";

import manufacturerMapping from "./mapping";

import { MYSQL_CONFIG } from "../../setup-database/mysql-db/utils";

const INDEX_NAME = "all_tires";

const BATCH_SIZE = 100;

const MAX_RETRIES = 5;


// ======================================================
// Normalize values
// Must match the normalization used during OpenSearch
// AutoSync import
// ======================================================

function normalize(value) {

    const mappedValue = manufacturerMapping[value] ?? value;

    return String(mappedValue)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

}

// ======================================================
// Sleep
// ======================================================

function sleep(ms) {

    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });

}


// ======================================================
// Fetch pending MySQL inventory
// ======================================================


async function fetchPendingInventory(connection) {

    const [rows] = await connection.execute(
        `
            SELECT
                id,
                manufacturer,
                item,
                size,
                description,
                price,
                fet,
                quantity

            FROM tire_inventory

            WHERE opensearch_mapping_status = 'pending' AND status = 'active'
        
            ORDER BY id ASC

            LIMIT ${BATCH_SIZE}
        `
    );

    return rows;

}



// ======================================================
// Find OpenSearch matches
//
// We match:
//
// MySQL manufacturer
//      ↓ normalize
// OpenSearch normalized_brand
//
// MySQL item
//      ↓ normalize
// OpenSearch normalized_part_number
//
// Each MySQL row can have:
//      0 matches
//      1 match
//      multiple matches
//
// We use exact keyword matching.
// ======================================================

async function findOpenSearchMatches(
    rows,
    attempt = 1
) {

    try {

        if (rows.length === 0) {

            return [];

        }


        // --------------------------------------------------
        // Build unique mapping keys
        // --------------------------------------------------

        const uniqueKeys = new Map();


        for (const row of rows) {

            const normalizedBrand =
                normalize(row.manufacturer);


            const normalizedPartNumber =
                normalize(row.item);


            const key =
                `${normalizedBrand}|||${normalizedPartNumber}`;


            if (!uniqueKeys.has(key)) {

                uniqueKeys.set(
                    key,
                    {
                        normalizedBrand,
                        normalizedPartNumber
                    }
                );

            }

        }


        // --------------------------------------------------
        // Build OpenSearch bool/should query
        // --------------------------------------------------

        const shouldQueries =
            Array.from(uniqueKeys.values())
                .map(
                    ({
                        normalizedBrand,
                        normalizedPartNumber
                    }) => {

                        return {

                            bool: {

                                must: [

                                    {
                                        term: {
                                            normalized_brand:
                                                normalizedBrand
                                        }
                                    },

                                    {
                                        term: {
                                            normalized_part_number:
                                                normalizedPartNumber
                                        }
                                    }

                                ]

                            }

                        };

                    }
                );


        // --------------------------------------------------
        // Search OpenSearch
        //
        // We intentionally don't limit to 1 because
        // multiple matches must go to in_review.
        // --------------------------------------------------

        const response =
            await openSearchClient.search({

                index: INDEX_NAME,

                body: {

                    size: Math.max(
                        rows.length * 10,
                        1000
                    ),

                    query: {

                        bool: {

                            should:
                                shouldQueries,

                            minimum_should_match: 1

                        }

                    }

                }

            });


        const hits =
            response.body?.hits?.hits ??
            response.hits?.hits ??
            [];


        return hits;


    } catch (error) {


        console.error(
            `❌ OpenSearch mapping search failed. Attempt ${attempt}/${MAX_RETRIES}`,
            error.message
        );


        if (attempt >= MAX_RETRIES) {

            throw error;

        }


        const delay =
            1000 * Math.pow(
                2,
                attempt - 1
            );


        console.log(
            `Retrying OpenSearch mapping search after ${delay}ms`
        );


        await sleep(delay);


        return findOpenSearchMatches(
            rows,
            attempt + 1
        );

    }

}


// ======================================================
// Group OpenSearch results by mapping key
// ======================================================

function groupMatchesByKey(
    hits
) {

    const matchesByKey =
        new Map();


    for (const hit of hits) {


        const source =
            hit._source || {};


        const normalizedBrand =
            normalize(
                source.normalized_brand
            );


        const normalizedPartNumber =
            normalize(
                source.normalized_part_number
            );


        const key =
            `${normalizedBrand}|||${normalizedPartNumber}`;


        if (!matchesByKey.has(key)) {

            matchesByKey.set(
                key,
                []
            );

        }


        matchesByKey
            .get(key)
            .push({

                id:
                    hit._id,

                source

            });

    }


    return matchesByKey;

}


// ======================================================
// Update OpenSearch after successful mapping
//
// We only add these fields to successfully mapped
// OpenSearch documents:
//
// is_mysql_mapped = true
// mysql_id = MySQL row ID
// ======================================================

async function updateOpenSearchMapping(
    opensearchId,
    mysqlId,
    attempt = 1
) {

    try {


        await openSearchClient.update({

            index:
                INDEX_NAME,

            id:
                String(opensearchId),

            body: {

                doc: {

                    is_mysql_mapped:
                        true,
                    status: 'active',
                    mysql_id:
                        String(mysqlId)

                }

            }

        });


    } catch (error) {


        console.error(
            `❌ Failed to update OpenSearch document ${opensearchId}. Attempt ${attempt}/${MAX_RETRIES}`,
            error.message
        );


        if (attempt >= MAX_RETRIES) {

            throw error;

        }


        await sleep(
            1000 * attempt
        );


        return updateOpenSearchMapping(
            opensearchId,
            mysqlId,
            attempt + 1
        );

    }

}


// ======================================================
// Update MySQL after successful mapping
// ======================================================

async function markMysqlAsMatched(
    connection,
    mysqlId,
    opensearchId
) {

    await connection.execute(

        `
            UPDATE tire_inventory

            SET
                opensearch_mapping_status = 'matched',
                opensearch_id = ?

            WHERE
                id = ?

            AND
                opensearch_mapping_status = 'pending'
        `,

        [
            String(opensearchId),
            mysqlId
        ]

    );

}


// ======================================================
// Mark MySQL row as in_review
//
// IMPORTANT:
// We never automatically set not_found.
//
// Admin will later decide:
//      matched
// or
//      not_found
// ======================================================

async function markMysqlAsInReview(
    connection,
    mysqlId
) {

    await connection.execute(

        `
            UPDATE tire_inventory

            SET
                opensearch_mapping_status = 'in_review'

            WHERE
                id = ?

            AND
                opensearch_mapping_status = 'pending'
        `,

        [
            mysqlId
        ]

    );

}


// ======================================================
// Process one MySQL batch
// ======================================================

async function processBatch(
    connection,
    rows
) {


    if (rows.length === 0) {

        return {

            matched: 0,

            inReview: 0

        };

    }


    console.log(
        `🔎 Searching OpenSearch for ${rows.length} MySQL products`
    );


    // --------------------------------------------------
    // Get all OpenSearch matches for this batch
    // --------------------------------------------------

    const hits =
        await findOpenSearchMatches(
            rows
        );


    console.log(
        `🔍 OpenSearch returned ${hits.length} matching documents`
    );




    // --------------------------------------------------
    // Group OpenSearch results
    // --------------------------------------------------

    const matchesByKey =
        groupMatchesByKey(
            hits
        );


    let matchedCount = 0;

    let inReviewCount = 0;


    // --------------------------------------------------
    // Process each MySQL product
    // --------------------------------------------------

    for (const row of rows) {


        const normalizedBrand =
            normalize(
                row.manufacturer
            );


        const normalizedPartNumber =
            normalize(
                row.item
            );


        const key =
            `${normalizedBrand}|||${normalizedPartNumber}`;


        const matches =
            matchesByKey.get(key) || [];


        // ==================================================
        // EXACTLY ONE MATCH
        // ==================================================

        if (matches.length > 0) {


            const match =
                matches[0];


            console.log(

                `✅ Mapping MySQL ${row.id}` +

                ` (${row.manufacturer} / ${row.item})` +

                ` → OpenSearch ${match.id}`

            );



            // ------------------------------------------------
            // First update OpenSearch
            // ------------------------------------------------

            await updateOpenSearchMapping(

                match.id,

                row.id

            );


            // ------------------------------------------------
            // Then update MySQL
            // ------------------------------------------------

            await markMysqlAsMatched(

                connection,

                row.id,

                match.id

            );


            matchedCount++;


        }

        // ==================================================
        // ZERO MATCHES
        // ==================================================

        else if (matches.length === 0) {


            console.log(

                `⚠️ No OpenSearch match for MySQL ${row.id}` +

                ` (${row.manufacturer} / ${row.item})` +

                ` → in_review`

            );


            await markMysqlAsInReview(

                connection,

                row.id

            );


            inReviewCount++;


        }

        // ==================================================
        // MULTIPLE MATCHES
        // ==================================================

        else {


            console.log(

                `⚠️ Multiple OpenSearch matches for MySQL ${row.id}` +

                ` (${row.manufacturer} / ${row.item})` +

                ` → in_review`

            );


            console.log(

                "Possible OpenSearch IDs:",

                matches.map(
                    match => match.id
                )

            );


            await markMysqlAsInReview(

                connection,

                row.id

            );


            inReviewCount++;

        }

    }


    return {

        matched:
            matchedCount,

        inReview:
            inReviewCount

    };

}


// ======================================================
// MAIN MAPPING PIPELINE
// ======================================================

export async function mapPendingTireInventory() {

    let connection;

    let totalProcessed = 0;

    let totalMatched = 0;

    let totalInReview = 0;



    try {


        connection =
            await mysql.createConnection(
                MYSQL_CONFIG
            );


        console.log(
            "🚀 Starting MySQL → OpenSearch tire mapping"
        );


        while (true) {

            // ==============================================
            // FETCH 100 PENDING MYSQL ROWS
            // ==============================================

            const rows =
                await fetchPendingInventory(
                    connection
                );


            console.log(rows[0])
            console.log("hello")
            console.log(rows.length)

            // break; 

            // ==============================================
            // NO MORE PENDING ROWS
            // ==============================================

            if (rows.length === 0) {

                console.log(
                    "🎉 No more pending inventory rows"
                );

                break;

            }

            console.log(
                `📦 Processing batch of ${rows.length} rows`
            );

            // ==============================================
            // PROCESS BATCH
            // ==============================================

            const result =
                await processBatch(

                    connection,

                    rows

                );

            // ==============================================
            // UPDATE TOTALS
            // ==============================================

            totalProcessed +=
                rows.length;


            totalMatched +=
                result.matched;


            totalInReview +=
                result.inReview;


            console.log(

                `📊 Batch complete | ` +

                `Matched: ${result.matched} | ` +

                `In Review: ${result.inReview}`

            );


            console.log(

                `📈 Total | ` +

                `Processed: ${totalProcessed} | ` +

                `Matched: ${totalMatched} | ` +

                `In Review: ${totalInReview}`

            );


        }


        console.log(
            "======================================"
        );


        console.log(
            "🎉 MySQL → OpenSearch mapping complete"
        );


        console.log(
            `Total processed: ${totalProcessed}`
        );


        console.log(
            `Total matched: ${totalMatched}`
        );


        console.log(
            `Total in review: ${totalInReview}`
        );


        console.log(
            "======================================"
        );


        return {

            success: true,

            totalProcessed,

            totalMatched,

            totalInReview

        };


    } catch (error) {

        
        console.error(

            "💀 Tire mapping pipeline failed:",

            error

        );


        throw error;


    } finally {


        if (connection) {

            await connection.end();

        }

    }

}