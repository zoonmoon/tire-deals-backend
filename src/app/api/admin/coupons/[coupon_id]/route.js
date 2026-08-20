import mysql from "mysql2/promise";

import { NextResponse } from "next/server";

import { MYSQL_CONFIG } from "@/app/api/setup-database/mysql-db/utils";
import { getAuthenticatedAdmin } from "../../auth/utils/manage-cookie";

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
        // COUPON ID
        // ============================================================

                const { coupon_id } = await params;


        const couponId = coupon_id


        if (!couponId) {

            return NextResponse.json(
                {
                    success: false,

                    message:
                        "Coupon ID is required.",
                },
                {
                    status: 400,
                }
            );

        }


        const numericCouponId =
            Number(couponId);


        if (
            !Number.isInteger(
                numericCouponId
            ) ||
            numericCouponId < 1
        ) {

            return NextResponse.json(
                {
                    success: false,

                    message:
                        "Invalid coupon ID.",
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
        // FETCH COUPON
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
                    numericCouponId
                ]
            );


        // ============================================================
        // COUPON NOT FOUND
        // ============================================================

        if (
            coupons.length === 0
        ) {

            return NextResponse.json(
                {
                    success: false,

                    message:
                        "Coupon not found.",
                },
                {
                    status: 404,
                }
            );

        }


        // ============================================================
        // RESPONSE
        // ============================================================

        return NextResponse.json({

            success: true,

            coupon:
                coupons[0],

        });


    } catch (error) {

        console.error(
            "Admin coupon detail error:",
            error
        );


        return NextResponse.json(
            {
                success: false,

                message:
                    "Unable to retrieve coupon.",
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

export async function PUT(
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
        // COUPON ID
        // ============================================================
        
        const { coupon_id } = await params;


        const couponId = coupon_id

        const numericCouponId =
            Number(couponId);


        if (
            !Number.isInteger(
                numericCouponId
            ) ||
            numericCouponId < 1
        ) {

            return NextResponse.json(
                {
                    success: false,

                    message:
                        "Invalid coupon ID.",
                },
                {
                    status: 400,
                }
            );

        }


        // ============================================================
        // REQUEST BODY
        // ============================================================

        const body =
            await request.json();


        // ============================================================
        // FIELDS
        // ============================================================

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
            body.minimum_order_amount ===
            null ||
            body.minimum_order_amount ===
            ""
                ? null
                : Number(
                    body.minimum_order_amount
                );


        const maximumDiscountAmount =
            body.maximum_discount_amount ===
            null ||
            body.maximum_discount_amount ===
            ""
                ? null
                : Number(
                    body.maximum_discount_amount
                );


        const usageLimit =
            body.usage_limit ===
            null ||
            body.usage_limit ===
            ""
                ? null
                : Number(
                    body.usage_limit
                );


        const startsAt =
            body.starts_at ===
            null ||
            body.starts_at ===
            ""
                ? null
                : body.starts_at;


        const expiresAt =
            body.expires_at ===
            null ||
            body.expires_at ===
            ""
                ? null
                : body.expires_at;


        const status =
            String(
                body.status || ""
            )
                .trim()
                .toLowerCase();


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


        if (
            type !== "percentage" &&
            type !== "fixed"
        ) {

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
                        "Percentage discount cannot exceed 100.",
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
                maximumDiscountAmount < 0
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
                usageLimit < 1
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
            status !== "active" &&
            status !== "inactive"
        ) {

            return NextResponse.json(
                {
                    success: false,

                    message:
                        "Status must be active or inactive.",
                },
                {
                    status: 400,
                }
            );

        }


        if (
            startsAt &&
            expiresAt
        ) {

            const startDate =
                new Date(
                    startsAt
                );

            const expiryDate =
                new Date(
                    expiresAt
                );


            if (
                Number.isNaN(
                    startDate.getTime()
                ) ||
                Number.isNaN(
                    expiryDate.getTime()
                )
            ) {

                return NextResponse.json(
                    {
                        success: false,

                        message:
                            "Invalid coupon dates.",
                    },
                    {
                        status: 400,
                    }
                );

            }


            if (
                startDate >=
                expiryDate
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

        }


        // ============================================================
        // DATABASE CONNECTION
        // ============================================================

        connection =
            await mysql.createConnection(
                MYSQL_CONFIG
            );


        // ============================================================
        // CHECK COUPON EXISTS
        // ============================================================

        const [
            existingCoupons
        ] =
            await connection.execute(
                `
                    SELECT

                        id,

                        used_count

                    FROM coupons

                    WHERE id = ?

                    LIMIT 1
                `,
                [
                    numericCouponId
                ]
            );


        if (
            existingCoupons.length === 0
        ) {

            return NextResponse.json(
                {
                    success: false,

                    message:
                        "Coupon not found.",
                },
                {
                    status: 404,
                }
            );

        }


        // ============================================================
        // CHECK DUPLICATE CODE
        // ============================================================

        const [
            duplicateCoupons
        ] =
            await connection.execute(
                `
                    SELECT id

                    FROM coupons

                    WHERE code = ?

                    AND id != ?

                    LIMIT 1
                `,
                [
                    code,

                    numericCouponId,
                ]
            );


        if (
            duplicateCoupons.length > 0
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
        // CHECK USAGE LIMIT AGAINST CURRENT USAGE
        // ============================================================

        const usedCount =
            Number(
                existingCoupons[0]
                    .used_count || 0
            );


        if (
            usageLimit !== null &&
            usageLimit < usedCount
        ) {

            return NextResponse.json(
                {
                    success: false,

                    message:
                        `Usage limit cannot be lower than the current used count (${usedCount}).`,
                },
                {
                    status: 400,
                }
            );

        }


        // ============================================================
        // UPDATE COUPON
        // ============================================================

        await connection.execute(
            `
                UPDATE coupons

                SET

                    code = ?,

                    type = ?,

                    value = ?,

                    minimum_order_amount = ?,

                    maximum_discount_amount = ?,

                    usage_limit = ?,

                    starts_at = ?,

                    expires_at = ?,

                    status = ?

                WHERE id = ?
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

                numericCouponId,

            ]
        );


        // ============================================================
        // FETCH UPDATED COUPON
        // ============================================================

        const [
            updatedCoupons
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
                    numericCouponId
                ]
            );


        // ============================================================
        // RESPONSE
        // ============================================================

        return NextResponse.json({

            success: true,

            message:
                "Coupon updated successfully.",

            coupon:
                updatedCoupons[0],

        });


    } catch (error) {

        console.error(
            "Admin coupon update error:",
            error
        );


        // ============================================================
        // DUPLICATE CODE SAFETY
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
                    "Unable to update coupon.",
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