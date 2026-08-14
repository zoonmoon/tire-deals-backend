'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
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
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';


export default function ProductsPage() {

    const router = useRouter();

    // ============================================================
    // STATE
    // ============================================================

    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [search, setSearch] = useState('');

    const [status, setStatus] = useState('');

    const [mappingStatus, setMappingStatus] = useState('');

    const [page, setPage] = useState(1);

    const [limit, setLimit] = useState(25);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 25,
        has_previous: false,
        has_next: false,
    });


    // ============================================================
    // FETCH PRODUCTS
    // ============================================================

    const fetchProducts = async () => {

        try {

            setLoading(true);

            setError('');


            const params =
                new URLSearchParams();


            params.set(
                'page',
                String(page)
            );


            params.set(
                'limit',
                String(limit)
            );


            if (search.trim()) {

                params.set(
                    'search',
                    search.trim()
                );

            }


            if (status) {

                params.set(
                    'status',
                    status
                );

            }


            if (mappingStatus) {

                params.set(
                    'mapping_status',
                    mappingStatus
                );

            }


            // ====================================================
            // EXACT ENDPOINT
            // ====================================================

            const url =
                `/api/admin/products/?${params.toString()}`;


            console.log(
                'Fetching products:',
                url
            );


            const response =
                await fetch(
                    url,
                    {
                        method: 'GET',

                        credentials: 'include',

                        cache: 'no-store',

                        headers: {
                            Accept:
                                'application/json',
                        },
                    }
                );


            // ====================================================
            // READ RESPONSE AS TEXT FIRST
            // ====================================================

            const raw =
                await response.text();


            console.log(
                'Products API status:',
                response.status
            );


            console.log(
                'Products API response:',
                raw
            );


            // ====================================================
            // HTTP ERROR
            // ====================================================

            if (!response.ok) {

                let message =
                    `Failed to load products (${response.status}).`;


                if (raw) {

                    try {

                        const errorData =
                            JSON.parse(raw);


                        message =
                            errorData?.message ||
                            errorData?.error ||
                            message;

                    } catch {

                        message = raw;

                    }

                }


                throw new Error(
                    message
                );

            }


            // ====================================================
            // EMPTY RESPONSE
            // ====================================================

            if (!raw.trim()) {

                throw new Error(
                    'Products API returned an empty response.'
                );

            }


            // ====================================================
            // PARSE JSON
            // ====================================================

            let data;


            try {

                data =
                    JSON.parse(raw);

            } catch (parseError) {

                console.error(
                    'Products API returned invalid JSON:',
                    raw
                );


                throw new Error(
                    'Products API returned invalid JSON.'
                );

            }


            // ====================================================
            // VALIDATE DATA
            // ====================================================

            if (
                !Array.isArray(
                    data.products
                )
            ) {

                throw new Error(
                    'Invalid products response.'
                );

            }


            // ====================================================
            // PRODUCTS
            // ====================================================

            setProducts(
                data.products
            );


            // ====================================================
            // PAGINATION
            //
            // YOUR API RETURNS:
            //
            // has_previous
            // has_next
            // ====================================================

            setPagination({

                page:
                    Number(
                        data.pagination?.page
                    ) || page,

                limit:
                    Number(
                        data.pagination?.limit
                    ) || limit,

                has_previous:
                    Boolean(
                        data.pagination?.has_previous
                    ),

                has_next:
                    Boolean(
                        data.pagination?.has_next
                    ),

            });


        } catch (error) {

            console.error(
                'Admin products error:',
                error
            );


            setError(
                error?.message ||
                'Unable to load products.'
            );


            setProducts([]);


        } finally {

            setLoading(false);

        }

    };


    // ============================================================
    // LOAD PRODUCTS
    // ============================================================

    useEffect(() => {

        fetchProducts();

    }, [
        page,
        limit,
        search,
        status,
        mappingStatus,
    ]);


    // ============================================================
    // SEARCH
    // ============================================================

    const handleSearchChange = (
        event
    ) => {

        setSearch(
            event.target.value
        );

        setPage(1);

    };


    // ============================================================
    // STATUS FILTER
    // ============================================================

    const handleStatusChange = (
        event
    ) => {

        setStatus(
            event.target.value
        );

        setPage(1);

    };


    // ============================================================
    // MAPPING FILTER
    // ============================================================

    const handleMappingStatusChange = (
        event
    ) => {

        setMappingStatus(
            event.target.value
        );

        setPage(1);

    };


    // ============================================================
    // PAGE SIZE
    // ============================================================

    const handleLimitChange = (
        event
    ) => {

        setLimit(
            Number(
                event.target.value
            )
        );

        setPage(1);

    };


    // ============================================================
    // PREVIOUS
    // ============================================================

    const handlePreviousPage = () => {

        if (
            loading ||
            !pagination.has_previous
        ) {

            return;

        }


        setPage(
            currentPage =>
                Math.max(
                    currentPage - 1,
                    1
                )
        );

    };


    // ============================================================
    // NEXT
    // ============================================================

    const handleNextPage = () => {

        if (
            loading ||
            !pagination.has_next
        ) {

            return;

        }


        setPage(
            currentPage =>
                currentPage + 1
        );

    };


    // ============================================================
    // PRODUCT CLICK
    // ============================================================

    const handleProductClick = (
        productId
    ) => {

        router.push(
            `/admin/products/${productId}`
        );

    };


    // ============================================================
    // MONEY FORMAT
    // ============================================================

    const formatMoney = (
        value
    ) => {

        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {

            return '—';

        }


        const number =
            Number(value);


        if (
            Number.isNaN(number)
        ) {

            return '—';

        }


        return `$${number.toFixed(2)}`;

    };


    // ============================================================
    // MAPPING STATUS
    // ============================================================

    const renderMappingStatus = (
        value
    ) => {

        switch (value) {

            case 'matched':

                return (
                    <Chip
                        label="Matched"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{
                            fontWeight: 600,
                        }}
                    />
                );


            case 'pending':

                return (
                    <Chip
                        label="Pending"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{
                            fontWeight: 600,
                        }}
                    />
                );


            case 'in_review':

                return (
                    <Chip
                        label="in_review"
                        size="small"
                        color="info"
                        variant="outlined"
                        sx={{
                            fontWeight: 600,
                        }}
                    />
                );


            case 'not_found':

                return (
                    <Chip
                        label="Not Found"
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{
                            fontWeight: 600,
                        }}
                    />
                );


            default:

                return (
                    <Chip
                        label={
                            value ||
                            'Unknown'
                        }
                        size="small"
                        variant="outlined"
                        sx={{
                            fontWeight: 600,
                        }}
                    />
                );

        }

    };


    // ============================================================
    // PRODUCT STATUS
    // ============================================================

    const renderProductStatus = (
        value
    ) => {

        if (value === 'active') {

            return (
                <Chip
                    label="Active"
                    size="small"
                    color="success"
                    sx={{
                        fontWeight: 600,
                    }}
                />
            );

        }


        if (value === 'archived') {

            return (
                <Chip
                    label="Archived"
                    size="small"
                    variant="outlined"
                    sx={{
                        fontWeight: 600,
                    }}
                />
            );

        }


        return (
            <Chip
                label={
                    value ||
                    'Unknown'
                }
                size="small"
                variant="outlined"
            />
        );

    };


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <Box
            sx={{
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,

                overflowX: 'hidden',

                boxSizing: 'border-box',

                px: {
                    xs: 1.5,
                    sm: 2,
                    md: 3,
                },

                py: {
                    xs: 2,
                    md: 3,
                },
            }}
        >

            {/* ====================================================
                HEADER
            ===================================================== */}

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

                <Box
                    sx={{
                        minWidth: 0,
                    }}
                >

                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            letterSpacing:
                                '-0.02em',
                        }}
                    >
                        Products
                    </Typography>


                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 0.5,
                        }}
                    >
                        Manage your tire inventory
                        and product mappings.
                    </Typography>

                </Box>


                <Button
                    variant="outlined"

                    startIcon={
                        <RefreshIcon />
                    }

                    onClick={
                        fetchProducts
                    }

                    disabled={loading}

                    sx={{
                        flexShrink: 0,

                        borderRadius: 2,

                        textTransform:
                            'none',

                        fontWeight: 600,
                    }}
                >
                    Refresh
                </Button>

            </Stack>


            {/* ====================================================
                FILTERS
            ===================================================== */}

            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,

                    boxSizing: 'border-box',

                    p: 2,

                    mb: 2,

                    border:
                        '1px solid',

                    borderColor:
                        'divider',

                    borderRadius: 3,
                }}
            >

                <Stack
                    direction={{
                        xs: 'column',
                        md: 'row',
                    }}

                    spacing={1.5}

                    sx={{
                        width: '100%',
                        minWidth: 0,
                    }}
                >




                    <FormControl
                        size="small"

                        sx={{
                            width: {
                                xs: '100%',
                                md: 160,
                            },

                            flexShrink: 0,
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

                            sx={{
                                borderRadius: 2,
                            }}
                        >

                            <MenuItem value="">
                                All statuses
                            </MenuItem>

                            <MenuItem value="active">
                                Active
                            </MenuItem>

                            <MenuItem value="archived">
                                Archived
                            </MenuItem>

                        </Select>

                    </FormControl>


                    <FormControl
                        size="small"

                        sx={{
                            width: {
                                xs: '100%',
                                md: 180,
                            },

                            flexShrink: 0,
                        }}
                    >

                        <InputLabel>
                            Mapping
                        </InputLabel>


                        <Select
                            value={
                                mappingStatus
                            }

                            label="Mapping"

                            onChange={
                                handleMappingStatusChange
                            }

                            sx={{
                                borderRadius: 2,
                            }}
                        >

                            <MenuItem value="">
                                All mappings
                            </MenuItem>

                            <MenuItem value="pending">
                                Pending
                            </MenuItem>

                            <MenuItem value="matched">
                                Matched
                            </MenuItem>

                            <MenuItem value="in_review">
                                In Review
                            </MenuItem>

                            <MenuItem value="not_found">
                                Not Found
                            </MenuItem>

                        </Select>

                    </FormControl>




                    <TextField
                        value={search}

                        onChange={
                            handleSearchChange
                        }

                        placeholder="Search products..."

                        size="small"

                        fullWidth

                        sx={{
                            flex: 1,
                            minWidth: 0,

                            '& .MuiOutlinedInput-root':
                                {
                                    borderRadius: 2,
                                },
                        }}

                        InputProps={{
                            startAdornment: (
                                <InputAdornment
                                    position="start"
                                >
                                    <SearchIcon
                                        fontSize="small"
                                        sx={{
                                            color:
                                                'text.secondary',
                                        }}
                                    />
                                </InputAdornment>
                            ),
                        }}
                    />


                </Stack>

            </Paper>


            {/* ====================================================
                ERROR
            ===================================================== */}

            {error && (

                <Paper
                    elevation={0}

                    sx={{
                        p: 2,
                        mb: 2,

                        border:
                            '1px solid',

                        borderColor:
                            'error.light',

                        borderRadius: 2,
                    }}
                >

                    <Typography
                        variant="body2"
                        color="error"
                    >
                        {error}
                    </Typography>

                </Paper>

            )}


            {/* ====================================================
                TABLE
            ===================================================== */}

            <Paper
                elevation={0}

                sx={{
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,

                    overflow: 'hidden',

                    border:
                        '1px solid',

                    borderColor:
                        'divider',

                    borderRadius: 3,
                }}
            >

                <Table
                    size="small"

                    sx={{
                        width: '100%',
                        maxWidth: '100%',

                        tableLayout:
                            'fixed',

                        '& .MuiTableCell-root':
                            {
                                minWidth: 0,
                                overflow: 'hidden',
                            },
                    }}
                >

                    <TableHead>

                        <TableRow
                            sx={{
                                backgroundColor:
                                    'action.hover',
                            }}
                        >

                            <TableCell
                                sx={{
                                    width: '40%',
                                    fontWeight: 700,
                                }}
                            >
                                Product
                            </TableCell>


                            <TableCell
                                sx={{
                                    width: '14%',
                                    fontWeight: 700,
                                }}
                            >
                                Price
                            </TableCell>


                            <TableCell
                                sx={{
                                    width: '10%',
                                    fontWeight: 700,
                                }}
                            >
                                FET
                            </TableCell>


                            <TableCell
                                sx={{
                                    width: '10%',
                                    fontWeight: 700,
                                }}
                            >
                                Qty
                            </TableCell>


                            <TableCell
                                sx={{
                                    width: '16%',
                                    fontWeight: 700,
                                }}
                            >
                                Mapping
                            </TableCell>


                            <TableCell
                                sx={{
                                    width: '10%',
                                    fontWeight: 700,
                                }}
                            >
                                Status
                            </TableCell>

                        </TableRow>

                    </TableHead>


                    <TableBody>

                        {/* =================================================
                            LOADING
                        ================================================== */}

                        {loading && (

                            <TableRow>

                                <TableCell
                                    colSpan={6}
                                    align="center"

                                    sx={{
                                        py: 8,
                                    }}
                                >

                                    <CircularProgress
                                        size={28}
                                    />


                                    <Typography
                                        variant="body2"

                                        color="text.secondary"

                                        sx={{
                                            mt: 1.5,
                                        }}
                                    >
                                        Loading products...
                                    </Typography>

                                </TableCell>

                            </TableRow>

                        )}


                        {/* =================================================
                            EMPTY
                        ================================================== */}

                        {!loading &&
                            products.length === 0 && (

                                <TableRow>

                                    <TableCell
                                        colSpan={6}
                                        align="center"

                                        sx={{
                                            py: 8,
                                        }}
                                    >

                                        <Typography
                                            fontWeight={600}
                                        >
                                            No products found
                                        </Typography>


                                        <Typography
                                            variant="body2"

                                            color="text.secondary"

                                            sx={{
                                                mt: 0.5,
                                            }}
                                        >
                                            Try changing your
                                            search or filters.
                                        </Typography>

                                    </TableCell>

                                </TableRow>

                            )}


                        {/* =================================================
                            PRODUCTS
                        ================================================== */}

                        {!loading &&
                            products.map(
                                (product) => (

                                    <TableRow
                                        key={
                                            product.id
                                        }

                                        hover

                                        onClick={() =>
                                            handleProductClick(
                                                product.id
                                            )
                                        }

                                        sx={{
                                            cursor:
                                                'pointer',

                                            '&:last-child td':
                                                {
                                                    borderBottom:
                                                        0,
                                                },
                                        }}
                                    >

                                        {/* PRODUCT */}

                                        <TableCell
                                            sx={{
                                                minWidth: 0,
                                            }}
                                        >

                                            <Box
                                                sx={{
                                                    width:
                                                        '100%',

                                                    minWidth:
                                                        0,

                                                    overflow:
                                                        'hidden',
                                                }}
                                            >

                                                <Typography
                                                    variant="body2"

                                                    fontWeight={600}

                                                    noWrap

                                                    sx={{
                                                        overflow:
                                                            'hidden',

                                                        textOverflow:
                                                            'ellipsis',
                                                    }}
                                                >

                                                    {
                                                        product.manufacturer ||
                                                        'Unknown'
                                                    }

                                                    {product.item
                                                        ? ` — ${product.item}`
                                                        : ''}

                                                </Typography>


                                                <Typography
                                                    variant="caption"

                                                    color="text.secondary"

                                                    noWrap

                                                    sx={{
                                                        display:
                                                            'block',

                                                        overflow:
                                                            'hidden',

                                                        textOverflow:
                                                            'ellipsis',

                                                        mt: 0.25,
                                                    }}
                                                >
                                                    {
                                                        product.size ||
                                                        'No size'
                                                    }
                                                </Typography>

                                            </Box>

                                        </TableCell>


                                        {/* PRICE */}

                                        <TableCell
                                            sx={{
                                                whiteSpace:
                                                    'nowrap',
                                            }}
                                        >

                                            <Typography
                                                variant="body2"
                                                fontWeight={600}
                                            >
                                                {
                                                    formatMoney(
                                                        product.price
                                                    )
                                                }
                                            </Typography>

                                        </TableCell>


                                        {/* FET */}

                                        <TableCell
                                            sx={{
                                                whiteSpace:
                                                    'nowrap',
                                            }}
                                        >
                                            {
                                                formatMoney(
                                                    product.fet
                                                )
                                            }
                                        </TableCell>


                                        {/* QUANTITY */}

                                        <TableCell>

                                            <Typography
                                                variant="body2"
                                                fontWeight={600}
                                            >
                                                {
                                                    product.quantity ??
                                                    0
                                                }
                                            </Typography>

                                        </TableCell>


                                        {/* MAPPING */}

                                        <TableCell
                                            sx={{
                                                overflow:
                                                    'hidden',
                                            }}
                                        >
                                            {
                                                renderMappingStatus(
                                                    product.opensearch_mapping_status
                                                )
                                            }
                                        </TableCell>


                                        {/* STATUS */}

                                        <TableCell
                                            sx={{
                                                overflow:
                                                    'hidden',
                                            }}
                                        >
                                            {
                                                renderProductStatus(
                                                    product.status
                                                )
                                            }
                                        </TableCell>

                                    </TableRow>

                                )
                            )}

                    </TableBody>

                </Table>


                {/* ====================================================
                    PAGINATION
                ===================================================== */}

                <Box
                    sx={{
                        width: '100%',
                        maxWidth: '100%',
                        minWidth: 0,

                        boxSizing:
                            'border-box',

                        borderTop:
                            '1px solid',

                        borderColor:
                            'divider',

                        px: 2,
                        py: 1.5,
                    }}
                >

                    <Stack
                        direction={{
                            xs: 'column',
                            sm: 'row',
                        }}

                        justifyContent="space-between"

                        alignItems={{
                            xs: 'stretch',
                            sm: 'center',
                        }}

                        spacing={2}
                    >

                        <Stack
                            direction="row"
                            sx={{alignItems:'center'}}
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

                                    <MenuItem value={25}>
                                        25 / page
                                    </MenuItem>

                                    <MenuItem value={50}>
                                        50 / page
                                    </MenuItem>

                                    <MenuItem value={75}>
                                        75 / page
                                    </MenuItem>

                                    <MenuItem value={100}>
                                        100 / page
                                    </MenuItem>

                                </Select>

                            </FormControl>

                        </Stack>


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
                                        'none',

                                    fontWeight: 600,
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
                                        'none',

                                    fontWeight: 600,
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