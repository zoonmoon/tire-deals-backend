import { cookies } from "next/headers";
import crypto from "crypto";

const CART_COOKIE_NAME = "cart_cookie_id";


// ============================================================
// GENERATE CART ID
// ============================================================

export function generateCartId() {

    return crypto
        .randomBytes(15)
        .toString("base64url")
        .slice(0, 30);

}


// ============================================================
// GET CART ID
//
// Returns existing cart ID.
//
// If one does not exist, creates a new one and stores it.
// ============================================================

export async function getCartId() {

    const cookieStore = await cookies();

    const existingCart =
        cookieStore.get(
            CART_COOKIE_NAME
        );


    if (existingCart?.value) {

        return existingCart.value;

    }


    const cartId =
        generateCartId();


    cookieStore.set({

        name:
            CART_COOKIE_NAME,

        value:
            cartId,

        maxAge:
            60 * 60 * 24 * 300,

        httpOnly:
            true,

        sameSite:
            "lax",

        path: "/"

    });

    return cartId;

}


// ============================================================
// GET EXISTING CART ID
//
// Does NOT create one.
//
// Returns null if no cart cookie exists.
// ============================================================

export async function getExistingCartId() {

    const cookieStore = await cookies();

    const cartCookie =
        cookieStore.get(
            CART_COOKIE_NAME
        );


    return cartCookie?.value || null;

}


// ============================================================
// DESTROY CART COOKIE
//
// Used after successful order creation.
// ============================================================

export async function clearCartCookie() {

    const cookieStore = await cookies();


    cookieStore.set({

        name:
            CART_COOKIE_NAME,

        value:
            "",

        maxAge:
            0,

        expires:
            new Date(0),

        httpOnly:
            true,

        sameSite:
            "lax",

        path: "/"

    });

}