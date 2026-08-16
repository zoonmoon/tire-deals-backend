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
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FiberNewIcon from "@mui/icons-material/FiberNew";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { useRouter } from "next/navigation";


const API_URL =
    "/api/admin/contact-us-inquiries";


export default function ContactUsInquiriesPage() {

    const router =
        useRouter();


    // ============================================================
    // STATE
    // ============================================================

    const [inquiries, setInquiries] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // API uses 1-based pages
    const [page, setPage] =
        useState(1);


    const [limit, setLimit] =
        useState(25);


    const [search, setSearch] =
        useState("");


    const [status, setStatus] =
        useState("");


    const [pagination, setPagination] =
        useState({

            page: 1,

            limit: 25,

            total: 0,

            has_previous: false,

            has_next: false,

        });


    // ============================================================
    // FETCH INQUIRIES
    // ============================================================

    const fetchInquiries =
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


                    if (search.trim()) {

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
                            `${API_URL}?${params.toString()}`,
                            {
                                method: "GET",

                                credentials:
                                    "include",

                                cache:
                                    "no-store",
                            }
                        );


                    // ====================================================
                    // SAFELY HANDLE NON-JSON RESPONSES
                    // ====================================================

                    const contentType =
                        response.headers.get(
                            "content-type"
                        ) || "";


                    if (
                        !contentType.includes(
                            "application/json"
                        )
                    ) {

                        const text =
                            await response.text();


                        console.error(
                            "Expected JSON but received:",
                            text
                        );


                        throw new Error(
                            `Server returned an invalid response (${response.status}).`
                        );

                    }


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data?.message ||
                            "Failed to retrieve inquiries."
                        );

                    }


                    // ====================================================
                    // SET DATA
                    // ====================================================

                    setInquiries(
                        data?.inquiries || []
                    );


                    setPagination(
                        data?.pagination || {

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
                        "Fetch contact inquiries error:",
                        error
                    );


                    setError(
                        error?.message ||
                        "Unable to retrieve inquiries."
                    );


                    setInquiries([]);


                    setPagination({

                        page,

                        limit,

                        total: 0,

                        has_previous:
                            false,

                        has_next:
                            false,

                    });


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


    // ============================================================
    // FETCH WHEN PARAMETERS CHANGE
    // ============================================================

    useEffect(() => {

        fetchInquiries();

    }, [fetchInquiries]);


    // ============================================================
    // SEARCH
    // ============================================================

    const handleSearchChange =
        (event) => {

            setSearch(
                event.target.value
            );


            // Always return to first page
            // when search changes.

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
    // LIMIT
    // ============================================================

    const handleLimitChange =
        (event) => {

            const newLimit =
                Number(
                    event.target.value
                );


            setLimit(
                newLimit
            );


            // New page size starts from page 1.

            setPage(1);

        };


    // ============================================================
    // PREVIOUS PAGE
    // ============================================================

    const handlePreviousPage =
        () => {

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
    // NEXT PAGE
    // ============================================================

    const handleNextPage =
        () => {

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
    // OPEN INQUIRY
    // ============================================================

    const handleOpenInquiry =
        (id) => {

            router.push(
                `/admin/contact-us-inquiries/${id}`
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
                undefined,
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
    // RENDER
    // ============================================================

    return (

        <Box
            sx={{
                width: "100%",

                maxWidth: "100%",

                minWidth: 0,

                boxSizing: "border-box",

                overflowX: "hidden",

                p: {
                    xs: 2,

                    md: 3,
                },
            }}
        >

            {/* =====================================================
                HEADER
            ====================================================== */}

            <Stack
                direction={{
                    xs: "column",

                    sm: "row",
                }}

                justifyContent="space-between"

                alignItems={{
                    xs: "flex-start",

                    sm: "center",
                }}

                spacing={2}

                sx={{
                    mb: 3,

                    minWidth: 0,
                }}
            >

                <Box
                    sx={{
                        minWidth: 0,
                    }}
                >

                    <Typography
                        variant="h5"
                        fontWeight={700}
                    >
                        Contact Us Inquiries
                    </Typography>


                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 0.5,
                        }}
                    >
                        Manage customer contact inquiries.
                    </Typography>

                </Box>


                <Chip
                    label={`${pagination.total} ${
                        pagination.total === 1
                            ? "Inquiry"
                            : "Inquiries"
                    }`}

                    variant="outlined"

                    sx={{
                        flexShrink: 0,
                    }}
                />

            </Stack>


            {/* =====================================================
                FILTERS
            ====================================================== */}

            <Paper
                elevation={0}

                sx={{
                    width: "100%",

                    maxWidth: "100%",

                    minWidth: 0,

                    boxSizing: "border-box",

                    border: "1px solid",

                    borderColor: "divider",

                    p: 2,

                    mb: 2,

                    overflow: "hidden",
                }}
            >

                <Stack
                    direction={{
                        xs: "column",

                        sm: "row",
                    }}

                    spacing={2}

                    sx={{
                        minWidth: 0,
                    }}
                >



                   <FormControl
                        size="small"

                        sx={{
                            width: {
                                xs: "100%",

                                sm: 160,
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
                        >

                            <MenuItem value="">
                                All
                            </MenuItem>


                            <MenuItem value="new">
                                New
                            </MenuItem>


                            <MenuItem value="viewed">
                                Viewed
                            </MenuItem>

                        </Select>

                    </FormControl>


                    <TextField
                        fullWidth

                        size="small"

                        value={search}

                        onChange={
                            handleSearchChange
                        }

                        placeholder={
                            "Search name, email, phone, subject..."
                        }

                        InputProps={{
                            startAdornment: (

                                <InputAdornment
                                    position="start"
                                >

                                    <SearchIcon />

                                </InputAdornment>

                            ),
                        }}
                    />


 

                </Stack>

            </Paper>


            {/* =====================================================
                ERROR
            ====================================================== */}

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


            {/* =====================================================
                TABLE
            ====================================================== */}

            <Paper
                elevation={0}

                sx={{
                    width: "100%",

                    maxWidth: "100%",

                    minWidth: 0,

                    boxSizing: "border-box",

                    border: "1px solid",

                    borderColor: "divider",

                    overflow: "hidden",
                }}
            >

                <TableContainer
                    sx={{
                        width: "100%",

                        maxWidth: "100%",

                        minWidth: 0,

                        overflowX: "hidden",
                    }}
                >

                    <Table
                        sx={{
                            width: "100%",

                            maxWidth: "100%",

                            tableLayout:
                                "fixed",
                        }}
                    >

                        <TableHead>

                            <TableRow>

                                {/* STATUS */}

                                <TableCell
                                    sx={{
                                        width: {
                                            xs: 90,

                                            sm: 105,
                                        },
                                    }}
                                >
                                    Status
                                </TableCell>


                                {/* NAME */}

                                <TableCell
                                    sx={{
                                        width: {
                                            xs: 130,

                                            sm: 170,
                                        },
                                    }}
                                >
                                    Name
                                </TableCell>


                                {/* EMAIL */}

                                <TableCell
                                    sx={{
                                        width: 220,

                                        display: {
                                            xs: "none",

                                            md: "table-cell",
                                        },
                                    }}
                                >
                                    Email
                                </TableCell>


                                {/* SUBJECT */}

                                <TableCell
                                    sx={{
                                        width: {
                                            xs: 150,

                                            sm: 200,
                                        },
                                    }}
                                >
                                    Subject
                                </TableCell>


                                {/* MESSAGE */}

                                <TableCell
                                    sx={{
                                        width: 280,

                                        display: {
                                            xs: "none",

                                            lg: "table-cell",
                                        },
                                    }}
                                >
                                    Message
                                </TableCell>


                                {/* CREATED */}

                                <TableCell
                                    sx={{
                                        width: {
                                            xs: 135,

                                            sm: 170,
                                        },
                                    }}
                                >
                                    Created
                                </TableCell>

                            </TableRow>

                        </TableHead>


                        <TableBody>

                            {/* =================================================
                                LOADING
                            ================================================== */}

                            {loading ? (

                                <TableRow>

                                    <TableCell
                                        colSpan={6}

                                        align="center"

                                        sx={{
                                            py: 8,
                                        }}
                                    >

                                        <CircularProgress
                                            size={32}
                                        />

                                    </TableCell>

                                </TableRow>

                            ) : inquiries.length === 0 ? (

                                /* =============================================
                                    EMPTY
                                ============================================== */

                                <TableRow>

                                    <TableCell
                                        colSpan={6}

                                        align="center"

                                        sx={{
                                            py: 8,
                                        }}
                                    >

                                        <Typography
                                            color="text.secondary"
                                        >
                                            No contact inquiries found.
                                        </Typography>

                                    </TableCell>

                                </TableRow>

                            ) : (

                                /* =============================================
                                    RESULTS
                                ============================================== */

                                inquiries.map(
                                    (inquiry) => (

                                        <TableRow

                                            key={
                                                inquiry.id
                                            }

                                            hover

                                            onClick={() =>
                                                handleOpenInquiry(
                                                    inquiry.id
                                                )
                                            }

                                            sx={{
                                                cursor:
                                                    "pointer",

                                                backgroundColor:
                                                    inquiry.status ===
                                                    "new"
                                                        ? "action.hover"
                                                        : "transparent",

                                                "&:last-child td":
                                                    {
                                                        borderBottom:
                                                            0,
                                                    },
                                            }}
                                        >

                                            {/* STATUS */}

                                            <TableCell>

                                                {inquiry.status ===
                                                "new" ? (

                                                    <Chip
                                                        icon={
                                                            <FiberNewIcon />
                                                        }

                                                        label="New"

                                                        size="small"

                                                        color="error"

                                                        sx={{
                                                            maxWidth:
                                                                "100%",
                                                        }}
                                                    />

                                                ) : (

                                                    <Chip
                                                        icon={
                                                            <VisibilityIcon />
                                                        }

                                                        label="Viewed"

                                                        size="small"

                                                        variant="outlined"

                                                        sx={{
                                                            maxWidth:
                                                                "100%",
                                                        }}
                                                    />

                                                )}

                                            </TableCell>


                                            {/* NAME */}

                                            <TableCell>

                                                <Typography
                                                    fontWeight={
                                                        inquiry.status ===
                                                        "new"
                                                            ? 600
                                                            : 400
                                                    }

                                                    noWrap
                                                >
                                                    {
                                                        inquiry.name ||
                                                        "-"
                                                    }
                                                </Typography>

                                            </TableCell>


                                            {/* EMAIL */}

                                            <TableCell
                                                sx={{
                                                    display: {
                                                        xs: "none",

                                                        md: "table-cell",
                                                    },
                                                }}
                                            >

                                                <Typography
                                                    noWrap
                                                >
                                                    {
                                                        inquiry.email ||
                                                        "-"
                                                    }
                                                </Typography>

                                            </TableCell>


                                            {/* SUBJECT */}

                                            <TableCell>

                                                <Typography
                                                    noWrap
                                                >
                                                    {
                                                        inquiry.subject ||
                                                        "-"
                                                    }
                                                </Typography>

                                            </TableCell>


                                            {/* MESSAGE */}

                                            <TableCell
                                                sx={{
                                                    display: {
                                                        xs: "none",

                                                        lg: "table-cell",
                                                    },
                                                }}
                                            >

                                                <Typography
                                                    color="text.secondary"

                                                    noWrap
                                                >
                                                    {
                                                        inquiry.message ||
                                                        "-"
                                                    }
                                                </Typography>

                                            </TableCell>


                                            {/* CREATED */}

                                            <TableCell
                                                sx={{
                                                    whiteSpace:
                                                        "nowrap",
                                                }}
                                            >

                                                {
                                                    formatDate(
                                                        inquiry.created_at
                                                    )
                                                }

                                            </TableCell>

                                        </TableRow>

                                    )
                                )

                            )}

                        </TableBody>

                    </Table>

                </TableContainer>


                {/* =====================================================
                    CUSTOM PAGINATION
                ====================================================== */}

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

                        overflow: "hidden",
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

                        {/* =================================================
                            PAGE + LIMIT
                        ================================================== */}

                        <Stack
                            direction="row"

                            sx={{
                                alignItems:
                                    "center",

                                minWidth: 0,
                            }}

                            spacing={1.5}
                        >

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    whiteSpace:
                                        "nowrap",
                                }}
                            >
                                Page {pagination.page}
                            </Typography>


                            <FormControl
                                size="small"

                                sx={{
                                    minWidth: 105,

                                    flexShrink: 0,
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


                        {/* =================================================
                            PREVIOUS / NEXT
                        ================================================== */}

                        <Stack
                            direction="row"

                            spacing={1}

                            sx={{
                                flexShrink: 0,
                            }}
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

                                    whiteSpace:
                                        "nowrap",
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

                                    whiteSpace:
                                        "nowrap",
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