'use client';

import Link from 'next/link';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    InputAdornment,
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
} from '@mui/material';

import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import ClearOutlinedIcon from '@mui/icons-material/Clear';
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';

import { useCallback, useEffect, useState } from 'react';


// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_LIMIT = 25;

const PAYMENT_STATUSES = [

    {
        value: 'all',
        label: 'All',
    },

    {
        value: 'pending',
        label: 'Pending',
    },

    {
        value: 'paid',
        label: 'Paid',
    },

    {
        value: 'failed',
        label: 'Failed',
    },

    {
        value: 'partially_refunded',
        label: 'Partially Refunded',
    },

    {
        value: 'refunded',
        label: 'Refunded',
    },

];


const ORDER_STATUSES = [

    {
        value: 'all',
        label: 'All',
    },

    {
        value: 'pending',
        label: 'Pending',
    },

    {
        value: 'processing',
        label: 'Processing',
    },

    {
        value: 'completed',
        label: 'Completed',
    },

    {
        value: 'cancelled',
        label: 'Cancelled',
    },

];


const FULFILLMENT_STATUSES = [

    {
        value: 'all',
        label: 'All',
    },

    {
        value: 'unfulfilled',
        label: 'Unfulfilled',
    },

    {
        value: 'partially_fulfilled',
        label: 'Partially Fulfilled',
    },

    {
        value: 'fulfilled',
        label: 'Fulfilled',
    },

];


// ============================================================
// HELPERS
// ============================================================

function formatStatus(status) {

    if (!status) {
        return '-';
    }


    return String(status)
        .replaceAll('_', ' ')
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );

}


function formatCurrency(
    amount,
    currency = 'USD'
) {

    try {

        return new Intl.NumberFormat(
            'en-US',
            {
                style: 'currency',
                currency: currency || 'USD',
            }
        ).format(
            Number(amount || 0)
        );

    } catch {

        return `${currency || 'USD'} ${Number(amount || 0).toFixed(2)}`;

    }

}


function formatDate(date) {

    if (!date) {
        return '-';
    }


    const parsedDate =
        new Date(date);


    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {

        return '-';

    }


    return parsedDate.toLocaleDateString(
        'en-US',
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }
    );

}


function getStatusColor(status) {

    switch (status) {

        case 'paid':
        case 'fulfilled':
        case 'completed':

            return 'success';


        case 'pending':
        case 'unfulfilled':
        case 'processing':

            return 'warning';


        case 'failed':
        case 'cancelled':
        case 'refunded':

            return 'error';


        case 'partially_fulfilled':
        case 'partially_refunded':

            return 'info';


        default:

            return 'default';

    }

}


function getCustomerName(order) {

    const name = [

        order.shipping_first_name,

        order.shipping_last_name,

    ]
        .filter(Boolean)
        .join(' ')
        .trim();


    return name || 'Guest';

}


// ============================================================
// PAGE
// ============================================================

