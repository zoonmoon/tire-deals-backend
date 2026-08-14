import mysql from 'mysql2/promise';

import { MYSQL_CONFIG } from '@/app/api/setup-database/mysql-db/utils';

import openSearchClient from '@/app/api/setup-database/_lib/route';

import { getAuthenticatedAdmin } from '../../auth/utils/manage-cookie';



const INDEX_NAME = 'all_tires';


export async function GET(
    request,
    { params }
) {

    let connection;


    try {

        // ============================================================
        // ADMIN AUTHENTICATION
        // ============================================================

        const admin =
            await getAuthenticatedAdmin();


        if (!admin) {

            return Response.json(
                {
                    success: false,
                    message: 'Authentication required.',
                },
                {
                    status: 401,
                }
            );

        }


        // ============================================================
        // GET PRODUCT ID
        // ============================================================

        const { product_id } =
            await params;


        const mysqlId =
            String(product_id || '').trim();


        if (!mysqlId) {

            return Response.json(
                {
                    success: false,
                    message: 'Product ID is required.',
                },
                {
                    status: 400,
                }
            );

        }


        // ============================================================
        // VALIDATE PRODUCT ID
        // ============================================================

        if (!/^\d+$/.test(mysqlId)) {

            return Response.json(
                {
                    success: false,
                    message: 'Invalid product ID.',
                },
                {
                    status: 400,
                }
            );

        }


        // ============================================================
        // MYSQL CONNECTION
        // ============================================================

        connection =
            await mysql.createConnection(
                MYSQL_CONFIG
            );


        // ============================================================
        // FETCH MYSQL PRODUCT
        // ============================================================

        const [rows] =
            await connection.execute(
                `
                    SELECT

                        id,

                        manufacturer,

                        item,

                        size,

                        description,

                        opensearch_id,

                        price,

                        fet,

                        quantity,

                        opensearch_mapping_status,

                        status,

                        created_at,

                        updated_at

                    FROM tire_inventory

                    WHERE id = ?

                    LIMIT 1
                `,
                [
                    mysqlId
                ]
            );


        // ============================================================
        // MYSQL PRODUCT NOT FOUND
        // ============================================================

        if (rows.length === 0) {

            return Response.json(
                {
                    success: false,
                    message: 'Product not found.',
                },
                {
                    status: 404,
                }
            );

        }


        const mysqlProduct =
            rows[0];


        // ============================================================
        // FETCH OPENSEARCH PRODUCT
        //
        // If the MySQL product has no OpenSearch mapping,
        // simply return opensearch: null.
        // ============================================================

        let openSearchProduct =
            null;


        if (mysqlProduct.opensearch_id) {

            try {

                const response =
                    await openSearchClient.get(
                        {
                            index:
                                INDEX_NAME,

                            id:
                                String(
                                    mysqlProduct.opensearch_id
                                ),
                        }
                    );


                const source =
                    response.body?._source ||
                    response._source ||
                    null;


                if (source) {

                    openSearchProduct = {

                        id:
                            response.body?._id ||
                            response._id ||
                            mysqlProduct.opensearch_id,

                        ...source,

                    };

                }


            } catch (error) {

                // ====================================================
                // OpenSearch DOCUMENT NOT FOUND / UNAVAILABLE
                //
                // Do not fail the entire request.
                // The MySQL product still exists.
                // ====================================================

                console.warn(
                    `⚠️ OpenSearch document ${mysqlProduct.opensearch_id} could not be retrieved:`,
                    error.message
                );

            }

        }


        // ============================================================
        // SUCCESS
        // ============================================================

        return Response.json(
            {
                success: true,

                product: {

                    mysql:
                        mysqlProduct,

                    opensearch:
                        openSearchProduct,

                },

            }
        );


    } catch (error) {

        console.error(
            '❌ Admin product details error:',
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    'Unable to retrieve product.',
            },
            {
                status: 500,
            }
        );


    } finally {

        if (connection) {

            await connection.end();

        }

    }

}