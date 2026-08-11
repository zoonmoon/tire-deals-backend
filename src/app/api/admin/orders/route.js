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


        // ============================================================
        // PAYMENT STATUS
        //
        // Default:
        //
        // paid
        //
        // Because orders are created when the customer reaches
        // the payment step, pending orders may simply be abandoned
        // checkouts.
        //
        // To retrieve another payment status, explicitly provide:
        //
        // ?payment_status=pending
        //
        // To retrieve all payment statuses:
        //
        // ?payment_status=all
        // ============================================================

        const paymentStatus =
            String(
                searchParams.get('payment_status') || 'paid'
            ).trim();


        const fulfillmentStatus =
            String(
                searchParams.get('fulfillment_status') || ''
            ).trim();


        const dateFrom =
            String(
                searchParams.get('date_from') || ''
            ).trim();


        const dateTo =
            String(
                searchParams.get('date_to') || ''
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
        // - Order number
        // - Customer email
        // ============================================================

        if (search) {

            conditions.push(`
                (
                    order_number LIKE ?
                    OR customer_email LIKE ?
                )
            `);


            const searchValue =
                `%${search}%`;


            parameters.push(
                searchValue,
                searchValue
            );

        }


        // ============================================================
        // ORDER STATUS
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
        // PAYMENT STATUS
        // ============================================================

        if (
            paymentStatus &&
            paymentStatus !== 'all'
        ) {

            conditions.push(
                `payment_status = ?`
            );


            parameters.push(
                paymentStatus
            );

        }


        // ============================================================
        // FULFILLMENT STATUS
        // ============================================================

        if (fulfillmentStatus) {

            conditions.push(
                `fulfillment_status = ?`
            );


            parameters.push(
                fulfillmentStatus
            );

        }


        // ============================================================
        // DATE FROM
        // ============================================================

        if (dateFrom) {

            conditions.push(
                `created_at >= ?`
            );


            parameters.push(
                `${dateFrom} 00:00:00`
            );

        }


        // ============================================================
        // DATE TO
        // ============================================================

        if (dateTo) {

            conditions.push(
                `created_at < DATE_ADD(?, INTERVAL 1 DAY)`
            );


            parameters.push(
                dateTo
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
        //
        // Fetch 26.
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

                order_number,

                customer_id,

                customer_email,

                delivery_method,

                delivery_location_id,

                status,

                payment_status,

                fulfillment_status,

                currency,

                subtotal,

                discount_total,

                shipping_total,

                tax_total,

                grand_total,

                shipping_first_name,

                shipping_last_name,

                shipping_city,

                shipping_state,

                shipping_postcode,

                shipping_country,

                created_at,

                updated_at

            FROM orders

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

        const orders =
            rows.slice(
                0,
                limit
            );


        // ============================================================
        // SUCCESS
        // ============================================================

        return Response.json({

            success: true,

            orders,

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
            'Admin orders error:',
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    'Unable to retrieve orders.',
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