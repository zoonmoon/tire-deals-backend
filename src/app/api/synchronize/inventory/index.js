import ftp from 'basic-ftp';
import { Writable } from 'stream';
import mysql from 'mysql2/promise';
import { parse } from 'csv-parse/sync';


import { MYSQL_CONFIG } from '../../setup-database/mysql-db/utils';

const BATCH_SIZE = 100;

const REQUIRED_COLUMNS = [
    'Mfg',
    'Item',
    'Size',
    'Description',
    'Price',
    'FET',
    'Qty'
];


export default async function synchronizeInventory() {

    const ftpClient = new ftp.Client();

    let connection;


    try {

        // =====================================================
        // 1. Connect to FTP
        // =====================================================

        await ftpClient.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USERNAME,
            password: process.env.FTP_PASSWORD,
            secure: false
        });


        // =====================================================
        // 2. Download CSV directly into memory
        // =====================================================

        const chunks = [];

        const writable = new Writable({

            write(chunk, encoding, callback) {

                chunks.push(chunk);

                callback();

            }

        });


        await ftpClient.downloadTo(
            writable,
            'usawheeltiredeals.csv'
        );


        const csvContent = Buffer
            .concat(chunks)
            .toString('utf8');


        console.log(
            `Downloaded CSV: ${csvContent.length} bytes`
        );


        // =====================================================
        // 3. Parse CSV using column names
        // =====================================================

        const rows = parse(csvContent, {

            columns: true,

            skip_empty_lines: true,

            bom: true,

            trim: true

        });


        console.log(
            `CSV rows found: ${rows.length}`
        );


        // =====================================================
        // 4. Make sure required columns exist
        // =====================================================

        if (rows.length === 0) {

            throw new Error(
                'CSV file contains no rows'
            );

        }


        const csvColumns = Object.keys(rows[0]);


        const missingColumns =
            REQUIRED_COLUMNS.filter(
                column => !csvColumns.includes(column)
            );


        if (missingColumns.length > 0) {

            throw new Error(
                `Missing required CSV columns: ${missingColumns.join(', ')}`
            );

        }


        // =====================================================
        // 5. Validate and prepare rows
        // =====================================================

        const validRows = [];

        let skippedRows = 0;


        for (const row of rows) {

            const manufacturer =
                row.Mfg?.trim();

            const item =
                row.Item?.trim();


            // Manufacturer and Item are our
            // unique identification fields.
            if (!manufacturer || !item) {

                console.warn(
                    'Skipping row because Mfg or Item is missing:',
                    row
                );

                skippedRows++;

                continue;

            }


            const size =
                row.Size?.trim() || '';

            const description =
                row.Description?.trim() || '';


            const price =
                Number(row.Price || 0);

            const fet =
                Number(row.FET || 0);

            const quantity =
                Number(row.Qty || 0);


            // Validate numeric fields
            if (
                !Number.isFinite(price) ||
                !Number.isFinite(fet) ||
                !Number.isInteger(quantity)
            ) {

                console.warn(
                    'Skipping row because numeric data is invalid:',
                    row
                );

                skippedRows++;

                continue;

            }


            validRows.push([
                manufacturer,
                item,
                size,
                description,
                price,
                fet,
                quantity
            ]);

        }


        console.log(
            `Valid rows: ${validRows.length}`
        );

        console.log(
            `Skipped rows: ${skippedRows}`
        );


        // =====================================================
        // 6. Connect to MySQL
        // =====================================================

        connection =
            await mysql.createConnection(
                MYSQL_CONFIG
            );


        // =====================================================
        // 7. Start transaction
        // =====================================================

        await connection.beginTransaction();


        try {

            // =================================================
            // 8. Process rows in batches
            // =================================================

            for (
                let start = 0;
                start < validRows.length;
                start += BATCH_SIZE
            ) {


                const batch =
                    validRows.slice(
                        start,
                        start + BATCH_SIZE
                    );


                // =============================================
                // Create (?, ?, ?, ?, ?, ?, ?) placeholders
                // =============================================

                const placeholders =
                    batch
                        .map(() =>
                            '(?, ?, ?, ?, ?, ?, ?)'
                        )
                        .join(', ');


                // =============================================
                // Flatten batch values
                // =============================================

                const values =
                    batch.flat();


                // =============================================
                // Bulk UPSERT
                // =============================================

                const query = `

                    INSERT INTO tire_inventory (

                        manufacturer,
                        item,
                        size,
                        description,
                        price,
                        fet,
                        quantity

                    )

                    VALUES ${placeholders}

                    ON DUPLICATE KEY UPDATE

                        size = VALUES(size),

                        description = VALUES(description),

                        price = VALUES(price),

                        fet = VALUES(fet),

                        quantity = VALUES(quantity)

                `;


                await connection.execute(
                    query,
                    values
                );


                const processed =
                    Math.min(
                        start + batch.length,
                        validRows.length
                    );


                console.log(
                    `Processed ${processed}/${validRows.length} rows`
                );

            }


            // =================================================
            // 9. Commit transaction
            // =================================================

            await connection.commit();


        } catch (error) {

            // =================================================
            // Rollback everything if any batch fails
            // =================================================

            await connection.rollback();

            throw error;

        }


        // =====================================================
        // 10. Return success
        // =====================================================

        return Response.json({

            success: true,

            totalCsvRows:
                rows.length,

            processed:
                validRows.length,

            skipped:
                skippedRows,

            batchSize:
                BATCH_SIZE

        });


    } catch (error) {

        console.error(
            'FTP inventory import failed:',
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

        // =====================================================
        // Close FTP connection
        // =====================================================

        ftpClient.close();


        // =====================================================
        // Close MySQL connection
        // =====================================================

        if (connection) {

            await connection.end();

        }

    }

}