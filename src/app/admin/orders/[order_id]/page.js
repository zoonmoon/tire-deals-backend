
'use client';
import toast from 'react-hot-toast';
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
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
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


export default function AdminOrderDetailsPage() {

    const params = useParams();

    const orderId = params?.order_id;


    const [order, setOrder] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [
        fulfillDialogOpen,
        setFulfillDialogOpen
    ] = useState(false);

    const [
        fulfillmentQuantities,
        setFulfillmentQuantities
    ] = useState({});

    const [
        fulfillmentCarrier,
        setFulfillmentCarrier
    ] = useState('');

    const [
        fulfillmentService,
        setFulfillmentService
    ] = useState('');

    const [
        fulfillmentTrackingNumber,
        setFulfillmentTrackingNumber
    ] = useState('');

    const [
        fulfillmentTrackingUrl,
        setFulfillmentTrackingUrl
    ] = useState('');

    const [
        fulfillmentShippingCost,
        setFulfillmentShippingCost
    ] = useState('');

    const [
        creatingFulfillment,
        setCreatingFulfillment
    ] = useState(false);



    const [cancellingFulfillmentId, setCancellingFulfillmentId] =
        useState(null);

    const [deliveringFulfillmentId, setDeliveringFulfillmentId] =
        useState(null);


    const [trackingDialogOpen, setTrackingDialogOpen] =
        useState(false);

    const [trackingFulfillment, setTrackingFulfillment] =
        useState(null);

    const [trackingCarrier, setTrackingCarrier] =
        useState('');

    const [trackingService, setTrackingService] =
        useState('');

    const [trackingNumber, setTrackingNumber] =
        useState('');

    const [trackingUrl, setTrackingUrl] =
        useState('');

    const [updatingTracking, setUpdatingTracking] =
        useState(false);


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

        // return (

        //     <Alert severity="error">

        //         {error}

        //     </Alert>

        // );

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


    const getFulfilledQuantity = (orderItemId) => {

        return (
            order.fulfillments || []
        ).reduce(
            (total, fulfillment) => {

                const fulfillmentItem =
                    fulfillment.items?.find(
                        item =>
                            Number(item.order_item_id) ===
                            Number(orderItemId)
                    );

                return total +
                    Number(
                        fulfillmentItem?.quantity || 0
                    );

            },
            0
        );

    };


    const getRemainingQuantity = (orderItem) => {

        const orderedQuantity =
            Number(orderItem.quantity || 0);

        const fulfilledQuantity =
            getFulfilledQuantity(orderItem.id);

        return Math.max(
            0,
            orderedQuantity - fulfilledQuantity
        );

    };


    // ============================================================
    // CREATE FULFILLMENT
    // ============================================================

    const handleCreateFulfillment = async () => {

        try {

            setCreatingFulfillment(true);

            // ========================================================
            // BUILD FULFILLMENT ITEMS
            // ========================================================

            const items = Object.entries(
                fulfillmentQuantities
            )
                .map(

                    ([orderItemId, quantity]) => ({

                        order_item_id:
                            Number(orderItemId),

                        quantity:
                            Number(quantity || 0),

                    })
                )
                .filter(
                    item =>
                        item.quantity > 0
                );


            // ========================================================
            // VALIDATE
            // ========================================================

            if (items.length === 0) {

                throw new Error(
                    'Please select at least one item to fulfill.'
                );

            }


            // ========================================================
            // CREATE FULFILLMENT
            // ========================================================

            const response =
                await fetch(
                    `/api/admin/orders/${orderId}/fulfillments`,
                    {
                        method: 'POST',

                        credentials: 'include',

                        headers: {
                            'Content-Type':
                                'application/json',
                        },

                        body: JSON.stringify({

                            items,

                            carrier:
                                fulfillmentCarrier ||
                                null,

                            service:
                                fulfillmentService ||
                                null,

                            tracking_number:
                                fulfillmentTrackingNumber ||
                                null,

                            tracking_url:
                                fulfillmentTrackingUrl ||
                                null,

                            shipping_cost:
                                Number(
                                    fulfillmentShippingCost ||
                                    0
                                ),

                        }),

                    }
                );


            const data =
                await response.json();


            // ========================================================
            // HANDLE ERROR
            // ========================================================

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data?.message ||
                    'Unable to create fulfillment.'
                );

            }


            // ========================================================
            // CLOSE DIALOG
            // ========================================================

            setFulfillDialogOpen(false);


            // ========================================================
            // RESET FORM
            // ========================================================

            setFulfillmentQuantities({});

            setFulfillmentCarrier('');

            setFulfillmentService('');

            setFulfillmentTrackingNumber('');

            setFulfillmentTrackingUrl('');

            setFulfillmentShippingCost('');


            // ========================================================
            // REFRESH ORDER
            // ========================================================

            toast.success('Fulfillment created successfully')

            setLoading(true) 
            
            // 

            const refreshResponse =
                await fetch(
                    `/api/admin/orders/${orderId}`,
                    {
                        method: 'GET',
                        credentials: 'include',
                        cache: 'no-store',
                    }
                );


            const refreshData =
                await refreshResponse.json();


            if (
                refreshResponse.ok &&
                refreshData.success
            ) {

                setOrder(
                    refreshData.order
                );

            }

            setLoading(false)

        } catch (error) {

            setLoading(false)

            console.error(
                'Create fulfillment error:',
                error
            );


            setError(
                error.message ||
                'Unable to create fulfillment.'
            );



            toast.error(
                error.message ||
                'Unable to create fulfillment.'
            );



        } finally {

            setCreatingFulfillment(false);

        }

    };



    // ============================================================
    // CANCEL FULFILLMENT
    // ============================================================


    // ============================================================
    // CANCEL FULFILLMENT
    // ============================================================

    const handleCancelFulfillment = async (fulfillmentId) => {

        try {

            setError(null);

            setCancellingFulfillmentId(
                fulfillmentId
            );


            // ========================================================
            // CANCEL FULFILLMENT
            // ========================================================

            const response =
                await fetch(
                    `/api/admin/orders/${orderId}/fulfillments/${fulfillmentId}`,
                    {
                        method: 'DELETE',

                        credentials: 'include',

                        cache: 'no-store',
                    }
                );


            const data =
                await response.json();


            // ========================================================
            // HANDLE ERROR
            // ========================================================

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data?.message ||
                    'Unable to cancel fulfillment.'
                );

            }


            toast.success('Fulfillment cancelled successfully')

            // ========================================================
            // REFRESH ORDER
            // ========================================================


            setLoading(true)

            const refreshResponse =
                await fetch(
                    `/api/admin/orders/${orderId}`,
                    {
                        method: 'GET',

                        credentials: 'include',

                        cache: 'no-store',
                    }
                );


            const refreshData =
                await refreshResponse.json();


            if (
                !refreshResponse.ok ||
                !refreshData.success
            ) {


                setLoading(false)


                throw new Error(
                    refreshData?.message ||
                    'Fulfillment was cancelled, but the order could not be refreshed.'
                );

            }

            setLoading(false)

            setOrder(
                refreshData.order
            );


        } catch (error) {

            console.error(
                'Cancel fulfillment error:',
                error
            );

            setLoading(false)


            setError(
                error.message ||
                'Unable to cancel fulfillment.'
            );


        } finally {

            setCancellingFulfillmentId(
                null
            );

        }

    };



    // ============================================================
    // MARK FULFILLMENT AS DELIVERED
    // ============================================================


    const handleMarkDelivered = async (fulfillmentId) => {

        const confirmed = window.confirm(
            'Are you sure you want to mark this fulfillment as delivered?'
        );

        // User clicked Cancel
        if (!confirmed) {
            return;
        }


        try {

            setDeliveringFulfillmentId(
                fulfillmentId
            );


            const response = await fetch(
                `/api/admin/orders/${orderId}/fulfillments/${fulfillmentId}`,
                {
                    method: 'PATCH',

                    credentials: 'include',

                    headers: {
                        'Content-Type':
                            'application/json',
                    },

                    body: JSON.stringify({
                        status: 'delivered',
                    }),
                }
            );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data?.message ||
                    'Unable to mark fulfillment as delivered.'
                );

            }


            // ====================================================
            // REFRESH ORDER
            // ====================================================

            const refreshResponse =
                await fetch(
                    `/api/admin/orders/${orderId}`,
                    {
                        method: 'GET',
                        credentials: 'include',
                        cache: 'no-store',
                    }
                );


            const refreshData =
                await refreshResponse.json();


            if (
                refreshResponse.ok &&
                refreshData.success
            ) {

                setOrder(
                    refreshData.order
                );

            }


            toast.success(
                'Fulfillment marked as delivered.'
            );


        } catch (error) {

            console.error(
                'Mark delivered error:',
                error
            );


            toast.error(
                error.message ||
                'Unable to mark fulfillment as delivered.'
            );


        } finally {

            setDeliveringFulfillmentId(
                null
            );

        }

    };



    const handleAddTracking = (fulfillment) => {

        setTrackingFulfillment(
            fulfillment
        );

        setTrackingCarrier(
            fulfillment.carrier || ''
        );

        setTrackingService(
            fulfillment.service || ''
        );

        setTrackingNumber(
            fulfillment.tracking_number || ''
        );

        setTrackingUrl(
            fulfillment.tracking_url || ''
        );

        setTrackingDialogOpen(true);

    };



    const handlePatchTracking = async () => {

        if (!trackingFulfillment) {
            return;
        }


        try {

            setUpdatingTracking(true);


            const response =
                await fetch(
                    `/api/admin/orders/${orderId}/fulfillments/${trackingFulfillment.id}/tracking`,
                    {
                        method: 'PATCH',

                        credentials: 'include',

                        headers: {
                            'Content-Type':
                                'application/json',
                        },

                        body: JSON.stringify({

                            carrier:
                                trackingCarrier.trim() ||
                                null,

                            service:
                                trackingService.trim() ||
                                null,

                            tracking_number:
                                trackingNumber.trim() ||
                                null,

                            tracking_url:
                                trackingUrl.trim() ||
                                null,

                        }),

                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data?.message ||
                    'Unable to update tracking information.'
                );

            }


            // ====================================================
            // CLOSE DIALOG
            // ====================================================

            setTrackingDialogOpen(false);


            // ====================================================
            // RESET
            // ====================================================

            setTrackingFulfillment(null);

            setTrackingCarrier('');

            setTrackingService('');

            setTrackingNumber('');

            setTrackingUrl('');


            // ====================================================
            // REFRESH ORDER
            // ====================================================

            const refreshResponse =
                await fetch(
                    `/api/admin/orders/${orderId}`,
                    {
                        method: 'GET',
                        credentials: 'include',
                        cache: 'no-store',
                    }
                );


            const refreshData =
                await refreshResponse.json();


            if (
                refreshResponse.ok &&
                refreshData.success
            ) {

                setOrder(
                    refreshData.order
                );

            }


            toast.success(
                'Tracking information updated.'
            );


        } catch (error) {

            console.error(
                'Update tracking error:',
                error
            );


            toast.error(
                error.message ||
                'Unable to update tracking information.'
            );


        } finally {

            setUpdatingTracking(false);

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
                spacing={3}
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



                <div
                    style={{
                        display:'flex',
                        justifyContent:'space-between',
                        flexGrow:'1',
                        alignItems:'center'
                    }}

                >


                    <Stack
                        direction={'row'}
                        spacing={2}
                    >

                        {/* <Chip
                            label={order.status}
                            size={'small'}
                            color={getStatusColor(
                                order.status
                            )}
                        /> */}


                        <Chip
                            label={order.payment_status}
                            size={'small'}
                            color={getStatusColor(
                                order.payment_status
                            )}
                        />


                        <Chip
                            label={order.fulfillment_status}
                            size={'small'}
                            color={getStatusColor(
                                order.fulfillment_status
                            )}
                        />


                    </Stack>



                    <Button
                        variant="contained"
                        sx={{maxHeight:'40px'}}
                        onClick={() =>
                            setFulfillDialogOpen(true)
                        }
                    >
                        Fulfill Order
                    </Button>

                </div>




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
                {/* FULFILLMENTS */}
                {/* ================================================== */}

                {order.fulfillments?.length > 0 && (

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

                                    Fulfillments

                                </Typography>

                            </Box>


                            <Divider />


                            {order.fulfillments.map(
                                (fulfillment) => (

                                    <Box
                                        key={fulfillment.id}
                                        sx={{
                                            p: 3,
                                        }}
                                    >

                                        {/* ====================================== */}
                                        {/* FULFILLMENT HEADER */}
                                        {/* ====================================== */}

                                        <Stack
                                            direction={{
                                                xs: 'column',
                                                sm: 'row',
                                            }}
                                            spacing={2}
                                            sx={{
                                                mb: 2,
                                                alignItems:'center',
                                                justifyContent:'space-between'
                                            }}
                                        >

                                            <Box>



                                                <Typography
                                                    sx={{
                                                        fontWeight: 600,
                                                        alignItems:'center',
                                                        display:'flex',
                                                        gap: '10px',
                                                        mb: 0.5
                                                    }}
                                                >

                                                    Fulfillment #
                                                    {fulfillment.id}


                                                    <Chip
                                                        size="small"
                                                        label={fulfillment.status}
                                                        color={getStatusColor(
                                                            fulfillment.status
                                                        )}
                                                    />

                                                </Typography>


                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >

                                                    Created{' '}

                                                    {formatDate(
                                                        fulfillment.created_at
                                                    )}

                                                </Typography>

                                            </Box>


                                            {/* ================================== */}
                                            {/* STATUS + ACTIONS */}
                                            {/* ================================== */}

                                            <Stack
                                                direction="row"
                                                spacing={3}
                                                alignItems="center"
                                                flexWrap="wrap"
                                                useFlexGap
                                            >

                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() =>
                                                        handleAddTracking(
                                                            fulfillment
                                                        )
                                                    }
                                                >

                                                     Tracking Info

                                                </Button>


                                                {/* ================================== */}
                                                {/* IN PROGRESS ACTIONS */}
                                                {/* ================================== */}

                                                {fulfillment.status ===
                                                    'in_progress' && (

                                                    <>






                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="success"
                                                            onClick={() =>
                                                                handleMarkDelivered(fulfillment.id)
                                                            }
                                                            disabled={
                                                                deliveringFulfillmentId === fulfillment.id
                                                            }
                                                        >
                                                            {deliveringFulfillmentId === fulfillment.id
                                                                ? 'Marking...'
                                                                : 'Mark Delivered'}
                                                        </Button>

                                         

                                        


                                                        <Button
                                                            color="error"
                                                            variant="outlined"
                                                            size="small"
                                                            disabled={
                                                                cancellingFulfillmentId === fulfillment.id
                                                            }
                                                            onClick={() => {

                                                                const confirmed =
                                                                    window.confirm(
                                                                        `Are you sure you want to delete Fulfillment #${fulfillment.id}?`
                                                                    );


                                                                if (!confirmed) {

                                                                    return;

                                                                }


                                                                handleCancelFulfillment(
                                                                    fulfillment.id
                                                                );

                                                            }}
                                                        >
                                                            {cancellingFulfillmentId === fulfillment.id ? (

                                                                <CircularProgress
                                                                    size={18}
                                                                    color="inherit"
                                                                />

                                                            ) : (

                                                                'Delete Fulfillment'

                                                            )}
                                                        </Button>





                                                    </>

                                                )}

                                            </Stack>

                                        </Stack>


                                        {/* ====================================== */}
                                        {/* SHIPPING INFORMATION */}
                                        {/* ====================================== */}

                                        <Grid
                                            container
                                            spacing={2}
                                            sx={{
                                                mb: 2,
                                            }}
                                        >

                                            <Grid
                                                size={{
                                                    xs: 12,
                                                    sm: 4,
                                                }}
                                            >

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >

                                                    Carrier

                                                </Typography>


                                                <Typography>

                                                    {fulfillment.carrier ||
                                                        '—'}

                                                </Typography>

                                            </Grid>


                                            <Grid
                                                size={{
                                                    xs: 12,
                                                    sm: 4,
                                                }}
                                            >

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >

                                                    Service

                                                </Typography>


                                                <Typography>

                                                    {fulfillment.service ||
                                                        '—'}

                                                </Typography>

                                            </Grid>


                                            <Grid
                                                size={{
                                                    xs: 12,
                                                    sm: 4,
                                                }}
                                            >

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >

                                                    Tracking

                                                </Typography>


                                                {fulfillment.tracking_url ? (

                                                    <div>

                                                        <Typography
                                                            component="a"
                                                            href={
                                                                fulfillment.tracking_url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            sx={{
                                                                textDecoration:
                                                                    'none',
                                                            }}
                                                        >

                                                            {
                                                                fulfillment.tracking_number ||
                                                                'Track'
                                                            }

                                                        </Typography>

                                                    </div>


                                                ) : (

                                                    <Typography>

                                                        {
                                                            fulfillment.tracking_number ||
                                                            '—'
                                                        }

                                                    </Typography>

                                                )}

                                            </Grid>

                                        </Grid>


                                        {/* ====================================== */}
                                        {/* ITEMS */}
                                        {/* ====================================== */}

                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                mb: 1,
                                            }}
                                        >

                                            Items

                                        </Typography>


                                        <TableContainer>

                                            <Table
                                                size="small"
                                                sx={{maxWidth: '500px'}}
                                            >

                                                <TableHead>

                                                    <TableRow>

                                                        <TableCell>
                                                            Product
                                                        </TableCell>

                                                        <TableCell >
                                                            Quantity
                                                        </TableCell>

                                                        <TableCell align="right">
                                                            Order Item ID
                                                        </TableCell>



                                                    </TableRow>

                                                </TableHead>


                                                <TableBody>

                                                    {fulfillment.items?.map(
                                                        (fulfillmentItem) => {

                                                            const orderItem =
                                                                order.items?.find(
                                                                    item =>
                                                                        Number(
                                                                            item.id
                                                                        ) ===
                                                                        Number(
                                                                            fulfillmentItem.order_item_id
                                                                        )
                                                                );


                                                            return (

                                                                <TableRow
                                                                    key={
                                                                        fulfillmentItem.id
                                                                    }
                                                                >

                                                                    <TableCell>

                                                                        {
                                                                            orderItem?.name ||
                                                                            '—'
                                                                        }

                                                                    </TableCell>


                                                                    <TableCell
                                                                        
                                                                    >

                                                                        {
                                                                            fulfillmentItem.quantity
                                                                        }

                                                                    </TableCell>

                                                                    <TableCell
                                                                        align="right"
                                                                    >

                                                                        {
                                                                            fulfillmentItem.order_item_id
                                                                        }

                                                                    </TableCell>




                                                                </TableRow>

                                                            );

                                                        }
                                                    )}

                                                </TableBody>

                                            </Table>

                                        </TableContainer>

                                    </Box>

                                )
                            )}

                        </Paper>

                    </Grid>

                )}





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


            {/* ================================================== */}
            {/* FULFILL ORDER DIALOG */}
            {/* ================================================== */}

            <Dialog
                open={fulfillDialogOpen}
                onClose={() => {

                    if (reason === 'backdropClick') {
                        return;
                    }

                    if (!creatingFulfillment) {

                        setFulfillDialogOpen(false);

                    }

                }}
                fullWidth
                maxWidth="md"
            >

                <DialogTitle>

                    Fulfill Order #{order.order_number}

                </DialogTitle>


                <DialogContent dividers>

                    <Stack spacing={3}>

                        {/* ================================================== */}
                        {/* ITEMS */}
                        {/* ================================================== */}

                        <Box>

                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 600,
                                    mb: 2,
                                }}
                            >

                                Items to Fulfill

                            </Typography>


                            <Stack spacing={2}>

                                {order.items?.filter(i => i.type === 'product' && getRemainingQuantity(i) > 0 )?.map(
                                    (item) => {

                                        const fulfilledQuantity =
                                            getFulfilledQuantity(
                                                item.id
                                            );


                                        const remainingQuantity =
                                            Math.max(
                                                0,
                                                Number(
                                                    item.quantity || 0
                                                ) -
                                                fulfilledQuantity
                                            );


                                        return (

                                            <Paper
                                                key={item.id}
                                                variant="outlined"
                                                sx={{
                                                    p: 2,
                                                }}
                                            >

                                                <Grid
                                                    container
                                                    spacing={2}
                                                    alignItems="center"
                                                    sx={{alignItems:'center'}}
                                                >

                                                    {/* PRODUCT */}

                                                    <Grid
                                                        size={{
                                                            xs: 12,
                                                            sm: 5,
                                                        }}
                                                    >

                                                        <Typography
                                                            sx={{
                                                                fontWeight: 600,
                                                            }}
                                                        >

                                                            {item.name}

                                                        </Typography>


                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                        >

                                                            Ordered:{' '}

                                                            {item.quantity}

                                                            {' · '}

                                                            Fulfilled:{' '}

                                                            {fulfilledQuantity}

                                                            {' · '}

                                                            Remaining:{' '}

                                                            {remainingQuantity}

                                                        </Typography>

                                                    </Grid>


                                                    {/* QUANTITY */}

                                                    <Grid
                                                        size={{
                                                            xs: 12,
                                                            sm: 4,
                                                        }}
                                                    >

                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            type="number"
                                                            label="Quantity"
                                                            value={
                                                                fulfillmentQuantities[
                                                                    item.id
                                                                ] ?? ''
                                                            }
                                                            disabled={
                                                                remainingQuantity === 0 ||
                                                                creatingFulfillment
                                                            }
                                                            onChange={(event) => {

                                                                const value =
                                                                    event.target.value;


                                                                if (
                                                                    value === ''
                                                                ) {

                                                                    setFulfillmentQuantities(
                                                                        previous => ({
                                                                            ...previous,
                                                                            [item.id]: ''
                                                                        })
                                                                    );

                                                                    return;

                                                                }


                                                                const quantity =
                                                                    Number(value);


                                                                if (
                                                                    !Number.isInteger(
                                                                        quantity
                                                                    ) ||
                                                                    quantity < 0
                                                                ) {

                                                                    return;

                                                                }


                                                                if (
                                                                    quantity >
                                                                    remainingQuantity
                                                                ) {

                                                                    return;

                                                                }


                                                                setFulfillmentQuantities(
                                                                    previous => ({
                                                                        ...previous,
                                                                        [item.id]:
                                                                            quantity
                                                                    })
                                                                );

                                                            }}
                                                            inputProps={{
                                                                min: 0,
                                                                max: remainingQuantity,
                                                                step: 1,
                                                            }}
                                                        />

                                                    </Grid>


                                                    {/* REMAINING */}

                                                    <Grid
                                                        size={{
                                                            xs: 12,
                                                            sm: 3,
                                                        }}
                                                    >

                                                        <Chip
                                                            size="small"
                                                            label={
                                                                remainingQuantity === 0
                                                                    ? 'Fully fulfilled'
                                                                    : `${remainingQuantity} remaining`
                                                            }
                                                            color={
                                                                remainingQuantity === 0
                                                                    ? 'success'
                                                                    : 'default'
                                                            }
                                                        />

                                                    </Grid>

                                                </Grid>

                                            </Paper>

                                        );

                                    }
                                )}

                            </Stack>

                        </Box>


                        <Divider />




                    </Stack>

                </DialogContent>


                <DialogActions
                    sx={{
                        minHeight:'70px',
                        display:'flex',
                        justifyContent:'space-between'

                    }}

                >

                    <Button
                        variant={'contained'}
                        color={'error'}
                        onClick={() =>
                            setFulfillDialogOpen(false)
                        }
                        disabled={
                            creatingFulfillment
                        }
                    >

                        Cancel

                    </Button>


                    <Button
                        variant="contained"
                        disabled={
                            creatingFulfillment
                        }
                        onClick={handleCreateFulfillment}
                    >

                        {creatingFulfillment ? (

                            <CircularProgress
                                size={20}
                            />

                        ) : (

                            'Create Fulfillment'

                        )}

                    </Button>

                </DialogActions>

            </Dialog>







            <Dialog
                open={trackingDialogOpen}
                onClose={(event, reason) => {

                    if (reason === 'backdropClick') {
                        return;
                    }

                    if (!updatingTracking) {
                        setTrackingDialogOpen(false);
                    }

                }}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>

                    {trackingFulfillment?.tracking_number
                        ? 'Edit Tracking Information'
                        : 'Add Tracking Information'}

                </DialogTitle>


                <DialogContent dividers>

                    <Stack spacing={2}>

                        <FormControl
                            fullWidth
                            disabled={updatingTracking}
                        >
                            <InputLabel>
                                Carrier
                            </InputLabel>

                            <Select
                                value={trackingCarrier}
                                label="Carrier"
                                onChange={(event) =>
                                    setTrackingCarrier(
                                        event.target.value
                                    )
                                }
                            >

                                <MenuItem value="UPS">
                                    UPS
                                </MenuItem>

                                <MenuItem value="FedEx">
                                    FedEx
                                </MenuItem>

                                <MenuItem value="Roadie">
                                    Roadie
                                </MenuItem>

                            </Select>

                        </FormControl>


                        <TextField
                            fullWidth
                            label="Service"
                            value={trackingService}
                            disabled={updatingTracking}
                            onChange={(event) =>
                                setTrackingService(
                                    event.target.value
                                )
                            }
                        />


                        <TextField
                            fullWidth
                            label="Tracking Number"
                            value={trackingNumber}
                            disabled={updatingTracking}
                            onChange={(event) =>
                                setTrackingNumber(
                                    event.target.value
                                )
                            }
                        />


                        <TextField
                            fullWidth
                            label="Tracking URL"
                            value={trackingUrl}
                            disabled={updatingTracking}
                            onChange={(event) =>
                                setTrackingUrl(
                                    event.target.value
                                )
                            }
                        />

                    </Stack>

                </DialogContent>


                <DialogActions
                    sx={{
                        display: 'flex',
                        minHeight: '60px',
                        justifyContent: 'space-between',
                    }}
                >

                    <Button
                        color="error"
                        variant="contained"
                        onClick={() =>
                            setTrackingDialogOpen(false)
                        }
                        disabled={updatingTracking}
                    >
                        Cancel
                    </Button>


                    <Button
                        variant="contained"
                        onClick={handlePatchTracking}
                        disabled={updatingTracking}
                    >

                        {updatingTracking
                            ? 'Saving...'
                            : 'Save Tracking'}

                    </Button>

                </DialogActions>

            </Dialog>






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
