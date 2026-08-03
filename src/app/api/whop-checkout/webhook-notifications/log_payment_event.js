export async function logPaymentEvent(
    connection,
    webhookData
) {

    await connection.execute(
        `
        INSERT INTO payment_events (

            provider,
            provider_event_id,
            provider_payment_id,
            event_type,
            event_data

        )

        VALUES (?, ?, ?, ?, ?)

        ON DUPLICATE KEY UPDATE

            id = id
        `,
        [

            "whop",

            webhookData.id,

            webhookData.data.id,

            webhookData.type,

            JSON.stringify(webhookData)

        ]
    );

}