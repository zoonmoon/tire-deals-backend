import mysql from 'mysql2/promise';
import crypto from 'crypto';

import { MYSQL_CONFIG } from '@/app/api/setup-database/mysql-db/utils';

import { sendEmail } from '@/app/api/utils/email';


export async function POST(request) {

    let connection;


    try {

        const body =
            await request.json();


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
                    message:
                        'Email is required.'
                },
                {
                    status: 400
                }
            );

        }


        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        // ============================================================
        // DATABASE
        // ============================================================

        connection =
            await mysql.createConnection(
                MYSQL_CONFIG
            );


        // ============================================================
        // FIND ADMIN
        // ============================================================

        const [admins] =
            await connection.execute(
                `
                    SELECT
                        id,
                        email,
                        name,
                        status
                    FROM admins
                    WHERE email = ?
                    LIMIT 1
                `,
                [
                    normalizedEmail
                ]
            );


        // Don't reveal whether the email exists.
        if (admins.length === 0) {

            return Response.json({

                success: true,

                message:
                    'If an account exists for this email, a password reset code has been sent.'

            });

        }


        const admin = admins[0];


        if (admin.status !== 'active') {

            return Response.json({

                success: true,

                message:
                    'If an account exists for this email, a password reset code has been sent.'

            });

        }


        // ============================================================
        // GENERATE CODE
        // ============================================================

        const code =
            crypto
                .randomInt(
                    100000,
                    1000000
                )
                .toString();


        const tokenHash =
            crypto
                .createHash('sha256')
                .update(code)
                .digest('hex');


        // ============================================================
        // EXPIRE OLD RESET CODES
        // ============================================================

        await connection.execute(
            `
                UPDATE admin_auth_tokens
                SET used_at = CURRENT_TIMESTAMP
                WHERE admin_id = ?
                AND type = 'password_reset'
                AND used_at IS NULL
            `,
            [
                admin.id
            ]
        );


        // ============================================================
        // CREATE NEW RESET TOKEN
        // ============================================================

        await connection.execute(
            `
                INSERT INTO admin_auth_tokens (
                    admin_id,
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
                admin.id,
                tokenHash
            ]
        );


        // ============================================================
        // SEND EMAIL
        // ============================================================

        await sendEmail({

            to: admin.email,

            subject:
                'Admin password reset code',

            html: `
                <div
                    style="
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: 0 auto;
                    "
                >

                    <h2>
                        Reset your password
                    </h2>

                    <p>
                        Hi ${admin.name || 'there'},
                    </p>

                    <p>
                        Use the verification code below
                        to reset your admin password.
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
                            ${code}
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


        return Response.json({

            success: true,

            message:
                'If an account exists for this email, a password reset code has been sent.'

        });


    } catch (error) {

        console.error(
            'Admin forgot password error:',
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    'Unable to process password reset request.'
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