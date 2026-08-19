'use client';

import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Alert,
    Link,
} from '@mui/material';

import { useState } from 'react';
import { useRouter } from 'next/navigation';


export default function ForgotPasswordPage() {

    const router = useRouter();


    // ==================================================
    // STEP
    // ==================================================

    const [step, setStep] = useState(1);


    // ==================================================
    // FORM
    // ==================================================

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');


    // ==================================================
    // UI STATE
    // ==================================================

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');


    // ==================================================
    // REQUEST RESET CODE
    // ==================================================

    async function handleRequestCode(event) {

        event.preventDefault();

        setError('');
        setSuccess('');
        setLoading(true);


        try {

            const response = await fetch(
                '/api/admin/auth/forgot-password',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                    },

                    body: JSON.stringify({
                        email,
                    }),
                }
            );


            const data =
                await response.json();


            if (!response.ok || !data.success) {

                setError(
                    data.message ||
                    'Unable to process password reset request.'
                );

                return;

            }


            // ==================================================
            // CODE SENT
            // ==================================================

            setSuccess(
                data.message ||
                'If an account exists for this email, a password reset code has been sent.'
            );

            setStep(2);


        } catch (error) {

            console.error(
                'Forgot password error:',
                error
            );

            setError(
                'Unable to process your request. Please try again.'
            );

        } finally {

            setLoading(false);

        }

    }


    // ==================================================
    // RESET PASSWORD
    // ==================================================

    async function handleResetPassword(event) {

        event.preventDefault();

        setError('');
        setSuccess('');


        // ==================================================
        // CLIENT VALIDATION
        // ==================================================

        if (!/^\d{6}$/.test(code)) {

            setError(
                'Please enter the 6-digit verification code.'
            );

            return;

        }


        if (newPassword.length < 8) {

            setError(
                'Password must be at least 8 characters.'
            );

            return;

        }


        if (newPassword !== confirmPassword) {

            setError(
                'Passwords do not match.'
            );

            return;

        }


        setLoading(true);


        try {

            const response = await fetch(
                '/api/admin/auth/reset-password',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                    },

                    body: JSON.stringify({

                        email,

                        code,

                        new_password:
                            newPassword,

                    }),
                }
            );


            const data =
                await response.json();


            if (!response.ok || !data.success) {

                setError(
                    data.message ||
                    'Unable to reset your password.'
                );

                return;

            }


            // ==================================================
            // PASSWORD RESET SUCCESSFUL
            // ==================================================

            setSuccess(
                data.message ||
                'Your password has been reset successfully.'
            );


            // Your backend creates the auth cookie,
            // so the admin is already logged in.

            setTimeout(() => {

                router.push('/admin');

                router.refresh();

            }, 1000);


        } catch (error) {

            console.error(
                'Admin password reset error:',
                error
            );

            setError(
                'Unable to reset your password. Please try again.'
            );

        } finally {

            setLoading(false);

        }

    }


    // ==================================================
    // BACK TO LOGIN
    // ==================================================

    const handleBackToLogin = () => {

        router.push('/');

    };


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
                {/* STEP 1 */}
                {/* ================================================== */}

                {step === 1 && (

                    <>

                        <Typography
                            variant="h5"
                            component="h1"
                            sx={{
                                fontWeight: 600,
                                mb: 1,
                            }}
                        >
                            Forgot Password?
                        </Typography>


                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mb: 3,
                            }}
                        >
                            Enter your admin email address and
                            we'll send you a verification code.
                        </Typography>


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


                        <Box
                            component="form"
                            onSubmit={handleRequestCode}
                        >

                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(
                                        event.target.value
                                    )
                                }
                                disabled={loading}
                                autoComplete="email"
                                sx={{
                                    mb: 3,
                                }}
                            />


                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                disabled={
                                    loading ||
                                    !email
                                }
                                size="large"
                            >
                                {loading
                                    ? 'Sending...'
                                    : 'Send Verification Code'
                                }
                            </Button>

                        </Box>


                        <Box
                            sx={{
                                textAlign: 'center',
                                mt: 3,
                            }}
                        >
                            
                            <Link
                                component="button"
                                type="button"
                                onClick={
                                    handleBackToLogin
                                }
                                underline="hover"
                            >
                                Back to Login
                            </Link>

                        </Box>

                    </>

                )}


                {/* ================================================== */}
                {/* STEP 2 */}
                {/* ================================================== */}

                {step === 2 && (

                    <>

                        <Typography
                            variant="h5"
                            component="h1"
                            sx={{
                                fontWeight: 600,
                                mb: 1,
                            }}
                        >
                            Reset Password
                        </Typography>


                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mb: 3,
                            }}
                        >
                            Enter the 6-digit verification code
                            sent to your email and choose a new
                            password.
                        </Typography>


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


                        <Box
                            component="form"
                            onSubmit={handleResetPassword}
                        >


                            {/* EMAIL */}

                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={email}
                                disabled
                                sx={{
                                    mb: 2,
                                }}
                            />


                            {/* VERIFICATION CODE */}

                            <TextField
                                fullWidth
                                label="Verification Code"
                                value={code}
                                onChange={(event) => {

                                    const value =
                                        event.target.value
                                            .replace(/\D/g, '')
                                            .slice(0, 6);

                                    setCode(value);

                                }}
                                disabled={loading}
                                inputProps={{
                                    inputMode: 'numeric',
                                    maxLength: 6,
                                }}
                                sx={{
                                    mb: 2,
                                }}
                            />


                            {/* NEW PASSWORD */}

                            <TextField
                                fullWidth
                                label="New Password"
                                type="password"
                                value={newPassword}
                                onChange={(event) =>
                                    setNewPassword(
                                        event.target.value
                                    )
                                }
                                disabled={loading}
                                autoComplete="new-password"
                                sx={{
                                    mb: 2,
                                }}
                            />


                            {/* CONFIRM PASSWORD */}

                            <TextField
                                fullWidth
                                label="Confirm New Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(
                                        event.target.value
                                    )
                                }
                                disabled={loading}
                                autoComplete="new-password"
                                error={
                                    confirmPassword.length > 0 &&
                                    newPassword !==
                                        confirmPassword
                                }
                                helperText={
                                    confirmPassword.length > 0 &&
                                    newPassword !==
                                        confirmPassword
                                        ? 'Passwords do not match'
                                        : ''
                                }
                                sx={{
                                    mb: 3,
                                }}
                            />


                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                disabled={
                                    loading ||
                                    !code ||
                                    !newPassword ||
                                    !confirmPassword ||
                                    newPassword !==
                                        confirmPassword
                                }
                                size="large"
                            >
                                {loading
                                    ? 'Resetting Password...'
                                    : 'Reset Password'
                                }
                            </Button>

                        </Box>


                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                mt: 3,
                            }}
                        >

                            <Link
                                component="button"
                                type="button"
                                onClick={() => {

                                    setStep(1);
                                    setCode('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    setError('');
                                    setSuccess('');

                                }}
                                underline="hover"
                            >
                                Change Email
                            </Link>


                            <Link
                                component="button"
                                type="button"
                                onClick={
                                    handleBackToLogin
                                }
                                underline="hover"
                            >
                                Back to Login
                            </Link>

                        </Box>

                    </>

                )}

            </Paper>

        </Box>

    );

}