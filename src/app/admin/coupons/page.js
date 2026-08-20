"use client";

import React, {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

import VisibilityIcon from "@mui/icons-material/Visibility";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { useRouter } from "next/navigation";


export default function CouponsPage() {

    const router =
        useRouter();


    // ============================================================
    // COUPONS
    // ============================================================

    const [coupons, setCoupons] =
        useState([]);


    // ============================================================
    // LOADING / ERROR
    // ============================================================

    const [loading, setLoading] =
        useState(true);


    const [error, setError] =
        useState("");


    // ============================================================
    // PAGINATION
    // ============================================================

    const [page, setPage] =
        useState(1);


    const [limit, setLimit] =
        useState(25);


    const [pagination, setPagination] =
        useState({

            page: 1,

            limit: 25,

            total: 0,

            has_previous: false,

            has_next: false,

        });


    // ============================================================
    // FILTERS
    // ============================================================

    const [search, setSearch] =
        useState("");


    const [status, setStatus] =
        useState("");


    // ============================================================
    // FETCH COUPONS
    // ============================================================

    const fetchCoupons =
        useCallback(
            async () => {

                try {

                    setLoading(true);

                    setError("");


                    const params =
                        new URLSearchParams();


                    params.set(
                        "page",
                        String(page)
                    );


                    params.set(
                        "limit",
                        String(limit)
                    );


                    if (
                        search.trim()
                    ) {

                        params.set(
                            "search",
                            search.trim()
                        );

                    }


                    if (status) {

                        params.set(
                            "status",
                            status
                        );

                    }


                    const response =
                        await fetch(
                            `/api/admin/coupons?${params.toString()}`,
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
                            "Unable to retrieve coupons."
                        );

                    }


                    setCoupons(
                        data.coupons || []
                    );


                    setPagination(
                        data.pagination || {

                            page,

                            limit,

                            total: 0,

                            has_previous:
                                false,

                            has_next:
                                false,

                        }
                    );


                } catch (error) {

                    console.error(
                        "Fetch coupons error:",
                        error
                    );


                    setError(
                        error.message ||
                        "Unable to retrieve coupons."
                    );


                    setCoupons([]);


                } finally {

                    setLoading(false);

                }

            },
            [
                page,
                limit,
                search,
                status,
            ]
        );


    useEffect(
        () => {

            fetchCoupons();

        },
        [
            fetchCoupons,
        ]
    );


    // ============================================================
    // SEARCH
    // ============================================================

    const handleSearchChange =
        (event) => {

            setSearch(
                event.target.value
            );


            setPage(1);

        };


    // ============================================================
    // STATUS
    // ============================================================

    const handleStatusChange =
        (event) => {

            setStatus(
                event.target.value
            );


            setPage(1);

        };


    // ============================================================
    // PAGINATION
    // ============================================================

    const handlePreviousPage =
        () => {

            if (
                !pagination.has_previous ||
                loading
            ) {

                return;

            }


            setPage(
                (currentPage) =>
                    Math.max(
                        1,
                        currentPage - 1
                    )
            );

        };


    const handleNextPage =
        () => {

            if (
                !pagination.has_next ||
                loading
            ) {

                return;

            }


            setPage(
                (currentPage) =>
                    currentPage + 1
            );

        };


    const handleLimitChange =
        (event) => {

            setLimit(
                Number(
                    event.target.value
                )
            );


            setPage(1);

        };


    // ============================================================
    // NAVIGATION
    // ============================================================

    const handleCreateCoupon =
        () => {

            router.push(
                "/admin/coupons/create-new"
            );

        };


    const handleViewCoupon =
        (couponId) => {

            router.push(
                `/admin/coupons/${couponId}`
            );

        };


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
        (coupon) => {

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


            return new Date(
                value
            ).toLocaleDateString(
                "en-US",
                {
                    year: "numeric",

                    month: "short",

                    day: "numeric",
                }
            );

        };


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <Box
            sx={{
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                p: 3,
            }}
        >

            {/* ================================================== */}
            {/* HEADER */}
            {/* ================================================== */}

            <Stack
                direction={{
                    xs: "column",
                    md: "row",
                }}

                alignItems={{
                    xs: "stretch",
                    md: "center",
                }}

                spacing={2}

                sx={{
                    mb: 3,
                    justifyContent:'space-between'
                }}
            >

                {/* ================================================== */}
                {/* TITLE */}
                {/* ================================================== */}

                <Box
                    sx={{
                        flexShrink: 0,
                    }}
                >

                    <Typography
                        variant="h5"
                        fontWeight={600}
                    >
                        Coupons
                    </Typography>


                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 0.5,
                        }}
                    >
                        Manage discount coupons
                    </Typography>

                </Box>






               <Box
                    sx={{
                        background:'white',
                        display: 'flex',
                        gap: 1,
                        padding:'15px',
                        flexDirection: {
                            xs: 'column',
                            sm: 'row',
                        },
                    }}
                >

                    {/* ================================================== */}
                    {/* SEARCH */}
                    {/* ================================================== */}

                    <TextField
                        size="small"

                        placeholder="Search coupon code..."

                        value={search}

                        onChange={
                            handleSearchChange
                        }

                        sx={{
                            flex: 1,

                            minWidth: {
                                xs: "100%",
                                md: 250,
                            },
                        }}
                    />


                    <Button
                        variant={'outlined'}
                        onClick={
                            handleSearchChange
                        }
                        disabled={loading}
                        sx={{
                            minWidth: 110,
                        }}
                    >
                        Search
                    </Button>

                </Box>




                {/* ================================================== */}
                {/* CREATE COUPON */}
                {/* ================================================== */}

                <Button
                    variant="contained"

                    startIcon={
                        <AddIcon />
                    }

                    onClick={
                        handleCreateCoupon
                    }

                    sx={{
                        flexShrink: 0,

                        textTransform:
                            "none",

                        fontWeight: 600,
                        maxHeight:'50px'
                    }}
                >
                    Create Coupon
                </Button>

            </Stack>


            {/* ================================================== */}
            {/* STATUS FILTER */}
            {/* ================================================== */}

            <Paper
                sx={{
                    p: 2,
                    mb: 2,
                }}
            >

                <FormControl
                    size="small"

                    sx={{
                        minWidth: 180,
                    }}
                >

                    <InputLabel>
                        Status
                    </InputLabel>


                    <Select
                        value={status}

                        label="Status"

                        onChange={
                            handleStatusChange
                        }
                    >

                        <MenuItem value="">
                            All
                        </MenuItem>


                        <MenuItem value="active">
                            Active
                        </MenuItem>


                        <MenuItem value="inactive">
                            Inactive
                        </MenuItem>

                    </Select>

                </FormControl>

            </Paper>


            {/* ================================================== */}
            {/* TABLE */}
            {/* ================================================== */}

            <Paper
                sx={{
                    width: "100%",
                    minWidth: 0,
                    overflow: "hidden",
                }}
            >

                <TableContainer
                    sx={{
                        width: "100%",
                        overflowX: "auto",
                    }}
                >

                    <Table>

                        <TableHead>

                            <TableRow>

                                <TableCell>
                                    Code
                                </TableCell>


                                <TableCell>
                                    Discount
                                </TableCell>


                                <TableCell>
                                    Minimum Order
                                </TableCell>


                                <TableCell>
                                    Usage
                                </TableCell>


                                <TableCell>
                                    Start
                                </TableCell>


                                <TableCell>
                                    Expires
                                </TableCell>


                                <TableCell>
                                    Status
                                </TableCell>


                                <TableCell
                                    align="right"
                                >
                                    Action
                                </TableCell>

                            </TableRow>

                        </TableHead>


                        <TableBody>

                            {/* ================================================== */}
                            {/* LOADING */}
                            {/* ================================================== */}

                            {loading ? (

                                <TableRow>

                                    <TableCell
                                        colSpan={8}
                                        align="center"
                                        sx={{
                                            py: 6,
                                        }}
                                    >

                                        <CircularProgress />

                                    </TableCell>

                                </TableRow>

                            ) : error ? (

                                /* ================================================== */
                                /* ERROR */
                                /* ================================================== */

                                <TableRow>

                                    <TableCell
                                        colSpan={8}
                                        align="center"
                                        sx={{
                                            py: 6,
                                        }}
                                    >

                                        <Typography
                                            color="error"
                                        >
                                            {error}
                                        </Typography>

                                    </TableCell>

                                </TableRow>

                            ) : coupons.length === 0 ? (

                                /* ================================================== */
                                /* EMPTY */
                                /* ================================================== */

                                <TableRow>

                                    <TableCell
                                        colSpan={8}
                                        align="center"
                                        sx={{
                                            py: 6,
                                        }}
                                    >

                                        <Typography
                                            color="text.secondary"
                                        >
                                            No coupons found.
                                        </Typography>

                                    </TableCell>

                                </TableRow>

                            ) : (

                                /* ================================================== */
                                /* COUPONS */
                                /* ================================================== */

                                coupons.map(
                                    (coupon) => (

                                        <TableRow
                                            key={
                                                coupon.id
                                            }

                                            hover

                                            onClick={() =>
                                                handleViewCoupon(
                                                    coupon.id
                                                )
                                            }

                                            sx={{
                                                cursor:
                                                    "pointer",
                                            }}
                                        >

                                            {/* CODE */}

                                            <TableCell>

                                                <Typography
                                                    fontWeight={600}
                                                >
                                                    {
                                                        coupon.code
                                                    }
                                                </Typography>

                                            </TableCell>


                                            {/* DISCOUNT */}

                                            <TableCell>

                                                {
                                                    formatDiscount(
                                                        coupon
                                                    )
                                                }

                                            </TableCell>


                                            {/* MINIMUM ORDER */}

                                            <TableCell>

                                                {
                                                    coupon.minimum_order_amount !==
                                                    null
                                                        ? formatMoney(
                                                            coupon.minimum_order_amount
                                                        )
                                                        : "-"
                                                }

                                            </TableCell>


                                            {/* USAGE */}

                                            <TableCell>

                                                {coupon.used_count}

                                                {" / "}

                                                {
                                                    coupon.usage_limit !==
                                                    null
                                                        ? coupon.usage_limit
                                                        : "Unlimited"
                                                }

                                            </TableCell>


                                            {/* START */}

                                            <TableCell>

                                                {
                                                    formatDate(
                                                        coupon.starts_at
                                                    )
                                                }

                                            </TableCell>


                                            {/* EXPIRES */}

                                            <TableCell>

                                                {
                                                    formatDate(
                                                        coupon.expires_at
                                                    )
                                                }

                                            </TableCell>


                                            {/* STATUS */}

                                            <TableCell>

                                                <Chip
                                                    size="small"

                                                    label={
                                                        coupon.status
                                                    }

                                                    color={
                                                        coupon.status ===
                                                        "active"
                                                            ? "success"
                                                            : "default"
                                                    }

                                                />

                                            </TableCell>


                                            {/* ACTION */}

                                            <TableCell
                                                align="right"

                                                onClick={
                                                    (event) =>
                                                        event.stopPropagation()
                                                }
                                            >

                                                <Button
                                                    size="small"

                                                    startIcon={
                                                        <VisibilityIcon />
                                                    }

                                                    onClick={() =>
                                                        handleViewCoupon(
                                                            coupon.id
                                                        )
                                                    }

                                                    sx={{
                                                        textTransform:
                                                            "none",
                                                    }}
                                                >
                                                    View
                                                </Button>

                                            </TableCell>

                                        </TableRow>

                                    )
                                )

                            )}

                        </TableBody>

                    </Table>

                </TableContainer>


                {/* ================================================== */}
                {/* PAGINATION */}
                {/* ================================================== */}

                <Box
                    sx={{
                        width: "100%",

                        maxWidth: "100%",

                        minWidth: 0,

                        boxSizing:
                            "border-box",

                        borderTop:
                            "1px solid",

                        borderColor:
                            "divider",

                        px: 2,

                        py: 1.5,
                    }}
                >

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
                    >

                        {/* ================================================== */}
                        {/* PAGE / LIMIT */}
                        {/* ================================================== */}

                        <Stack
                            direction="row"

                            sx={{
                                alignItems:
                                    "center",
                            }}

                            spacing={1.5}
                        >

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Page {page}
                            </Typography>


                            <FormControl
                                size="small"

                                sx={{
                                    minWidth: 105,
                                }}
                            >

                                <Select
                                    value={limit}

                                    onChange={
                                        handleLimitChange
                                    }

                                    sx={{
                                        height: 34,

                                        borderRadius:
                                            1.5,

                                        fontSize: 13,
                                    }}
                                >

                                    <MenuItem
                                        value={25}
                                    >
                                        25 / page
                                    </MenuItem>


                                    <MenuItem
                                        value={50}
                                    >
                                        50 / page
                                    </MenuItem>


                                    <MenuItem
                                        value={75}
                                    >
                                        75 / page
                                    </MenuItem>


                                    <MenuItem
                                        value={100}
                                    >
                                        100 / page
                                    </MenuItem>

                                </Select>

                            </FormControl>

                        </Stack>


                        {/* ================================================== */}
                        {/* PREVIOUS / NEXT */}
                        {/* ================================================== */}

                        <Stack
                            direction="row"
                            spacing={1}
                        >

                            <Button
                                size="small"

                                variant="outlined"

                                startIcon={
                                    <ChevronLeftIcon />
                                }

                                disabled={
                                    loading ||
                                    !pagination.has_previous
                                }

                                onClick={
                                    handlePreviousPage
                                }

                                sx={{
                                    borderRadius:
                                        1.5,

                                    textTransform:
                                        "none",

                                    fontWeight:
                                        600,
                                }}
                            >
                                Previous
                            </Button>


                            <Button
                                size="small"

                                variant="contained"

                                endIcon={
                                    <ChevronRightIcon />
                                }

                                disabled={
                                    loading ||
                                    !pagination.has_next
                                }

                                onClick={
                                    handleNextPage
                                }

                                sx={{
                                    borderRadius:
                                        1.5,

                                    textTransform:
                                        "none",

                                    fontWeight:
                                        600,
                                }}
                            >
                                Next
                            </Button>

                        </Stack>

                    </Stack>

                </Box>

            </Paper>

        </Box>

    );

}