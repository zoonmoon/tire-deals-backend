import mysql from 'mysql2/promise';
import { MYSQL_CONFIG } from '../utils';

export async function GET(){

    const connection = await mysql.createConnection(MYSQL_CONFIG);
    
    try {

        await connection.execute(`

            CREATE TABLE IF NOT EXISTS tire_inventory (

                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                manufacturer VARCHAR(300) NOT NULL,
                item VARCHAR(300) NOT NULL,
                size VARCHAR(1000) NOT NULL,
                description TEXT NOT NULL,

                opensearch_id VARCHAR(1000) NULL,

                price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                fet DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                quantity INT NOT NULL DEFAULT 0,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                UNIQUE KEY unique_manufacturer_item (manufacturer, item)

            );

        `);


        const [rows] = await connection.execute(
            'SHOW TABLES'
        );

        console.log(rows);
        

        const [columns] = await connection.execute(`
            SHOW COLUMNS FROM tire_inventory LIKE 'opensearch_mapping_status'
        `);

        if (columns.length === 0) {
            await connection.execute(`
                ALTER TABLE tire_inventory
                ADD COLUMN opensearch_mapping_status VARCHAR(255) NOT NULL DEFAULT 'pending'
            `);
        }


        return new Response("success")


    } finally {
    
        await connection.end();
    
    }

}