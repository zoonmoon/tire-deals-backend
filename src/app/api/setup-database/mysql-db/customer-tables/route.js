
import mysql from 'mysql2/promise';
import { MYSQL_CONFIG } from '../utils';

export async function GET() {

    return 

    const connection = await mysql.createConnection(MYSQL_CONFIG);

    try {

        // ============================================================
        // DROP EXISTING TABLES
        // ============================================================

        await connection.execute(`
            DROP TABLE IF EXISTS customer_auth_tokens
        `);
            
        await connection.execute(`
            DROP TABLE IF EXISTS customer_addresses
        `); 

        await connection.execute(`
            DROP TABLE IF EXISTS customers
        `);


        // ============================================================
        // CUSTOMERS
        // ============================================================

        await connection.execute(`
            CREATE TABLE customers (

                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                email VARCHAR(255) NOT NULL,

                password_hash VARCHAR(255) NOT NULL,

                first_name VARCHAR(100) NULL,

                last_name VARCHAR(100) NULL,

                phone VARCHAR(50) NULL,

                status VARCHAR(50)
                    NOT NULL DEFAULT 'active',

                email_verified_at TIMESTAMP NULL,

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                UNIQUE KEY unique_customer_email (email),

                INDEX idx_customer_status (status),

                INDEX idx_customer_created_at (created_at)

            )
        `);


        // ============================================================
        // CUSTOMER ADDRESSES
        // ============================================================

        await connection.execute(`
            CREATE TABLE customer_addresses (

                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                customer_id BIGINT UNSIGNED NOT NULL,

                address_type VARCHAR(50)
                    NOT NULL DEFAULT 'shipping',

                first_name VARCHAR(100) NULL,

                last_name VARCHAR(100) NULL,

                company VARCHAR(255) NULL,

                address1 VARCHAR(255) NOT NULL,

                address2 VARCHAR(255) NULL,

                city VARCHAR(100) NOT NULL,

                state VARCHAR(100) NULL,

                postcode VARCHAR(30) NOT NULL,

                country VARCHAR(100) NOT NULL DEFAULT 'US',

                phone VARCHAR(50) NULL,

                is_default BOOLEAN
                    NOT NULL DEFAULT FALSE,

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                INDEX idx_customer_id (customer_id),

                INDEX idx_customer_address_type (
                    customer_id,
                    address_type
                ),

                INDEX idx_customer_default (
                    customer_id,
                    is_default
                ),

                FOREIGN KEY (customer_id)
                    REFERENCES customers(id)
                    ON DELETE CASCADE

            )
        `);


        // ============================================================
        // CUSTOMER AUTH TOKENS
        // ============================================================

        await connection.execute(`
            CREATE TABLE customer_auth_tokens (

                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                customer_id BIGINT UNSIGNED NOT NULL,

                type VARCHAR(50) NOT NULL,

                token_hash VARCHAR(255) NOT NULL,

                expires_at TIMESTAMP NOT NULL,

                used_at TIMESTAMP NULL,

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                INDEX idx_customer_id (customer_id),

                INDEX idx_customer_token_type (
                    customer_id,
                    type
                ),

                INDEX idx_token_hash (token_hash),

                INDEX idx_expires_at (expires_at),

                FOREIGN KEY (customer_id)
                    REFERENCES customers(id)
                    ON DELETE CASCADE

            )
        `);


        // ============================================================
        // SUCCESS
        // ============================================================

        return Response.json({
            success: true,
            message: 'Customer tables created successfully.'
        });


    } catch (error) {

        console.error(error);

        return Response.json(
            {
                success: false,
                error: error.message
            },
            {
                status: 500
            }
        );


    } finally {

        await connection.end();

    }

}
