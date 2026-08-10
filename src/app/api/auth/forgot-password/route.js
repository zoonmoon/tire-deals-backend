import mysql from 'mysql2/promise';
import crypto from 'crypto';

import { MYSQL_CONFIG } from '../../setup-database/mysql-db/utils';

import { sendEmail } from '../../utils/email';

export async function POST(request) {

    let connection;

    try {


        // 
        // ============================================================
        // REQUEST BODY
        // ============================================================

        const body = await request.json();

        const {
            email
        } = body;


        // ============================================================
        // VALIDATION
        // ============================================================

        if (!email) {

            return Response.json(
                {
                    success: false,
                    message: 'Email is required.'
                },
                {
                    status: 400
                }
            );

        }


        const normalizedEmail = String(email)
            .trim()
            .toLowerCase();


        if (!normalizedEmail.includes('@')) {

            return Response.json(
                {
                    success: false,
                    message: 'Please provide a valid email address.'
                },
                {
                    status: 400
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
        // FIND CUSTOMER
        // ============================================================

        const [customers] = await connection.execute(
            `
                SELECT
                    id,
                    email,
                    first_name,
                    email_verified_at
                FROM customers
                WHERE email = ?
                LIMIT 1
            `,
            [
                normalizedEmail
            ]
        );


        // ============================================================
        // DON'T REVEAL WHETHER EMAIL EXISTS
        // ============================================================

        if (customers.length === 0) {

            return Response.json({
                success: true,
                message:
                    'If an account exists with this email, a password reset code has been sent.'
            });

        }


        const customer = customers[0];


        // ============================================================
        // REQUIRE VERIFIED EMAIL
        // ============================================================

        if (!customer.email_verified_at) {

            return Response.json(
                {
                    success: false,
                    message:
                        'Your email address has not been verified yet.'
                },
                {
                    status: 403
                }
            );

        }


        // ============================================================
        // INVALIDATE PREVIOUS PASSWORD RESET CODES
        // ============================================================

        await connection.execute(
            `
                UPDATE customer_auth_tokens
                SET used_at = CURRENT_TIMESTAMP
                WHERE customer_id = ?
                AND type = 'password_reset'
                AND used_at IS NULL
            `,
            [
                customer.id
            ]
        );


        // ============================================================
        // GENERATE RESET CODE
        // ============================================================

        const resetCode = crypto
            .randomInt(
                100000,
                1000000
            )
            .toString();


        // ============================================================
        // HASH RESET CODE
        // ============================================================

        const resetCodeHash = crypto
            .createHash('sha256')
            .update(resetCode)
            .digest('hex');


        // ============================================================
        // STORE RESET CODE
        // ============================================================

        await connection.execute(
            `
                INSERT INTO customer_auth_tokens (
                    customer_id,
                    type,
                    token_hash,
                    expires_at
                )
                VALUES (
                    ?,
                    'password_reset',
                    ?,
                    DATE_ADD(
                        CURRENT_TIMESTAMP,
                        INTERVAL 15 MINUTE
                    )
                )
            `,
            [
                customer.id,
                resetCodeHash
            ]
        );


        // ============================================================
        // SEND RESET EMAIL
        // ============================================================

        await sendEmail({

            to: normalizedEmail,

            subject: 'Reset your password',

            html: `
                <div
                    style="
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: 0 auto;
                    "
                >

                    <h2>Reset your password</h2>

                    <p>
                        Hi ${customer.first_name || 'there'},
                    </p>

                    <p>
                        We received a request to reset your password.
                        Use the verification code below to continue.
                    </p>

                    <div
                        style="
                            margin: 30px 0;
                            text-align: center;
                        "
                    >

                        <div
                            style="
                                display: inline-block;
                                padding: 15px 25px;
                                background: #f5f5f5;
                                border-radius: 8px;
                                font-size: 32px;
                                font-weight: bold;
                                letter-spacing: 8px;
                            "
                        >
                            ${resetCode}
                        </div>

                    </div>

                    <p>
                        This code will expire in 15 minutes.
                    </p>

                    <p>
                        If you did not request a password reset,
                        you can safely ignore this email.
                    </p>

                </div>
            `

        });


        // ============================================================
        // SUCCESS
        // ============================================================

        return Response.json({

            success: true,

            message:
                'If an account exists with this email, a password reset code has been sent.',

            requires_verification: true

        });


    } catch (error) {

        console.error(
            'Forgot password error:',
            error
        );


        return Response.json(
            {
                success: false,
                message: 'Unable to process password reset request.'
            },
            {
                status: 500
            }
        );


    } finally {

        if (connection) {

            await connection.end();

        }

    }

}