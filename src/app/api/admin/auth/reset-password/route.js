import mysql from 'mysql2/promise';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import { MYSQL_CONFIG } from '@/app/api/setup-database/mysql-db/utils';

import { createAdminAuthCookie } from '../utils/manage-cookie';

export async function POST(request) {

    let connection;


    try {

        const body =
            await request.json();


        const {
            email,
            code,
            new_password
        } = body;


        // ============================================================
        // VALIDATION
        // ============================================================

        if (
            !email ||
            !code ||
            !new_password
        ) {

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


        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        const resetCode =
            String(code)
                .trim();


        if (!/^\d{6}$/.test(resetCode)) {

            return Response.json(
                {
                    success: false,
                    message:
                        'Verification code must be 6 digits.'
                },
                {
                    status: 400
                }
            );

        }


        if (
            String(new_password).length < 8
        ) {

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
                        status
                    FROM admins
                    WHERE email = ?
                    LIMIT 1
                `,
                [
                    normalizedEmail
                ]
            );


        if (admins.length === 0) {

            return Response.json(
                {
                    success: false,
                    message:
                        'Invalid password reset request.'
                },
                {
                    status: 400
                }
            );

        }


        const admin = admins[0];


        if (admin.status !== 'active') {

            return Response.json(
                {
                    success: false,
                    message:
                        'Invalid password reset request.'
                },
                {
                    status: 400
                }
            );

        }


        // ============================================================
        // FIND LATEST UNUSED RESET CODE
        // ============================================================

        const [tokens] =
            await connection.execute(
                `
                    SELECT
                        id,
                        token_hash,
                        expires_at
                    FROM admin_auth_tokens
                    WHERE admin_id = ?
                    AND type = 'password_reset'
                    AND used_at IS NULL
                    ORDER BY id DESC
                    LIMIT 1
                `,
                [
                    admin.id
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
        // CHECK EXPIRATION
        // ============================================================

        if (
            new Date(token.expires_at)
            <= new Date()
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        'This password reset code has expired. Please request a new code.'
                },
                {
                    status: 400
                }
            );

        }


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


        if (!codeMatches) {

            return Response.json(
                {
                    success: false,
                    message:
                        'Invalid verification code.'
                },
                {
                    status: 400
                }
            );

        }


        // ============================================================
        // HASH PASSWORD
        // ============================================================

        const passwordHash =
            await bcrypt.hash(
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
                    UPDATE admins
                    SET password_hash = ?
                    WHERE id = ?
                `,
                [
                    passwordHash,
                    admin.id
                ]
            );


            // --------------------------------------------------------
            // MARK ALL RESET CODES USED
            // --------------------------------------------------------

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


            await connection.commit();


        } catch (transactionError) {

            await connection.rollback();

            throw transactionError;

        }


        // ============================================================
        // CREATE LOGIN COOKIE
        // ============================================================

        await createAdminAuthCookie({

            id: admin.id,

            email: admin.email

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
            'Admin reset password error:',
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