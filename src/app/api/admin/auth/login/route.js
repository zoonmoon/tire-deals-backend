import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

import { MYSQL_CONFIG } from '@/app/api/setup-database/mysql-db/utils';

import { createAdminAuthCookie } from '../utils/manage-cookie';


export async function POST(request) {

    let connection;


    try {

        const body = await request.json();


        const {
            email,
            password
        } = body;


        // ============================================================
        // VALIDATION
        // ============================================================

        if (!email || !password) {

            return Response.json(
                {
                    success: false,
                    message:
                        'Email and password are required.'
                },
                {
                    status: 400
                }
            );

        }


        // ============================================================
        // NORMALIZE EMAIL
        // ============================================================

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(normalizedEmail)
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        'Please provide a valid email address.'
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
                        password_hash,
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


        // ============================================================
        // ADMIN NOT FOUND
        // ============================================================

        if (admins.length === 0) {

            return Response.json(
                {
                    success: false,
                    message:
                        'Invalid email or password.'
                },
                {
                    status: 401
                }
            );

        }


        const admin = admins[0];


        // ============================================================
        // CHECK STATUS
        // ============================================================

        if (admin.status !== 'active') {

            return Response.json(
                {
                    success: false,
                    message:
                        'Your admin account is not active.'
                },
                {
                    status: 403
                }
            );

        }


        // ============================================================
        // CHECK PASSWORD
        // ============================================================

        const passwordMatches =
            await bcrypt.compare(
                password,
                admin.password_hash
            );


        if (!passwordMatches) {

            return Response.json(
                {
                    success: false,
                    is_logged_in: false,
                    message:
                        'Invalid email or password.'
                },
                {
                    status: 401
                }
            );

        }


        // ============================================================
        // CREATE ADMIN COOKIE
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

            is_logged_in: true,

            message: 'Login successful.'

        });


    } catch (error) {

        console.error(
            'Admin login error:',
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    'Unable to login.'
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