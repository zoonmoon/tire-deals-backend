'use client'
import Intercom from '@intercom/messenger-js-sdk';
import { useState } from 'react';
import { useRouter } from 'next/navigation';


// Intercom({
//   app_id: 'tjn7j4ly',
// });


import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
} from '@mui/material';
import Link from 'next/link';


export default function AdminLoginPage() {

    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');


    async function handleSubmit(event) {

        event.preventDefault();

        setError('');
        setLoading(true);


        try {

            const response = await fetch(
                '/api/admin/auth/login',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                    },

                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            );


            const data = await response.json();


            if (!response.ok || !data.success) {

                setError(
                    data.message ||
                    'Unable to login.'
                );

                return;

            }


            // ====================================================
            // LOGIN SUCCESSFUL
            // ====================================================

            router.push('/admin');

            router.refresh();


        } catch (error) {

            console.error(
                'Admin login error:',
                error
            );

            setError(
                'Unable to login. Please try again.'
            );

        } finally {

            setLoading(false);

        }

    }


    return (

        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2,
            }}
        >

            <Paper
                elevation={3}
                sx={{
                    width: '100%',
                    maxWidth: 420,
                    p: 4,
                }}
            >

                {/* ================================================== */}
                {/* TITLE */}
                {/* ================================================== */}

                <Typography
                    variant="h5"
                    component="h1"
                    sx={{
                        fontWeight: 600,
                        mb: 1,
                    }}
                >
                    Admin Login
                </Typography>


                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        mb: 3,
                    }}
                >
                    Sign in to access the admin dashboard.
                </Typography>


                {/* ================================================== */}
                {/* ERROR */}
                {/* ================================================== */}

                {error && (

                    <Typography
                        color="error"
                        variant="body2"
                        sx={{
                            mb: 2,
                        }}
                    >
                        {error}
                    </Typography>

                )}


                {/* ================================================== */}
                {/* FORM */}
                {/* ================================================== */}

                <Box
                    component="form"
                    onSubmit={handleSubmit}
                >

                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        disabled={loading}
                        autoComplete="email"
                        sx={{
                            mb: 2,
                        }}
                    />


                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        disabled={loading}
                        autoComplete="current-password"
                        sx={{
                            mb: 3,
                        }}
                    />



<Box
    sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        mb: 3,
    }}
>

 

    <Link
        component="button"
        type="button"
        underline="hover"
        href='/auth/forgot-password'
        style={{
            fontSize: '0.875rem',
            color:'blue'
        }}
    >
        Forgot Password?
    </Link>


</Box>

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        disabled={
                            loading ||
                            !email ||
                            !password
                        }
                        size="large"
                    >
                        {loading
                            ? 'Signing in...'
                            : 'Sign In'
                        }
                    </Button>

                </Box>

            </Paper>

        </Box>

    );

}