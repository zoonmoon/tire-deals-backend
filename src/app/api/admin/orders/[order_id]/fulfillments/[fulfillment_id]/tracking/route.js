import mysql from 'mysql2/promise';

import { MYSQL_CONFIG } from '@/app/api/setup-database/mysql-db/utils';


import { getAuthenticatedAdmin } from '@/app/api/admin/auth/utils/manage-cookie';

// ============================================================
// UPDATE FULFILLMENT TRACKING
// ============================================================

export async function PATCH(request, { params }) {

    let connection;


    try {

        // ========================================================
        // ADMIN AUTHENTICATION
        // ========================================================

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


        // ========================================================
        // URL PARAMETERS
        // ========================================================

        const {
            order_id,
            fulfillment_id,
        } = await params;


        const orderId =
            Number(order_id);

        const fulfillmentId =
            Number(fulfillment_id);


        if (
            !Number.isInteger(orderId) ||
            orderId <= 0
        ) {

            return Response.json(
                {
                    success: false,
                    message: 'Invalid order ID.',
                },
                {
                    status: 400,
                }
            );

        }


        if (
            !Number.isInteger(fulfillmentId) ||
            fulfillmentId <= 0
        ) {

            return Response.json(
                {
                    success: false,
                    message: 'Invalid fulfillment ID.',
                },
                {
                    status: 400,
                }
            );

        }


        // ========================================================
        // REQUEST BODY
        // ========================================================

        const body =
            await request.json();


        const {
            carrier = null,
            service = null,
            tracking_number = null,
            tracking_url = null,
        } = body;


        // ========================================================
        // VALIDATE TRACKING NUMBER
        // ========================================================

        if (
            tracking_number !== null &&
            typeof tracking_number !== 'string'
        ) {

            return Response.json(
                {
                    success: false,
                    message: 'Invalid tracking number.',
                },
                {
                    status: 400,
                }
            );

        }


        // ========================================================
        // VALIDATE TRACKING URL
        // ========================================================

        if (
            tracking_url !== null &&
            typeof tracking_url !== 'string'
        ) {

            return Response.json(
                {
                    success: false,
                    message: 'Invalid tracking URL.',
                },
                {
                    status: 400,
                }
            );

        }


        // ========================================================
        // DATABASE CONNECTION
        // ========================================================

        connection =
            await mysql.createConnection(
                MYSQL_CONFIG
            );


        // ========================================================
        // START TRANSACTION
        // ========================================================

        await connection.beginTransaction();


        // ========================================================
        // GET FULFILLMENT
        //
        // Make sure the fulfillment belongs to this order.
        // Lock it while updating.
        // ========================================================

        const [fulfillmentRows] =
            await connection.execute(

                `

                SELECT

                    id,

                    order_id,

                    status,

                    carrier,

                    service,

                    tracking_number,

                    tracking_url

                FROM fulfillments

                WHERE id = ?

                AND order_id = ?

                FOR UPDATE

                `,

                [
                    fulfillmentId,
                    orderId,
                ]

            );


        // ========================================================
        // FULFILLMENT NOT FOUND
        // ========================================================

        if (
            fulfillmentRows.length === 0
        ) {

            await connection.rollback();

            return Response.json(
                {
                    success: false,
                    message: 'Fulfillment not found.',
                },
                {
                    status: 404,
                }
            );

        }


        const fulfillment =
            fulfillmentRows[0];


        // ========================================================
        // CANNOT UPDATE CANCELLED FULFILLMENT
        // ========================================================

        if (
            fulfillment.status ===
            'cancelled'
        ) {

            await connection.rollback();

            return Response.json(
                {
                    success: false,
                    message:
                        'Tracking information cannot be updated for a cancelled fulfillment.',
                },
                {
                    status: 400,
                }
            );

        }


        // ========================================================
        // UPDATE TRACKING
        // ========================================================

        await connection.execute(

            `

            UPDATE fulfillments

            SET

                carrier = ?,

                service = ?,

                tracking_number = ?,

                tracking_url = ?

            WHERE id = ?

            AND order_id = ?

            `,

            [

                carrier !== null
                    ? carrier.trim() || null
                    : null,

                service !== null
                    ? service.trim() || null
                    : null,

                tracking_number !== null
                    ? tracking_number.trim() || null
                    : null,

                tracking_url !== null
                    ? tracking_url.trim() || null
                    : null,

                fulfillmentId,

                orderId,

            ]

        );


        // ========================================================
        // COMMIT
        // ========================================================

        await connection.commit();


        // ========================================================
        // SUCCESS
        // ========================================================

        return Response.json(
            {
                success: true,

                message:
                    'Tracking information updated successfully.',

                fulfillment: {

                    id:
                        fulfillmentId,

                    order_id:
                        orderId,

                    carrier:
                        carrier !== null
                            ? carrier.trim() || null
                            : null,

                    service:
                        service !== null
                            ? service.trim() || null
                            : null,

                    tracking_number:
                        tracking_number !== null
                            ? tracking_number.trim() || null
                            : null,

                    tracking_url:
                        tracking_url !== null
                            ? tracking_url.trim() || null
                            : null,

                },

            },
            {
                status: 200,
            }
        );


    } catch (error) {

        // ========================================================
        // ROLLBACK
        // ========================================================

        if (connection) {

            try {

                await connection.rollback();

            } catch (rollbackError) {

                console.error(
                    'Tracking update rollback failed:',
                    rollbackError
                );

            }

        }


        console.error(
            'Update fulfillment tracking error:',
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    'Unable to update tracking information.',
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