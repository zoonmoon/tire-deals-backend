'use client';

import Link from 'next/link';

import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
} from '@mui/material';

import { ADMIN_DRAWER_WIDTH } from '../constants';

import { adminNavigationItems } from './sidebar_nav_items';

export default function AdminSidebar() {

    return (

        <Drawer
            variant="permanent"
            sx={{
                width: ADMIN_DRAWER_WIDTH,

                flexShrink: 0,

                '& .MuiDrawer-paper': {
                    width: ADMIN_DRAWER_WIDTH,
                    boxSizing: 'border-box',
                },
            }}
        >

            {/* Keeps navigation below the fixed header */}
            <Toolbar />


            {/* ================================================== */}
            {/* NAVIGATION */}
            {/* ================================================== */}

            <Box
                sx={{
                    overflow: 'auto',
                    px: 1,
                }}
            >

                <List>

                    {adminNavigationItems.map((item) => {

                        const Icon = item.icon;

                        return (

                            <ListItem
                                key={item.href}
                                disablePadding
                            >

                                <ListItemButton
                                    component={Link}
                                    href={item.href}
                                    sx={{
                                        borderRadius: 1,
                                        mb: 0.5,
                                    }}
                                >

                                    <ListItemIcon>
                                        <Icon />
                                    </ListItemIcon>

                                    <ListItemText
                                        primary={item.label}
                                    />

                                </ListItemButton>

                            </ListItem>

                        );

                    })}

                </List>

            </Box>

        </Drawer>

    );

}