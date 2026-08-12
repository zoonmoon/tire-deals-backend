import mysql from 'mysql2/promise';

import { MYSQL_CONFIG } from '@/app/api/setup-database/mysql-db/utils';


import { getAuthenticatedAdmin } from '../../../auth/utils/manage-cookie';


// ============================================================
// CREATE FULFILLMENT
// ============================================================

export async function POST(request, { params }) {

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
        // URL PARAMETER
        // ============================================================

        const { order_id } = await params;


        const orderId =
            Number(order_id);


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


        // ============================================================
        // REQUEST BODY
        // ============================================================

        const body =
            await request.json();


        const {
            items = [],

            status = 'pending',

            provider = null,

            provider_fulfillment_id = null,

            carrier = null,

            service = null,

            tracking_number = null,

            tracking_url = null,

            shipping_cost = 0,

            shipped_at = null,

            delivered_at = null,

        } = body;


        // ============================================================
        // VALIDATE ITEMS
        // ============================================================

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return Response.json(
                {
                    success: false,
                    message: 'At least one fulfillment item is required.',
                },
                {
                    status: 400,
                }
            );

        }


        // ============================================================
        // VALIDATE FULFILLMENT STATUS
        // ============================================================

        const allowedStatuses = [
            'pending',
            'processing',
            'shipped',
            'in_transit',
            'out_for_delivery',
            'delivered',
            'cancelled',
            'returned',
        ];


        if (!allowedStatuses.includes(status)) {

            return Response.json(
                {
                    success: false,
                    message: 'Invalid fulfillment status.',
                },
                {
                    status: 400,
                }
            );

        }


        // ============================================================
        // VALIDATE SHIPPING COST
        // ============================================================

        const shippingCost =
            Number(shipping_cost);


        if (
            !Number.isFinite(shippingCost) ||
            shippingCost < 0
        ) {

            return Response.json(
                {
                    success: false,
                    message: 'Invalid shipping cost.',
                },
                {
                    status: 400,
                }
            );

        }


        // ============================================================
        // NORMALIZE FULFILLMENT ITEMS
        // ============================================================

        const fulfillmentItems = [];

        const seenOrderItemIds = new Set();


        for (const item of items) {

            const orderItemId =
                Number(item.order_item_id);

            const quantity =
                Number(item.quantity);


            if (
                !Number.isInteger(orderItemId) ||
                orderItemId <= 0
            ) {

                return Response.json(
                    {
                        success: false,
                        message: 'Invalid order item ID.',
                    },
                    {
                        status: 400,
                    }
                );

            }


            if (
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {

                return Response.json(
                    {
                        success: false,
                        message:
                            `Invalid quantity for order item ${orderItemId}.`,
                    },
                    {
                        status: 400,
                    }
                );

            }


            // Prevent the same order item from being submitted twice.
            if (seenOrderItemIds.has(orderItemId)) {

                return Response.json(
                    {
                        success: false,
                        message:
                            `Order item ${orderItemId} appears more than once.`,
                    },
                    {
                        status: 400,
                    }
                );

            }


            seenOrderItemIds.add(orderItemId);


            fulfillmentItems.push({
                orderItemId,
                quantity,
            });

        }


        // ============================================================
        // DATABASE CONNECTION
        // ============================================================

        connection =
            await mysql.createConnection(
                MYSQL_CONFIG
            );


        // ============================================================
        // START TRANSACTION
        // ============================================================

        await connection.beginTransaction();


        // ============================================================
        // GET ORDER
        //
        // FOR UPDATE prevents another fulfillment from modifying
        // the same order simultaneously.
        // ============================================================

        const [orderRows] =
            await connection.execute(

                `

                SELECT

                    id,

                    order_number,

                    fulfillment_status,

                    status,

                    payment_status

                FROM orders

                WHERE id = ?

                FOR UPDATE

                `,

                [orderId]

            );


        if (orderRows.length === 0) {

            await connection.rollback();

            return Response.json(
                {
                    success: false,
                    message: 'Order not found.',
                },
                {
                    status: 404,
                }
            );

        }


        const order =
            orderRows[0];


        // ============================================================
        // VALIDATE ORDER
        //
        // Only paid orders should normally be fulfilled.
        // ============================================================

        if (order.payment_status !== 'paid') {

            await connection.rollback();

            return Response.json(
                {
                    success: false,
                    message:
                        'Only paid orders can be fulfilled.',
                },
                {
                    status: 400,
                }
            );

        }


        // ============================================================
        // GET ORDER ITEMS
        //
        // Lock all product order items for this order.
        // ============================================================

        const [orderItemRows] =
            await connection.execute(

                `

                SELECT

                    id,

                    order_id,

                    type,

                    name,

                    quantity

                FROM order_items

                WHERE order_id = ?

                AND type = 'product'

                FOR UPDATE

                `,

                [orderId]

            );


        // ============================================================
        // MAP ORDER ITEMS
        // ============================================================

        const orderItemMap =
            new Map();


        for (const row of orderItemRows) {

            orderItemMap.set(
                Number(row.id),
                row
            );

        }


        // ============================================================
        // VALIDATE REQUESTED ITEMS
        //
        // Also calculate how much has already been fulfilled.
        // ============================================================

        for (const item of fulfillmentItems) {

            const orderItem =
                orderItemMap.get(
                    item.orderItemId
                );


            // --------------------------------------------------------
            // Order item must belong to this order
            // --------------------------------------------------------

            if (!orderItem) {

                await connection.rollback();

                return Response.json(
                    {
                        success: false,
                        message:
                            `Order item ${item.orderItemId} does not belong to this order.`,
                    },
                    {
                        status: 400,
                    }
                );

            }


            // --------------------------------------------------------
            // Get previously fulfilled quantity
            // --------------------------------------------------------

            const [fulfilledRows] =
                await connection.execute(

                    `

                    SELECT

                        COALESCE(
                            SUM(fi.quantity),
                            0
                        ) AS fulfilled_quantity

                    FROM fulfillment_items fi

                    INNER JOIN fulfillments f

                        ON f.id = fi.fulfillment_id

                    WHERE fi.order_item_id = ?

                    AND f.order_id = ?

                    AND f.status != 'cancelled'

                    `,

                    [
                        item.orderItemId,
                        orderId,
                    ]

                );


            const alreadyFulfilled =
                Number(
                    fulfilledRows[0].fulfilled_quantity
                );


            const orderedQuantity =
                Number(orderItem.quantity);


            const remainingQuantity =
                orderedQuantity -
                alreadyFulfilled;


            // --------------------------------------------------------
            // Prevent over-fulfillment
            // --------------------------------------------------------

            if (
                item.quantity >
                remainingQuantity
            ) {

                await connection.rollback();

                return Response.json(
                    {
                        success: false,

                        message:
                            `Cannot fulfill ${item.quantity} of "${orderItem.name}". ` +
                            `Ordered: ${orderedQuantity}, ` +
                            `Already fulfilled: ${alreadyFulfilled}, ` +
                            `Remaining: ${remainingQuantity}.`,
                    },
                    {
                        status: 400,
                    }
                );

            }

        }


        // ============================================================
        // CREATE FULFILLMENT
        // ============================================================

        const [fulfillmentResult] =
            await connection.execute(

                `

                INSERT INTO fulfillments (

                    order_id,

                    status,

                    provider,

                    provider_fulfillment_id,

                    carrier,

                    service,

                    tracking_number,

                    tracking_url,

                    shipping_cost,

                    shipped_at,

                    delivered_at

                )

                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

                `,

                [

                    orderId,

                    status,

                    provider,

                    provider_fulfillment_id,

                    carrier,

                    service,

                    tracking_number,

                    tracking_url,

                    shippingCost,

                    shipped_at,

                    delivered_at,

                ]

            );


        const fulfillmentId =
            fulfillmentResult.insertId;


        // ============================================================
        // CREATE FULFILLMENT ITEMS
        // ============================================================

        for (const item of fulfillmentItems) {

            await connection.execute(

                `

                INSERT INTO fulfillment_items (

                    fulfillment_id,

                    order_item_id,

                    quantity

                )

                VALUES (?, ?, ?)

                `,

                [

                    fulfillmentId,

                    item.orderItemId,

                    item.quantity,

                ]

            );

        }


        // ============================================================
        // CALCULATE ORDER FULFILLMENT STATUS
        //
        // We check all product order items and compare:
        //
        // ordered quantity
        // vs
        // fulfilled quantity
        // ============================================================

        const [fulfillmentSummaryRows] =
            await connection.execute(

                `

                SELECT

                    oi.id,

                    oi.quantity AS ordered_quantity,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN f.status != 'cancelled'
                                THEN fi.quantity
                                ELSE 0
                            END
                        ),
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


            if (fulfilledQuantity > 0) {

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


        if (allFulfilled) {

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


        // ============================================================
        // UPDATE ORDER FULFILLMENT STATUS
        // ============================================================

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


        // ============================================================
        // COMMIT
        // ============================================================

        await connection.commit();


        // ============================================================
        // RETURN
        // ============================================================

        return Response.json(
            {
                success: true,

                message:
                    'Fulfillment created successfully.',

                fulfillment: {

                    id: fulfillmentId,

                    order_id: orderId,

                    status,

                    provider,

                    provider_fulfillment_id,

                    carrier,

                    service,

                    tracking_number,

                    tracking_url,

                    shipping_cost: shippingCost,

                    shipped_at,

                    delivered_at,

                    items: fulfillmentItems,

                },

                order: {

                    id: orderId,

                    order_number:
                        order.order_number,

                    fulfillment_status:
                        fulfillmentStatus,

                },

            },
            {
                status: 201,
            }
        );


    } catch (error) {

        // ============================================================
        // ROLLBACK
        // ============================================================

        if (connection) {

            try {

                await connection.rollback();

            } catch (rollbackError) {

                console.error(
                    'Fulfillment rollback failed:',
                    rollbackError
                );

            }

        }


        console.error(
            'Create fulfillment error:',
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    'Unable to create fulfillment.',
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