
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// ============================================================
// CONFIGURATION
// ============================================================

const COOKIE_NAME = 'customer_account_cookie';

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
// CREATE AUTH COOKIE
//
// Creates a stateless JWT and stores it in:
//
// customer_account_cookie
//
// The JWT does NOT expire.
//
// Payload:
// {
//     sub: customer ID,
//     email: customer email,
//     type: customer
// }
//
// ============================================================

export async function createAuthCookie(customer) {

    if (!customer?.id || !customer?.email) {
        throw new Error(
            'Customer ID and email are required to create auth cookie.'
        );
    }


    // ========================================================
    // JWT PAYLOAD
    // ========================================================

    const payload = {

        // Standard JWT subject claim
        sub: String(customer.id),

        email: customer.email,

        type: 'customer'

    };


    // ========================================================
    // CREATE JWT
    //
    // IMPORTANT:
    // No "expiresIn" is provided.
    //
    // Therefore the JWT itself does not expire.
    // ========================================================

    const token = jwt.sign(
        payload,
        JWT_SECRET
    );


    // ========================================================
    // SET COOKIE
    // ========================================================

    const cookieStore = await cookies();

    cookieStore.set({

        name: COOKIE_NAME,

        value: token,

        // Long-lived browser cookie.
        // The JWT itself has no expiration.
        maxAge: 60 * 60 * 24 * 365 * 10,

        httpOnly: true,

        secure: process.env.NODE_ENV === 'production',

        sameSite: 'lax',

        path: '/'

    });


    return token;
}


// ============================================================
// VERIFY AUTH COOKIE
//
// Returns the authenticated customer information from the JWT.
//
// Returns:
//
// {
//     authenticated: true,
//     customer: {
//         id,
//         email,
//         type
//     }
// }
//
// OR:
//
// {
//     authenticated: false,
//     customer: null
// }
//
// ============================================================

export async function verifyAuthCookie() {

    try {

        const cookieStore = await cookies();

        const authCookie = cookieStore.get(
            COOKIE_NAME
        );


        if (!authCookie?.value) {

            return {

                authenticated: false,

                customer: null

            };

        }


        // ====================================================
        // VERIFY JWT
        // ====================================================

        const decoded = jwt.verify(
            authCookie.value,
            JWT_SECRET
        );


        // ====================================================
        // VALIDATE PAYLOAD
        // ====================================================

        if (
            !decoded ||
            typeof decoded !== 'object' ||
            !decoded.sub ||
            !decoded.email ||
            decoded.type !== 'customer'
        ) {

            return {

                authenticated: false,

                customer: null

            };

        }


        // ====================================================
        // RETURN CUSTOMER
        // ====================================================

        return {

            authenticated: true,

            customer: {

                id: Number(decoded.sub),

                email: decoded.email,

                type: decoded.type

            }

        };


    } catch (error) {

        console.error(
            'Auth cookie verification failed:',
            error.message
        );


        return {

            authenticated: false,

            customer: null

        };

    }

}


// ============================================================
// CLEAR AUTH COOKIE
//
// Used during logout.
// ============================================================

export async function clearAuthCookie() {

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
// GET AUTHENTICATED CUSTOMER
//
// Convenience helper.
//
// Returns:
// customer object
//
// OR:
// null
//
// ============================================================

export async function getAuthenticatedCustomer() {

    const auth = await verifyAuthCookie();


    if (!auth.authenticated) {

        return null;

    }


    return auth.customer;

}
