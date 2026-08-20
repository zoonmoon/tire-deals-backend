import mysql from "mysql2/promise";

import { NextResponse } from "next/server";

import { MYSQL_CONFIG } from "../../setup-database/mysql-db/utils";

import { validateCoupon } from ".";

export async function GET(request) {

    let connection;


    try {

        // ============================================================
        // URL PARAMETERS
        // ============================================================

        const { searchParams } =
            new URL(
                request.url
            );


        const couponCode =
            searchParams.get(
                "coupon_code"
            );

        // 
            
        const subtotal =
            searchParams.get(
                "subtotal"
            );


        // ============================================================
        // DATABASE
        // ============================================================

        connection =
            await mysql.createConnection(
                MYSQL_CONFIG
            );


        // ============================================================
        // VALIDATE COUPON
        // ============================================================

        const result =
            await validateCoupon(
                connection,
                couponCode,
                subtotal
            );


        // ============================================================
        // INVALID
        // ============================================================

        if (
            !result.valid
        ) {

            return NextResponse.json(
                {
                    success: false,

                    message:
                        result.message,
                },
                {
                    status: 400,
                }
            );

        }


        // ============================================================
        // SUCCESS
        // ============================================================

        return NextResponse.json({

            success: true,

            message:
                result.message,

            coupon:
                result.coupon,

        });


    } catch (error) {

        console.error(
            "Coupon validation API error:",
            error
        );


        return NextResponse.json(
            {
                success: false,

                message:
                    "Unable to validate coupon.",
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