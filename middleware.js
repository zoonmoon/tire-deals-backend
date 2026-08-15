import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'admin_account_cookie';
const JWT_SECRET = process.env.JWT_SECRET;

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    if (
        pathname.startsWith('/api/admin') &&
        !pathname.startsWith('/api/admin/auth')
    ) {
        const authCookie = request.cookies.get(COOKIE_NAME);

        if (!authCookie?.value) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Authentication required.',
                },
                { status: 401 }
            );
        }

        try {
            const decoded = jwt.verify(
                authCookie.value,
                JWT_SECRET
            );

            if (
                !decoded ||
                typeof decoded !== 'object' ||
                !decoded.sub ||
                !decoded.email ||
                decoded.type !== 'admin'
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Authentication required.',
                    },
                    { status: 401 }
                );
            }

        } catch (error) {
            console.error('JWT verification failed:', error);

            return NextResponse.json(
                {
                    success: false,
                    message: 'Authentication required.',
                },
                { status: 401 }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/admin/:path*'],
};