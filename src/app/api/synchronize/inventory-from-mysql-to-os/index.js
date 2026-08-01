
import mysql from "mysql2/promise";

import openSearchClient from "../../setup-database/_lib/route";
import { MYSQL_CONFIG } from "../../setup-database/mysql-db/utils";


// ======================================================
// Configuration
// ======================================================

const INDEX_NAME = "all_tires";

const BATCH_SIZE = 500;

const MAX_RETRIES = 5;


// ======================================================
// Sleep
// ======================================================

function sleep(ms) {

    return new Promise(resolve => {

        setTimeout(resolve, ms);

    });

}


// ======================================================
// Fetch MySQL inventory
//
// Only fetch rows that are already mapped to OpenSearch.
//
// We use keyset pagination:
//     id > lastId
//
// This avoids OFFSET performance problems.
// ======================================================

async function fetchInventoryBatch(
    connection,
    lastId
) {

    const [rows] =
        await connection.execute(

            `

                SELECT

                    id,

                    opensearch_id,

                    price,

                    quantity,

                    status

                FROM tire_inventory

                WHERE

                    id > ?

                AND

                    opensearch_id IS NOT NULL

                AND

                    opensearch_id != ''

                AND

                    opensearch_mapping_status = 'matched'

                ORDER BY

                    id ASC

                LIMIT ${BATCH_SIZE}

            `,

            [
                lastId
            ]

        );


    return rows;

}


// ======================================================
// Bulk update OpenSearch
//
// IMPORTANT:
//
// This uses "update", NOT "index".
//
// It also does NOT use:
//
//     doc_as_upsert: true
//
// Therefore:
//
// If OpenSearch ID exists:
//     → document gets updated
//
// If OpenSearch ID does NOT exist:
//     → OpenSearch returns a 404/error for that item
//
// No new OpenSearch documents are created.
// ======================================================

async function bulkUpdateOpenSearch(
    rows,
    attempt = 1
) {

    try {


        const bulkBody = [];


        // ==================================================
        // Build bulk update operations
        // ==================================================

        for (
            const row of rows
        ) {


            // ==============================================
            // Update metadata
            // ==============================================

            bulkBody.push({

                update: {

                    _index:
                        INDEX_NAME,

                    _id:
                        String(
                            row.opensearch_id
                        )

                }

            });


            // ==============================================
            // Document fields to update
            //
            // NO doc_as_upsert
            // ==============================================

            bulkBody.push({

                doc: {

                    price:
                        Number(
                            row.price ?? 0
                        ),

                    quantity:
                        Number(
                            row.quantity ?? 0
                        ),

                    status:
                        row.status

                }

            });

        }


        // ==================================================
        // ONE BULK REQUEST
        // ==================================================

        const response =
            await openSearchClient.bulk({

                body:
                    bulkBody

            });


        const responseBody =
            response.body ??
            response;


        const items =
            responseBody.items ??
            [];


        let updated = 0;

        let notFound = 0;

        let failed = 0;


        // ==================================================
        // Analyze individual bulk results
        //
        // Bulk API can return HTTP 200 even when some
        // individual update operations fail.
        // ==================================================

        for (
            let i = 0;

            i < items.length;

            i++
        ) {


            const item =
                items[i];


            const result =
                item.update;


            // ==============================================
            // Successful update
            // ==============================================

            if (
                !result?.error
            ) {

                updated++;

                continue;

            }


            // ==============================================
            // OpenSearch document does not exist
            //
            // Usually status 404
            // ==============================================

            if (
                result.status === 404
            ) {


                notFound++;


                console.warn(

                    `⚠️ OpenSearch document not found: ` +

                    `${result._id}`

                );


                continue;

            }


            // ==============================================
            // Other error
            // ==============================================

            failed++;


            console.error(

                `❌ OpenSearch update failed: ` +

                `${result._id}`,

                result.error

            );

        }


        return {

            updated,

            notFound,

            failed

        };


    } catch (error) {


        console.error(

            `❌ OpenSearch bulk request failed. ` +

            `Attempt ${attempt}/${MAX_RETRIES}`,

            error.message

        );


        if (
            attempt >= MAX_RETRIES
        ) {

            throw error;

        }


        const delay =
            1000 *
            Math.pow(
                2,
                attempt - 1
            );


        console.log(

            `Retrying bulk update after ${delay}ms`

        );


        await sleep(
            delay
        );


        return bulkUpdateOpenSearch(

            rows,

            attempt + 1

        );

    }

}


