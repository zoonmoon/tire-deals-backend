import mysql from 'mysql2/promise';

import { MYSQL_CONFIG } from '@/app/api/setup-database/mysql-db/utils';

import { getAuthenticatedAdmin } from '../../auth/utils/manage-cookie';


export async function GET(request, { params }) {

    let connection;


    try {

        // ============================================================
        // ADMIN AUTHENTICATION
        // ============================================================

        const admin = await getAuthenticatedAdmin();


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
        // ORDER ID
        // ============================================================

        const { order_id } = await params;

        const orderId = Number(order_id);


        if (
            !Number.isSafeInteger(orderId) ||
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
        // DATABASE CONNECTION
        // ============================================================

        connection = await mysql.createConnection(
            MYSQL_CONFIG
        );


        // ============================================================
        // FETCH ORDER
        // ============================================================

        const [orders] = await connection.execute(
            `
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


                    -- ==================================================
                    -- BILLING ADDRESS
                    -- ==================================================

                    billing_first_name,

                    billing_last_name,

                    billing_company,

                    billing_address1,

                    billing_address2,

                    billing_city,

                    billing_state,

                    billing_postcode,

                    billing_country,


                    -- ==================================================
                    -- SHIPPING ADDRESS
                    -- ==================================================

                    shipping_first_name,

                    shipping_last_name,

                    shipping_company,

                    shipping_address1,

                    shipping_address2,

                    shipping_city,

                    shipping_state,

                    shipping_postcode,

                    shipping_country,


                    -- ==================================================
                    -- TIMESTAMPS
                    -- ==================================================

                    created_at,

                    updated_at,

                    admin_viewed_at

                FROM orders

                WHERE id = ?

                LIMIT 1
            `,
            [
                orderId
            ]
        );


        // ============================================================
        // ORDER NOT FOUND
        // ============================================================

        if (orders.length === 0) {

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


        const order = orders[0];


        // ============================================================
        // MARK ORDER AS VIEWED
        //
        // Only set it the first time an admin opens the order.
        // ============================================================

        if (!order.admin_viewed_at) {

            await connection.execute(
                `
                    UPDATE orders

                    SET admin_viewed_at = CURRENT_TIMESTAMP

                    WHERE id = ?

                    AND admin_viewed_at IS NULL
                `,
                [
                    orderId
                ]
            );

        }


        // ============================================================
        // ORDER ITEMS
        // ============================================================

        const [items] = await connection.execute(
            `
                SELECT

                    id,

                    order_id,

                    tire_inventory_id,

                    name,

                    type,

                    selected_vehicle,

                    quantity,

                    unit_price,

                    fet,

                    subtotal,

                    tax_total,

                    total,

                    created_at

                FROM order_items

                WHERE order_id = ?

                ORDER BY id ASC
            `,
            [
                orderId
            ]
        );


        // ============================================================
        // PAYMENTS
        // ============================================================

        const [payments] = await connection.execute(
            `
                SELECT

                    id,

                    order_id,

                    provider,

                    payment_id,

                    amount,

                    currency,

                    status,

                    created_at,

                    updated_at

                FROM payments

                WHERE order_id = ?

                ORDER BY id DESC
            `,
            [
                orderId
            ]
        );


        // ============================================================
        // REFUNDS
        // ============================================================

        const [refunds] = await connection.execute(
            `
                SELECT

                    id,

                    order_id,

                    payment_id,

                    amount,

                    currency,

                    status,

                    reason,

                    provider,

                    provider_refund_id,

                    refunded_at,

                    created_at,

                    updated_at

                FROM refunds

                WHERE order_id = ?

                ORDER BY id DESC
            `,
            [
                orderId
            ]
        );


        // ============================================================
        // FULFILLMENTS
        //
        // One fulfillment can contain multiple order items.
        //
        // Example:
        //
        // Fulfillment #1
        //     Product A x2
        //     Product B x3
        //
        // Fulfillment #2
        //     Product A x1
        //     Product C x1
        //
        // Each fulfillment has its own carrier, service,
        // tracking number, etc.
        // ============================================================

        const [fulfillments] = await connection.execute(
            `
                SELECT

                    id,

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

                    delivered_at,

                    created_at,

                    updated_at

                FROM fulfillments

                WHERE order_id = ?

                ORDER BY id ASC
            `,
            [
                orderId
            ]
        );


        // ============================================================
        // FULFILLMENT ITEMS
        //
        // Fetch only fulfillment items belonging to this order.
        // ============================================================

        const [fulfillmentItems] = await connection.execute(
            `
                SELECT

                    fi.id,

                    fi.fulfillment_id,

                    fi.order_item_id,

                    fi.quantity,

                    fi.created_at,

                    fi.updated_at

                FROM fulfillment_items fi

                INNER JOIN fulfillments f

                    ON f.id = fi.fulfillment_id

                WHERE f.order_id = ?

                ORDER BY fi.id ASC
            `,
            [
                orderId
            ]
        );


        // ============================================================
        // ATTACH FULFILLMENT ITEMS
        //
        // Convert:
        //
        // fulfillments
        // fulfillment_items
        //
        // into:
        //
        // fulfillments: [
        //     {
        //         ...,
        //         items: [...]
        //     }
        // ]
        // ============================================================

        const fulfillmentMap = new Map();


        for (const fulfillment of fulfillments) {

            fulfillmentMap.set(
                fulfillment.id,
                {
                    ...fulfillment,

                    items: []
                }
            );

        }


        for (const fulfillmentItem of fulfillmentItems) {

            const fulfillment =
                fulfillmentMap.get(
                    fulfillmentItem.fulfillment_id
                );


            if (fulfillment) {

                fulfillment.items.push(
                    fulfillmentItem
                );

            }

        }


        const fulfillmentList =
            Array.from(
                fulfillmentMap.values()
            );


        // ============================================================
        // PAYMENT EVENTS
        //
        // Your current payment_events table does not have order_id.
        // It has order_number, so we use that here.
        // ============================================================

        const [paymentEvents] = await connection.execute(
            `
                SELECT

                    id,

                    provider,

                    provider_event_id,

                    provider_payment_id,

                    order_number,

                    event_type,

                    event_data,

                    created_at

                FROM payment_events

                WHERE order_number = ?

                ORDER BY id DESC
            `,
            [
                order.order_number
            ]
        );


        // ============================================================
        // SUCCESS
        // ============================================================

        return Response.json({

            success: true,

            order: {

                ...order,

                items,

                payments,

                refunds,

                fulfillments:
                    fulfillmentList,

                payment_events:
                    paymentEvents,

            },

        });


    } catch (error) {

        console.error(
            'Admin order details error:',
            error
        );


        return Response.json(
            {
                success: false,
                message: 'Unable to retrieve order.',
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