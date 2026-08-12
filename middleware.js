import { NextResponse } from 'next/server';

import { getAuthenticatedAdmin } from '@/app/api/admin/auth/utils/manage-cookie';

export async function middleware(request) {

    const { pathname } =
        request.nextUrl;


    // ============================================================
    // ADMIN API
    // ============================================================

    if (pathname.startsWith('/api/admin')) {

        const admin =
            await getAuthenticatedAdmin();


        if (!admin) {

            return NextResponse.json(
                {
                    success: false,
                    message: 'Authentication required.',
                },
                {
                    status: 401,
                }
            );

        }

    }


    return NextResponse.next();

}


export const config = {

    matcher: [
        '/api/admin/:path*',
    ],

};