export async function handlePaymentSucceeded(
    connection,
    webhookData
) {

    await connection.beginTransaction();

    try {

        // ============================================================
        // GET ORDER NUMBER
        // ============================================================

        const orderNumber =
            webhookData.metadata?.order_number;


        if (!orderNumber) {

            throw new Error(
                "Whop payment is missing order_number metadata"
            );

        }


        // ============================================================
        // FIND AND LOCK ORDER
        // ============================================================

        const [orders] = await connection.execute(
            `
            SELECT
                id,
                order_number,
                payment_status,
                status

            FROM orders

            WHERE order_number = ?

            FOR UPDATE
            `,
            [
                orderNumber
            ]
        );


        if (orders.length === 0) {

            throw new Error(
                `Order not found: ${orderNumber}`
            );

        }

        const order = orders[0];

        console.log("order entry", order)

        // ============================================================
        // IDEMPOTENCY CHECK
        //
        // If the order is already paid, this payment.succeeded
        // event has already been processed.
        //
        // DO NOT deduct inventory again.
        // ============================================================

        if (
            order.payment_status === "paid"
        ) {

            console.log(
                `[WHOP PAYMENT] Order already paid: ${orderNumber}`
            );

            await connection.commit();

            return;

        }


        // ============================================================
        // INSERT PAYMENT
        //
        // provider + payment_id is UNIQUE.
        //
        // This prevents the same Whop payment from creating
        // multiple payment records.
        // ============================================================

        await connection.execute(
            `
            INSERT INTO payments (

                order_id,
                provider,
                payment_id,
                amount,
                currency,
                status

            )

            VALUES (?, ?, ?, ?, ?, ?)

            ON DUPLICATE KEY UPDATE

                status = VALUES(status),

                amount = VALUES(amount),

                currency = VALUES(currency),

                updated_at = CURRENT_TIMESTAMP
            `,
            [

                order.id,

                "whop",

                webhookData.id,

                webhookData.total,

                webhookData.currency.toUpperCase(),

                "paid"

            ]
        );


        // ============================================================
        // MARK ORDER AS PAID
        // ============================================================

        await connection.execute(
            `
            UPDATE orders

            SET

                payment_status = 'paid',

                status = 'processing'

            WHERE id = ?

            AND payment_status <> 'paid'
            `,
            [
                order.id
            ]
        );


        // ============================================================
        // GET PRODUCT ORDER ITEMS
        // ============================================================

        const [orderItems] = await connection.execute(
            `
            SELECT

                tire_inventory_id,

                quantity

            FROM order_items

            WHERE order_id = ?

            AND type = 'product'

            AND tire_inventory_id IS NOT NULL
            `,
            [
                order.id
            ]
        );


        // ============================================================
        // DEDUCT INVENTORY
        // ============================================================

        for (
            const item of orderItems
        ) {

            const [
                inventoryResult
            ] = await connection.execute(
                `
                UPDATE tire_inventory

                SET

                    quantity = quantity - ?

                WHERE id = ?
                
                `,
                [

                    item.quantity,

                    item.tire_inventory_id

                ]
            );

        }


        // ============================================================
        // COMMIT EVERYTHING
        // ============================================================

        await connection.commit();


        console.log(
            `[WHOP PAYMENT] Payment successful. Order ${orderNumber} marked as paid and inventory deducted.`
        );


    } catch (error) {

        // ============================================================
        // ROLLBACK EVERYTHING
        // ============================================================

        await connection.rollback();

        console.error(
            `[WHOP PAYMENT ERROR]`,
            error
        );

        throw error;

    }

}