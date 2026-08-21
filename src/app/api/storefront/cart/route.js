import { NextResponse } from "next/server";

import openSearchClient from "@/app/api/setup-database/_lib/route";

import mysql from "mysql2/promise";

import {
    MYSQL_CONFIG
} from "../../setup-database/mysql-db/utils";

import {
    getAuthenticatedCustomer
} from "../../auth/utils/manage-cookie";

import {
    getCartId
} from "./cart_cookie";


// ============================================================
// CONFIGURATION
// ============================================================

const INDEX_NAME =
    "carts";


// ============================================================
// GET TIRE INVENTORIES
//
// Fetches ALL tire inventories in ONE MySQL query.
//
// Example:
//
// ids = [1001, 1002, 1003]
//
// Query:
//
// WHERE id IN (?, ?, ?)
// ============================================================

async function getTireInventories(
    tireInventoryIds
) {

    if (
        !Array.isArray(tireInventoryIds) ||
        tireInventoryIds.length === 0
    ) {

        return new Map();

    }


    // ========================================================
    // NORMALIZE IDS
    // ========================================================

    const ids = [

        ...new Set(

            tireInventoryIds.map(

                id =>
                    String(id)

            )

        )

    ];


    // ========================================================
    // MYSQL CONNECTION
    // ========================================================

    const connection =
        await mysql.createConnection(
            MYSQL_CONFIG
        );


    try {

        // ====================================================
        // PLACEHOLDERS
        // ====================================================

        const placeholders =
            ids
                .map(
                    () => "?"
                )
                .join(", ");


        // ====================================================
        // FETCH ALL INVENTORIES
        // ====================================================

        const [rows] =
            await connection.execute(

                `
                SELECT
                    id,
                    quantity,
                    status
                FROM tire_inventory
                WHERE id IN (${placeholders})
                `,

                ids

            );


        // ====================================================
        // CREATE LOOKUP MAP
        // ====================================================

        return new Map(

            rows.map(

                inventory => [

                    String(
                        inventory.id
                    ),

                    inventory

                ]

            )

        );

    } finally {

        await connection.end();

    }

}


// ============================================================
// POST
//
// Frontend sends:
//
// {
//     items: [
//
//         {
//             tire_inventory_id,
//             quantity
//         }
//
//     ]
// }
//
// This route:
//
// 1. Validates item structure
// 2. Fetches ALL inventories with one IN query
// 3. Validates every inventory
// 4. Returns ALL validation errors if any exist
// 5. Saves the complete cart to OpenSearch
//
// Delivery information is NOT handled here.
// ============================================================

