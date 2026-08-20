"use client";

import React, {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import EditIcon from "@mui/icons-material/Edit";

import { useParams, useRouter } from "next/navigation";


export default function CouponDetailPage() {

    const router =
        useRouter();


    const params =
        useParams();


    const couponId =
        params?.coupon_id;


    // ============================================================
    // STATE
    // ============================================================

    const [coupon, setCoupon] =
        useState(null);


    const [loading, setLoading] =
        useState(true);


    const [error, setError] =
        useState("");


    // ============================================================
    // FETCH COUPON
    // ============================================================

    const fetchCoupon =
        useCallback(
            async () => {

                if (!couponId) {

                    return;

                }


                try {

                    setLoading(true);

                    setError("");


                    const response =
                        await fetch(
                            `/api/admin/coupons/${couponId}`,
                            {
                                method: "GET",

                                credentials:
                                    "include",
                            }
                        );


                    const data =
                        await response.json();


                    if (
                        !response.ok
                    ) {

                        throw new Error(
                            data?.message ||
                            "Unable to retrieve coupon."
                        );

                    }


                    setCoupon(
                        data.coupon
                    );


                } catch (error) {

                    console.error(
                        "Fetch coupon error:",
                        error
                    );


                    setError(
                        error.message ||
                        "Unable to retrieve coupon."
                    );


                } finally {

                    setLoading(false);

                }

            },
            [
                couponId,
            ]
        );


    useEffect(
        () => {

            fetchCoupon();

        },
        [
            fetchCoupon,
        ]
    );


    // ============================================================
    // FORMAT MONEY
    // ============================================================

    const formatMoney =
        (value) => {

            if (
                value === null ||
                value === undefined
            ) {

                return "-";

            }


            return new Intl.NumberFormat(
                "en-US",
                {
                    style: "currency",

                    currency: "USD",
                }
            ).format(
                Number(value)
            );

        };


    // ============================================================
    // FORMAT DISCOUNT
    // ============================================================

    const formatDiscount =
        () => {

            if (!coupon) {

                return "-";

            }


            if (
                coupon.type ===
                "percentage"
            ) {

                return `${coupon.value}%`;

            }


            return formatMoney(
                coupon.value
            );

        };


    // ============================================================
    // FORMAT DATE
    // ============================================================

    const formatDate =
        (value) => {

            if (!value) {

                return "-";

            }


            const date =
                new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return "-";

            }


            return date.toLocaleString(
                "en-US",
                {
                    year: "numeric",

                    month: "short",

                    day: "numeric",

                    hour: "numeric",

                    minute: "2-digit",
                }
            );

        };


    // ============================================================
    // STATUS
    // ============================================================

    const getStatusColor =
        () => {

            if (
                coupon?.status ===
                "active"
            ) {

                return "success";

            }


            return "default";

        };


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (

            <Box
                sx={{
                    width: "100%",

                    minHeight: 400,

                    display: "flex",

                    alignItems: "center",

                    justifyContent: "center",
                }}
            >

                <CircularProgress />

            </Box>

        );

    }


    // ============================================================
    // ERROR
    // ============================================================

    if (error) {

        return (

            <Box
                sx={{
                    width: "100%",

                    maxWidth: 1000,

                    mx: "auto",

                    p: 3,
                }}
            >

                <Alert
                    severity="error"
                    sx={{
                        mb: 2,
                    }}
                >
                    {error}
                </Alert>


                <Button
                    variant="outlined"

                    startIcon={
                        <ArrowBackIcon />
                    }

                    onClick={() =>
                        router.push(
                            "/admin/coupons"
                        )
                    }

                    sx={{
                        textTransform:
                            "none",

                        fontWeight:
                            600,
                    }}
                >
                    Back to Coupons
                </Button>

            </Box>

        );

    }


    // ============================================================
    // NOT FOUND
    // ============================================================

    if (!coupon) {

        return (

            <Box
                sx={{
                    width: "100%",

                    maxWidth: 1000,

                    mx: "auto",

                    p: 3,
                }}
            >

                <Alert
                    severity="warning"
                    sx={{
                        mb: 2,
                    }}
                >
                    Coupon not found.
                </Alert>


                <Button
                    variant="outlined"

                    startIcon={
                        <ArrowBackIcon />
                    }

                    onClick={() =>
                        router.push(
                            "/admin/coupons"
                        )
                    }

                    sx={{
                        textTransform:
                            "none",

                        fontWeight:
                            600,
                    }}
                >
                    Back to Coupons
                </Button>

            </Box>

        );

    }


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <Box
            sx={{
                width: "100%",

                maxWidth: 1000,

                mx: "auto",

                p: 3,

                boxSizing:
                    "border-box",
            }}
        >

            {/* ================================================== */}
            {/* HEADER */}
            {/* ================================================== */}

            <Stack
                direction={{
                    xs: "column",
                    sm: "row",
                }}


                alignItems={{
                    xs: "stretch",
                    sm: "center",
                }}

                spacing={2}

                sx={{
                    mb: 3,
                    justifyContent:'space-between'
                }}
            >

                <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                >

                    <Button
                        variant={'text'}

                        startIcon={
                            <ArrowBackIcon />
                        }

                        onClick={() =>
                            router.push(
                                "/admin/coupons"
                            )
                        }

                        sx={{
                            textTransform:
                                "none",

                            fontWeight:
                                600,
                        }}
                    >
                        
                    </Button>


                    <Box>

                        <Typography
                            variant="h5"
                            fontWeight={600}
                        >
                            {coupon.code}
                        </Typography>


                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mt: 0.5,
                            }}
                        >
                            Coupon details
                        </Typography>

                    </Box>

                </Stack>


                <Button
                    variant="contained"

                    startIcon={
                        <EditIcon />
                    }

                    onClick={() =>
                        router.push(
                            `/admin/coupons/${coupon.id}/edit`
                        )
                    }

                    sx={{
                        textTransform:
                            "none",

                        fontWeight:
                            600,
                            maxHeight:'50px'
                    }}
                >
                    Edit Coupon
                </Button>

            </Stack>


            {/* ================================================== */}
            {/* OVERVIEW */}
            {/* ================================================== */}

            <Paper
                sx={{
                    p: 3,

                    mb: 2,
                }}
            >

                <Stack
                    direction={{
                        xs: "column",
                        sm: "row",
                    }}

                    spacing={3}

                    alignItems={{
                        xs: "flex-start",
                        sm: "center",
                    }}
                >

                    <Box
                        sx={{
                            flex: 1,
                        }}
                    >

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Coupon Code
                        </Typography>


                        <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{
                                mt: 0.5,
                            }}
                        >
                            {coupon.code}
                        </Typography>

                    </Box>


                    <Box
                        sx={{
                            flex: 1,
                        }}
                    >

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Discount
                        </Typography>


                        <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{
                                mt: 0.5,
                            }}
                        >
                            {formatDiscount()}
                        </Typography>

                    </Box>


                    <Box
                        sx={{
                            flex: 1,
                        }}
                    >

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Status
                        </Typography>


                        <Box
                            sx={{
                                mt: 0.5,
                            }}
                        >

                            <Chip
                                label={
                                    coupon.status
                                }

                                color={
                                    getStatusColor()
                                }

                                size="small"
                            />

                        </Box>

                    </Box>

                </Stack>

            </Paper>


            {/* ================================================== */}
            {/* DISCOUNT */}
            {/* ================================================== */}

            <Paper
                sx={{
                    p: 3,

                    mb: 2,
                }}
            >

                <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{
                        mb: 2,
                    }}
                >
                    Discount Configuration
                </Typography>


                <Stack
                    spacing={2}
                >

                    <DetailRow
                        label="Discount Type"
                        value={
                            coupon.type ===
                            "percentage"
                                ? "Percentage"
                                : "Fixed Amount"
                        }
                    />


                    <Divider />


                    <DetailRow
                        label="Discount Value"
                        value={
                            formatDiscount()
                        }
                    />


                    <Divider />


                    <DetailRow
                        label="Minimum Order Amount"
                        value={
                            coupon.minimum_order_amount !==
                            null
                                ? formatMoney(
                                    coupon.minimum_order_amount
                                )
                                : "No minimum"
                        }
                    />


                    <Divider />


                    <DetailRow
                        label="Maximum Discount Amount"
                        value={
                            coupon.maximum_discount_amount !==
                            null
                                ? formatMoney(
                                    coupon.maximum_discount_amount
                                )
                                : "No maximum"
                        }
                    />

                </Stack>

            </Paper>


            {/* ================================================== */}
            {/* USAGE */}
            {/* ================================================== */}

            <Paper
                sx={{
                    p: 3,

                    mb: 2,
                }}
            >

                <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{
                        mb: 2,
                    }}
                >
                    Usage Limits
                </Typography>


                <Stack
                    spacing={2}
                >

                    <DetailRow
                        label="Total Usage"
                        value={
                            coupon.usage_limit !==
                            null
                                ? `${coupon.used_count} / ${coupon.usage_limit}`
                                : `${coupon.used_count} / Unlimited`
                        }
                    />


                    <Divider />


                    <DetailRow
                        label="Usage Limit Per Customer"
                        value={
                            coupon.usage_limit_per_customer !==
                            null
                                ? coupon.usage_limit_per_customer
                                : "Unlimited"
                        }
                    />


                    <Divider />


                    <DetailRow
                        label="Used Count"
                        value={
                            coupon.used_count
                        }
                    />

                </Stack>

            </Paper>


            {/* ================================================== */}
            {/* SCHEDULE */}
            {/* ================================================== */}

            <Paper
                sx={{
                    p: 3,

                    mb: 2,
                }}
            >

                <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{
                        mb: 2,
                    }}
                >
                    Schedule
                </Typography>


                <Stack
                    spacing={2}
                >

                    <DetailRow
                        label="Starts At"
                        value={
                            formatDate(
                                coupon.starts_at
                            )
                        }
                    />


                    <Divider />


                    <DetailRow
                        label="Expires At"
                        value={
                            formatDate(
                                coupon.expires_at
                            )
                        }
                    />

                </Stack>

            </Paper>


            {/* ================================================== */}
            {/* TIMESTAMPS */}
            {/* ================================================== */}

            <Paper
                sx={{
                    p: 3,
                }}
            >

                <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{
                        mb: 2,
                    }}
                >
                    Information
                </Typography>


                <Stack
                    spacing={2}
                >

                    <DetailRow
                        label="Coupon ID"
                        value={
                            coupon.id
                        }
                    />


                    <Divider />


                    <DetailRow
                        label="Created At"
                        value={
                            formatDate(
                                coupon.created_at
                            )
                        }
                    />


                    <Divider />


                    <DetailRow
                        label="Updated At"
                        value={
                            formatDate(
                                coupon.updated_at
                            )
                        }
                    />

                </Stack>

            </Paper>

        </Box>

    );

}


// ================================================================
// DETAIL ROW
// ================================================================

function DetailRow({
    label,
    value,
}) {

    return (

        <Stack
            direction={{
                xs: "column",
                sm: "row",
            }}

            spacing={1}

            justifyContent="space-between"

            sx={{
                width: "100%",
            }}
        >

            <Typography
                variant="body2"
                color="text.secondary"
            >
                {label}
            </Typography>


            <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                    textAlign: {
                        xs: "left",
                        sm: "right",
                    },
                    wordBreak:
                        "break-word",
                }}
            >
                {value}
            </Typography>

        </Stack>

    );

}