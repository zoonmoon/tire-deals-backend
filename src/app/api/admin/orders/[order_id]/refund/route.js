
import mysql from "mysql2/promise";
import Whop from "@whop/sdk";

import { MYSQL_CONFIG } from "@/app/api/setup-database/mysql-db/utils";

const whopClient = new Whop({
    apiKey: process.env.WHOP_API_KEY,
});

export async function POST(
    request,
    { params }
) {

    const connection =
        await mysql.createConnection(
            MYSQL_CONFIG
        );


    try {

        const { order_id } =
            await params;


        // ============================================================
        // GET REQUEST BODY
        // ============================================================

        const body =
            await request.json();


        // ============================================================
        // REFUND AMOUNT IS REQUIRED
        //
        // Admin must explicitly enter the amount.
        //
        // We NEVER automatically refund the full payment.
        // ============================================================

        const refundAmount =
            Number(body.partial_amount);


        const reason =
            body.reason || null;


        // ============================================================
        // VALIDATE REFUND AMOUNT
        // ============================================================

        if (
            !Number.isFinite(
                refundAmount
            ) ||
            refundAmount <= 0
        ) {

            return new Response(

                JSON.stringify({
                    error:
                        "A valid refund amount greater than 0 is required"
                }),

                {
                    status: 400,

                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }

            );

        }


        // ============================================================
        // FIND WHOP PAYMENT
        // ============================================================

        const [
            payments
        ] = await connection.execute(
            `
            SELECT

                p.id,

                p.order_id,

                p.payment_id,

                p.amount,

                p.currency,

                p.status

            FROM payments p

            WHERE p.order_id = ?

            AND p.provider = 'whop'

            AND p.status IN (
                'paid',
                'partially_refunded'
            )

            ORDER BY p.id DESC

            LIMIT 1
            `,
            [
                order_id
            ]
        );


        if (
            payments.length === 0
        ) {

            return new Response(

                JSON.stringify({
                    error:
                        "No refundable Whop payment found"
                }),

                {
                    status: 404,

                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }

            );

        }


        const payment =
            payments[0];


        // ============================================================
        // CALCULATE ALREADY REFUNDED AMOUNT
        //
        // This prevents multiple partial refunds from exceeding
        // the original payment amount.
        //
        // Example:
        //
        // Payment = $100
        // Already refunded = $40
        // Remaining = $60
        //
        // A new $70 refund will be rejected.
        // ============================================================

        const [
            refundRows
        ] = await connection.execute(
            `
            SELECT

                COALESCE(
                    SUM(amount),
                    0
                ) AS refunded_amount
            
            FROM refunds

            WHERE payment_id = ?

            AND status IN (
                'pending',
                'processing',
                'completed'
            )
            `,
            [
                payment.id
            ]
        );


        const alreadyRefunded =
            Number(
                refundRows[0]
                    .refunded_amount
            );


        const remainingRefundable =
            Number(payment.amount) -
            alreadyRefunded;


        // ============================================================
        // VALIDATE AGAINST REMAINING REFUNDABLE AMOUNT
        // ============================================================

        if (
            refundAmount >
            remainingRefundable
        ) {

            return new Response(

                JSON.stringify({
                    error:
                        "Refund amount exceeds the remaining refundable amount",

                    payment_amount:
                        Number(payment.amount),

                    already_refunded:
                        alreadyRefunded,

                    remaining_refundable:
                        remainingRefundable
                }),

                {
                    status: 400,

                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }

            );

        }


        // ============================================================
        // CREATE REFUND THROUGH WHOP
        //
        // We ALWAYS send partial_amount.
        //
        // Even if the admin enters the entire remaining amount,
        // the amount is still explicitly supplied by the admin.
        // ============================================================

        const whopPayment =
            await whopClient.payments.refund(

                payment.payment_id,

                {
                    partial_amount:
                        refundAmount
                }

            );


        console.log(
            "[WHOP REFUND INITIATED]",
            whopPayment
        );


        // ============================================================
        // CREATE LOCAL REFUND RECORD
        //
        // The actual Whop refund ID will be received through
        // the refund webhook.
        //
        // Therefore:
        //
        // provider_refund_id = NULL
        // status = processing
        // ============================================================

        const [
            refundResult
        ] = await connection.execute(
            `
            INSERT INTO refunds (

                order_id,

                payment_id,

                amount,

                currency,

                status,

                reason,

                provider

            )

            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [

                payment.order_id,

                payment.id,

                refundAmount,

                payment.currency,

                "processing",

                reason,

                "whop"

            ]
        );


        // ============================================================
        // RESPONSE
        // ============================================================

        return new Response(

            JSON.stringify({

                success: true,

                refund_id:
                    refundResult.insertId,

                payment_id:
                    payment.payment_id,

                amount:
                    refundAmount,

                currency:
                    payment.currency,

                status:
                    "processing"

            }),

            {
                status: 200,

                headers: {
                    "Content-Type":
                        "application/json"
                }

            }

        );


    } catch (error) {

        console.error(
            "[WHOP REFUND ERROR]",
            error
        );


        return new Response(

            JSON.stringify({
                error:
                    error.message ||
                    "Failed to initiate refund"
            }),

            {
                status: 500,

                headers: {
                    "Content-Type":
                        "application/json"
                }

            }

        );


    } finally {

        await connection.end();

    }

}