export async function POST(
    request
) {

    try {

        // ========================================================
        // REQUEST BODY
        // ========================================================

        const body =
            await request.json();


        const {
            items
        } = body;


        // ========================================================
        // CART ID
        // ========================================================

        const cartId =
            await getCartId();


        // ========================================================
        // AUTHENTICATED CUSTOMER
        // ========================================================

        const customer =
            await getAuthenticatedCustomer();


        const customerId =
            customer?.id ??
            null;


        // ========================================================
        // VALIDATE ITEMS ARRAY
        // ========================================================

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return NextResponse.json(

                {

                    success: false,

                    code:
                        "CART_EMPTY",

                    message:
                        "Cart must contain at least one item."

                },

                {
                    status: 400
                }

            );

        }


        // ========================================================
        // NORMALIZE + VALIDATE ITEM STRUCTURE
        // ========================================================

        const normalizedItems =
            [];

        const structureErrors =
            [];


        for (
            const item
            of items
        ) {

            // ====================================================
            // INVALID ITEM
            // ====================================================

            if (!item) {

                structureErrors.push({

                    code:
                        "INVALID_CART_ITEM",

                    message:
                        "Cart contains an invalid item."

                });

                continue;

            }


            // ====================================================
            // TIRE INVENTORY ID
            // ====================================================

            if (
                item.tire_inventory_id === null ||
                item.tire_inventory_id === undefined ||
                item.tire_inventory_id === ""
            ) {

                structureErrors.push({

                    code:
                        "TIRE_INVENTORY_ID_REQUIRED",

                    message:
                        "Every cart item must contain tire_inventory_id."

                });

                continue;

            }


            // ====================================================
            // QUANTITY
            // ====================================================

            if (
                !Number.isInteger(
                    item.quantity
                ) ||
                item.quantity <= 0
            ) {

                structureErrors.push({

                    code:
                        "INVALID_QUANTITY",

                    tire_inventory_id:
                        String(
                            item.tire_inventory_id
                        ),

                    requested_quantity:
                        item.quantity,

                    message:
                        `Invalid quantity for tire inventory ${item.tire_inventory_id}.`

                });

                continue;

            }


            // ====================================================
            // NORMALIZED ITEM
            // ====================================================

            normalizedItems.push({

                tire_inventory_id:
                    String(
                        item.tire_inventory_id
                    ),

                quantity:
                    item.quantity

            });

        }


        // ========================================================
        // RETURN STRUCTURE ERRORS
        // ========================================================

        if (
            structureErrors.length > 0
        ) {

            return NextResponse.json(

                {

                    success: false,

                    code:
                        "CART_VALIDATION_FAILED",

                    message:
                        "One or more cart items are invalid.",

                    errors:
                        structureErrors

                },

                {
                    status: 400
                }

            );

        }


        // ========================================================
        // CHECK DUPLICATE INVENTORY IDs
        // ========================================================

        const inventoryIds =
            normalizedItems.map(

                item =>
                    item.tire_inventory_id

            );


        const uniqueInventoryIds =
            new Set(
                inventoryIds
            );


        if (
            uniqueInventoryIds.size !==
            inventoryIds.length
        ) {

            const duplicateIds =
                inventoryIds.filter(

                    (
                        id,
                        index,
                        array
                    ) =>
                        array.indexOf(id) !==
                        index

                );


            return NextResponse.json(

                {

                    success: false,

                    code:
                        "DUPLICATE_CART_ITEMS",

                    message:
                        "Cart contains duplicate tire inventory items.",

                    errors:
                        [

                            ...new Set(
                                duplicateIds
                            )

                        ].map(

                            tireInventoryId => ({

                                code:
                                    "DUPLICATE_TIRE_INVENTORY_ID",

                                tire_inventory_id:
                                    tireInventoryId,

                                message:
                                    `Tire inventory ${tireInventoryId} appears more than once in the cart.`

                            })

                        )

                },

                {
                    status: 400
                }

            );

        }


        // ========================================================
        // FETCH ALL INVENTORIES
        //
        // ONE MYSQL QUERY.
        // ========================================================

        const inventories =
            await getTireInventories(
                inventoryIds
            );


        // ========================================================
        // VALIDATION ERRORS
        // ========================================================

        const inventoryErrors =
            [];


        // ========================================================
        // VALIDATE EVERY ITEM
        // ========================================================

        for (
            const item
            of normalizedItems
        ) {

            const inventory =
                inventories.get(

                    item.tire_inventory_id

                );


            // ====================================================
            // INVENTORY DOES NOT EXIST
            // ====================================================

            if (!inventory) {

                inventoryErrors.push({

                    code:
                        "INVENTORY_NOT_FOUND",

                    tire_inventory_id:
                        item.tire_inventory_id,

                    requested_quantity:
                        item.quantity,

                    message:
                        `Tire inventory ${item.tire_inventory_id} was not found.`

                });

                continue;

            }


            // ====================================================
            // INVENTORY STATUS
            // ====================================================

            if (
                inventory.status !== "active"
            ) {

                inventoryErrors.push({

                    code:
                        "INVENTORY_UNAVAILABLE",

                    tire_inventory_id:
                        item.tire_inventory_id,

                    requested_quantity:
                        item.quantity,

                    status:
                        inventory.status,

                    message:
                        `Tire inventory ${item.tire_inventory_id} is not available.`

                });

                continue;

            }


            // ====================================================
            // INVENTORY QUANTITY
            // ====================================================

            const availableQuantity =
                Number(
                    inventory.quantity
                );


            const requestedQuantity =
                Number(
                    item.quantity
                );


            if (
                availableQuantity <
                requestedQuantity
            ) {

                inventoryErrors.push({

                    code:
                        "INSUFFICIENT_INVENTORY",

                    tire_inventory_id:
                        item.tire_inventory_id,

                    requested_quantity:
                        requestedQuantity,

                    available_quantity:
                        availableQuantity,

                    message:
                        `Insufficient inventory for tire ${item.tire_inventory_id}.`

                });

            }

        }


        // ========================================================
        // RETURN ALL INVENTORY ERRORS
        // ========================================================

        if (
            inventoryErrors.length > 0
        ) {

            return NextResponse.json(

                {

                    success: false,

                    code:
                        "CART_VALIDATION_FAILED",

                    message:
                        "One or more cart items are unavailable.",

                    errors:
                        inventoryErrors

                },

                {
                    status: 400
                }

            );

        }


        // ========================================================
        // BUILD CART
        // ========================================================

        const cart = {

            cart_id:
                cartId,

            items:
                normalizedItems,

            updated_at:
                new Date().toISOString()

        };


        // ========================================================
        // CUSTOMER
        //
        // Only add customer_id when authenticated.
        // ========================================================

        if (
            customerId !== null &&
            customerId !== undefined
        ) {

            cart.customer_id =
                customerId;

        }


        // ========================================================
        // SAVE CART
        //
        // cartId is the OpenSearch document ID.
        //
        // Doesn't exist:
        //     creates it.
        //
        // Exists:
        //     replaces it.
        //
        // No GET required.
        // ========================================================

        await openSearchClient.index({

            index:
                INDEX_NAME,

            id:
                cartId,

            body:
                cart,

            refresh:
                true

        });


        // ========================================================
        // RESPONSE
        // ========================================================

        return NextResponse.json({

            success: true,

            cart

        });


    } catch (error) {

        console.error(
            "Failed to update cart:",
            error
        );

        
        return NextResponse.json(

            {

                success: false,

                message:
                    error.message ||
                    "Failed to update cart."

            },

            {
                status: 500
            }

        );

    }

}