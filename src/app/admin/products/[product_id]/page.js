'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
    Alert,
    Box,
    Breadcrumbs,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    Link,
    Paper,
    Stack,
    Typography,
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import TireRepairOutlinedIcon from '@mui/icons-material/TireRepairOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function ProductPage() {

    const params = useParams();

    const router = useRouter();

    // ============================================================
    // PRODUCT ID
    // ============================================================

    const productId =
        params?.product_id;


    // ============================================================
    // STATE
    // ============================================================

    const [product, setProduct] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    // ============================================================
    // FETCH PRODUCT
    // ============================================================

    useEffect(() => {

        if (!productId) {
            return;
        }


        const fetchProduct = async () => {

            try {

                setLoading(true);

                setError('');


                const response =
                    await fetch(
                        `/api/admin/products/${productId}`,
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


                const raw =
                    await response.text();


                if (!response.ok) {

                    let message =
                        `Failed to load product (${response.status}).`;


                    if (raw.trim()) {

                        try {

                            const data =
                                JSON.parse(raw);


                            message =
                                data?.message ||
                                data?.error ||
                                message;

                        } catch {

                            message = raw;

                        }

                    }


                    throw new Error(
                        message
                    );

                }


                if (!raw.trim()) {

                    throw new Error(
                        'Product API returned an empty response.'
                    );

                }


                let data;


                try {

                    data =
                        JSON.parse(raw);

                } catch {

                    throw new Error(
                        'Product API returned invalid JSON.'
                    );

                }


                if (
                    !data?.success ||
                    !data?.product
                ) {

                    throw new Error(
                        data?.message ||
                        'Product not found.'
                    );

                }


                setProduct(
                    data.product
                );


            } catch (error) {

                console.error(
                    'Product details error:',
                    error
                );


                setError(
                    error?.message ||
                    'Unable to load product.'
                );


            } finally {

                setLoading(false);

            }

        };


        fetchProduct();

    }, [productId]);


    // ============================================================
    // HELPERS
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


        if (Number.isNaN(number)) {

            return '—';

        }


        return `$${number.toFixed(2)}`;

    };


    const formatNumber = (
        value,
        decimals = 2
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


        if (Number.isNaN(number)) {

            return '—';

        }


        return number.toFixed(
            decimals
        );

    };


    const displayValue = (
        value
    ) => {

        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {

            return '—';

        }


        if (
            typeof value === 'boolean'
        ) {

            return value
                ? 'Yes'
                : 'No';

        }


        return String(value);

    };


    const renderStatus = (
        status
    ) => {

        if (status === 'active') {

            return (
                <Chip
                    label="Active"
                    color="success"
                    size="small"
                    icon={
                        <CheckCircleIcon />
                    }
                    sx={{
                        fontWeight: 600,
                    }}
                />
            );

        }


        if (status === 'archived') {

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
                    displayValue(status)
                }
                size="small"
                variant="outlined"
            />
        );

    };


    const renderMappingStatus = (
        status
    ) => {

        switch (status) {

            case 'matched':

                return (
                    <Chip
                        label="Matched"
                        color="success"
                        size="small"
                        icon={
                            <CheckCircleIcon />
                        }
                        sx={{
                            fontWeight: 600,
                        }}
                    />
                );


            case 'pending':

                return (
                    <Chip
                        label="Pending"
                        color="warning"
                        size="small"
                        icon={
                            <ScheduleOutlinedIcon />
                        }
                        sx={{
                            fontWeight: 600,
                        }}
                    />
                );


            case 'in_review':

                return (
                    <Chip
                        label="In Review"
                        color="warning"
                        size="small"
                        icon={
                            <WarningAmberOutlinedIcon />
                        }
                        sx={{
                            fontWeight: 600,
                        }}
                    />
                );


            case 'not_found':

                return (
                    <Chip
                        label="Not Found"
                        color="error"
                        size="small"
                        sx={{
                            fontWeight: 600,
                        }}
                    />
                );


            default:

                return (
                    <Chip
                        label={
                            displayValue(status)
                        }
                        size="small"
                        variant="outlined"
                    />
                );

        }

    };


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (

            <Box
                sx={{
                    minHeight: '60vh',

                    display: 'flex',

                    alignItems: 'center',

                    justifyContent: 'center',
                }}
            >

                <Stack
                    alignItems="center"
                    sx={{alignItems:'center'}}
                    spacing={2}
                >

                    <CircularProgress
                        size={32}
                    />

                    <Typography
                        variant="body2"
                        sx={{textAlign:'center'}}
                        color="text.secondary"
                    >
                        Loading product...
                    </Typography>

                </Stack>

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
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,

                    boxSizing: 'border-box',

                    px: {
                        xs: 2,
                        md: 3,
                    },

                    py: 3,
                }}
            >

                <Button
                    startIcon={
                        <ArrowBackIcon />
                    }

                    onClick={() =>
                        router.push(
                            '/admin/products'
                        )
                    }

                    sx={{
                        mb: 3,
                        textTransform: 'none',
                    }}
                >
                    Back to Products
                </Button>


                <Alert
                    severity="error"
                    sx={{
                        borderRadius: 2,
                    }}
                >
                    {error}
                </Alert>

            </Box>

        );

    }


    // ============================================================
    // DATA
    // ============================================================

    const mysql =
        product?.mysql || {};

    const opensearch =
        product?.opensearch || null;


    const title =
        opensearch?.title ||
        (mysql?.size || '') + ' - ' + (mysql?.item || '') ||
        'Product';


    const brand =
        opensearch?.brand ||
        mysql.manufacturer ||
        '';


    const size =
        opensearch?.size ||
        mysql.size ||
        '';


    // ============================================================
    // IMAGE
    // ============================================================

    const imageUrl =
        opensearch?.img_url_base &&
        opensearch?.img_thumb
            ? `${opensearch.img_url_base}${opensearch.img_thumb}`
            : (
                opensearch?.img_thumb ||
                opensearch?.img_front ||
                ''
            );


    // ============================================================
    // PAGE
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
                BREADCRUMBS
            ===================================================== */}

            <Breadcrumbs
                sx={{
                    mb: 2,
                }}
            >

                <Link
                    component="button"

                    underline="hover"

                    color="inherit"

                    onClick={() =>
                        router.push(
                            '/admin/products'
                        )
                    }

                    sx={{
                        border: 0,
                        background: 'none',
                        cursor: 'pointer',
                        font: 'inherit',
                    }}
                >
                    Products
                </Link>


                <Typography
                    color="text.primary"
                    noWrap
                    sx={{
                        maxWidth: {
                            xs: 180,
                            sm: 350,
                        },
                    }}
                >
                    {title}
                </Typography>

            </Breadcrumbs>


            {/* ====================================================
                HEADER
            ===================================================== */}

            <Stack
                direction={{
                    xs: 'column',
                    md: 'row',
                }}

                justifyContent="space-between"

                alignItems={{
                    xs: 'flex-start',
                    md: 'center',
                }}

                spacing={2}

                sx={{
                    mb: 3,
                }}
            >

                <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"

                    sx={{
                        minWidth: 0,
                    }}
                >

                    <IconButton
                        onClick={() =>
                            router.push(
                                '/admin/products'
                            )
                        }

                        sx={{
                            border:
                                '1px solid',

                            borderColor:
                                'divider',

                            borderRadius: 2,

                            flexShrink: 0,
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>


                    <Box
                        sx={{
                            minWidth: 0,
                        }}
                    >

                        <Typography
                            variant="h5"

                            sx={{
                                fontWeight: 750,

                                letterSpacing:
                                    '-0.025em',

                                overflow:
                                    'hidden',

                                textOverflow:
                                    'ellipsis',

                                whiteSpace:
                                    'nowrap',
                            }}
                        >
                            {title}
                        </Typography>


                        <Typography
                            variant="body2"

                            color="text.secondary"

                            sx={{
                                mt: 0.5,
                            }}
                        >
                            {brand}

                            {size
                                ? ` • ${size}`
                                : ''}
                        </Typography>

                    </Box>

                </Stack>


                <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                >

                    {renderMappingStatus(
                        mysql.opensearch_mapping_status
                    )}

                    {renderStatus(
                        mysql.status
                    )}

                </Stack>

            </Stack>


            {/* ====================================================
                MAIN PRODUCT CARD
            ===================================================== */}

            <Card
                elevation={0}

                sx={{
                    border:
                        '1px solid',

                    borderColor:
                        'divider',

                    borderRadius: 3,

                    mb: 2,

                    overflow: 'hidden',
                }}
            >

                <CardContent
                    sx={{
                        p: {
                            xs: 2,
                            md: 3,
                        },

                        '&:last-child': {
                            pb: {
                                xs: 2,
                                md: 3,
                            },
                        },
                    }}
                >

                    <Grid
                        container
                        spacing={3}
                        alignItems="stretch"
                    >

                        {/* =================================================
                            IMAGE
                        ================================================== */}

                        <Grid
                            size={{
                                xs: 12,
                                md: 4,
                            }}
                        >

                            <Box
                                sx={{
                                    width: '100%',

                                    aspectRatio:
                                        '1 / 1',

                                    maxHeight: {
                                        md: 390,
                                    },

                                    borderRadius: 2.5,

                                    backgroundColor:
                                        'action.hover',

                                    display: 'flex',

                                    alignItems:
                                        'center',

                                    justifyContent:
                                        'center',

                                    overflow:
                                        'hidden',
                                }}
                            >

                                {imageUrl ? (

                                    <Box
                                        component="img"

                                        src={imageUrl}

                                        alt={title}

                                        sx={{
                                            width:
                                                '100%',

                                            height:
                                                '100%',

                                            objectFit:
                                                'contain',

                                            p: 2,
                                        }}
                                    />

                                ) : (

                                    <Stack
                                        alignItems="center"
                                        spacing={1}
                                        color="text.secondary"
                                    >

                                        <ImageOutlinedIcon
                                            sx={{
                                                fontSize: 52,
                                            }}
                                        />

                                        <Typography
                                            variant="body2"
                                        >
                                            No image available
                                        </Typography>

                                    </Stack>

                                )}

                            </Box>

                        </Grid>


                        {/* =================================================
                            PRODUCT SUMMARY
                        ================================================== */}

                        <Grid
                            size={{
                                xs: 12,
                                md: 8,
                            }}
                        >

                            <Stack
                                spacing={2.5}
                                sx={{
                                    height:
                                        '100%',
                                }}
                            >

                                <Box>

                                    <Typography
                                        variant="overline"

                                        color="text.secondary"

                                        sx={{
                                            fontWeight:
                                                700,

                                            letterSpacing:
                                                '0.08em',
                                        }}
                                    >
                                        Product
                                    </Typography>


                                    <Typography
                                        variant="h6"

                                        sx={{
                                            fontWeight:
                                                700,

                                            mt: 0.25,
                                        }}
                                    >
                                        {title}
                                    </Typography>


                                    <Typography
                                        variant="body2"

                                        color="text.secondary"

                                        sx={{
                                            mt: 0.75,

                                            lineHeight:
                                                1.7,
                                        }}
                                    >
                                        {displayValue(
                                            opensearch?.description ||
                                            mysql.description
                                        )}
                                    </Typography>

                                </Box>


                                <Divider />


                                {/* PRICE */}

                                <Grid
                                    container
                                    spacing={2}
                                >

                                    <Grid
                                        size={{
                                            xs: 6,
                                            sm: 4,
                                        }}
                                    >

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            Price
                                        </Typography>


                                        <Typography
                                            variant="h6"
                                            fontWeight={750}
                                            sx={{
                                                mt: 0.25,
                                            }}
                                        >
                                            {
                                                formatMoney(
                                                    mysql.price
                                                )
                                            }
                                        </Typography>

                                    </Grid>


                                    <Grid
                                        size={{
                                            xs: 6,
                                            sm: 4,
                                        }}
                                    >

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            FET
                                        </Typography>


                                        <Typography
                                            variant="h6"
                                            fontWeight={700}
                                            sx={{
                                                mt: 0.25,
                                            }}
                                        >
                                            {
                                                formatMoney(
                                                    mysql.fet
                                                )
                                            }
                                        </Typography>

                                    </Grid>


                                    <Grid
                                        size={{
                                            xs: 6,
                                            sm: 4,
                                        }}
                                    >

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            Quantity
                                        </Typography>


                                        <Typography
                                            variant="h6"
                                            fontWeight={700}
                                            sx={{
                                                mt: 0.25,
                                            }}
                                        >
                                            {
                                                displayValue(
                                                    mysql.quantity
                                                )
                                            }
                                        </Typography>

                                    </Grid>

                                </Grid>


                                <Divider />


                                {/* IDENTITY */}

                                <Grid
                                    container
                                    spacing={2}
                                >

                                    <Grid
                                        size={{
                                            xs: 12,
                                            sm: 6,
                                        }}
                                    >

                                        <InfoItem
                                            label="Manufacturer"
                                            value={
                                                mysql.manufacturer
                                            }
                                        />

                                    </Grid>


                                    <Grid
                                        size={{
                                            xs: 12,
                                            sm: 6,
                                        }}
                                    >

                                        <InfoItem
                                            label="Part Number"
                                            value={
                                                mysql.item
                                            }
                                        />

                                    </Grid>


                                    <Grid
                                        size={{
                                            xs: 12,
                                            sm: 6,
                                        }}
                                    >

                                        <InfoItem
                                            label="Size"
                                            value={
                                                mysql.size
                                            }
                                        />

                                    </Grid>


                                    <Grid
                                        size={{
                                            xs: 12,
                                            sm: 6,
                                        }}
                                    >

                                        <InfoItem
                                            label="OpenSearch ID"
                                            value={
                                                mysql.opensearch_id
                                            }
                                        />

                                    </Grid>

                                </Grid>

                            </Stack>

                        </Grid>

                    </Grid>

                </CardContent>

            </Card>


            {/* ====================================================
                OPENSEARCH MAPPING
            ===================================================== */}

            <SectionCard
                icon={
                    <LinkOutlinedIcon />
                }

                title="AutoSync Mapping"
            >

                {opensearch ? (

                    <Grid
                        container
                        spacing={2}
                    >

                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >

                            <InfoItem
                                label="AutoSync ID"
                                value={
                                    opensearch.id
                                }
                            />

                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >

                            <InfoItem
                                label="MySQL ID"
                                value={
                                    opensearch.mysql_id
                                }
                            />

                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >

                            <InfoItem
                                label="Mapped"
                                value={
                                    opensearch.is_mysql_mapped
                                        ? 'Yes'
                                        : 'No'
                                }
                            />

                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >

                            <InfoItem
                                label="AutoSync Status"
                                value={
                                    opensearch.status
                                }
                            />

                        </Grid>

                    </Grid>

                ) : (

                    <Alert
                        severity="warning"
                        icon={
                            <WarningAmberOutlinedIcon />
                        }

                        sx={{
                            borderRadius: 2,
                        }}
                    >
                        This product is not currently
                        mapped to an OpenSearch document.
                    </Alert>

                )}

            </SectionCard>


            {/* ====================================================
                TIRE SPECIFICATIONS
            ===================================================== */}

            {opensearch && (

                <SectionCard
                    icon={
                        <TireRepairOutlinedIcon />
                    }

                    title="Tire Specifications"
                >

                    <Grid
                        container
                        spacing={2}
                    >

                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Brand"
                                value={
                                    opensearch.brand
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Model"
                                value={
                                    opensearch.model
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Size"
                                value={
                                    opensearch.size
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Size Format"
                                value={
                                    opensearch.size_format
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Section Width"
                                value={
                                    opensearch.section_width
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Aspect Ratio"
                                value={
                                    opensearch.aspect_ratio
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Rim Diameter"
                                value={
                                    opensearch.rim_diameter
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Diameter"
                                value={
                                    opensearch.diameter
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Inch Width"
                                value={
                                    opensearch.inch_width
                                }
                            />
                        </Grid>

                    </Grid>

                </SectionCard>

            )}


            {/* ====================================================
                DIMENSIONS
            ===================================================== */}

            {opensearch && (

                <SectionCard
                    icon={
                        <StraightenOutlinedIcon />
                    }

                    title="Physical Dimensions"
                >

                    <Grid
                        container
                        spacing={2}
                    >

                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Overall Diameter"
                                value={
                                    opensearch.overall_diameter
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Overall Width"
                                value={
                                    opensearch.overall_width
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Weight"
                                value={
                                    opensearch.weight
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Tread Depth"
                                value={
                                    opensearch.tread_depth
                                }
                            />
                        </Grid>

                    </Grid>

                </SectionCard>

            )}


            {/* ====================================================
                PERFORMANCE
            ===================================================== */}

            {opensearch && (

                <SectionCard
                    icon={
                        <SpeedOutlinedIcon />
                    }

                    title="Performance"
                >

                    <Grid
                        container
                        spacing={2}
                    >

                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Speed Rating"
                                value={
                                    opensearch.speed_rating
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Load Rating"
                                value={
                                    opensearch.load_rating
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Load Range"
                                value={
                                    opensearch.load_range
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Ply Rating"
                                value={
                                    opensearch.ply_rating
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Sidewall"
                                value={
                                    opensearch.sidewall
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Run Flat"
                                value={
                                    opensearch.run_flat
                                        ? 'Yes'
                                        : 'No'
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="Winter Class"
                                value={
                                    opensearch.winter_class
                                }
                            />
                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
                            }}
                        >
                            <InfoItem
                                label="UTQG"
                                value={
                                    opensearch.utqg
                                }
                            />
                        </Grid>

                    </Grid>

                </SectionCard>

            )}


            {/* ====================================================
                CLASSIFICATION
            ===================================================== */}

            {opensearch && (

                <SectionCard
                    icon={
                        <PublicOutlinedIcon />
                    }

                    title="Classification"
                >

                    <Grid
                        container
                        spacing={2}
                    >

                        <Grid
                            size={{
                                xs: 12,
                                md: 4,
                            }}
                        >

                            <InfoItem
                                label="Origin Country"
                                value={
                                    opensearch.origin_country
                                }
                            />

                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                md: 4,
                            }}
                        >

                            <TagList
                                label="Vehicle Types"
                                values={
                                    opensearch.vehicle_type_tags
                                }
                            />

                        </Grid>


                        <Grid
                            size={{
                                xs: 12,
                                md: 4,
                            }}
                        >

                            <TagList
                                label="Segments"
                                values={
                                    opensearch.segment_tags
                                }
                            />

                        </Grid>

                    </Grid>

                </SectionCard>

            )}


            {/* ====================================================
                IMAGES
            ===================================================== */}

            {opensearch && (

                <SectionCard
                    icon={
                        <ImageOutlinedIcon />
                    }

                    title="Product Images"
                >

                    <Grid
                        container
                        spacing={2}
                    >

                        <ImageItem
                            label="Front"
                            url={
                                opensearch.img_front
                            }
                            base={
                                opensearch.img_url_base
                            }
                        />

                        <ImageItem
                            label="Side 1"
                            url={
                                opensearch.img_side1
                            }
                            base={
                                opensearch.img_url_base
                            }
                        />

                        <ImageItem
                            label="Side 2"
                            url={
                                opensearch.img_side2
                            }
                            base={
                                opensearch.img_url_base
                            }
                        />

                        <ImageItem
                            label="Angle"
                            url={
                                opensearch.img_angle
                            }
                            base={
                                opensearch.img_url_base
                            }
                        />

                    </Grid>

                </SectionCard>

            )}


            {/* ====================================================
                DATABASE INFORMATION
            ===================================================== */}

            <SectionCard
                icon={
                    <Inventory2OutlinedIcon />
                }

                title="Inventory Information"
            >

                <Grid
                    container
                    spacing={2}
                >

                    <Grid
                        size={{
                            xs: 12,
                            sm: 6,
                            md: 3,
                        }}
                    >
                        <InfoItem
                            label="Manufacturer"
                            value={
                                mysql.manufacturer
                            }
                        />
                    </Grid>


                    <Grid
                        size={{
                            xs: 12,
                            sm: 6,
                            md: 3,
                        }}
                    >
                        <InfoItem
                            label="Item"
                            value={
                                mysql.item
                            }
                        />
                    </Grid>


                    <Grid
                        size={{
                            xs: 12,
                            sm: 6,
                            md: 3,
                        }}
                    >
                        <InfoItem
                            label="Quantity"
                            value={
                                mysql.quantity
                            }
                        />
                    </Grid>


                    <Grid
                        size={{
                            xs: 12,
                            sm: 6,
                            md: 3,
                        }}
                    >
                        <InfoItem
                            label="Price"
                            value={
                                formatMoney(
                                    mysql.price
                                )
                            }
                        />
                    </Grid>


                    <Grid
                        size={{
                            xs: 12,
                            sm: 6,
                            md: 3,
                        }}
                    >
                        <InfoItem
                            label="FET"
                            value={
                                formatMoney(
                                    mysql.fet
                                )
                            }
                        />
                    </Grid>


                    <Grid
                        size={{
                            xs: 12,
                            sm: 6,
                            md: 3,
                        }}
                    >
                        <InfoItem
                            label="Mapping Status"
                            value={
                                mysql.opensearch_mapping_status
                            }
                        />
                    </Grid>


                    <Grid
                        size={{
                            xs: 12,
                            sm: 6,
                            md: 3,
                        }}
                    >
                        <InfoItem
                            label="Created"
                            value={
                                mysql.created_at
                            }
                        />
                    </Grid>


                    <Grid
                        size={{
                            xs: 12,
                            sm: 6,
                            md: 3,
                        }}
                    >
                        <InfoItem
                            label="Updated"
                            value={
                                mysql.updated_at
                            }
                        />
                    </Grid>

                </Grid>

            </SectionCard>


            {/* ====================================================
                DESCRIPTION
            ===================================================== */}

            {mysql.description && (

                <SectionCard
                    icon={
                        <LocalShippingOutlinedIcon />
                    }

                    title="Description"
                >

                    <Typography
                        variant="body2"

                        color="text.secondary"

                        sx={{
                            lineHeight: 1.8,

                            whiteSpace:
                                'pre-wrap',

                            overflowWrap:
                                'anywhere',
                        }}
                    >
                        {mysql.description}
                    </Typography>

                </SectionCard>

            )}

        </Box>

    );

}


// ==================================================================
// SECTION CARD
// ==================================================================

function SectionCard({
    icon,
    title,
    children,
}) {

    return (

        <Card
            elevation={0}

            sx={{
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,

                boxSizing:
                    'border-box',

                border:
                    '1px solid',

                borderColor:
                    'divider',

                borderRadius: 3,

                mb: 2,

                overflow: 'hidden',
            }}
        >

            <CardContent
                sx={{
                    p: {
                        xs: 2,
                        md: 2.5,
                    },

                    '&:last-child': {
                        pb: {
                            xs: 2,
                            md: 2.5,
                        },
                    },
                }}
            >

                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}

                    sx={{
                        mb: 2,
                    }}
                >

                    <Box
                        sx={{
                            width: 34,
                            height: 34,

                            borderRadius: 1.5,

                            backgroundColor:
                                'action.hover',

                            display: 'flex',

                            alignItems:
                                'center',

                            justifyContent:
                                'center',

                            color:
                                'primary.main',

                            flexShrink: 0,
                        }}
                    >
                        {icon}
                    </Box>


                    <Typography
                        variant="subtitle1"

                        sx={{
                            fontWeight: 700,
                        }}
                    >
                        {title}
                    </Typography>

                </Stack>


                {children}

            </CardContent>

        </Card>

    );

}


// ==================================================================
// INFO ITEM
// ==================================================================

function InfoItem({
    label,
    value,
}) {

    return (

        <Box
            sx={{
                minWidth: 0,
            }}
        >

            <Typography
                variant="caption"

                color="text.secondary"

                sx={{
                    display: 'block',

                    mb: 0.5,

                    fontWeight: 600,
                }}
            >
                {label}
            </Typography>


            <Typography
                variant="body2"

                sx={{
                    fontWeight: 600,

                    overflowWrap:
                        'anywhere',

                    wordBreak:
                        'break-word',
                }}
            >
                {
                    value === null ||
                    value === undefined ||
                    value === ''
                        ? '—'
                        : String(value)
                }
            </Typography>

        </Box>

    );

}


// ==================================================================
// TAG LIST
// ==================================================================

function TagList({
    label,
    values,
}) {

    let items = [];


    if (Array.isArray(values)) {

        items = values;

    } else if (values) {

        items = [values];

    }


    return (

        <Box
            sx={{
                minWidth: 0,
            }}
        >

            <Typography
                variant="caption"

                color="text.secondary"

                sx={{
                    display: 'block',

                    mb: 0.75,

                    fontWeight: 600,
                }}
            >
                {label}
            </Typography>


            {items.length > 0 ? (

                <Stack
                    direction="row"
                    spacing={0.75}
                    useFlexGap
                    flexWrap="wrap"
                >

                    {items.map(
                        (
                            item,
                            index
                        ) => (

                            <Chip
                                key={
                                    `${item}-${index}`
                                }

                                label={
                                    String(item)
                                }

                                size="small"

                                variant="outlined"
                            />

                        )
                    )}

                </Stack>

            ) : (

                <Typography
                    variant="body2"
                    fontWeight={600}
                >
                    —
                </Typography>

            )}

        </Box>

    );

}


// ==================================================================
// IMAGE ITEM
// ==================================================================

function ImageItem({
    label,
    url,
    base,
}) {

    const imageUrl =
        url
            ? (
                String(url).startsWith('http')
                    ? url
                    : `${base || ''}${url}`
            )
            : '';


    return (

        <Grid
            size={{
                xs: 6,
                sm: 4,
                md: 3,
            }}
        >

            <Paper
                elevation={0}

                sx={{
                    border:
                        '1px solid',

                    borderColor:
                        'divider',

                    borderRadius: 2,

                    overflow:
                        'hidden',

                    backgroundColor:
                        'action.hover',
                }}
            >

                <Box
                    sx={{
                        aspectRatio:
                            '1 / 1',

                        display: 'flex',

                        alignItems:
                            'center',

                        justifyContent:
                            'center',

                        overflow:
                            'hidden',
                    }}
                >

                    {imageUrl ? (

                        <Box
                            component="img"

                            src={imageUrl}

                            alt={label}

                            sx={{
                                width:
                                    '100%',

                                height:
                                    '100%',

                                objectFit:
                                    'contain',

                                p: 1,
                            }}
                        />

                    ) : (

                        <ImageOutlinedIcon
                            sx={{
                                fontSize: 40,

                                color:
                                    'text.disabled',
                            }}
                        />

                    )}

                </Box>


                <Box
                    sx={{
                        px: 1.5,
                        py: 1,
                    }}
                >

                    <Typography
                        variant="caption"

                        fontWeight={700}
                    >
                        {label}
                    </Typography>


                    {imageUrl && (

                        <IconButton
                            component="a"

                            href={imageUrl}

                            target="_blank"

                            rel="noopener noreferrer"

                            size="small"

                            sx={{
                                float: 'right',

                                mt: -0.5,
                            }}
                        >

                            <OpenInNewIcon
                                fontSize="small"
                            />

                        </IconButton>

                    )}

                </Box>

            </Paper>

        </Grid>

    );

}