export default function OrdersPage() {

    // ============================================================
    // DATA
    // ============================================================

    const [orders, setOrders] =
        useState([]);


    const [pagination, setPagination] =
        useState({

            page: 1,

            limit: DEFAULT_LIMIT,

            has_previous: false,

            has_next: false,

        });


    // ============================================================
    // UI STATE
    // ============================================================

    const [loading, setLoading] =
        useState(true);


    const [error, setError] =
        useState('');


    // ============================================================
    // FILTER STATE
    // ============================================================

    const [search, setSearch] =
        useState('');


    const [paymentStatus, setPaymentStatus] =
        useState('paid');


    const [status, setStatus] =
        useState('all');


    const [fulfillmentStatus, setFulfillmentStatus] =
        useState('all');


    const [dateFrom, setDateFrom] =
        useState('');


    const [dateTo, setDateTo] =
        useState('');


    // ============================================================
    // APPLIED SEARCH
    //
    // Search is only sent when the user presses Enter or clicks
    // Search.
    // ============================================================

    const [appliedSearch, setAppliedSearch] =
        useState('');


    // ============================================================
    // FETCH ORDERS
    // ============================================================

    const fetchOrders = useCallback(
        async ({
            page = 1,
            searchValue = appliedSearch,
            paymentValue = paymentStatus,
            statusValue = status,
            fulfillmentValue = fulfillmentStatus,
            dateFromValue = dateFrom,
            dateToValue = dateTo,
        } = {}) => {

            try {

                setLoading(true);

                setError('');


                // ====================================================
                // BUILD QUERY
                // ====================================================

                const params =
                    new URLSearchParams();


                params.set(
                    'page',
                    String(page)
                );


                params.set(
                    'limit',
                    String(DEFAULT_LIMIT)
                );


                // ----------------------------------------------------
                // SEARCH
                // ----------------------------------------------------

                if (searchValue) {

                    params.set(
                        'search',
                        searchValue
                    );

                }


                // ----------------------------------------------------
                // PAYMENT STATUS
                // ----------------------------------------------------

                if (
                    paymentValue &&
                    paymentValue !== 'all'
                ) {

                    params.set(
                        'payment_status',
                        paymentValue
                    );

                }


                // ----------------------------------------------------
                // ORDER STATUS
                // ----------------------------------------------------

                if (
                    statusValue &&
                    statusValue !== 'all'
                ) {

                    params.set(
                        'status',
                        statusValue
                    );

                }


                // ----------------------------------------------------
                // FULFILLMENT STATUS
                // ----------------------------------------------------

                if (
                    fulfillmentValue &&
                    fulfillmentValue !== 'all'
                ) {

                    params.set(
                        'fulfillment_status',
                        fulfillmentValue
                    );

                }


                // ----------------------------------------------------
                // DATE FROM
                // ----------------------------------------------------

                if (dateFromValue) {

                    params.set(
                        'date_from',
                        dateFromValue
                    );

                }


                // ----------------------------------------------------
                // DATE TO
                // ----------------------------------------------------

                if (dateToValue) {

                    params.set(
                        'date_to',
                        dateToValue
                    );

                }


                // ====================================================
                // REQUEST
                // ====================================================

                const response =
                    await fetch(
                        `/api/admin/orders?${params.toString()}`,
                        {
                            method: 'GET',

                            credentials: 'include',

                            cache: 'no-store',
                        }
                    );


                const data =
                    await response.json();


                // ====================================================
                // HANDLE ERROR
                // ====================================================

                if (!response.ok) {

                    throw new Error(
                        data?.message ||
                        'Unable to retrieve orders.'
                    );

                }


                // ====================================================
                // UPDATE DATA
                // ====================================================

                setOrders(
                    Array.isArray(data.orders)
                        ? data.orders
                        : []
                );


                setPagination(
                    data.pagination || {

                        page,

                        limit: DEFAULT_LIMIT,

                        has_previous:
                            page > 1,

                        has_next: false,

                    }
                );


            } catch (error) {

                console.error(
                    'Orders fetch error:',
                    error
                );


                setError(
                    error.message ||
                    'Unable to retrieve orders.'
                );


                setOrders([]);

            } finally {

                setLoading(false);

            }

        },
        [
            appliedSearch,
            paymentStatus,
            status,
            fulfillmentStatus,
            dateFrom,
            dateTo,
        ]
    );


    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {

        fetchOrders({
            page: 1,
        });

    }, [fetchOrders]);


    // ============================================================
    // SEARCH
    // ============================================================

    function handleSearch() {

        setAppliedSearch(
            search.trim()
        );


        fetchOrders({

            page: 1,

            searchValue:
                search.trim(),

        });

    }


    // ============================================================
    // SEARCH ENTER
    // ============================================================

    function handleSearchKeyDown(event) {

        if (
            event.key === 'Enter'
        ) {

            handleSearch();

        }

    }


    // ============================================================
    // PAYMENT FILTER
    // ============================================================

    function handlePaymentStatusChange(
        event
    ) {

        const value =
            event.target.value;


        setPaymentStatus(
            value
        );


        fetchOrders({

            page: 1,

            paymentValue:
                value,

        });

    }


    // ============================================================
    // ORDER STATUS FILTER
    // ============================================================

    function handleStatusChange(
        event
    ) {

        const value =
            event.target.value;


        setStatus(
            value
        );


        fetchOrders({

            page: 1,

            statusValue:
                value,

        });

    }


    // ============================================================
    // FULFILLMENT FILTER
    // ============================================================

    function handleFulfillmentStatusChange(
        event
    ) {

        const value =
            event.target.value;


        setFulfillmentStatus(
            value
        );


        fetchOrders({

            page: 1,

            fulfillmentValue:
                value,

        });

    }


    // ============================================================
    // DATE FROM
    // ============================================================

    function handleDateFromChange(
        event
    ) {

        const value =
            event.target.value;


        setDateFrom(
            value
        );


        fetchOrders({

            page: 1,

            dateFromValue:
                value,

        });

    }


    // ============================================================
    // DATE TO
    // ============================================================

    function handleDateToChange(
        event
    ) {

        const value =
            event.target.value;


        setDateTo(
            value
        );


        fetchOrders({

            page: 1,

            dateToValue:
                value,

        });

    }


    // ============================================================
    // CLEAR FILTERS
    // ============================================================

    function handleClearFilters() {

        setSearch('');

        setAppliedSearch('');

        setPaymentStatus('paid');

        setStatus('all');

        setFulfillmentStatus('all');

        setDateFrom('');

        setDateTo('');


        fetchOrders({

            page: 1,

            searchValue: '',

            paymentValue: 'paid',

            statusValue: 'all',

            fulfillmentValue: 'all',

            dateFromValue: '',

            dateToValue: '',

        });

    }


    // ============================================================
    // REFRESH
    // ============================================================

    function handleRefresh() {

        fetchOrders({

            page:
                pagination.page,

        });

    }


    // ============================================================
    // PREVIOUS PAGE
    // ============================================================

    function handlePreviousPage() {

        if (
            !pagination.has_previous ||
            loading
        ) {

            return;

        }


        const previousPage =
            pagination.page - 1;


        fetchOrders({

            page:
                previousPage,

        });

    }


    // ============================================================
    // NEXT PAGE
    // ============================================================

    function handleNextPage() {

        if (
            !pagination.has_next ||
            loading
        ) {

            return;

        }


        const nextPage =
            pagination.page + 1;


        fetchOrders({

            page:
                nextPage,

        });

    }


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <Box>

            {/* ================================================== */}
            {/* PAGE HEADER */}
            {/* ================================================== */}

            <Box
                sx={{
                    display: 'flex',
                    alignItems: {
                        xs: 'flex-start',
                        sm: 'center',
                    },
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 3,
                    flexDirection: {
                        xs: 'column',
                        sm: 'row',
                    },
                }}
            >

                <Box>

                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                        }}
                    >
                        Orders
                    </Typography>


                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 0.5,
                        }}
                    >
                        View and manage customer orders.
                    </Typography>

                </Box>


                <Button
                    variant="outlined"
                    startIcon={
                        <RefreshOutlinedIcon />
                    }
                    onClick={
                        handleRefresh
                    }
                    disabled={loading}
                >
                    Refresh
                </Button>

            </Box>


            {/* ================================================== */}
            {/* FILTERS */}
            {/* ================================================== */}

            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >

                <Stack
                    spacing={2}
                >

                    {/* ========================================== */}
                    {/* SEARCH */}
                    {/* ========================================== */}

                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            flexDirection: {
                                xs: 'column',
                                sm: 'row',
                            },
                        }}
                    >

                        <TextField
                            fullWidth
                            size="small"
                            label="Search orders"
                            placeholder="Order number or customer email"
                            value={search}
                            onChange={
                                event =>
                                    setSearch(
                                        event.target.value
                                    )
                            }
                            onKeyDown={
                                handleSearchKeyDown
                            }
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment
                                        position="start"
                                    >
                                        <SearchOutlinedIcon
                                            fontSize="small"
                                        />
                                    </InputAdornment>
                                ),
                            }}
                        />


                        <Button
                            variant="contained"
                            onClick={
                                handleSearch
                            }
                            disabled={loading}
                            sx={{
                                minWidth: 110,
                            }}
                        >
                            Search
                        </Button>

                    </Box>


                    {/* ========================================== */}
                    {/* FILTER ROW */}
                    {/* ========================================== */}

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, 1fr)',
                                md: 'repeat(3, 1fr)',
                                lg: 'repeat(5, 1fr)',
                            },
                            gap: 2,
                        }}
                    >

                        {/* ====================================== */}
                        {/* PAYMENT */}
                        {/* ====================================== */}

                        <FormControl
                            size="small"
                            fullWidth
                        >

                            <InputLabel>
                                Payment
                            </InputLabel>

                            <Select
                                value={
                                    paymentStatus
                                }
                                label="Payment"
                                onChange={
                                    handlePaymentStatusChange
                                }
                            >

                                {PAYMENT_STATUSES.map(
                                    option => (

                                        <MenuItem
                                            key={
                                                option.value
                                            }
                                            value={
                                                option.value
                                            }
                                        >
                                            {
                                                option.label
                                            }
                                        </MenuItem>

                                    )
                                )}

                            </Select>

                        </FormControl>


                        {/* ====================================== */}
                        {/* ORDER STATUS */}
                        {/* ====================================== */}

                        <FormControl
                            size="small"
                            fullWidth
                        >

                            <InputLabel>
                                Order Status
                            </InputLabel>

                            <Select
                                value={
                                    status
                                }
                                label="Order Status"
                                onChange={
                                    handleStatusChange
                                }
                            >

                                {ORDER_STATUSES.map(
                                    option => (

                                        <MenuItem
                                            key={
                                                option.value
                                            }
                                            value={
                                                option.value
                                            }
                                        >
                                            {
                                                option.label
                                            }
                                        </MenuItem>

                                    )
                                )}

                            </Select>

                        </FormControl>


                        {/* ====================================== */}
                        {/* FULFILLMENT */}
                        {/* ====================================== */}

                        <FormControl
                            size="small"
                            fullWidth
                        >

                            <InputLabel>
                                Fulfillment
                            </InputLabel>

                            <Select
                                value={
                                    fulfillmentStatus
                                }
                                label="Fulfillment"
                                onChange={
                                    handleFulfillmentStatusChange
                                }
                            >

                                {FULFILLMENT_STATUSES.map(
                                    option => (

                                        <MenuItem
                                            key={
                                                option.value
                                            }
                                            value={
                                                option.value
                                            }
                                        >
                                            {
                                                option.label
                                            }
                                        </MenuItem>

                                    )
                                )}

                            </Select>

                        </FormControl>


                        {/* ====================================== */}
                        {/* DATE FROM */}
                        {/* ====================================== */}

                        <TextField
                            size="small"
                            fullWidth
                            label="From"
                            type="date"
                            value={
                                dateFrom
                            }
                            onChange={
                                handleDateFromChange
                            }
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                        />


                        {/* ====================================== */}
                        {/* DATE TO */}
                        {/* ====================================== */}

                        <TextField
                            size="small"
                            fullWidth
                            label="To"
                            type="date"
                            value={
                                dateTo
                            }
                            onChange={
                                handleDateToChange
                            }
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                        />

                    </Box>


                    {/* ========================================== */}
                    {/* CLEAR FILTERS */}
                    {/* ========================================== */}

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                        }}
                    >

                        <Button
                            size="small"
                            color="inherit"
                            startIcon={
                                <ClearOutlinedIcon />
                            }
                            onClick={
                                handleClearFilters
                            }
                        >
                            Clear filters
                        </Button>

                    </Box>

                </Stack>

            </Paper>


            {/* ================================================== */}
            {/* ERROR */}
            {/* ================================================== */}

            {error && (

                <Alert
                    severity="error"
                    sx={{
                        mb: 3,
                    }}
                    onClose={() =>
                        setError('')
                    }
                >
                    {error}
                </Alert>

            )}


            {/* ================================================== */}
            {/* ORDERS TABLE */}
            {/* ================================================== */}

            <Paper
                elevation={0}
                sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                }}
            >

                <TableContainer>

                    <Table
                        sx={{
                            minWidth: 1100,
                        }}
                    >

                        {/* ====================================== */}
                        {/* TABLE HEADER */}
                        {/* ====================================== */}

                        <TableHead>

                            <TableRow>

                                <TableCell>
                                    Order
                                </TableCell>

                                <TableCell>
                                    Customer
                                </TableCell>

                                <TableCell>
                                    Date
                                </TableCell>

                                <TableCell>
                                    Payment
                                </TableCell>

                                <TableCell>
                                    Fulfillment
                                </TableCell>

                                <TableCell>
                                    Delivery
                                </TableCell>

                                <TableCell align="right">
                                    Total
                                </TableCell>

                            </TableRow>

                        </TableHead>


                        {/* ====================================== */}
                        {/* TABLE BODY */}
                        {/* ====================================== */}

                        <TableBody>

                            {/* ================================== */}
                            {/* LOADING */}
                            {/* ================================== */}

                            {loading ? (

                                <TableRow>

                                    <TableCell
                                        colSpan={7}
                                        align="center"
                                        sx={{
                                            py: 8,
                                        }}
                                    >

                                        <CircularProgress
                                            size={28}
                                        />

                                    </TableCell>

                                </TableRow>

                            ) : orders.length === 0 ? (

                                /* ================================== */
                                /* EMPTY */
                                /* ================================== */

                                <TableRow>

                                    <TableCell
                                        colSpan={7}
                                        align="center"
                                        sx={{
                                            py: 8,
                                        }}
                                    >

                                        <Typography
                                            variant="body1"
                                            color="text.secondary"
                                        >
                                            No orders found.
                                        </Typography>

                                    </TableCell>

                                </TableRow>

                            ) : (

                                /* ================================== */
                                /* ORDERS */
                                /* ================================== */

                                orders.map(
                                    order => (


                                        <TableRow
                                            key={order.id}
                                            hover
                                            component={Link}
                                            href={`/admin/orders/${order.id}`}
                                            sx={{
                                                cursor: 'pointer',
                                                textDecoration: 'none',
                                            }}
                                        >



                                            {/* ====================== */}
                                            {/* ORDER */}
                                            {/* ====================== */}

                                            <TableCell>

                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {
                                                        order.order_number
                                                    }
                                                </Typography>

                                            </TableCell>


                                            {/* ====================== */}
                                            {/* CUSTOMER */}
                                            {/* ====================== */}

                                            <TableCell>

                                                <Box>

                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {
                                                            getCustomerName(
                                                                order
                                                            )
                                                        }
                                                    </Typography>


                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {
                                                            order.customer_email
                                                        }
                                                    </Typography>

                                                </Box>

                                            </TableCell>


                                            {/* ====================== */}
                                            {/* DATE */}
                                            {/* ====================== */}

                                            <TableCell>

                                                <Typography
                                                    variant="body2"
                                                >
                                                    {
                                                        formatDate(
                                                            order.created_at
                                                        )
                                                    }
                                                </Typography>

                                            </TableCell>


                                            {/* ====================== */}
                                            {/* PAYMENT */}
                                            {/* ====================== */}

                                            <TableCell>

                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    label={
                                                        formatStatus(
                                                            order.payment_status
                                                        )
                                                    }
                                                    color={
                                                        getStatusColor(
                                                            order.payment_status
                                                        )
                                                    }
                                                />

                                            </TableCell>


                                            {/* ====================== */}
                                            {/* FULFILLMENT */}
                                            {/* ====================== */}

                                            <TableCell>

                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    label={
                                                        formatStatus(
                                                            order.fulfillment_status
                                                        )
                                                    }
                                                    color={
                                                        getStatusColor(
                                                            order.fulfillment_status
                                                        )
                                                    }
                                                />

                                            </TableCell>


                                            {/* ====================== */}
                                            {/* DELIVERY */}
                                            {/* ====================== */}

                                            <TableCell>

                                                <Typography
                                                    variant="body2"
                                                >
                                                    {
                                                        formatStatus(
                                                            order.delivery_method
                                                        )
                                                    }
                                                </Typography>

                                            </TableCell>


                                            {/* ====================== */}
                                            {/* TOTAL */}
                                            {/* ====================== */}

                                            <TableCell
                                                align="right"
                                            >

                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {
                                                        formatCurrency(
                                                            order.grand_total,
                                                            order.currency
                                                        )
                                                    }
                                                </Typography>

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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 2,
                        py: 1.5,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                    }}
                >

                    {/* ============================================== */}
                    {/* PAGE */}
                    {/* ============================================== */}

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        Page {pagination.page}
                    </Typography>


                    {/* ============================================== */}
                    {/* CONTROLS */}
                    {/* ============================================== */}

                    <Stack
                        direction="row"
                        spacing={1}
                    >

                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={
                                <ChevronLeftOutlinedIcon />
                            }
                            disabled={
                                loading ||
                                !pagination.has_previous
                            }
                            onClick={
                                handlePreviousPage
                            }
                        >
                            Previous
                        </Button>


                        <Button
                            size="small"
                            variant="outlined"
                            endIcon={
                                <ChevronRightOutlinedIcon />
                            }
                            disabled={
                                loading ||
                                !pagination.has_next
                            }
                            onClick={
                                handleNextPage
                            }
                        >
                            Next
                        </Button>

                    </Stack>

                </Box>

            </Paper>

        </Box>

    );

}