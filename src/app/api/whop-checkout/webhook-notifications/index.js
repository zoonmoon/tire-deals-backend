import mysql from "mysql2/promise";
import { MYSQL_CONFIG } from "../../setup-database/mysql-db/utils";

import { logPaymentEvent } from "./log_payment_event";

import { handlePaymentSucceeded } from "./handle-payment-succeeded";

export async function handleWhopWebhook(
    webhookData
) {

    const connection =
        await mysql.createConnection(
            MYSQL_CONFIG
        );

    try {



        // Only process successful payments
        if (
            webhookData.type ===
            "payment.succeeded"
        ) {

            await handlePaymentSucceeded(
                connection,
                webhookData.data
            );

        }

   
        // Log every Whop event
        await logPaymentEvent(
            connection,
            webhookData
        );



    } finally {

        await connection.end();

    }

}