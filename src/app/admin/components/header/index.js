'use client';

import {
    AppBar,
    Toolbar,
    Box,
    IconButton,
    Avatar,
    Typography,
    Menu,
    MenuItem,
    Divider,
    ListItemIcon,
} from '@mui/material';

import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';

import { useState } from 'react';
import { useRouter } from 'next/navigation';


export default function AdminHeader({ admin }) {

    const router = useRouter();


    // ==================================================
    // ADMIN MENU
    // ==================================================

    const [anchorEl, setAnchorEl] = useState(null);

    const open = Boolean(anchorEl);


    // ==================================================
    // ADMIN MENU HANDLERS
    // ==================================================

    const handleAdminClick = (event) => {

        setAnchorEl(event.currentTarget);

    };


    const handleClose = () => {

        setAnchorEl(null);

    };


    // ==================================================
    // RESET PASSWORD
    // ==================================================

    const handleResetPassword = async () => {

        handleClose();


        try {

            const response =
                await fetch(
                    '/api/admin/auth/log-out',
                    {
                        method: 'POST',
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                console.error(
                    'Admin logout failed:',
                    data.message
                );

                return;

            }


            // ==================================================
            // LOGOUT SUCCESSFUL
            // ==================================================

            router.push(
                '/auth/forgot-password'
            );

            router.refresh();


        } catch (error) {

            console.error(
                'Admin logout error:',
                error
            );

        }

    };


    // ==================================================
    // LOGOUT
    // ==================================================

    const handleLogout = async () => {

        handleClose();


        try {

            const response =
                await fetch(
                    '/api/admin/auth/log-out',
                    {
                        method: 'POST',
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                console.error(
                    'Admin logout failed:',
                    data.message
                );

                return;

            }


            // ==================================================
            // LOGOUT SUCCESSFUL
            // ==================================================

            router.push(
                '/'
            );

            router.refresh();


        } catch (error) {

            console.error(
                'Admin logout error:',
                error
            );

        }

    };


    return (

        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                zIndex: (theme) =>
                    theme.zIndex.drawer + 1,
            }}
        >

            <Toolbar>


                {/* ================================================== */}
                {/* LOGO */}
                {/* ================================================== */}

                <Typography
                    variant="h6"
                    component="div"
                    sx={{
                        fontWeight: 700,
                    }}
                >
                    The Tire Deals
                </Typography>


                {/* ================================================== */}
                {/* SPACER */}
                {/* ================================================== */}

                <Box
                    sx={{
                        flexGrow: 1,
                    }}
                />


                {/* ================================================== */}
                {/* NOTIFICATIONS */}
                {/* ================================================== */}

                <IconButton
                    color="inherit"
                    aria-label="notifications"
                >
                    <NotificationsNoneOutlinedIcon />
                </IconButton>


                {/* ================================================== */}
                {/* USER */}
                {/* ================================================== */}

                <Box
                    onClick={handleAdminClick}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        ml: 2,
                        gap: 1,
                        cursor: 'pointer',
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,

                        '&:hover': {
                            backgroundColor:
                                'rgba(255,255,255,0.08)',
                        },
                    }}
                >

                    <Avatar
                        sx={{
                            width: 36,
                            height: 36,
                        }}
                    >
                        {
                            admin?.name
                                ?.charAt(0)
                                ?.toUpperCase()
                            || 'A'
                        }
                    </Avatar>


                    <Box>

                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 600,
                                lineHeight: 1.2,
                            }}
                        >
                            {admin?.name || 'Admin'}
                        </Typography>


                        <Typography
                            variant="caption"
                            sx={{
                                opacity: 0.7,
                            }}
                        >
                            Administrator
                        </Typography>

                    </Box>

                </Box>


                {/* ================================================== */}
                {/* ADMIN MENU */}
                {/* ================================================== */}

                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    MenuListProps={{
                        autoFocus: false,
                        disableListWrap: true,
                    }}
                    slotProps={{
                        paper: {
                            sx: {

                                '& .MuiMenuItem-root:focus': {
                                    backgroundColor:
                                        'transparent',
                                },

                                '& .MuiMenuItem-root:hover': {
                                    backgroundColor:
                                        'action.hover',
                                },

                            },
                        },
                    }}
                >


                    {/* ================================================== */}
                    {/* RESET PASSWORD */}
                    {/* ================================================== */}

                    <MenuItem
                        onClick={
                            handleResetPassword
                        }
                    >

                        <ListItemIcon>

                            <LockOutlinedIcon
                                fontSize="small"
                            />

                        </ListItemIcon>

                        Change Password

                    </MenuItem>


                    <Divider />


                    {/* ================================================== */}
                    {/* LOG OUT */}
                    {/* ================================================== */}

                    <MenuItem
                        onClick={
                            handleLogout
                        }
                    >

                        <ListItemIcon>

                            <LogoutOutlinedIcon
                                fontSize="small"
                            />

                        </ListItemIcon>

                        Log Out

                    </MenuItem>


                </Menu>


            </Toolbar>

        </AppBar>

    );

}