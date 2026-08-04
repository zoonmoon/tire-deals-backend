export async function handleRefundCreated(
    connection,
    refundData
) {

    // ============================================================
    // GET WHOP REFUND ID
    // ============================================================

    const providerRefundId =
        refundData.id;


    // ============================================================
    // GET WHOP PAYMENT ID
    // ============================================================

    const providerPaymentId =
        refundData.payment?.id;


    if (
        !providerRefundId
    ) {

        throw new Error(
            "Whop refund is missing refund ID"
        );

    }


    if (
        !providerPaymentId
    ) {

        throw new Error(
            "Whop refund is missing payment ID"
        );

    }


    // ============================================================
    // FIND OUR INTERNAL PAYMENT
    // ============================================================

    const [
        payments
    ] = await connection.execute(
        `
        SELECT

            id,

            order_id,

            payment_id

        FROM payments

        WHERE provider = 'whop'

        AND payment_id = ?

        LIMIT 1
        `,
        [
            providerPaymentId
        ]
    );


    if (
        payments.length === 0
    ) {

        throw new Error(
            `Payment not found for Whop payment: ${providerPaymentId}`
        );

    }


    const payment =
        payments[0];


    // ============================================================
    // UPDATE REFUND
    //
    // provider_refund_id is UNIQUE.
    //
    // This makes the refund webhook idempotent.
    // ============================================================

    const [
        result
    ] = await connection.execute(
        `
        UPDATE refunds

        SET

            provider_refund_id = ?,

            status = ?,

            refunded_at = ?

        WHERE payment_id = ?

        AND provider = 'whop'

        AND provider_refund_id IS NULL

        AND status IN (
            'pending',
            'processing'
        )

        ORDER BY id ASC

        LIMIT 1
        `,
        [

            providerRefundId,

            refundData.status,

            refundData.created_at,

            payment.id

        ]
    );


    // ============================================================
    // NO LOCAL REFUND FOUND
    // ============================================================

    if (
        result.affectedRows === 0
    ) {

        console.log(
            `[WHOP REFUND] No pending local refund found for payment ${providerPaymentId}`
        );

        return;

    }


    console.log(
        `[WHOP REFUND] Refund ${providerRefundId} linked to order ${payment.order_id}`
    );

}