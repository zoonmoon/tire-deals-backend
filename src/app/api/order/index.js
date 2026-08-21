
import mysql from "mysql2/promise";
import { MYSQL_CONFIG } from "../setup-database/mysql-db/utils";
import { DELIVERY_METHODS } from "./delivery_methods";
import { validateCoupon } from "./verify-coupon-code";
import { getInstaller } from "../storefront/local-installers/[installer_id]";

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

            coupon_code = null, 

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
        // INSTALLER
        // ============================================================




        // ============================================================
        // PREPARE CALCULATED VALUES
        // ============================================================

        let subtotal = 0;

        let discountTotal = 0;

        let shippingTotal = 0;

        let taxTotal = 0;
        

        let selectedInstaller = null 

        const validatedItems = [];


        // ============================================================
        // NORMALIZE + VALIDATE ITEMS
        // ============================================================

        const normalizedItems = items.map(item => ({

            ...item,

            type: item.type || "product"

        }));


        // ============================================================
        // COLLECT PRODUCT INVENTORY IDS
        // ============================================================


        const inventoryIds = normalizedItems
            .filter(
                item =>
                    item.type === "product" &&
                    item.tire_inventory_id
            )
            .map(
                item => item.tire_inventory_id
            );


        if (inventoryIds.length === 0) {

            throw new Error(
                "Order must contain at least one product."
            );

        }


        // ============================================================
        // FETCH ALL INVENTORY AT ONCE
        // ============================================================

        const uniqueInventoryIds = [
            ...new Set(inventoryIds)
        ];

        
        const placeholders = uniqueInventoryIds
            .map(() => "?")
            .join(",");


        const [inventoryRows] =
            await connection.execute(

                `
                SELECT
                    id,
                    manufacturer,
                    item,
                    price,
                    size,
                    fet,
                    quantity,
                    status
                FROM tire_inventory
                WHERE id IN (${placeholders})
                FOR UPDATE
                `,

                uniqueInventoryIds

            );


        // ============================================================
        // CREATE INVENTORY MAP
        // ============================================================

        const inventoryMap = new Map(
            inventoryRows.map(inventory => [
                Number(inventory.id),
                inventory
            ])
        );


        // ============================================================
        // VALIDATE EVERY LINE ITEM
        // ============================================================

        for (const item of normalizedItems) {

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

            if (
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {

                throw new Error(
                    `Invalid quantity for item: ${name || type}`
                );

            }


            // ========================================================
            // PRODUCT
            // ========================================================

            if (type === "product") {

                if (!tire_inventory_id) {

                    throw new Error(
                        "Product line item requires tire_inventory_id"
                    );

                }


                // ====================================================
                // GET INVENTORY FROM MAP
                // ====================================================

                const inventory =
                    inventoryMap.get(
                        Number(tire_inventory_id)
                    );


                if (!inventory) {

                    throw new Error(
                        `Product not found: ${tire_inventory_id}`
                    );

                }


                if (inventory.status !== "active") {

                    throw new Error(
                        `Product is not available: ${tire_inventory_id}`
                    );

                }


                if (
                    Number(inventory.quantity) <
                    Number(quantity)
                ) {

                    throw new Error(

                        `Insufficient inventory for product ${tire_inventory_id}. ` +
                        `Available: ${inventory.quantity}, ` +
                        `Requested: ${quantity}`

                    );

                }


                // ====================================================
                // USE DATABASE VALUES
                // ====================================================

                const productPrice =
                    Number(inventory.price);

                const productFet =
                    Number(inventory.fet);


                const itemSubtotal =
                    productPrice * quantity;

                const itemFet =
                    productFet * quantity;

                const itemTaxTotal =
                    Number(tax_total);

                const itemTotal =
                    itemSubtotal +
                    itemFet +
                    itemTaxTotal;


                subtotal += itemSubtotal;

                taxTotal += itemTaxTotal;


                // ====================================================
                // ADD VALIDATED ITEM
                // ====================================================

                validatedItems.push({

                    tire_inventory_id:
                        inventory.id,

                    name:
                        `${inventory.manufacturer} ${inventory.size} - ${inventory.item}`,

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

        }


        const hasProduct = validatedItems.some(
            item => item.type === "product"
        );

        if (!hasProduct) {
            throw new Error(
                "Order must contain at least one product."
            );
        }


        if (
            delivery_method === "ship_to_local_installer" ||
            delivery_method === "ship_to_mobile_installer"
        ) {

            if (!delivery_location_id) {

                throw new Error(
                    "Installer is required for this delivery method."
                );

            }


            const installer =
                await getInstaller(
                    delivery_location_id
                );


            if (!installer) {

                throw new Error(
                    "Selected installer was not found."
                );

            }

            selectedInstaller = installer

            // ============================================================
            // TOTAL TIRES
            // ============================================================

            const totalTires =
                validatedItems
                .filter(item => item.type === "product" && item.tire_inventory_id !== null)
                .reduce(
                    (total, item) =>
                        total +
                        Number(item.quantity || 0),
                    0
                );


            if (
                !Number.isInteger(totalTires) ||
                totalTires < 1
            ) {

                throw new Error(
                    "At least one tire is required for installation."
                );

            }


            // ============================================================
            // INSTALLATION PRICE
            //
            // Stored in cents PER TIRE.
            //
            // Example:
            // 1500 cents = $15.00 / tire
            // 3 tires    = $45.00
            // ============================================================

            const installationPricePerTireInCents =
                Number(
                    installer.installation_price || 0
                );


            if (
                !Number.isFinite(
                    installationPricePerTireInCents
                ) ||
                installationPricePerTireInCents < 0
            ) {

                throw new Error(
                    "Invalid installation price."
                );

            }


            const installationPricePerTire =
                installationPricePerTireInCents /
                100;


            const installationTotal =
                installationPricePerTire *
                totalTires;


            // ============================================================
            // INSTALLATION LINE ITEM
            // ============================================================

            const installationItem = {

                tire_inventory_id:
                    null,

                name:
                    "Installation Fee",

                type:
                    "installation_fee",

                selected_vehicle:
                    null,

                quantity:
                    totalTires,

                unit_price:
                    installationPricePerTire,

                fet:
                    0,

                subtotal:
                    installationTotal,

                tax_total:
                    0,

                total:
                    installationTotal,

            };


            validatedItems.push(
                installationItem
            );


            subtotal +=
                installationTotal;

        }


        // ============================================================
        // VALIDATE COUPON
        // ============================================================

        if (coupon_code) {

            const couponResult =
                await validateCoupon(
                    connection,
                    coupon_code,
                    subtotal
                );

            

            if (!couponResult.valid) {

                // throw new Error(
                //     couponResult.message
                // );

            }else{

                // ========================================================
                // APPLY COUPON DISCOUNT
                // ========================================================

                discountTotal +=
                    couponResult.coupon.discount_amount;

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

                appointment_booking_time_range,

                coupon_code

            )

            VALUES (

                ?, ?, ?, ?, ?, ?, ?,

                ?, ?, ?, ?, ?,

                ?, ?, ?, ?, ?, ?, ?, ?, ?,

                ?, ?, ?, ?, ?, ?, ?, ?, ?, 

                ?, ?,

                ?, ?,

                ?


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

                appointment_booking_date, appointment_booking_time_range,

                coupon_code

            ]

        );


        const orderId =

            orderResult.insertId;


        // ============================================================
        // CREATE ORDER ITEMS
        // ============================================================



        // ============================================================
        // CREATE ORDER ITEMS
        // ============================================================

        const values = validatedItems.flatMap(item => [

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

        ]);


        const placeholders2 = validatedItems
            .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .join(", ");


        await connection.execute(

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

            VALUES ${placeholders2}

            `,

            values

        );


        // ============================================================
        // FETCH CREATED ORDER ITEMS
        // ============================================================

        const [createdItems] = await connection.execute(

            `

            SELECT

                id,

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

            FROM order_items

            WHERE order_id = ?

            ORDER BY id ASC

            `,

            [orderId]

        );



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

            selectedInstaller,

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