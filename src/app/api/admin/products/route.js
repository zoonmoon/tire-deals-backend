import mysql from 'mysql2/promise';

import { MYSQL_CONFIG } from '@/app/api/setup-database/mysql-db/utils';

import {
    getAuthenticatedAdmin,
} from '../auth/utils/manage-cookie';


export async function GET(request) {

    let connection;


    try {

        // ============================================================
        // ADMIN AUTHENTICATION
        // ============================================================

        const admin =
            await getAuthenticatedAdmin();


        if (!admin) {

            return Response.json(
                {
                    success: false,
                    message: 'Authentication required.',
                },
                {
                    status: 401,
                }
            );

        }


        // ============================================================
        // URL PARAMETERS
        // ============================================================

        const { searchParams } =
            new URL(request.url);


        // ============================================================
        // PAGINATION
        // ============================================================

        let page =
            parseInt(
                searchParams.get('page') || '1',
                10
            );


        let limit =
            parseInt(
                searchParams.get('limit') || '25',
                10
            );


        // ------------------------------------------------------------
        // VALIDATE PAGE
        // ------------------------------------------------------------

        if (
            !Number.isInteger(page) ||
            page < 1
        ) {

            page = 1;

        }


        // ------------------------------------------------------------
        // VALIDATE LIMIT
        // ------------------------------------------------------------

        if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 100
        ) {

            limit = 25;

        }


        const offset =
            (page - 1) * limit;


        // ============================================================
        // FILTERS
        // ============================================================

        const search =
            String(
                searchParams.get('search') || ''
            ).trim();


        const status =
            String(
                searchParams.get('status') || ''
            ).trim();


        const mappingStatus =
            String(
                searchParams.get('mapping_status') || ''
            ).trim();


        // ============================================================
        // DATABASE CONNECTION
        // ============================================================

        connection =
            await mysql.createConnection(
                MYSQL_CONFIG
            );


        // ============================================================
        // BUILD WHERE CLAUSE
        // ============================================================

        const conditions = [];

        const parameters = [];


        // ============================================================
        // SEARCH
        //
        // Searches:
        // - manufacturer
        // - item
        // - size
        // - description
        // ============================================================

        if (search) {

            conditions.push(`
                (
                    manufacturer LIKE ?
                    OR item LIKE ?
                    OR size LIKE ?
                    OR description LIKE ?
                )
            `);


            const searchValue =
                `%${search}%`;


            parameters.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue
            );

        }


        // ============================================================
        // PRODUCT STATUS
        // ============================================================

        if (status) {

            conditions.push(
                `status = ?`
            );


            parameters.push(
                status
            );

        }


        // ============================================================
        // OPENSEARCH MAPPING STATUS
        // ============================================================

        if (mappingStatus) {

            conditions.push(
                `opensearch_mapping_status = ?`
            );


            parameters.push(
                mappingStatus
            );

        }


        // ============================================================
        // WHERE CLAUSE
        // ============================================================

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';


        // ============================================================
        // FETCH ONE EXTRA ROW
        //
        // Example:
        //
        // limit = 25
        // fetch 26
        //
        // 25 rows -> no next page
        // 26 rows -> next page exists
        // ============================================================

        const fetchLimit =
            limit + 1;


        // ============================================================
        // QUERY
        // ============================================================

        const query = `
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

            LIMIT ${fetchLimit}

            OFFSET ${offset}
        `;


        // ============================================================
        // EXECUTE QUERY
        // ============================================================

        const [rows] =
            await connection.execute(
                query,
                parameters
            );


        // ============================================================
        // PAGINATION
        // ============================================================

        const hasNext =
            rows.length > limit;


        const hasPrevious =
            page > 1;


        // ============================================================
        // REMOVE EXTRA ROW
        // ============================================================

        const products =
            rows.slice(
                0,
                limit
            );


        // ============================================================
        // SUCCESS
        // ============================================================

        return Response.json({

            success: true,

            products,

            pagination: {

                page,

                limit,

                has_previous:
                    hasPrevious,

                has_next:
                    hasNext,

            },

        });


    } catch (error) {

        console.error(
            'Admin products error:',
            error
        );


        return Response.json(
            {
                success: false,

                message:
                    'Unable to retrieve products.',
            },
            {
                status: 500,
            }
        );


    } finally {

        if (connection) {

            await connection.end();

        }

    }

}