import { createOrder } from "../../order";

import { DELIVERY_METHODS } from "../../order/delivery_methods";


// {

//     customer_id: null,

//     customer_email: "test@example.com",

//     currency: "USD",

//     billing_first_name: "John",
//     billing_last_name: "Doe",
//     billing_address1: "123 Main Street",
//     billing_city: "New York",
//     billing_state: "NY",
//     billing_postcode: "10001",
//     billing_country: "US",

//     shipping_first_name: "John",
//     shipping_last_name: "Doe",
//     shipping_address1: "123 Main Street",
//     shipping_city: "New York",
//     shipping_state: "NY",
//     shipping_postcode: "10001",
//     shipping_country: "US",

//     delivery_method: "ship_to_local_installer",

//     appointment_booking_date: "2026-08-21",

//     appointment_booking_time_range: "Morning",

//     delivery_location_id: "74216",

//     coupon_code: "SAVE20",

//     items: [

//         {
//             tire_inventory_id: 5,
//             quantity: 2,
//             selected_vehicle:
//                 "2021 BMW M340i xDrive"
//         },

//         {
//             tire_inventory_id: 9,
//             quantity: 1,
//             selected_vehicle: null
//         }

//     ]

// }


function requireField(value, fieldName) {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {

        throw new Error(
            `${fieldName} is required.`
        );

    }

}


function validateAddress(data, prefix) {

    requireField(
        data[`${prefix}_first_name`],
        `${prefix}_first_name`
    );

    requireField(
        data[`${prefix}_last_name`],
        `${prefix}_last_name`
    );

    requireField(
        data[`${prefix}_address1`],
        `${prefix}_address1`
    );

    requireField(
        data[`${prefix}_city`],
        `${prefix}_city`
    );

    requireField(
        data[`${prefix}_state`],
        `${prefix}_state`
    );

    requireField(
        data[`${prefix}_postcode`],
        `${prefix}_postcode`
    );

    requireField(
        data[`${prefix}_country`],
        `${prefix}_country`
    );

}


function validateAppointmentDate(value) {

    requireField(
        value,
        "appointment_booking_date"
    );


    const dateRegex =
        /^\d{4}-\d{2}-\d{2}$/;


    if (!dateRegex.test(value)) {

        throw new Error(
            "appointment_booking_date must be in YYYY-MM-DD format."
        );

    }


    const [
        year,
        month,
        day
    ] = value
        .split("-")
        .map(Number);


    const date = new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    );


    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {

        throw new Error(
            "Invalid appointment booking date."
        );

    }

}


function validateOrderItems(items) {

    // ============================================================
    // ITEMS MUST BE AN ARRAY
    // ============================================================

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        throw new Error(
            "Order must contain at least one item."
        );

    }


    // ============================================================
    // VALIDATE EVERY ITEM
    // ============================================================

    for (
        const [
            index,
            item
        ] of items.entries()
    ) {


        // ========================================================
        // ITEM MUST BE AN OBJECT
        // ========================================================

        if (
            !item ||
            typeof item !== "object" ||
            Array.isArray(item)
        ) {

            throw new Error(
                `Invalid order item at index ${index}.`
            );

        }


        // ========================================================
        // TIRE INVENTORY ID
        // ========================================================

        requireField(
            item.tire_inventory_id,
            `items[${index}].tire_inventory_id`
        );


        // ========================================================
        // TIRE INVENTORY ID MUST BE POSITIVE INTEGER
        // ========================================================

        if (
            !Number.isInteger(
                Number(item.tire_inventory_id)
            ) ||
            Number(item.tire_inventory_id) <= 0
        ) {

            throw new Error(
                `items[${index}].tire_inventory_id must be a positive integer.`
            );

        }


        // ========================================================
        // QUANTITY REQUIRED
        // ========================================================

        if (
            item.quantity === null ||
            item.quantity === undefined
        ) {

            throw new Error(
                `items[${index}].quantity is required.`
            );

        }


        // ========================================================
        // QUANTITY MUST BE POSITIVE INTEGER
        // ========================================================

        if (
            !Number.isInteger(item.quantity) ||
            item.quantity <= 0
        ) {

            throw new Error(
                `items[${index}].quantity must be a positive integer.`
            );

        }

    }

}


function validateOrderData(data) {

    const {

        customer_email,

        delivery_method,

        delivery_location_id,

        appointment_booking_date,

        appointment_booking_time_range,

        items

    } = data;


    // ============================================================
    // CUSTOMER EMAIL
    // ============================================================

    requireField(
        customer_email,
        "customer_email"
    );


    // ============================================================
    // DELIVERY METHOD
    // ============================================================

    if (
        !DELIVERY_METHODS.includes(
            delivery_method?.trim()
        )
    ) {

        throw new Error(
            `Invalid delivery method. Supported values: ${DELIVERY_METHODS.join(", ")}`
        );

    }


    // ============================================================
    // BILLING ADDRESS
    //
    // Required for ALL delivery methods.
    // ============================================================

    validateAddress(
        data,
        "billing"
    );


    // ============================================================
    // CUSTOMER SHIPPING ADDRESS
    //
    // Required for:
    //
    // ship_to_customer
    // ship_to_mobile_installer
    // ============================================================

    if (
        delivery_method === "ship_to_customer" ||
        delivery_method === "ship_to_mobile_installer"
    ) {

        validateAddress(
            data,
            "shipping"
        );

    }


    // ============================================================
    // DELIVERY LOCATION
    //
    // Required for:
    //
    // ship_to_local_installer
    // ship_to_mobile_installer
    // ship_to_fedex_pickup
    // ============================================================

    if (
        delivery_method === "ship_to_local_installer" ||
        delivery_method === "ship_to_mobile_installer" ||
        delivery_method === "ship_to_fedex_pickup"
    ) {

        requireField(
            delivery_location_id,
            "delivery_location_id"
        );

    }


    // ============================================================
    // APPOINTMENT
    //
    // Required for:
    //
    // ship_to_local_installer
    // ship_to_mobile_installer
    // ============================================================

    if (
        delivery_method === "ship_to_local_installer" ||
        delivery_method === "ship_to_mobile_installer"
    ) {

        validateAppointmentDate(
            appointment_booking_date
        );


        requireField(
            appointment_booking_time_range,
            "appointment_booking_time_range"
        );

    }


    // ============================================================
    // ORDER ITEMS
    // ============================================================

    validateOrderItems(
        items
    );

}


export async function createOrderForWhopSession(data) {

    // ============================================================
    // VALIDATE ORDER DATA
    // ============================================================

    validateOrderData(
        data
    );


    // ============================================================
    // CREATE ORDER
    // ============================================================

    const order =
        await createOrder(
            data
        );


    return order;

}