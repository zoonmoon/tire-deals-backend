import mysql from 'mysql2/promise';
import { MYSQL_CONFIG } from '../../setup-database/mysql-db/utils';


export async function GET(request) {

    const { searchParams } = new URL(request.url);

    // =========================
    // Pagination
    // =========================

    const page = Math.max(
        parseInt(searchParams.get('page') || '1', 10),
        1
    );

    const limit = Math.min(
        Math.max(
            parseInt(searchParams.get('limit') || '50', 10),
            1
        ),
        100
    );

    const offset = (page - 1) * limit;


    // =========================
    // Filters
    // =========================

    const search = searchParams.get('search')?.trim() || '';

    const status = searchParams.get('status')?.trim() || '';

    const mappingStatus =
        searchParams.get('mapping_status')?.trim() || '';

    const connection = await mysql.createConnection(
        MYSQL_CONFIG
    );


    try {

        // =========================
        // Build WHERE conditions
        // =========================

        const conditions = [];

        const values = [];

        // Search
        //
        // Search by:
        // manufacturer
        // item
        // size
        // description

        if (search) {

            conditions.push(`
                (
                    manufacturer LIKE ?
                    OR item LIKE ?
                    OR size LIKE ?
                    OR description LIKE ?
                )
            `);

            const searchValue = `%${search}%`;

            values.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue
            );

        }

        // Product status
        //
        // active
        // archived

        if (status) {

            conditions.push(
                `status = ?`
            );

            values.push(status);

        }


        // OpenSearch mapping status
        //
        // pending
        // matched
        // review
        // not_found

        if (mappingStatus) {

            conditions.push(
                `opensearch_mapping_status = ?`
            );

            values.push(mappingStatus);

        }


        // =========================
        // WHERE clause
        // =========================

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';


        // =========================
        // Get total count
        // =========================

        const [countRows] = await connection.execute(
            `
            SELECT COUNT(*) AS total
            FROM tire_inventory
            ${whereClause}
            `,
            values
        );


        const total = Number(
            countRows[0].total
        );


        // =========================
        // Get products
        // =========================



        const [products] = await connection.execute(
            `
            SELECT
                id,
                manufacturer,
                item,
                size,
                description,
                opensearch_id,
                price,
                fet,
                quantity,
                opensearch_mapping_status,
                status,
                created_at,
                updated_at
            FROM tire_inventory

            ${whereClause}

            ORDER BY id DESC

            LIMIT ${limit} OFFSET ${offset}
            `,
            values
        );



        // =========================
        // Pagination
        // =========================

        const totalPages = Math.ceil(
            total / limit
        );


        return Response.json({

            products,

            pagination: {
                page,
                limit,
                total,
                totalPages,

                hasNextPage:
                    page < totalPages,

                hasPreviousPage:
                    page > 1
            }

        });


    } catch (error) {

        console.error(
            'Failed to fetch tire inventory:',
            error
        );


        return Response.json(

            {
                error:
                    'Failed to fetch products'
            },

            {
                status: 500
            }

        );


    } finally {

        await connection.end();

    }

}