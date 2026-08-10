import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

import { MYSQL_CONFIG } from '../../setup-database/mysql-db/utils';

import { generateVerificationCode } from '../utils';
import { sendVerificationEmail } from '../utils';


export async function POST(request) {

    let connection;

    try {

        // ============================================================
        // REQUEST BODY
        // ============================================================

        const body = await request.json();

        const {
            email,
            password,
            first_name,
            last_name,
            phone
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


        const normalizedEmail = String(email)
            .trim()
            .toLowerCase();


        // ============================================================
        // EMAIL VALIDATION
        // ============================================================

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailRegex.test(normalizedEmail)) {

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
        // PASSWORD VALIDATION
        // ============================================================

        if (password.length < 8) {

            return Response.json(
                {
                    success: false,
                    message: 'Password must be at least 8 characters.'
                },
                {
                    status: 400
                }
            );

        }


        // ============================================================
        // NORMALIZE OPTIONAL FIELDS
        // ============================================================

        const firstName =
            first_name?.trim() || null;

        const lastName =
            last_name?.trim() || null;

        const phoneNumber =
            phone?.trim() || null;


        // ============================================================
        // DATABASE CONNECTION
        // ============================================================

        connection = await mysql.createConnection(
            MYSQL_CONFIG
        );


        // ============================================================
        // CHECK EXISTING CUSTOMER
        // ============================================================

        const [existingCustomers] =
            await connection.execute(
                `
                    SELECT
                        id,
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
        // CUSTOMER ALREADY EXISTS
        // ============================================================

        if (existingCustomers.length > 0) {

            const existingCustomer =
                existingCustomers[0];


            // --------------------------------------------------------
            // EMAIL ALREADY VERIFIED
            // --------------------------------------------------------

            if (existingCustomer.email_verified_at) {

                return Response.json(
                    {
                        success: false,
                        message:
                            'An account with this email already exists.'
                    },
                    {
                        status: 409
                    }
                );

            }


            // --------------------------------------------------------
            // CUSTOMER EXISTS BUT EMAIL IS NOT VERIFIED
            //
            // Resend a new verification code.
            // --------------------------------------------------------

            const {
                code,
                hash
            } = generateVerificationCode();


            // --------------------------------------------------------
            // INVALIDATE OLD VERIFICATION CODES
            // --------------------------------------------------------

            await connection.execute(
                `
                    UPDATE customer_auth_tokens
                    SET used_at = CURRENT_TIMESTAMP
                    WHERE customer_id = ?
                    AND type = 'email_verification'
                    AND used_at IS NULL
                `,
                [
                    existingCustomer.id
                ]
            );


            // --------------------------------------------------------
            // STORE NEW VERIFICATION CODE
            // --------------------------------------------------------

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
                        'email_verification',
                        ?,
                        DATE_ADD(
                            CURRENT_TIMESTAMP,
                            INTERVAL 15 MINUTE
                        )
                    )
                `,
                [
                    existingCustomer.id,
                    hash
                ]
            );


            // --------------------------------------------------------
            // SEND VERIFICATION EMAIL
            // --------------------------------------------------------

            await sendVerificationEmail({

                email: normalizedEmail,

                firstName:
                    existingCustomer.first_name,

                code

            });


            // --------------------------------------------------------
            // RESPONSE
            // --------------------------------------------------------

            return Response.json({

                success: true,

                message:
                    'A new verification code has been sent to your email.',

                requires_verification: true

            });

        }


        // ============================================================
        // HASH PASSWORD
        // ============================================================

        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );


        // ============================================================
        // CREATE CUSTOMER
        //
        // email_verified_at remains NULL.
        //
        // The customer is NOT allowed to log in until the email
        // verification process is completed.
        // ============================================================

        const [customerResult] =
            await connection.execute(
                `
                    INSERT INTO customers (
                        email,
                        password_hash,
                        first_name,
                        last_name,
                        phone
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                `,
                [
                    normalizedEmail,
                    passwordHash,
                    firstName,
                    lastName,
                    phoneNumber
                ]
            );


        const customerId =
            customerResult.insertId;


        // ============================================================
        // GENERATE VERIFICATION CODE
        // ============================================================

        const {
            code,
            hash
        } = generateVerificationCode();


        // ============================================================
        // STORE VERIFICATION CODE
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
                    'email_verification',
                    ?,
                    DATE_ADD(
                        CURRENT_TIMESTAMP,
                        INTERVAL 15 MINUTE
                    )
                )
            `,
            [
                customerId,
                hash
            ]
        );


        // ============================================================
        // SEND VERIFICATION EMAIL
        // ============================================================

        await sendVerificationEmail({

            email: normalizedEmail,

            firstName,

            code

        });


        // ============================================================
        // SUCCESS
        // ============================================================

        return Response.json({

            success: true,

            message:
                'Account created successfully. Please check your email for the verification code.',

            requires_verification: true

        });


    } catch (error) {

        console.error(
            'Registration error:',
            error
        );


        // ============================================================
        // DUPLICATE EMAIL
        // ============================================================

        if (error.code === 'ER_DUP_ENTRY') {

            return Response.json(
                {
                    success: false,
                    message:
                        'An account with this email already exists.'
                },
                {
                    status: 409
                }
            );

        }


        return Response.json(
            {
                success: false,
                message:
                    'Unable to create account.'
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