import { NextResponse } from "next/server";

import mysql from "mysql2/promise";

import { MYSQL_CONFIG } from "../../setup-database/mysql-db/utils";

import { getAuthenticatedAdmin } from "../auth/utils/manage-cookie";

export async function POST(request) {

    let connection;


    try {

        // ============================================================
        // ADMIN AUTHENTICATION
        // ============================================================

        const admin =
            await getAuthenticatedAdmin();


        if (!admin) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Authentication required.",
                },
                {
                    status: 401,
                }
            );

        }


        // ============================================================
        // REQUEST BODY
        // ============================================================

        const body =
            await request.json();


        const code =
            String(
                body.code || ""
            )
                .trim()
                .toUpperCase();


        const type =
            String(
                body.type || ""
            )
                .trim()
                .toLowerCase();


        const value =
            Number(
                body.value
            );


        const minimumOrderAmount =
            body.minimum_order_amount === null ||
            body.minimum_order_amount === undefined ||
            body.minimum_order_amount === ""
                ? null
                : Number(
                    body.minimum_order_amount
                );


        const maximumDiscountAmount =
            body.maximum_discount_amount === null ||
            body.maximum_discount_amount === undefined ||
            body.maximum_discount_amount === ""
                ? null
                : Number(
                    body.maximum_discount_amount
                );


        const usageLimit =
            body.usage_limit === null ||
            body.usage_limit === undefined ||
            body.usage_limit === ""
                ? null
                : Number(
                    body.usage_limit
                );


        const startsAt =
            body.starts_at || null;


        const expiresAt =
            body.expires_at || null;


        const status =
            body.status
                ? String(
                    body.status
                )
                    .trim()
                    .toLowerCase()
                : "active";


        // ============================================================
        // VALIDATION
        // ============================================================

        if (!code) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Coupon code is required.",
                },
                {
                    status: 400,
                }
            );

        }


        if (!["percentage", "fixed"].includes(type)) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Coupon type must be percentage or fixed.",
                },
                {
                    status: 400,
                }
            );

        }


        if (
            !Number.isFinite(value) ||
            value <= 0
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Coupon value must be greater than 0.",
                },
                {
                    status: 400,
                }
            );

        }


        if (
            type === "percentage" &&
            value > 100
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Percentage coupon value cannot exceed 100.",
                },
                {
                    status: 400,
                }
            );

        }


        if (
            minimumOrderAmount !== null &&
            (
                !Number.isFinite(
                    minimumOrderAmount
                ) ||
                minimumOrderAmount < 0
            )
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid minimum order amount.",
                },
                {
                    status: 400,
                }
            );

        }


        if (
            maximumDiscountAmount !== null &&
            (
                !Number.isFinite(
                    maximumDiscountAmount
                ) ||
                maximumDiscountAmount <= 0
            )
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid maximum discount amount.",
                },
                {
                    status: 400,
                }
            );

        }


        if (
            usageLimit !== null &&
            (
                !Number.isInteger(
                    usageLimit
                ) ||
                usageLimit <= 0
            )
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Usage limit must be a positive integer.",
                },
                {
                    status: 400,
                }
            );

        }


        if (
            !["active", "inactive"].includes(status)
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid coupon status.",
                },
                {
                    status: 400,
                }
            );

        }


        if (
            startsAt &&
            expiresAt &&
            new Date(startsAt) >=
            new Date(expiresAt)
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Expiration date must be after the start date.",
                },
                {
                    status: 400,
                }
            );

        }


        // ============================================================
        // DATABASE CONNECTION
        // ============================================================

        connection =
            await mysql.createConnection(
                MYSQL_CONFIG
            );


        // ============================================================
        // CHECK DUPLICATE COUPON CODE
        // ============================================================

        const [existingCoupons] =
            await connection.execute(
                `
                    SELECT id
                    FROM coupons
                    WHERE code = ?
                    LIMIT 1
                `,
                [
                    code,
                ]
            );


        if (
            existingCoupons.length > 0
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "A coupon with this code already exists.",
                },
                {
                    status: 409,
                }
            );

        }


        // ============================================================
        // CREATE COUPON
        // ============================================================

        const [
            result
        ] =
            await connection.execute(
                `
                    INSERT INTO coupons (

                        code,

                        type,

                        value,

                        minimum_order_amount,

                        maximum_discount_amount,

                        usage_limit,

                        starts_at,

                        expires_at,

                        status

                    )

                    VALUES (

                        ?,

                        ?,

                        ?,

                        ?,

                        ?,

                        ?,

                        ?,

                        ?,

                        ?

                    )
                `,
                [

                    code,

                    type,

                    value,

                    minimumOrderAmount,

                    maximumDiscountAmount,

                    usageLimit,

                    startsAt,

                    expiresAt,

                    status,

                ]
            );


        // ============================================================
        // FETCH CREATED COUPON
        // ============================================================

        const [
            coupons
        ] =
            await connection.execute(
                `
                    SELECT
                        id,
                        code,
                        type,
                        value,
                        minimum_order_amount,
                        maximum_discount_amount,
                        usage_limit,
                        used_count,
                        starts_at,
                        expires_at,
                        status,
                        created_at,
                        updated_at

                    FROM coupons

                    WHERE id = ?

                    LIMIT 1
                `,
                [
                    result.insertId,
                ]
            );


        // ============================================================
        // RESPONSE
        // ============================================================

        return NextResponse.json(
            {
                success: true,

                message:
                    "Coupon created successfully.",

                coupon:
                    coupons[0],
            },
            {
                status: 201,
            }
        );


    } catch (error) {

        console.error(
            "Admin create coupon error:",
            error
        );


        // ============================================================
        // DUPLICATE CODE RACE CONDITION
        // ============================================================

        if (
            error?.code ===
            "ER_DUP_ENTRY"
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "A coupon with this code already exists.",
                },
                {
                    status: 409,
                }
            );

        }


        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to create coupon.",
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


