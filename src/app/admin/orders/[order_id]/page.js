
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
    ArrowBackOutlined,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';


export default function AdminOrderDetailsPage() {

    const params = useParams();

    const orderId = params?.order_id;


    const [order, setOrder] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);


    // ============================================================
    // FETCH ORDER
    // ============================================================

    useEffect(() => {

        if (!orderId) {

            return;

        }


        async function fetchOrder() {

            try {

                setLoading(true);

                setError(null);


                const response =
                    await fetch(
                        `/api/admin/orders/${orderId}`,
                        {
                            method: 'GET',
                            credentials: 'include',
                            cache: 'no-store',
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data?.message ||
                        'Unable to retrieve order.'
                    );

                }


                if (!data.success) {

                    throw new Error(
                        data?.message ||
                        'Unable to retrieve order.'
                    );

                }


                setOrder(data.order);


            } catch (error) {

                console.error(
                    'Fetch order error:',
                    error
                );


                setError(
                    error.message ||
                    'Unable to retrieve order.'
                );


            } finally {

                setLoading(false);

            }

        }


        fetchOrder();

    }, [orderId]);


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 400,
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

            <Alert severity="error">

                {error}

            </Alert>

        );

    }


    // ============================================================
    // ORDER NOT FOUND
    // ============================================================

    if (!order) {

        return (

            <Alert severity="warning">

                Order not found.

            </Alert>

        );

    }


    // ============================================================
    // HELPERS
    // ============================================================

    const formatMoney = (value) => {

        return new Intl.NumberFormat(
            'en-US',
            {
                style: 'currency',
                currency: order.currency || 'USD',
            }
        ).format(
            Number(value || 0)
        );

    };


    const formatDate = (value) => {

        if (!value) {

            return '—';

        }


        return new Date(value).toLocaleString();

    };


    const getStatusColor = (status) => {

        switch (status) {

            case 'paid':
            case 'completed':
            case 'fulfilled':
            case 'delivered':

                return 'success';


            case 'pending':
            case 'processing':
            case 'unfulfilled':
            case 'in_transit':

                return 'warning';


            case 'failed':
            case 'cancelled':
            case 'refunded':
            case 'returned':

                return 'error';


            default:

                return 'default';

        }

    };


    // ============================================================
    // PAGE
    // ============================================================

    return (

        <Box>

            {/* ================================================== */}
            {/* HEADER */}
            {/* ================================================== */}

            <Stack
                direction={{
                    xs: 'column',
                    sm: 'row',
                }}
                justifyContent="space-between"
                alignItems={{
                    xs: 'flex-start',
                    sm: 'center',
                }}
                spacing={2}
                sx={{
                    mb: 3,
                }}
            >


                    <Button
                        startIcon={<ArrowBackOutlined />}
                        onClick={() => window.history.back()}
                        sx={{
                            mb: 2,
                        }}
                    >
                        
                    </Button>




                <Box>

                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                        }}
                    >

                        Order #{order.order_number}

                    </Typography>

                            

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 0.5,
                        }}
                    >

                        Created {formatDate(order.created_at)}

                    </Typography>

                </Box>


                <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                >

                    <Chip
                        label={order.status}
                        color={getStatusColor(
                            order.status
                        )}
                    />


                    <Chip
                        label={order.payment_status}
                        color={getStatusColor(
                            order.payment_status
                        )}
                    />


                    <Chip
                        label={order.fulfillment_status}
                        color={getStatusColor(
                            order.fulfillment_status
                        )}
                    />

                </Stack>

            </Stack>


            {/* ================================================== */}
            {/* ORDER SUMMARY */}
            {/* ================================================== */}

            <Grid
                container
                spacing={3}
            >

                {/* ================================================== */}
                {/* CUSTOMER */}
                {/* ================================================== */}

                <Grid
                    size={{
                        xs: 12,
                        md: 6,
                    }}
                >

                    <Paper
                        variant="outlined"
                        sx={{
                            p: 3,
                            height: '100%',
                        }}
                    >

                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                mb: 2,
                            }}
                        >

                            Customer

                        </Typography>


                        <Stack spacing={1}>

                            <Typography>

                                <strong>Email:</strong>{' '}

                                {order.customer_email}

                            </Typography>


                            {order.customer_id && (

                                <Typography>

                                    <strong>Customer ID:</strong>{' '}

                                    {order.customer_id}

                                </Typography>

                            )}


                            <Typography>

                                <strong>Delivery:</strong>{' '}

                                {order.delivery_method}

                            </Typography>

                        </Stack>

                    </Paper>

                </Grid>


                {/* ================================================== */}
                {/* TOTALS */}
                {/* ================================================== */}

                <Grid
                    size={{
                        xs: 12,
                        md: 6,
                    }}
                >

                    <Paper
                        variant="outlined"
                        sx={{
                            p: 3,
                            height: '100%',
                        }}
                    >

                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                mb: 2,
                            }}
                        >

                            Order Summary

                        </Typography>


                        <Stack spacing={1}>

                            <SummaryRow
                                label="Subtotal"
                                value={formatMoney(
                                    order.subtotal
                                )}
                            />


                            <SummaryRow
                                label="Discount"
                                value={`-${formatMoney(
                                    order.discount_total
                                )}`}
                            />


                            <SummaryRow
                                label="Shipping"
                                value={formatMoney(
                                    order.shipping_total
                                )}
                            />


                            <SummaryRow
                                label="Tax"
                                value={formatMoney(
                                    order.tax_total
                                )}
                            />


                            <Divider
                                sx={{
                                    my: 1,
                                }}
                            />


                            <SummaryRow
                                label="Total"
                                value={formatMoney(
                                    order.grand_total
                                )}
                                strong
                            />

                        </Stack>

                    </Paper>

                </Grid>


                {/* ================================================== */}
                {/* ITEMS */}
                {/* ================================================== */}

                <Grid
                    size={12}
                >

                    <Paper
                        variant="outlined"
                    >

                        <Box
                            sx={{
                                p: 3,
                            }}
                        >

                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                }}
                            >

                                Order Items

                            </Typography>

                        </Box>


                        <Divider />


                        <TableContainer>

                            <Table>

                                <TableHead>

                                    <TableRow>

                                        <TableCell>
                                            Product
                                        </TableCell>

                                        <TableCell>
                                            Type
                                        </TableCell>

                                        <TableCell>
                                            Vehicle
                                        </TableCell>

                                        <TableCell align="right">
                                            Quantity
                                        </TableCell>

                                        <TableCell align="right">
                                            Unit Price
                                        </TableCell>

                                        <TableCell align="right">
                                            Total
                                        </TableCell>

                                    </TableRow>

                                </TableHead>


                                <TableBody>

                                    {order.items?.map(
                                        (item) => (

                                            <TableRow
                                                key={item.id}
                                            >

                                                <TableCell>

                                                    <Typography
                                                        sx={{
                                                            fontWeight: 600,
                                                        }}
                                                    >

                                                        {item.name}

                                                    </Typography>


                                                    {item.tire_inventory_id && (

                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >

                                                            Inventory ID:{' '}

                                                            {
                                                                item.tire_inventory_id
                                                            }

                                                        </Typography>

                                                    )}

                                                </TableCell>


                                                <TableCell>

                                                    <Chip
                                                        size="small"
                                                        label={item.type}
                                                    />

                                                </TableCell>


                                                <TableCell>

                                                    {item.selected_vehicle ||
                                                        '—'}

                                                </TableCell>


                                                <TableCell align="right">

                                                    {item.quantity}

                                                </TableCell>


                                                <TableCell align="right">

                                                    {formatMoney(
                                                        item.unit_price
                                                    )}

                                                </TableCell>


                                                <TableCell
                                                    align="right"
                                                >

                                                    <Typography
                                                        sx={{
                                                            fontWeight: 600,
                                                        }}
                                                    >

                                                        {formatMoney(
                                                            item.total
                                                        )}

                                                    </Typography>

                                                </TableCell>

                                            </TableRow>

                                        )
                                    )}


                                    {(!order.items ||
                                        order.items.length === 0) && (

                                        <TableRow>

                                            <TableCell
                                                colSpan={6}
                                                align="center"
                                            >

                                                No items found.

                                            </TableCell>

                                        </TableRow>

                                    )}

                                </TableBody>

                            </Table>

                        </TableContainer>

                    </Paper>

                </Grid>


                {/* ================================================== */}
                {/* BILLING ADDRESS */}
                {/* ================================================== */}

                <Grid
                    size={{
                        xs: 12,
                        md: 6,
                    }}
                >

                    <AddressCard
                        title="Billing Address"
                        firstName={
                            order.billing_first_name
                        }
                        lastName={
                            order.billing_last_name
                        }
                        company={
                            order.billing_company
                        }
                        address1={
                            order.billing_address1
                        }
                        address2={
                            order.billing_address2
                        }
                        city={
                            order.billing_city
                        }
                        state={
                            order.billing_state
                        }
                        postcode={
                            order.billing_postcode
                        }
                        country={
                            order.billing_country
                        }
                    />

                </Grid>


                {/* ================================================== */}
                {/* SHIPPING ADDRESS */}
                {/* ================================================== */}

                <Grid
                    size={{
                        xs: 12,
                        md: 6,
                    }}
                >

                    <AddressCard
                        title="Shipping Address"
                        firstName={
                            order.shipping_first_name
                        }
                        lastName={
                            order.shipping_last_name
                        }
                        company={
                            order.shipping_company
                        }
                        address1={
                            order.shipping_address1
                        }
                        address2={
                            order.shipping_address2
                        }
                        city={
                            order.shipping_city
                        }
                        state={
                            order.shipping_state
                        }
                        postcode={
                            order.shipping_postcode
                        }
                        country={
                            order.shipping_country
                        }
                    />

                </Grid>


                {/* ================================================== */}
                {/* PAYMENTS */}
                {/* ================================================== */}

                <Grid
                    size={12}
                >

                    <Paper
                        variant="outlined"
                    >

                        <Box sx={{ p: 3 }}>

                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                }}
                            >

                                Payments

                            </Typography>

                        </Box>


                        <Divider />


                        <TableContainer>

                            <Table>

                                <TableHead>

                                    <TableRow>

                                        <TableCell>
                                            Provider
                                        </TableCell>

                                        <TableCell>
                                            Payment ID
                                        </TableCell>

                                        <TableCell>
                                            Status
                                        </TableCell>

                                        <TableCell align="right">
                                            Amount
                                        </TableCell>

                                        <TableCell>
                                            Created
                                        </TableCell>

                                    </TableRow>

                                </TableHead>


                                <TableBody>

                                    {order.payments?.map(
                                        (payment) => (

                                            <TableRow
                                                key={payment.id}
                                            >

                                                <TableCell>
                                                    {payment.provider}
                                                </TableCell>

                                                <TableCell>
                                                    {payment.payment_id}
                                                </TableCell>

                                                <TableCell>

                                                    <Chip
                                                        size="small"
                                                        label={payment.status}
                                                        color={getStatusColor(
                                                            payment.status
                                                        )}
                                                    />

                                                </TableCell>

                                                <TableCell align="right">

                                                    {formatMoney(
                                                        payment.amount
                                                    )}

                                                </TableCell>

                                                <TableCell>

                                                    {formatDate(
                                                        payment.created_at
                                                    )}

                                                </TableCell>

                                            </TableRow>

                                        )
                                    )}

                                </TableBody>

                            </Table>

                        </TableContainer>

                    </Paper>

                </Grid>


                {/* ================================================== */}
                {/* REFUNDS */}
                {/* ================================================== */}

                {order.refunds?.length > 0 && (

                    <Grid
                        size={12}
                    >

                        <Paper
                            variant="outlined"
                        >

                            <Box sx={{ p: 3 }}>

                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 600,
                                    }}
                                >

                                    Refunds

                                </Typography>

                            </Box>


                            <Divider />


                            <TableContainer>

                                <Table>

                                    <TableHead>

                                        <TableRow>

                                            <TableCell>
                                                Amount
                                            </TableCell>

                                            <TableCell>
                                                Status
                                            </TableCell>

                                            <TableCell>
                                                Reason
                                            </TableCell>

                                            <TableCell>
                                                Provider
                                            </TableCell>

                                            <TableCell>
                                                Date
                                            </TableCell>

                                        </TableRow>

                                    </TableHead>


                                    <TableBody>

                                        {order.refunds.map(
                                            (refund) => (

                                                <TableRow
                                                    key={refund.id}
                                                >

                                                    <TableCell>

                                                        {formatMoney(
                                                            refund.amount
                                                        )}

                                                    </TableCell>


                                                    <TableCell>

                                                        <Chip
                                                            size="small"
                                                            label={refund.status}
                                                            color={getStatusColor(
                                                                refund.status
                                                            )}
                                                        />

                                                    </TableCell>


                                                    <TableCell>

                                                        {refund.reason ||
                                                            '—'}

                                                    </TableCell>


                                                    <TableCell>

                                                        {refund.provider ||
                                                            '—'}

                                                    </TableCell>


                                                    <TableCell>

                                                        {formatDate(
                                                            refund.created_at
                                                        )}

                                                    </TableCell>

                                                </TableRow>

                                            )
                                        )}

                                    </TableBody>

                                </Table>

                            </TableContainer>

                        </Paper>

                    </Grid>

                )}


                {/* ================================================== */}
                {/* SHIPMENTS */}
                {/* ================================================== */}

                {order.shipments?.length > 0 && (

                    <Grid
                        size={12}
                    >

                        <Paper
                            variant="outlined"
                        >

                            <Box sx={{ p: 3 }}>

                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 600,
                                    }}
                                >

                                    Shipments

                                </Typography>

                            </Box>


                            <Divider />


                            <TableContainer>

                                <Table>

                                    <TableHead>

                                        <TableRow>

                                            <TableCell>
                                                Item ID
                                            </TableCell>

                                            <TableCell>
                                                Status
                                            </TableCell>

                                            <TableCell>
                                                Carrier
                                            </TableCell>

                                            <TableCell>
                                                Service
                                            </TableCell>

                                            <TableCell>
                                                Tracking
                                            </TableCell>

                                            <TableCell>
                                                Quantity
                                            </TableCell>

                                        </TableRow>

                                    </TableHead>


                                    <TableBody>

                                        {order.shipments.map(
                                            (shipment) => (

                                                <TableRow
                                                    key={shipment.id}
                                                >

                                                    <TableCell>

                                                        {
                                                            shipment.order_item_id
                                                        }

                                                    </TableCell>


                                                    <TableCell>

                                                        <Chip
                                                            size="small"
                                                            label={shipment.status}
                                                            color={getStatusColor(
                                                                shipment.status
                                                            )}
                                                        />

                                                    </TableCell>


                                                    <TableCell>

                                                        {shipment.carrier ||
                                                            '—'}

                                                    </TableCell>


                                                    <TableCell>

                                                        {shipment.service ||
                                                            '—'}

                                                    </TableCell>


                                                    <TableCell>

                                                        {shipment.tracking_url ? (

                                                            <Typography
                                                                component="a"
                                                                href={
                                                                    shipment.tracking_url
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                sx={{
                                                                    textDecoration:
                                                                        'none',
                                                                }}
                                                            >

                                                                {
                                                                    shipment.tracking_number ||
                                                                    'Track'
                                                                }

                                                            </Typography>

                                                        ) : (

                                                            shipment.tracking_number ||
                                                            '—'

                                                        )}

                                                    </TableCell>


                                                    <TableCell>

                                                        {shipment.quantity}

                                                    </TableCell>

                                                </TableRow>

                                            )
                                        )}

                                    </TableBody>

                                </Table>

                            </TableContainer>

                        </Paper>

                    </Grid>

                )}


                {/* ================================================== */}
                {/* ORDER INFORMATION */}
                {/* ================================================== */}

                <Grid
                    size={12}
                >

                    <Paper
                        variant="outlined"
                        sx={{
                            p: 3,
                        }}
                    >

                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                mb: 2,
                            }}
                        >

                            Order Information

                        </Typography>


                        <Grid
                            container
                            spacing={2}
                        >

                            <InfoItem
                                label="Order ID"
                                value={order.id}
                            />

                            <InfoItem
                                label="Order Number"
                                value={order.order_number}
                            />

                            <InfoItem
                                label="Currency"
                                value={order.currency}
                            />

                            <InfoItem
                                label="Delivery Method"
                                value={order.delivery_method}
                            />

                            <InfoItem
                                label="Created"
                                value={formatDate(
                                    order.created_at
                                )}
                            />

                            <InfoItem
                                label="Updated"
                                value={formatDate(
                                    order.updated_at
                                )}
                            />

                            <InfoItem
                                label="First Viewed"
                                value={formatDate(
                                    order.admin_viewed_at
                                )}
                            />

                        </Grid>

                    </Paper>

                </Grid>

            </Grid>

        </Box>

    );

}


