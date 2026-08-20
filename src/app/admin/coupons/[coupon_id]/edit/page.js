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
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import SaveIcon from "@mui/icons-material/Save";

import { useParams, useRouter } from "next/navigation";


export default function EditCouponPage() {

    const router =
        useRouter();


    const params =
        useParams();


    const couponId =
        params?.coupon_id;


    // ============================================================
    // FORM
    // ============================================================

    const [form, setForm] =
        useState({

            code: "",

            type: "percentage",

            value: "",

            minimum_order_amount: "",

            maximum_discount_amount: "",

            usage_limit: "",

            starts_at: "",

            expires_at: "",

            status: "active",

        });


    // ============================================================
    // STATE
    // ============================================================

    const [loading, setLoading] =
        useState(true);


    const [saving, setSaving] =
        useState(false);


    const [error, setError] =
        useState("");


    const [success, setSuccess] =
        useState("");


    const [usedCount, setUsedCount] =
        useState(0);


    // ============================================================
    // FORMAT DATETIME FOR INPUT
    // ============================================================

    const formatDateTimeLocal =
        (value) => {

            if (!value) {

                return "";

            }


            const date =
                new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return "";

            }


            const year =
                date.getFullYear();


            const month =
                String(
                    date.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                );


            const day =
                String(
                    date.getDate()
                ).padStart(
                    2,
                    "0"
                );


            const hours =
                String(
                    date.getHours()
                ).padStart(
                    2,
                    "0"
                );


            const minutes =
                String(
                    date.getMinutes()
                ).padStart(
                    2,
                    "0"
                );


            return `${year}-${month}-${day}T${hours}:${minutes}`;

        };


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


                    const coupon =
                        data.coupon;


                    if (!coupon) {

                        throw new Error(
                            "Coupon not found."
                        );

                    }


                    setForm({

                        code:
                            coupon.code ||
                            "",

                        type:
                            coupon.type ||
                            "percentage",

                        value:
                            coupon.value ??
                            "",

                        minimum_order_amount:
                            coupon.minimum_order_amount ??
                            "",

                        maximum_discount_amount:
                            coupon.maximum_discount_amount ??
                            "",

                        usage_limit:
                            coupon.usage_limit ??
                            "",

                        starts_at:
                            formatDateTimeLocal(
                                coupon.starts_at
                            ),

                        expires_at:
                            formatDateTimeLocal(
                                coupon.expires_at
                            ),

                        status:
                            coupon.status ||
                            "active",

                    });


                    setUsedCount(
                        Number(
                            coupon.used_count ||
                            0
                        )
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
    // HANDLE CHANGE
    // ============================================================

    const handleChange =
        (event) => {

            const {
                name,
                value,
            } = event.target;


            setForm(
                (current) => ({

                    ...current,

                    [name]:
                        value,

                })
            );


            setError("");

            setSuccess("");

        };


    // ============================================================
    // SUBMIT
    // ============================================================

    const handleSubmit =
        async (event) => {

            event.preventDefault();


            setError("");

            setSuccess("");


            // ====================================================
            // CODE
            // ====================================================

            const code =
                form.code
                    .trim()
                    .toUpperCase();


            if (!code) {

                setError(
                    "Coupon code is required."
                );

                return;

            }


            // ====================================================
            // VALUE
            // ====================================================

            const value =
                Number(
                    form.value
                );


            if (
                !Number.isFinite(value) ||
                value <= 0
            ) {

                setError(
                    "Discount value must be greater than 0."
                );

                return;

            }


            if (
                form.type ===
                "percentage" &&
                value > 100
            ) {

                setError(
                    "Percentage discount cannot be greater than 100."
                );

                return;

            }


            // ====================================================
            // USAGE LIMIT
            // ====================================================

            let usageLimit =
                null;


            if (
                form.usage_limit !==
                ""
            ) {

                usageLimit =
                    Number(
                        form.usage_limit
                    );


                if (
                    !Number.isInteger(
                        usageLimit
                    ) ||
                    usageLimit < 1
                ) {

                    setError(
                        "Usage limit must be a positive integer."
                    );

                    return;

                }


                if (
                    usageLimit <
                    usedCount
                ) {

                    setError(
                        `Usage limit cannot be lower than the current used count (${usedCount}).`
                    );

                    return;

                }

            }


            // ====================================================
            // MINIMUM ORDER
            // ====================================================

            let minimumOrderAmount =
                null;


            if (
                form.minimum_order_amount !==
                ""
            ) {

                minimumOrderAmount =
                    Number(
                        form.minimum_order_amount
                    );


                if (
                    !Number.isFinite(
                        minimumOrderAmount
                    ) ||
                    minimumOrderAmount < 0
                ) {

                    setError(
                        "Invalid minimum order amount."
                    );

                    return;

                }

            }


            // ====================================================
            // MAXIMUM DISCOUNT
            // ====================================================

            let maximumDiscountAmount =
                null;


            if (
                form.maximum_discount_amount !==
                ""
            ) {

                maximumDiscountAmount =
                    Number(
                        form.maximum_discount_amount
                    );


                if (
                    !Number.isFinite(
                        maximumDiscountAmount
                    ) ||
                    maximumDiscountAmount < 0
                ) {

                    setError(
                        "Invalid maximum discount amount."
                    );

                    return;

                }

            }


            // ====================================================
            // DATES
            // ====================================================

            if (
                form.starts_at &&
                form.expires_at
            ) {

                const startDate =
                    new Date(
                        form.starts_at
                    );


                const expiryDate =
                    new Date(
                        form.expires_at
                    );


                if (
                    startDate >=
                    expiryDate
                ) {

                    setError(
                        "Expiration date must be after the start date."
                    );

                    return;

                }

            }


            // ====================================================
            // PAYLOAD
            // ====================================================

            const payload = {

                code,

                type:
                    form.type,

                value,

                minimum_order_amount:
                    minimumOrderAmount,

                maximum_discount_amount:
                    maximumDiscountAmount,

                usage_limit:
                    usageLimit,

                starts_at:
                    form.starts_at
                        ? form.starts_at
                        : null,

                expires_at:
                    form.expires_at
                        ? form.expires_at
                        : null,

                status:
                    form.status,

            };


            // ====================================================
            // UPDATE
            // ====================================================

            try {

                setSaving(true);


                const response =
                    await fetch(
                        `/api/admin/coupons/${couponId}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            credentials:
                                "include",

                            body:
                                JSON.stringify(
                                    payload
                                ),
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok
                ) {

                    throw new Error(
                        data?.message ||
                        data?.error ||
                        "Unable to update coupon."
                    );

                }


                setSuccess(
                    "Coupon updated successfully."
                );


                // ==================================================
                // GO BACK TO DETAIL PAGE
                // ==================================================

                setTimeout(
                    () => {

                        router.push(
                            `/admin/coupons/${couponId}`
                        );

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "Update coupon error:",
                    error
                );


                setError(
                    error.message ||
                    "Unable to update coupon."
                );


            } finally {

                setSaving(false);

            }

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

                <Typography
                    color="text.secondary"
                >
                    Loading coupon...
                </Typography>

            </Box>

        );

    }


    // ============================================================
    // ERROR
    // ============================================================

    if (error && !form.code) {

        return (

            <Box
                sx={{
                    width: "100%",

                    maxWidth: 900,

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
    // RENDER
    // ============================================================

    return (

        <Box
            sx={{
                width: "100%",

                maxWidth: 900,

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

                justifyContent="space-between"

                alignItems={{
                    xs: "stretch",
                    sm: "center",
                }}

                spacing={2}

                sx={{
                    mb: 3,
                }}
            >


               <Button
                    variant={'text'}

                    startIcon={
                        <ArrowBackIcon />
                    }

                    onClick={() =>
                        router.push(
                            `/admin/coupons/${couponId}`
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
                        Edit Coupon
                    </Typography>


                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 0.5,
                        }}
                    >
                        Update coupon settings and availability
                    </Typography>

                </Box>


 

            </Stack>


            {/* ================================================== */}
            {/* ALERTS */}
            {/* ================================================== */}

            {error && (

                <Alert
                    severity="error"
                    sx={{
                        mb: 2,
                    }}
                >
                    {error}
                </Alert>

            )}


            {success && (

                <Alert
                    severity="success"
                    sx={{
                        mb: 2,
                    }}
                >
                    {success}
                </Alert>

            )}


            {/* ================================================== */}
            {/* FORM */}
            {/* ================================================== */}

            <Paper
                component="form"

                onSubmit={
                    handleSubmit
                }

                sx={{
                    p: 3,
                }}
            >

                <Stack
                    spacing={3}
                >

                    {/* ================================================== */}
                    {/* COUPON INFORMATION */}
                    {/* ================================================== */}

                    <Box>

                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            sx={{
                                mb: 2,
                            }}
                        >
                            Coupon Information
                        </Typography>


                        <Stack
                            direction={{
                                xs: "column",
                                sm: "row",
                            }}

                            spacing={2}
                        >

                            <TextField
                                fullWidth

                                required

                                label="Coupon Code"

                                name="code"

                                value={
                                    form.code
                                }

                                onChange={
                                    handleChange
                                }

                                placeholder="SAVE20"

                                inputProps={{
                                    style: {
                                        textTransform:
                                            "uppercase",
                                    },
                                }}
                            />


                            <FormControl
                                fullWidth
                                required
                            >

                                <InputLabel>
                                    Discount Type
                                </InputLabel>


                                <Select
                                    name="type"

                                    value={
                                        form.type
                                    }

                                    label="Discount Type"

                                    onChange={
                                        handleChange
                                    }
                                >

                                    <MenuItem value="percentage">
                                        Percentage
                                    </MenuItem>


                                    <MenuItem value="fixed">
                                        Fixed Amount
                                    </MenuItem>

                                </Select>

                            </FormControl>

                        </Stack>

                    </Box>


                    {/* ================================================== */}
                    {/* STATUS */}
                    {/* ================================================== */}

                    <Box>

                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            sx={{
                                mb: 2,
                            }}
                        >
                            Status
                        </Typography>


                        <FormControl
                            sx={{
                                minWidth: 220,
                            }}
                        >

                            <InputLabel>
                                Status
                            </InputLabel>


                            <Select
                                name="status"

                                value={
                                    form.status
                                }

                                label="Status"

                                onChange={
                                    handleChange
                                }
                            >

                                <MenuItem value="active">
                                    Active
                                </MenuItem>


                                <MenuItem value="inactive">
                                    Inactive
                                </MenuItem>

                            </Select>


                            <FormHelperText>
                                Inactive coupons cannot be used.
                            </FormHelperText>

                        </FormControl>

                    </Box>


                    {/* ================================================== */}
                    {/* DISCOUNT */}
                    {/* ================================================== */}

                    <Box>

                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            sx={{
                                mb: 2,
                            }}
                        >
                            Discount
                        </Typography>


                        <Stack
                            direction={{
                                xs: "column",
                                sm: "row",
                            }}

                            spacing={2}
                        >

                            <TextField
                                fullWidth

                                required

                                type="number"

                                label={
                                    form.type ===
                                    "percentage"
                                        ? "Discount Percentage"
                                        : "Discount Amount"
                                }

                                name="value"

                                value={
                                    form.value
                                }

                                onChange={
                                    handleChange
                                }

                                inputProps={{
                                    min: 0,

                                    step:
                                        "0.01",

                                    max:
                                        form.type ===
                                        "percentage"
                                            ? 100
                                            : undefined,
                                }}

                                helperText={
                                    form.type ===
                                    "percentage"
                                        ? "Example: 20 = 20% off"
                                        : "Example: 25 = $25 off"
                                }
                            />


                            <TextField
                                fullWidth

                                type="number"

                                label="Minimum Order Amount"

                                name="minimum_order_amount"

                                value={
                                    form.minimum_order_amount
                                }

                                onChange={
                                    handleChange
                                }

                                inputProps={{
                                    min: 0,

                                    step:
                                        "0.01",
                                }}

                                helperText="Leave empty for no minimum"
                            />


                            <TextField
                                fullWidth

                                type="number"

                                label="Maximum Discount Amount"

                                name="maximum_discount_amount"

                                value={
                                    form.maximum_discount_amount
                                }

                                onChange={
                                    handleChange
                                }

                                disabled={
                                    form.type ===
                                    "fixed"
                                }

                                inputProps={{
                                    min: 0,

                                    step:
                                        "0.01",
                                }}

                                helperText={
                                    form.type ===
                                    "percentage"
                                        ? "Leave empty for no limit"
                                        : "Not applicable to fixed discounts"
                                }
                            />

                        </Stack>

                    </Box>


                    {/* ================================================== */}
                    {/* USAGE */}
                    {/* ================================================== */}

                    <Box>

                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            sx={{
                                mb: 2,
                            }}
                        >
                            Usage
                        </Typography>


                        <Stack
                            direction={{
                                xs: "column",
                                sm: "row",
                            }}

                            spacing={2}
                        >

                            <TextField
                                fullWidth

                                type="number"

                                label="Usage Limit"

                                name="usage_limit"

                                value={
                                    form.usage_limit
                                }

                                onChange={
                                    handleChange
                                }

                                inputProps={{
                                    min:
                                        Math.max(
                                            1,
                                            usedCount
                                        ),

                                    step: 1,
                                }}

                                helperText={
                                    usedCount > 0
                                        ? `Currently used ${usedCount} time${usedCount === 1 ? "" : "s"}`
                                        : "Leave empty for unlimited"
                                }
                            />


                            <TextField
                                fullWidth

                                label="Used Count"

                                value={
                                    usedCount
                                }

                                disabled

                                helperText="This value is managed automatically."
                            />

                        </Stack>

                    </Box>


                    {/* ================================================== */}
                    {/* SCHEDULE */}
                    {/* ================================================== */}

                    <Box>

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
                            direction={{
                                xs: "column",
                                sm: "row",
                            }}

                            spacing={2}
                        >

                            <TextField
                                fullWidth

                                type="datetime-local"

                                label="Starts At"

                                name="starts_at"

                                value={
                                    form.starts_at
                                }

                                onChange={
                                    handleChange
                                }

                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}

                                helperText="Leave empty to start immediately"
                            />


                            <TextField
                                fullWidth

                                type="datetime-local"

                                label="Expires At"

                                name="expires_at"

                                value={
                                    form.expires_at
                                }

                                onChange={
                                    handleChange
                                }

                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}

                                helperText="Leave empty for no expiration"
                            />

                        </Stack>

                    </Box>





                    {/* ================================================== */}
                    {/* ACTIONS */}
                    {/* ================================================== */}

                    <Stack
                        direction="row"

                        justifyContent="flex-end"

                        spacing={2}

                        sx={{
                            pt: 1,
                        }}
                    >

                        <Button
                            variant="outlined"

                            disabled={
                                saving
                            }

                            onClick={() =>
                                router.push(
                                    `/admin/coupons/${couponId}`
                                )
                            }

                            sx={{
                                textTransform:
                                    "none",

                                fontWeight:
                                    600,
                            }}
                        >
                            Cancel
                        </Button>


                        <Button
                            type="submit"

                            variant="contained"

                            disabled={
                                saving
                            }

                            startIcon={
                                saving
                                    ? null
                                    : <SaveIcon />
                            }

                            sx={{
                                textTransform:
                                    "none",

                                fontWeight:
                                    600,

                                minWidth:
                                    150,
                            }}
                        >
                            {saving
                                ? "Saving..."
                                : "Save Changes"}
                        </Button>

                    </Stack>

                </Stack>

            </Paper>

        </Box>

    );

}