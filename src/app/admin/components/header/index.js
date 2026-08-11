'use client';

import {
    AppBar,
    Toolbar,
    Box,
    IconButton,
    Avatar,
    Typography,
} from '@mui/material';

import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';

export default function AdminHeader({ admin }) {

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
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        ml: 2,
                        gap: 1,
                        cursor: 'pointer',
                    }}
                >

                    <Avatar
                        sx={{
                            width: 36,
                            height: 36,
                        }}
                    >
                        {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
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

            </Toolbar>

        </AppBar>

    );

}