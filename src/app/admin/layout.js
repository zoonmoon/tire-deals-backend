import { Box } from '@mui/material';
import { redirect } from 'next/navigation';

import AdminHeader from './components/header';
import AdminSidebar from './components/sidebar';

import {
    getAuthenticatedAdmin,
} from '../api/admin/auth/utils/manage-cookie';


export default async function AdminLayout({ children }) {

    const admin = await getAuthenticatedAdmin();


    // ============================================================
    // REQUIRE ADMIN AUTHENTICATION
    // ============================================================

    if (!admin) {

        redirect('/');

    }


    return (

        <Box
            sx={{
                minHeight: '100vh',
            }}
        >

            {/* ================================================== */}
            {/* FULL WIDTH HEADER */}
            {/* ================================================== */}

            <AdminHeader
                admin={admin}
            />


            {/* ================================================== */}
            {/* CONTENT AREA BELOW HEADER */}
            {/* ================================================== */}

            <Box
                sx={{
                    display: 'flex',
                    pt: '64px',
                    minHeight: '100vh',
                }}
            >

                {/* ================================================== */}
                {/* SIDEBAR */}
                {/* ================================================== */}

                <AdminSidebar />


                {/* ================================================== */}
                {/* MAIN CONTENT */}
                {/* ================================================== */}

                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        minWidth: 0,
                        p: 3,
                    }}
                >

                    {children}

                </Box>

            </Box>

        </Box>

    );

}