import mysql from 'mysql2/promise';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import { MYSQL_CONFIG } from '../../setup-database/mysql-db/utils';

import { createAuthCookie } from '../utils/manage-cookie';

export async function POST(request) {

    let connection;

    try {

        // ============================================================
        // REQUEST BODY
        // ============================================================

        const body = await request.json();

        const {
            email,
            code,
            new_password
        } = body;


        // ============================================================
        // VALIDATION
        // ============================================================

        if (!email || !code || !new_password) {

            return Response.json(
                {
                    success: false,
                    message:
                        'Email, verification code, and new password are required.'
                },
                {
                    status: 400
                }
            );

        }


        const normalizedEmail = String(email)
            .trim()
            .toLowerCase();

        const resetCode = String(code)
            .trim();


        if (!/^\d{6}$/.test(resetCode)) {

            return Response.json(
                {
                    success: false,
                    message: 'Verification code must be 6 digits.'
                },
                {
                    status: 400
                }
            );

        }


        if (String(new_password).length < 8) {

            return Response.json(
                {
                    success: false,
                    message:
                        'Password must be at least 8 characters.'
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
                    email_verified_at
                FROM customers
                WHERE email = ?
                LIMIT 1
            `,
            [
                normalizedEmail
            ]
        );


        if (customers.length === 0) {

            return Response.json(
                {
                    success: false,
                    message: 'Invalid password reset request.'
                },
                {
                    status: 400
                }
            );

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
                        'Your email address has not been verified.'
                },
                {
                    status: 403
                }
            );

        }


        // ============================================================
        // FIND LATEST UNUSED PASSWORD RESET CODE
        // ============================================================

        const [tokens] = await connection.execute(
            `
                SELECT
                    id,
                    token_hash
                FROM customer_auth_tokens
                WHERE customer_id = ?
                AND type = 'password_reset'
                AND used_at IS NULL
                ORDER BY id DESC
                LIMIT 1
            `,
            [
                customer.id
            ]
        );


        if (tokens.length === 0) {

            return Response.json(
                {
                    success: false,
                    message:
                        'No active password reset code was found. Please request a new code.'
                },
                {
                    status: 400
                }
            );

        }


        const token = tokens[0];


        // ============================================================
        // HASH SUBMITTED CODE
        // ============================================================

        const submittedCodeHash =
            crypto
                .createHash('sha256')
                .update(resetCode)
                .digest('hex');


        // ============================================================
        // COMPARE HASHES
        // ============================================================

        const codeMatches =
            crypto.timingSafeEqual(
                Buffer.from(
                    submittedCodeHash,
                    'utf8'
                ),
                Buffer.from(
                    token.token_hash,
                    'utf8'
                )
            );


        // ============================================================
        // INVALID CODE
        // ============================================================

        if (!codeMatches) {

            return Response.json(
                {
                    success: false,
                    message: 'Invalid verification code.'
                },
                {
                    status: 400
                }
            );

        }


        // ============================================================
        // HASH NEW PASSWORD
        // ============================================================

        const passwordHash = await bcrypt.hash(
            new_password,
            12
        );


        // ============================================================
        // TRANSACTION
        // ============================================================

        await connection.beginTransaction();

        try {

            // --------------------------------------------------------
            // UPDATE PASSWORD
            // --------------------------------------------------------

            await connection.execute(
                `
                    UPDATE customers
                    SET password_hash = ?
                    WHERE id = ?
                `,
                [
                    passwordHash,
                    customer.id
                ]
            );


            // --------------------------------------------------------
            // MARK RESET CODE AS USED
            // --------------------------------------------------------

            await connection.execute(
                `
                    UPDATE customer_auth_tokens
                    SET used_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    AND used_at IS NULL
                `,
                [
                    token.id
                ]
            );


            // --------------------------------------------------------
            // INVALIDATE OTHER PASSWORD RESET CODES
            // --------------------------------------------------------

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


            // --------------------------------------------------------
            // COMMIT
            // --------------------------------------------------------

            await connection.commit();

        } catch (transactionError) {

            await connection.rollback();

            throw transactionError;

        }


        // ============================================================
        // CREATE AUTH COOKIE
        // ============================================================


        console.log("customer")
        console.log(customer)

        await createAuthCookie({
            id: customer.id,
            email: customer.email
        });




        // ============================================================
        // SUCCESS
        // ============================================================

        return Response.json({

            success: true,

            message:
                'Your password has been reset successfully.',

            password_reset: true,

            logged_in: true

        });


    } catch (error) {

        console.error(
            'Reset password error:',
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    'Unable to reset your password.'
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