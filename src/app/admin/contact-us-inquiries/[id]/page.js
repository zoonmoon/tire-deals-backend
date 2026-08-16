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
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FiberNewIcon from "@mui/icons-material/FiberNew";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";

import { useParams, useRouter } from "next/navigation";


const API_URL =
    "/api/admin/contact-us-inquiries";


export default function ContactUsInquiryDetailsPage() {

    const router =
        useRouter();

    const params =
        useParams();

    const id =
        params?.id;


    // ============================================================
    // STATE
    // ============================================================

    const [inquiry, setInquiry] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // ============================================================
    // FETCH INQUIRY
    // ============================================================

    const fetchInquiry =
        useCallback(
            async () => {

                if (!id) {
                    return;
                }


                try {

                    setLoading(true);

                    setError("");


                    const response =
                        await fetch(
                            `${API_URL}/${id}`,
                            {
                                method: "GET",

                                credentials:
                                    "include",

                                cache:
                                    "no-store",
                            }
                        );


                    const contentType =
                        response.headers.get(
                            "content-type"
                        ) || "";


                    if (
                        !contentType.includes(
                            "application/json"
                        )
                    ) {

                        throw new Error(
                            "Server returned an invalid response."
                        );

                    }


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data?.message ||
                            "Unable to retrieve inquiry."
                        );

                    }


                    setInquiry(
                        data?.inquiry ||
                        data?.data ||
                        null
                    );


                } catch (error) {

                    console.error(
                        "Fetch inquiry error:",
                        error
                    );


                    setError(
                        error?.message ||
                        "Unable to retrieve inquiry."
                    );


                } finally {

                    setLoading(false);

                }

            },
            [id]
        );


    // ============================================================
    // FETCH
    // ============================================================

    useEffect(() => {

        fetchInquiry();

    }, [fetchInquiry]);


    // ============================================================
    // DATE
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

                    month: "long",

                    day: "numeric",

                    hour: "numeric",

                    minute: "2-digit",
                }
            );

        };


    // ============================================================
    // EMAIL
    // ============================================================

    const handleEmail =
        () => {

            if (!inquiry?.email) {
                return;
            }


            window.location.href =
                `mailto:${inquiry.email}`;

        };


    // ============================================================
    // PHONE
    // ============================================================

    const handlePhone =
        () => {

            if (!inquiry?.phone) {
                return;
            }


            window.location.href =
                `tel:${inquiry.phone}`;

        };


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (

            <Box
                sx={{
                    width: "100%",

                    minWidth: 0,

                    display: "flex",

                    justifyContent:
                        "center",

                    alignItems:
                        "center",

                    py: 12,
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

                    maxWidth: "100%",

                    minWidth: 0,

                    boxSizing:
                        "border-box",

                    p: {
                        xs: 2,

                        md: 3,
                    },
                }}
            >

                <Button
                    startIcon={
                        <ArrowBackIcon />
                    }

                    onClick={() =>
                        router.push(
                            "/admin/contact-us-inquiries"
                        )
                    }

                    sx={{
                        mb: 2,

                        textTransform:
                            "none",
                    }}
                >
                    Back to inquiries
                </Button>


                <Alert severity="error">
                    {error}
                </Alert>

            </Box>

        );

    }


    // ============================================================
    // NOT FOUND
    // ============================================================

    if (!inquiry) {

        return (

            <Box
                sx={{
                    width: "100%",

                    maxWidth: "100%",

                    minWidth: 0,

                    boxSizing:
                        "border-box",

                    p: {
                        xs: 2,

                        md: 3,
                    },
                }}
            >

                <Button
                    startIcon={
                        <ArrowBackIcon />
                    }

                    onClick={() =>
                        router.push(
                            "/admin/contact-us-inquiries"
                        )
                    }

                    sx={{
                        mb: 2,

                        textTransform:
                            "none",
                    }}
                >
                    Back to inquiries
                </Button>


                <Alert severity="info">
                    This inquiry could not be found.
                </Alert>

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

                maxWidth: "100%",

                minWidth: 0,

                boxSizing:
                    "border-box",

                overflowX: "hidden",

                p: {
                    xs: 2,

                    md: 3,
                },
            }}
        >

            {/* =====================================================
                TOP BAR
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
                }}
            >

                <Button
                    startIcon={
                        <ArrowBackIcon />
                    }

                    onClick={() =>
                        router.push(
                            "/admin/contact-us-inquiries"
                        )
                    }

                    sx={{
                        textTransform:
                            "none",

                        fontWeight: 600,
                    }}
                >
                    Back to inquiries
                </Button>


                <Stack
                    direction={{
                        xs: "column",

                        sm: "row",
                    }}

                    spacing={1}
                >

                    <Button
                        variant="outlined"

                        startIcon={
                            <EmailOutlinedIcon />
                        }

                        disabled={
                            !inquiry.email
                        }

                        onClick={
                            handleEmail
                        }

                        sx={{
                            textTransform:
                                "none",

                            borderRadius:
                                1.5,
                        }}
                    >
                        Reply by Email
                    </Button>


                    {inquiry.phone && (

                        <Button
                            variant="outlined"

                            startIcon={
                                <PhoneOutlinedIcon />
                            }

                            onClick={
                                handlePhone
                            }

                            sx={{
                                textTransform:
                                    "none",

                                borderRadius:
                                    1.5,
                            }}
                        >
                            Call
                        </Button>

                    )}

                </Stack>

            </Stack>


            {/* =====================================================
                MAIN CONTENT
            ====================================================== */}

            <Paper
                elevation={0}

                sx={{
                    width: "100%",

                    maxWidth: 1000,


                    border: "1px solid",

                    borderColor:
                        "divider",

                    borderRadius: 2,

                    overflow: "hidden",
                }}
            >

                {/* =================================================
                    HEADER
                ================================================== */}

                <Box
                    sx={{
                        p: {
                            xs: 2,

                            md: 3,
                        },
                    }}
                >

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
                    >

                        <Box
                            sx={{
                                minWidth: 0,
                            }}
                        >

                            <Typography
                                variant="h5"
                                fontWeight={700}
                                sx={{
                                    wordBreak:
                                        "break-word",
                                }}
                            >
                                {
                                    inquiry.subject ||
                                    "Contact Inquiry"
                                }
                            </Typography>


                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    mt: 0.75,
                                }}
                            >
                                Received{" "}
                                {
                                    formatDate(
                                        inquiry.created_at
                                    )
                                }
                            </Typography>

                        </Box>


                        {inquiry.status ===
                        "new" ? (

                            <Chip
                                icon={
                                    <FiberNewIcon />
                                }

                                label="New"

                                color="error"

                                size="small"

                                sx={{
                                    flexShrink: 0,
                                }}
                            />

                        ) : (

                            <Chip
                                icon={
                                    <VisibilityIcon />
                                }

                                label="Viewed"

                                variant="outlined"

                                size="small"

                                sx={{
                                    flexShrink: 0,
                                }}
                            />

                        )}

                    </Stack>

                </Box>


                <Divider />


                {/* =================================================
                    CONTACT INFORMATION
                ================================================== */}

                <Box
                    sx={{
                        p: {
                            xs: 2,

                            md: 3,
                        },
                    }}
                >

                    <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{
                            mb: 2,
                        }}
                    >
                        Contact Information
                    </Typography>


                    <Stack
                        spacing={2}
                    >

                        <Box>

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Name
                            </Typography>


                            <Typography
                                variant="body1"
                                sx={{
                                    mt: 0.25,

                                    wordBreak:
                                        "break-word",
                                }}
                            >
                                {
                                    inquiry.name ||
                                    "-"
                                }
                            </Typography>

                        </Box>


                        <Box>

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Email
                            </Typography>


                            <Typography
                                variant="body1"
                                sx={{
                                    mt: 0.25,

                                    wordBreak:
                                        "break-word",
                                }}
                            >
                                {
                                    inquiry.email ||
                                    "-"
                                }
                            </Typography>

                        </Box>


                        {inquiry.phone && (

                            <Box>

                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Phone
                                </Typography>


                                <Typography
                                    variant="body1"
                                    sx={{
                                        mt: 0.25,
                                    }}
                                >
                                    {
                                        inquiry.phone
                                    }
                                </Typography>

                            </Box>

                        )}

                    </Stack>

                </Box>


                <Divider />


                {/* =================================================
                    MESSAGE
                ================================================== */}

                <Box
                    sx={{
                        p: {
                            xs: 2,

                            md: 3,
                        },
                    }}
                >

                    <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{
                            mb: 2,
                        }}
                    >
                        Message
                    </Typography>


                    <Typography
                        variant="body1"
                        sx={{
                            whiteSpace:
                                "pre-wrap",

                            lineHeight:
                                1.8,

                            color:
                                "text.primary",

                            wordBreak:
                                "break-word",
                        }}
                    >
                        {
                            inquiry.message ||
                            "-"
                        }
                    </Typography>

                </Box>


                <Divider />


                {/* =================================================
                    FOOTER META
                ================================================== */}

                <Box
                    sx={{
                        p: {
                            xs: 2,

                            md: 3,
                        },
                    }}
                >

                    <Stack
                        direction={{
                            xs: "column",

                            sm: "row",
                        }}

                        spacing={3}
                    >

                        <Box>

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Inquiry ID
                            </Typography>


                            <Typography
                                variant="body2"
                                sx={{
                                    mt: 0.5,

                                    fontFamily:
                                        "monospace",

                                    wordBreak:
                                        "break-all",
                                }}
                            >
                                {
                                    inquiry.id
                                }
                            </Typography>

                        </Box>


                        <Box>

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Last Updated
                            </Typography>


                            <Typography
                                variant="body2"
                                sx={{
                                    mt: 0.5,
                                }}
                            >
                                {
                                    formatDate(
                                        inquiry.updated_at
                                    )
                                }
                            </Typography>

                        </Box>

                    </Stack>

                </Box>

            </Paper>

        </Box>

    );

}