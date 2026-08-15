
import mysql from "mysql2/promise";
import { MYSQL_CONFIG } from "../setup-database/mysql-db/utils";
import { DELIVERY_METHODS } from "./delivery_methods";

/**
 * Create Order
 *
 * Creates:
 *  - orders
 *  - order_items
 *
 * Does NOT:
 *  - create payment record
 *  - process payment
 *  - decrement inventory
 *
 * Payment will be handled by Whop and the Whop webhook.
 *
 * @param {Object} data
 *
 * @returns {Promise<Object>}
 */
export async function createOrder(data) {

    const connection = await mysql.createConnection(
        MYSQL_CONFIG
    );

    try {
        // 

        // ============================================================
        // START TRANSACTION
        // ============================================================

        await connection.beginTransaction();

        
        // ============================================================
        // GET ORDER DATA
        // ============================================================

        const {

            customer_id = null,

            customer_email,

            currency = "USD",


            // --------------------------------------------------------
            // BILLING ADDRESS
            // --------------------------------------------------------

            billing_first_name = null,

            billing_last_name = null,

            billing_company = null,

            billing_address1 = null,

            billing_address2 = null,

            billing_city = null,

            billing_state = null,

            billing_postcode = null,

            billing_country = null,


            // --------------------------------------------------------
            // SHIPPING ADDRESS
            // --------------------------------------------------------

            shipping_first_name = null,

            shipping_last_name = null,

            shipping_company = null,

            shipping_address1 = null,

            shipping_address2 = null,

            shipping_city = null,

            shipping_state = null,

            shipping_postcode = null,

            shipping_country = null,

            delivery_method = 'ship_to_customer',

            appointment_booking_date = null, 

            appointment_booking_time_range  = null, 

            delivery_location_id = null , 

            // --------------------------------------------------------
            // ORDER ITEMS
            // --------------------------------------------------------

            items = []

        } = data;


        if(!DELIVERY_METHODS.includes(delivery_method.trim())){
            throw new Error(
                `Delivery method is invalid. Supported values are ${DELIVERY_METHODS.join(' , ')}  `                   
            )
        }
        
        
        // ============================================================
        // BASIC VALIDATION
        // ============================================================

        if (!customer_email) {

            throw new Error(
                "Customer email is required"
            );

        }


        const email = customer_email.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            throw new Error(
                "Please provide a valid email address"
            );
        }


        if (!Array.isArray(items) || items.length === 0) {

            throw new Error(
                "Order must contain at least one item"
            );

        }


        // ============================================================
        // GENERATE ORDER NUMBER
        // ============================================================

        const orderNumber =

            `ORD-${Date.now()}-${Math.floor(
                Math.random() * 100000
            )}`;


        // ============================================================
        // PREPARE CALCULATED VALUES
        // ============================================================

        let subtotal = 0;

        let discountTotal = 0;

        let shippingTotal = 0;

        let taxTotal = 0;


        const validatedItems = [];


        // ============================================================
        // VALIDATE EVERY LINE ITEM
        // ============================================================

        for (const item of items) {

            const {

                tire_inventory_id = null,

                name = null,

                type = "product",

                selected_vehicle = null,

                quantity = 1,

                unit_price = 0,

                fet = 0,

                tax_total = 0

            } = item;


            // ========================================================
            // VALIDATE QUANTITY
            // ========================================================

            if (!Number.isInteger(quantity) || quantity <= 0) {

                throw new Error(
                    `Invalid quantity for item: ${name || type}`
                );

            }

            // ========================================================
            // PRODUCT LINE ITEM
            // ========================================================

            if (type === "product") {

                // ----------------------------------------------------
                // Product must have inventory ID
                // ----------------------------------------------------

                if (!tire_inventory_id) {

                    throw new Error(
                        "Product line item requires tire_inventory_id"
                    );

                }
                
                

                // ----------------------------------------------------
                // Get current inventory
                //
                // FOR UPDATE locks this inventory row until the
                // transaction commits or rolls back.
                // ----------------------------------------------------

                const [inventoryRows] = await connection.execute(

                    `

                    SELECT

                        id,

                        manufacturer,

                        item,

                        price,

                        fet,

                        quantity,

                        status

                    FROM tire_inventory

                    WHERE id = ?

                    FOR UPDATE

                    `,

                    [
                        tire_inventory_id
                    ]

                );

                // ----------------------------------------------------
                // Product not found
                // ----------------------------------------------------

                if (inventoryRows.length === 0) {

                    throw new Error(

                        `Product not found: ${tire_inventory_id}`

                    );

                }


                const inventory = inventoryRows[0];


                // ----------------------------------------------------
                // Product must be active
                // ----------------------------------------------------

                if (inventory.status !== "active") {

                    throw new Error(

                        `Product is not available: ${tire_inventory_id}`

                    );

                }


                // ----------------------------------------------------
                // Validate inventory quantity
                // ----------------------------------------------------

                if (inventory.quantity < quantity) {

                    throw new Error(

                        `Insufficient inventory for product ${tire_inventory_id}. ` +

                        `Available: ${inventory.quantity}, ` +

                        `Requested: ${quantity}`

                    );

                }


                // ----------------------------------------------------
                // IMPORTANT:
                //
                // Use the database price.
                //
                // Never trust the price sent from frontend.
                // ----------------------------------------------------

                const productPrice =

                    Number(inventory.price);


                const productFet =

                    Number(inventory.fet);

                // ----------------------------------------------------
                // Product subtotal
                // ----------------------------------------------------

                const itemSubtotal =

                    productPrice * quantity;
                

                // ----------------------------------------------------
                // FET
                //
                // Current assumption:
                // FET is stored per unit in tire_inventory.
                // ----------------------------------------------------

                const itemFet =

                    productFet * quantity;


                // ----------------------------------------------------
                // Tax
                //
                // For now, tax_total is supplied by the caller.
                //
                // In production, this should be calculated by your
                // server-side tax logic.
                // ----------------------------------------------------

                const itemTaxTotal =

                    Number(tax_total);


                // ----------------------------------------------------
                // Final product line total
                // ----------------------------------------------------

                const itemTotal =

                    itemSubtotal +

                    itemFet +

                    itemTaxTotal;


                // ----------------------------------------------------
                // Add to order totals
                // ----------------------------------------------------

                subtotal += itemSubtotal;

                taxTotal += itemTaxTotal;


                // ----------------------------------------------------
                // Save validated item
                // ----------------------------------------------------

                validatedItems.push({

                    tire_inventory_id:
                        inventory.id,

                    name:

                        `${inventory.manufacturer} ${inventory.item}`,

                    type: "product",

                    selected_vehicle:
                        selected_vehicle || null,

                    quantity,

                    unit_price:
                        productPrice,

                    fet:
                        productFet,

                    subtotal:
                        itemSubtotal,

                    tax_total:
                        itemTaxTotal,

                    total:
                        itemTotal

                });


            }


            // ========================================================
            // NON-PRODUCT LINE ITEM
            //
            // Examples:
            //
            // shipping
            // fee
            // discount
            // surcharge
            // credit
            // other
            // ========================================================

            else {


                if (!name) {

                    throw new Error(

                        `Name is required for ${type} line item`

                    );

                }


                const itemUnitPrice =

                    Number(unit_price);


                const itemSubtotal =

                    itemUnitPrice * quantity;


                const itemFet =

                    Number(fet);


                const itemTaxTotal =

                    Number(tax_total);


                let itemTotal =

                    itemSubtotal +

                    itemFet +

                    itemTaxTotal;


                // ----------------------------------------------------
                // Discounts and credits are negative amounts
                // ----------------------------------------------------

                if (

                    type === "discount" ||

                    type === "credit"

                ) {

                    itemTotal =

                        -Math.abs(itemTotal);

                }


                // ----------------------------------------------------
                // Order totals
                // ----------------------------------------------------

                if (type === "shipping") {

                    shippingTotal +=

                        Math.abs(itemSubtotal);

                }


                if (type === "discount") {

                    discountTotal +=

                        Math.abs(itemSubtotal);

                }


                if (

                    type !== "discount" &&

                    type !== "credit"

                ) {

                    subtotal += itemSubtotal;

                }


                taxTotal += itemTaxTotal;


                // ----------------------------------------------------
                // Save non-product item
                // ----------------------------------------------------

                validatedItems.push({

                    tire_inventory_id: null,

                    name,

                    type,

                    selected_vehicle: null,

                    quantity,

                    unit_price:
                        itemUnitPrice,

                    fet:
                        itemFet,

                    subtotal:
                        itemSubtotal,

                    tax_total:
                        itemTaxTotal,

                    total:
                        itemTotal

                });

            }

        }


        // ============================================================
        // CALCULATE GRAND TOTAL
        // ============================================================

        const grandTotal =

            subtotal +

            shippingTotal +

            taxTotal -

            discountTotal;


        // ============================================================
        // VALIDATE GRAND TOTAL
        // ============================================================

        if (grandTotal < 0) {

            throw new Error(
                "Order total cannot be negative"
            );

        }


        // ============================================================
        // CREATE ORDER
        // ============================================================

        const [orderResult] = await connection.execute(

            `

            INSERT INTO orders (

               

                order_number,

                customer_id,

                customer_email,

                status,

                payment_status,

                fulfillment_status,

                currency,


                subtotal,

                discount_total,

                shipping_total,

                tax_total,

                grand_total,


                billing_first_name,

                billing_last_name,

                billing_company,

                billing_address1,

                billing_address2,

                billing_city,

                billing_state,

                billing_postcode,

                billing_country,


                shipping_first_name,

                shipping_last_name,

                shipping_company,

                shipping_address1,

                shipping_address2,

                shipping_city,

                shipping_state,

                shipping_postcode,

                shipping_country,

                delivery_method, 
                
                delivery_location_id,

                appointment_booking_date,

                appointment_booking_time_range

            )

            VALUES (

                ?, ?, ?, ?, ?, ?, ?,

                ?, ?, ?, ?, ?,

                ?, ?, ?, ?, ?, ?, ?, ?, ?,

                ?, ?, ?, ?, ?, ?, ?, ?, ?, 

                ?, ?,

                ?, ?


            )

            `,

            [

                orderNumber,

                customer_id,

                customer_email,

                "pending",

                "pending",

                "unfulfilled",

                currency,


                subtotal,

                discountTotal,

                shippingTotal,

                taxTotal,

                grandTotal,


                billing_first_name,

                billing_last_name,

                billing_company,

                billing_address1,

                billing_address2,

                billing_city,

                billing_state,

                billing_postcode,

                billing_country,


                shipping_first_name,

                shipping_last_name,

                shipping_company,

                shipping_address1,

                shipping_address2,

                shipping_city,

                shipping_state,

                shipping_postcode,

                shipping_country,

                delivery_method, delivery_location_id,

                appointment_booking_date, appointment_booking_time_range

            ]

        );


        const orderId =

            orderResult.insertId;


        // ============================================================
        // CREATE ORDER ITEMS
        // ============================================================

        const createdItems = [];


        for (const item of validatedItems) {


            const [itemResult] = await connection.execute(

                `

                INSERT INTO order_items (

                    order_id,

                    tire_inventory_id,

                    name,

                    type,

                    selected_vehicle,

                    quantity,

                    unit_price,

                    fet,

                    subtotal,

                    tax_total,

                    total

                )

                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

                `,

                [

                    orderId,

                    item.tire_inventory_id,

                    item.name,

                    item.type,

                    item.selected_vehicle,

                    item.quantity,

                    item.unit_price,

                    item.fet,

                    item.subtotal,

                    item.tax_total,

                    item.total

                ]

            );


            createdItems.push({

                id:

                    itemResult.insertId,

                ...item

            });

        }


        // ============================================================
        // COMMIT TRANSACTION
        //
        // At this point:
        //
        // orders exists
        // order_items exist
        //
        // No payment record is created yet.
        //
        // ============================================================

        await connection.commit();


        // ============================================================
        // RETURN
        // ============================================================

        return {

            success: true,

            orderId,

            orderNumber,

            currency,

            totals: {

                subtotal,

                discount_total:
                    discountTotal,

                shipping_total:
                    shippingTotal,

                tax_total:
                    taxTotal,

                grand_total:
                    grandTotal

            },

            items:
                createdItems

        };


    } catch (error) {


        // ============================================================
        // ROLLBACK
        // ============================================================

        await connection.rollback();

        console.error(
            "Create order failed:",
            error
        );

        throw error;


    } finally {

        await connection.end();

    }

}