// ============================================================
// SUMMARY ROW
// ============================================================

function SummaryRow({
    label,
    value,
    strong = false,
}) {

    return (

        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
            }}
        >

            <Typography
                sx={{
                    fontWeight: strong ? 700 : 400,
                }}
            >

                {label}

            </Typography>


            <Typography
                sx={{
                    fontWeight: strong ? 700 : 400,
                }}
            >

                {value}

            </Typography>

        </Box>

    );

}


// ============================================================
// ADDRESS CARD
// ============================================================

function AddressCard({
    title,
    firstName,
    lastName,
    company,
    address1,
    address2,
    city,
    state,
    postcode,
    country,
}) {

    return (

        <Paper
            variant="outlined"
            sx={{
                p: 3,
                height: '100%',
            }}
        >

            <Typography
                variant="h6"
                sx={{
                    fontWeight: 600,
                    mb: 2,
                }}
            >

                {title}

            </Typography>


            <Stack spacing={0.5}>

                {(firstName || lastName) && (

                    <Typography
                        sx={{
                            fontWeight: 600,
                        }}
                    >

                        {[firstName, lastName]
                            .filter(Boolean)
                            .join(' ')}

                    </Typography>

                )}


                {company && (

                    <Typography>
                        {company}
                    </Typography>

                )}


                {address1 && (

                    <Typography>
                        {address1}
                    </Typography>

                )}


                {address2 && (

                    <Typography>
                        {address2}
                    </Typography>

                )}


                {(city || state || postcode) && (

                    <Typography>

                        {[
                            city,
                            state,
                            postcode,
                        ]
                            .filter(Boolean)
                            .join(', ')}

                    </Typography>

                )}


                {country && (

                    <Typography>
                        {country}
                    </Typography>

                )}

            </Stack>

        </Paper>

    );

}


// ============================================================
// INFORMATION ITEM
// ============================================================

function InfoItem({
    label,
    value,
}) {

    return (

        <Grid
            size={{
                xs: 12,
                sm: 6,
                md: 4,
            }}
        >

            <Typography
                variant="caption"
                color="text.secondary"
            >

                {label}

            </Typography>


            <Typography
                sx={{
                    fontWeight: 500,
                }}
            >

                {value || '—'}

            </Typography>

        </Grid>

    );

}