export async function GET(request) {

    let connection;


    try {

        // ============================================================
        // ADMIN AUTHENTICATION
        // ============================================================

        const admin =
            await getAuthenticatedAdmin();


        if (!admin) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Authentication required.",
                },
                {
                    status: 401,
                }
            );

        }


        // ============================================================
        // URL PARAMETERS
        // ============================================================

        const { searchParams } =
            new URL(request.url);


        // ============================================================
        // PAGINATION
        // ============================================================

        let page =
            parseInt(
                searchParams.get("page") || "1",
                10
            );


        let limit =
            parseInt(
                searchParams.get("limit") || "25",
                10
            );


        if (
            !Number.isInteger(page) ||
            page < 1
        ) {

            page = 1;

        }


        if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 100
        ) {

            limit = 25;

        }


        const offset =
            (page - 1) * limit;


        // ============================================================
        // FILTERS
        // ============================================================

        const search =
            String(
                searchParams.get("search") || ""
            ).trim();


        const status =
            String(
                searchParams.get("status") || ""
            ).trim();


        // ============================================================
        // DATABASE CONNECTION
        // ============================================================

        connection =
            await mysql.createConnection(
                MYSQL_CONFIG
            );


        // ============================================================
        // BUILD WHERE CLAUSE
        // ============================================================

        const where = [];

        const params = [];


        // ------------------------------------------------------------
        // SEARCH
        // ------------------------------------------------------------

        if (search) {

            where.push(`
                code LIKE ?
            `);

            params.push(
                `%${search}%`
            );

        }


        // ------------------------------------------------------------
        // STATUS
        // ------------------------------------------------------------

        if (status) {

            where.push(`
                status = ?
            `);

            params.push(
                status
            );

        }


        const whereClause =
            where.length > 0
                ? `WHERE ${where.join(" AND ")}`
                : "";


        // ============================================================
        // FETCH ONE EXTRA RECORD
        // ============================================================


const [
    coupons
] =
    await connection.execute(
        `
            SELECT

                id,

                code,

                type,

                value,

                minimum_order_amount,

                maximum_discount_amount,

                usage_limit,

                used_count,

                starts_at,

                expires_at,

                status,

                created_at,

                updated_at

            FROM coupons

            ${whereClause}

            ORDER BY created_at DESC

            LIMIT ${limit + 1}

            OFFSET ${offset}
        `,
        params
    );




        // ============================================================
        // PAGINATION
        // ============================================================

        const hasNext =
            coupons.length > limit;


        const hasPrevious =
            page > 1;


        // ============================================================
        // REMOVE EXTRA RECORD
        // ============================================================

        const results =
            coupons.slice(
                0,
                limit
            );


        // ============================================================
        // TOTAL COUNT
        // ============================================================

        const [
            countResult
        ] =
            await connection.execute(
                `
                    SELECT COUNT(*) AS total

                    FROM coupons

                    ${whereClause}
                `,
                params
            );


        const total =
            Number(
                countResult[0]?.total || 0
            );


        // ============================================================
        // RESPONSE
        // ============================================================

        return NextResponse.json({

            success: true,

            coupons: results,

            pagination: {

                page,

                limit,

                total,

                has_previous:
                    hasPrevious,

                has_next:
                    hasNext,

            },

        });


    } catch (error) {

        console.error(
            "Admin coupons error:",
            error
        );


        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to retrieve coupons.",
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