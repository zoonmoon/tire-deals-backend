import mysql from 'mysql2/promise';

import { MYSQL_CONFIG } from '@/app/api/setup-database/mysql-db/utils';

import { getAuthenticatedAdmin } from '../../../../auth/utils/manage-cookie';


// ============================================================
// CANCEL / DELETE FULFILLMENT
// ============================================================

export async function DELETE(request, { params }) {

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
        // Make sure the fulfillment actually belongs to this
        // order.
        //
        // FOR UPDATE prevents another request from modifying
        // the fulfillment simultaneously.
        // ========================================================

        const [fulfillmentRows] =
            await connection.execute(

                `

                SELECT

                    id,

                    order_id,

                    status

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

        //

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
        // ONLY IN-PROGRESS FULFILLMENTS CAN BE CANCELLED
        //
        // Your newly created fulfillment currently uses
        // "pending" as its initial status.
        //
        // Therefore allow pending / processing to be cancelled.
        // ========================================================

        const cancellableStatuses = [
            'pending',
            'processing',
            'in_progress'
        ];


        if (
            !cancellableStatuses.includes(
                fulfillment.status
            )
        ) {

            await connection.rollback();

            return Response.json(
                {
                    success: false,

                    message:
                        `Fulfillment cannot be cancelled because its current status is "${fulfillment.status}".`,
                },
                {
                    status: 400,
                }
            );

        }


        // ========================================================
        // DELETE FULFILLMENT
        //
        // fulfillment_items are automatically deleted because:
        //
        // fulfillment_items.fulfillment_id
        //     REFERENCES fulfillments(id)
        //     ON DELETE CASCADE
        //
        // So we only need to delete the fulfillment itself.
        // ========================================================

        const [deleteResult] =
            await connection.execute(

                `

                DELETE FROM fulfillments

                WHERE id = ?

                AND order_id = ?

                `,

                [
                    fulfillmentId,
                    orderId,
                ]

            );


        if (
            deleteResult.affectedRows === 0
        ) {

            await connection.rollback();

            return Response.json(
                {
                    success: false,
                    message:
                        'Fulfillment could not be cancelled.',
                },
                {
                    status: 400,
                }
            );

        }


        // ========================================================
        // RECALCULATE ORDER FULFILLMENT STATUS
        //
        // Since the fulfillment has been deleted, its quantities
        // no longer count toward fulfillment.
        // ========================================================

        const [fulfillmentSummaryRows] =
            await connection.execute(

                `

                SELECT

                    oi.id,

                    oi.quantity AS ordered_quantity,

                    COALESCE(
                        SUM(fi.quantity),
                        0
                    ) AS fulfilled_quantity

                FROM order_items oi

                LEFT JOIN fulfillment_items fi

                    ON fi.order_item_id = oi.id

                LEFT JOIN fulfillments f

                    ON f.id = fi.fulfillment_id

                    AND f.order_id = ?

                WHERE oi.order_id = ?

                AND oi.type = 'product'

                GROUP BY

                    oi.id,

                    oi.quantity

                `,

                [
                    orderId,
                    orderId,
                ]

            );


        let allFulfilled = true;

        let anyFulfilled = false;


        for (
            const row
            of fulfillmentSummaryRows
        ) {

            const orderedQuantity =
                Number(
                    row.ordered_quantity
                );


            const fulfilledQuantity =
                Number(
                    row.fulfilled_quantity
                );


            if (
                fulfilledQuantity > 0
            ) {

                anyFulfilled = true;

            }


            if (
                fulfilledQuantity <
                orderedQuantity
            ) {

                allFulfilled = false;

            }

        }


        let fulfillmentStatus;


        if (
            allFulfilled &&
            fulfillmentSummaryRows.length > 0
        ) {

            fulfillmentStatus =
                'fulfilled';

        }
        else if (anyFulfilled) {

            fulfillmentStatus =
                'partially_fulfilled';

        }
        else {

            fulfillmentStatus =
                'unfulfilled';

        }


        // ========================================================
        // UPDATE ORDER FULFILLMENT STATUS
        // ========================================================

        await connection.execute(

            `

            UPDATE orders

            SET fulfillment_status = ?

            WHERE id = ?

            `,

            [
                fulfillmentStatus,
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
                    'Fulfillment cancelled successfully.',

                fulfillment_id:
                    fulfillmentId,

                order: {

                    id:
                        orderId,

                    fulfillment_status:
                        fulfillmentStatus,

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
                    'Fulfillment cancellation rollback failed:',
                    rollbackError
                );

            }

        }


        console.error(
            'Cancel fulfillment error:',
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    'Unable to cancel fulfillment.',
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