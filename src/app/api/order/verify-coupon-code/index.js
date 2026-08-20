export async function validateCoupon(
    connection,
    couponCode,
    subtotal
) {

    // ============================================================
    // NORMALIZE INPUT
    // ============================================================

    const code =
        String(
            couponCode || ""
        )
            .trim()
            .toUpperCase();


    const orderSubtotal =
        Number(
            subtotal
        );


    // ============================================================
    // INPUT VALIDATION
    // ============================================================

    if (!code) {

        return {

            valid: false,

            message:
                "Coupon code is required.",

        };

    }


    if (
        !Number.isFinite(
            orderSubtotal
        ) ||
        orderSubtotal < 0
    ) {

        return {

            valid: false,

            message:
                "Invalid subtotal.",

        };

    }


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

                    status

                FROM coupons

                WHERE code = ?

                LIMIT 1
            `,
            [
                code
            ]
        );


    // ============================================================
    // COUPON NOT FOUND
    // ============================================================

    if (
        coupons.length === 0
    ) {

        return {

            valid: false,

            message:
                "Invalid coupon code.",

        };

    }


    const coupon =
        coupons[0];


    // ============================================================
    // STATUS
    // ============================================================

    if (
        coupon.status !==
        "active"
    ) {

        return {

            valid: false,

            message:
                "This coupon is inactive.",

        };

    }


    // ============================================================
    // START DATE
    // ============================================================

    if (
        coupon.starts_at
    ) {

        const startsAt =
            new Date(
                coupon.starts_at
            );


        if (
            new Date() <
            startsAt
        ) {

            return {

                valid: false,

                message:
                    "This coupon is not active yet.",

            };

        }

    }


    // ============================================================
    // EXPIRATION DATE
    // ============================================================

    if (
        coupon.expires_at
    ) {

        const expiresAt =
            new Date(
                coupon.expires_at
            );


        if (
            new Date() >
            expiresAt
        ) {

            return {

                valid: false,

                message:
                    "This coupon has expired.",

            };

        }

    }


    // ============================================================
    // USAGE LIMIT
    // ============================================================

    if (
        coupon.usage_limit !== null
    ) {

        const usageLimit =
            Number(
                coupon.usage_limit
            );


        const usedCount =
            Number(
                coupon.used_count
            );


        if (
            usedCount >=
            usageLimit
        ) {

            return {

                valid: false,

                message:
                    "This coupon has reached its usage limit.",

            };

        }

    }


    // ============================================================
    // MINIMUM ORDER AMOUNT
    // ============================================================

    if (
        coupon.minimum_order_amount !== null
    ) {

        const minimumOrderAmount =
            Number(
                coupon.minimum_order_amount
            );


        if (
            orderSubtotal <
            minimumOrderAmount
        ) {

            return {

                valid: false,

                message:
                    `A minimum order of $${minimumOrderAmount.toFixed(2)} is required to use this coupon.`,

            };

        }

    }


    // ============================================================
    // COUPON TYPE
    // ============================================================

    const couponType =
        String(
            coupon.type || ""
        )
            .trim()
            .toLowerCase();


    if (
        couponType !==
        "percentage" &&
        couponType !==
        "fixed"
    ) {

        return {

            valid: false,

            message:
                "Invalid coupon type.",

        };

    }


    // ============================================================
    // COUPON VALUE
    // ============================================================

    const couponValue =
        Number(
            coupon.value
        );


    if (
        !Number.isFinite(
            couponValue
        ) ||
        couponValue <= 0
    ) {

        return {

            valid: false,

            message:
                "Invalid coupon value.",

        };

    }


    // ============================================================
    // PERCENTAGE VALIDATION
    // ============================================================

    if (
        couponType ===
        "percentage" &&
        couponValue > 100
    ) {

        return {

            valid: false,

            message:
                "Invalid percentage discount.",

        };

    }


    // ============================================================
    // CALCULATE DISCOUNT
    // ============================================================

    let discountAmount = 0;


    if (
        couponType ===
        "percentage"
    ) {

        discountAmount =
            orderSubtotal *
            (
                couponValue /
                100
            );

    }


    else {

        discountAmount =
            couponValue;

    }


    // ============================================================
    // MAXIMUM DISCOUNT
    // ============================================================

    if (
        coupon.maximum_discount_amount !==
        null
    ) {

        const maximumDiscountAmount =
            Number(
                coupon.maximum_discount_amount
            );


        discountAmount =
            Math.min(
                discountAmount,

                maximumDiscountAmount
            );

    }


    // ============================================================
    // DISCOUNT CANNOT EXCEED SUBTOTAL
    // ============================================================

    discountAmount =
        Math.min(
            discountAmount,

            orderSubtotal
        );


    // ============================================================
    // ROUND DISCOUNT
    // ============================================================

    discountAmount =
        Math.round(
            (
                discountAmount +
                Number.EPSILON
            ) * 100
        ) / 100;


    // ============================================================
    // FINAL SUBTOTAL
    // ============================================================

    const finalSubtotal =
        Math.round(
            (
                orderSubtotal -
                discountAmount +
                Number.EPSILON
            ) * 100
        ) / 100;


    // ============================================================
    // SUCCESS
    // ============================================================

    return {

        valid: true,

        message:
            "Coupon is valid.",
        
        coupon: {
            
            id:
                coupon.id,

            code:
                coupon.code,

            type:
                couponType,

            value:
                couponValue,

            discount_amount:
                discountAmount,

            subtotal:
                orderSubtotal,

            final_subtotal:
                finalSubtotal,

        },

    };

}