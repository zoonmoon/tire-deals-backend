import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';


// ============================================================
// CONFIGURATION
// ============================================================

const COOKIE_NAME = 'admin_account_cookie';

const JWT_SECRET = process.env.JWT_SECRET;


// ============================================================
// VALIDATE SECRET
// ============================================================

if (!JWT_SECRET) {

    throw new Error(
        'JWT_SECRET environment variable is not configured.'
    );

}


// ============================================================
// CREATE ADMIN AUTH COOKIE
// ============================================================

export async function createAdminAuthCookie(admin) {

    if (!admin?.id || !admin?.email) {

        throw new Error(
            'Admin ID and email are required to create auth cookie.'
        );

    }


    const payload = {

        sub: String(admin.id),

        email: admin.email,

        type: 'admin'

    };



    const token = jwt.sign(
            payload,
            JWT_SECRET
        );


    const cookieStore = await cookies();


    cookieStore.set({

        name: COOKIE_NAME,
        
        value: token,

        maxAge: 60 * 60 * 24 * 365 * 10,

        httpOnly: true,

        secure: process.env.NODE_ENV === 'production',

        sameSite: 'lax',

        path: '/'

    });


    return token;

}


// ============================================================
// VERIFY ADMIN AUTH COOKIE
// ============================================================

export async function verifyAdminAuthCookie() {

    try {

        const cookieStore = await cookies();


        const authCookie = cookieStore.get(
            COOKIE_NAME
        );


        if (!authCookie?.value) {

            return {

                authenticated: false,

                admin: null

            };

        }


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

            return {

                authenticated: false,

                admin: null

            };

        }


        return {

            authenticated: true,

            admin: {

                id: Number(decoded.sub),

                email: decoded.email,

                type: decoded.type

            }

        };


    } catch (error) {

        console.error(
            'Admin auth cookie verification failed:',
            error.message
        );


        return {

            authenticated: false,

            admin: null

        };

    }

}


// ============================================================
// CLEAR ADMIN AUTH COOKIE
// ============================================================

export async function clearAdminAuthCookie() {

    const cookieStore = await cookies();


    cookieStore.set({

        name: COOKIE_NAME,

        value: '',

        maxAge: 0,

        expires: new Date(0),

        httpOnly: true,

        secure: process.env.NODE_ENV === 'production',

        sameSite: 'lax',

        path: '/'

    });

}


// ============================================================
// GET AUTHENTICATED ADMIN
// ============================================================

export async function getAuthenticatedAdmin() {

    const auth =
        await verifyAdminAuthCookie();


    if (!auth.authenticated) {

        return null;

    }


    return auth.admin;

}