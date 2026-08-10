import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

import { MYSQL_CONFIG } from '../../setup-database/mysql-db/utils';
import { createAuthCookie } from '../utils/manage-cookie';

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
                    message: 'Email and password are required.'
                },
                {
                    status: 400
                }
            );

        }


        // ============================================================
        // NORMALIZE EMAIL
        // ============================================================

        const normalizedEmail = String(email)
            .trim()
            .toLowerCase();


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                normalizedEmail
            )
        ) {

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
                    password_hash,
                    status,
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
        // CUSTOMER NOT FOUND
        // ============================================================

        if (customers.length === 0) {

            return Response.json(
                {
                    success: false,
                    message: 'Invalid email or password.'
                },
                {
                    status: 401
                }
            );

        }


        const customer = customers[0];


        // ============================================================
        // CHECK ACCOUNT STATUS
        // ============================================================

        if (customer.status !== 'active') {

            return Response.json(
                {
                    success: false,
                    message: 'Your account is not active.'
                },
                {
                    status: 403
                }
            );

        }


        // ============================================================
        // CHECK PASSWORD
        // ============================================================

        const passwordMatches = await bcrypt.compare(
            password,
            customer.password_hash
        );


        if (!passwordMatches) {

            return Response.json(
                {
                    success: false,
                    is_logged_in: false, 
                    message: 'Invalid email or password.'
                },
                {
                    status: 401
                }
            );

        }


        // ============================================================
        // CHECK EMAIL VERIFICATION
        // ============================================================

        if (!customer.email_verified_at) {

            return Response.json(
                {
                    success: false,
                    message:
                        'Please verify your email address before logging in.',
                    requires_verification: true,
                    email: customer.email
                },
                {
                    status: 403
                }
            );

        }


        // ============================================================
        // CREATE AUTH COOKIE
        // ============================================================

        await createAuthCookie({
            id: customer.id,
            email: customer.email
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
            'Login error:',
            error
        );

        return Response.json(
            {
                success: false,
                message: 'Unable to login.'
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