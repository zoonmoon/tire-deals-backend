import mysql from 'mysql2/promise';
import crypto from 'crypto';

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
            code
        } = body;


        // ============================================================
        // VALIDATION
        // ============================================================

        if (!email || !code) {

            return Response.json(
                {
                    success: false,
                    message: 'Email and verification code are required.'
                },
                {
                    status: 400
                }
            );

        }


        const normalizedEmail = String(email)
            .trim()
            .toLowerCase();


        const verificationCode = String(code)
            .trim();


        if (!/^\d{6}$/.test(verificationCode)) {

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
                    message: 'Invalid verification request.'
                },
                {
                    status: 404
                }
            );

        }


        const customer = customers[0];


        // ============================================================
        // ALREADY VERIFIED
        // ============================================================

        if (customer.email_verified_at) {

            return Response.json(
                {
                    success: false,
                    message: 'Your email address is already verified.'
                },
                {
                    status: 409
                }
            );

        }


        // ============================================================
        // FIND LATEST UNUSED VERIFICATION CODE
        // ============================================================

        const [tokens] = await connection.execute(
            `
                SELECT
                    id,
                    token_hash
                FROM customer_auth_tokens
                WHERE customer_id = ?
                AND type = 'email_verification'
                AND used_at IS NULL
                ORDER BY id DESC
                LIMIT 1
            `,
            [
                customer.id
            ]
        );


        // ============================================================
        // NO ACTIVE CODE
        // ============================================================

        if (tokens.length === 0) {

            return Response.json(
                {
                    success: false,
                    message:
                        'No active verification code was found. Please request a new code.'
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
                .update(verificationCode)
                .digest('hex');


        // ============================================================
        // COMPARE HASHES
        // ============================================================

        const codeMatches =
            crypto.timingSafeEqual(
                Buffer.from(submittedCodeHash, 'utf8'),
                Buffer.from(token.token_hash, 'utf8')
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
        // TRANSACTION
        // ============================================================

        await connection.beginTransaction();


        try {

            // --------------------------------------------------------
            // MARK CODE AS USED
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
            // VERIFY CUSTOMER EMAIL
            // --------------------------------------------------------

            await connection.execute(
                `
                    UPDATE customers
                    SET email_verified_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    AND email_verified_at IS NULL
                `,
                [
                    customer.id
                ]
            );


            // --------------------------------------------------------
            // COMMIT
            // --------------------------------------------------------

            await connection.commit();


            await createAuthCookie({
                id: customer.id,
                email: customer.email
            });


        } catch (transactionError) {

            await connection.rollback();

            throw transactionError;

        }


        // ============================================================
        // SUCCESS
        // ============================================================

        return Response.json(
            {
                success: true,
                message: 'Your email has been verified successfully.',
                email_verified: true
            }
        );


    } catch (error) {

        console.error(
            'Email verification error:',
            error
        );


        return Response.json(
            {
                success: false,
                message: 'Unable to verify email.'
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