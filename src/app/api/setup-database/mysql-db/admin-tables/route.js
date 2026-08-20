import mysql from 'mysql2/promise';

import { MYSQL_CONFIG } from '../utils';

export async function GET() {

    return 
    
    let connection;

    try {

        connection = await mysql.createConnection(
            MYSQL_CONFIG
        );


        // ============================================================
        // DROP EXISTING TABLES
        // ============================================================

        await connection.execute(`
            DROP TABLE IF EXISTS admin_auth_tokens
        `);

        await connection.execute(`
            DROP TABLE IF EXISTS admins
        `);


        // ============================================================
        // ADMINS
        // ============================================================

        await connection.execute(`
            CREATE TABLE admins (

                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                
                email VARCHAR(255) NOT NULL,
                
                password_hash VARCHAR(255) NOT NULL,

                name VARCHAR(255) NULL,

                status VARCHAR(50)
                    NOT NULL DEFAULT 'active',

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                UNIQUE KEY unique_admin_email (email),

                INDEX idx_admin_status (status),

                INDEX idx_admin_created_at (created_at)

            )
        `);


        // ============================================================
        // ADMIN AUTH TOKENS
        // ============================================================

        await connection.execute(`
            CREATE TABLE admin_auth_tokens (

                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                admin_id BIGINT UNSIGNED NOT NULL,

                type VARCHAR(50) NOT NULL,

                token_hash VARCHAR(255) NOT NULL,

                expires_at TIMESTAMP NOT NULL,

                used_at TIMESTAMP NULL,

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                INDEX idx_admin_id (admin_id),

                INDEX idx_admin_token_type (
                    admin_id,
                    type
                ),

                INDEX idx_admin_token_hash (
                    token_hash
                ),

                INDEX idx_admin_expires_at (
                    expires_at
                ),

                FOREIGN KEY (admin_id)
                    REFERENCES admins(id)
                    ON DELETE CASCADE

            )
        `);


        return Response.json({

            success: true,

            message:
                'Admin tables created successfully.'

        });


    } catch (error) {

        console.error(
            'Admin table creation error:',
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