// ======================================================
// Process one MySQL batch
// ======================================================

async function processBatch(
    rows
) {


    if (
        rows.length === 0
    ) {

        return {

            updated:
                0,

            notFound:
                0,

            failed:
                0

        };

    }


    console.log(

        `🔄 Updating ${rows.length} OpenSearch documents`

    );


    // ==================================================
    // Directly send all rows to OpenSearch Bulk API
    //
    // NO existence check
    // NO mget
    // NO exists()
    // ==================================================

    const result =
        await bulkUpdateOpenSearch(

            rows

        );


    console.log(

        `📊 Batch complete | ` +

        `Updated: ${result.updated} | ` +

        `Not Found: ${result.notFound} | ` +

        `Failed: ${result.failed}`

    );


    return result;

}


// ======================================================
// MAIN MYSQL → OPENSEARCH INVENTORY SYNC
// ======================================================

export default async function syncMysqlInventoryToOpenSearch() {


    let connection;


    let lastId = 0;


    let totalProcessed = 0;

    let totalUpdated = 0;

    let totalNotFound = 0;

    let totalFailed = 0;


    try {


        // ==================================================
        // Connect MySQL
        // ==================================================

        connection =
            await mysql.createConnection(

                MYSQL_CONFIG

            );


        console.log(

            "🚀 Starting MySQL → OpenSearch inventory sync"

        );


        console.log(

            `📦 Batch size: ${BATCH_SIZE}`

        );


        // ==================================================
        // Process all batches
        // ==================================================

        while (true) {


            // ==============================================
            // Fetch next 500 MySQL rows
            // ==============================================

            const rows =
                await fetchInventoryBatch(

                    connection,

                    lastId

                );


            // ==============================================
            // No more rows
            // ==============================================

            if (
                rows.length === 0
            ) {

                console.log(

                    "🎉 No more inventory rows to sync"

                );

                break;

            }


            console.log(

                `📦 Fetched ${rows.length} MySQL rows`

            );


            // ==============================================
            // Bulk update OpenSearch
            // ==============================================

            const result =
                await processBatch(

                    rows

                );


            // ==============================================
            // Update totals
            // ==============================================

            totalProcessed +=
                rows.length;


            totalUpdated +=
                result.updated;


            totalNotFound +=
                result.notFound;


            totalFailed +=
                result.failed;


            // ==============================================
            // Move cursor to last MySQL ID
            // ==============================================

            lastId =
                rows[
                    rows.length - 1
                ].id;


            console.log(

                `📈 Total | ` +

                `Processed: ${totalProcessed} | ` +

                `Updated: ${totalUpdated} | ` +

                `Not Found: ${totalNotFound} | ` +

                `Failed: ${totalFailed}`

            );


            console.log(

                `➡️ Last MySQL ID: ${lastId}`

            );

        }


        // ==================================================
        // Final summary
        // ==================================================

        console.log(

            "======================================"

        );


        console.log(

            "🎉 MySQL → OpenSearch inventory sync complete"

        );


        console.log(

            `Total processed: ${totalProcessed}`

        );


        console.log(

            `Total updated: ${totalUpdated}`

        );


        console.log(

            `Total OpenSearch documents not found: ${totalNotFound}`

        );


        console.log(

            `Total failed: ${totalFailed}`

        );


        console.log(

            "======================================"

        );


        return {

            success:
                true,

            totalProcessed,

            totalUpdated,

            totalNotFound,

            totalFailed

        };


    } catch (error) {


        console.error(

            "💀 MySQL → OpenSearch inventory sync failed:",

            error

        );


        throw error;


    } finally {


        if (connection) {

            await connection.end();

        }

    }

}
