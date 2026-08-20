import mysql from 'mysql2/promise';

import { MYSQL_CONFIG } from '../utils';

export async function GET() {

    let connection;

    try {

        connection = await mysql.createConnection(
            MYSQL_CONFIG
        );


        // ============================================================
        // DROP EXISTING TABLES
        // ============================================================

        await connection.execute(`
            DROP TABLE IF EXISTS coupon_usages
        `);

        await connection.execute(`
            DROP TABLE IF EXISTS coupons
        `);


        // ============================================================
        // COUPONS
        // ============================================================

        await connection.execute(`
            CREATE TABLE coupons (

                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                code VARCHAR(100) NOT NULL,

                -- percentage / fixed
                type VARCHAR(50)
                    NOT NULL,

                -- percentage: 20 = 20%
                -- fixed:      20 = $20
                value DECIMAL(12,2)
                    NOT NULL,

                -- Minimum order subtotal required
                minimum_order_amount DECIMAL(12,2)
                    NULL,

                -- Maximum discount allowed
                -- Mainly useful for percentage coupons
                maximum_discount_amount DECIMAL(12,2)
                    NULL,

                -- NULL = unlimited usage
                usage_limit INT UNSIGNED
                    NULL,

                -- Total number of times this coupon has been used
                used_count INT UNSIGNED
                    NOT NULL DEFAULT 0,

                -- Coupon availability
                starts_at TIMESTAMP
                    NULL,

                expires_at TIMESTAMP
                    NULL,

                -- active / inactive
                status VARCHAR(50)
                    NOT NULL DEFAULT 'active',

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                UNIQUE KEY unique_coupon_code (code),

                INDEX idx_coupon_status (status),

                INDEX idx_coupon_expires_at (expires_at),

                INDEX idx_coupon_starts_at (starts_at),

                INDEX idx_coupon_created_at (created_at)

            )
        `);


        // ============================================================
        // COUPON USAGES
        // ============================================================

        await connection.execute(`
            CREATE TABLE coupon_usages (

                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                coupon_id BIGINT UNSIGNED NOT NULL,

                -- NULL for guest checkout
                customer_id BIGINT UNSIGNED NULL,

                -- Email used during checkout
                customer_email VARCHAR(255) NULL,

                -- Order associated with this coupon usage
                order_id BIGINT UNSIGNED NOT NULL,

                -- Actual discount applied to the order
                discount_amount DECIMAL(12,2)
                    NOT NULL DEFAULT 0.00,

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                INDEX idx_coupon_id (coupon_id),

                INDEX idx_customer_id (customer_id),

                INDEX idx_customer_email (customer_email),

                INDEX idx_order_id (order_id),

                FOREIGN KEY (coupon_id)
                    REFERENCES coupons(id)
                    ON DELETE CASCADE

            )
        `);


        return Response.json({

            success: true,

            message:
                'Coupon tables created successfully.'

        });


    } catch (error) {

        console.error(
            'Coupon table creation error:',
            error
        );

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

        if (connection) {
            await connection.end();
        }

    }

}