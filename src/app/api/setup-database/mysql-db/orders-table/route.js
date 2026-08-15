import mysql from 'mysql2/promise';
import { MYSQL_CONFIG } from '../utils';

export async function GET() {

    return
    
    const connection = await mysql.createConnection(MYSQL_CONFIG);

    try {


        


        // ============================================================
        // DROP FULFILLMENT TABLES
        // ============================================================

        // Child table must be dropped first because of foreign key.
        await connection.execute(`
            DROP TABLE IF EXISTS fulfillment_items
        `);

        await connection.execute(`
            DROP TABLE IF EXISTS fulfillments
        `);




        // ============================================================
        // DROP EXISTING TABLES
        //
        // We are rebuilding the order system from scratch.
        //
        // Child tables must be dropped before parent tables because
        // of foreign key constraints.
        //
        // IMPORTANT:
        // order_adjustments is included here because it was part of
        // the previous database structure.
        //
        // ============================================================

        await connection.execute(`
            DROP TABLE IF EXISTS shipments
        `);

        await connection.execute(`
            DROP TABLE IF EXISTS refunds
        `);

        await connection.execute(`
            DROP TABLE IF EXISTS payments
        `);

        await connection.execute(`
            DROP TABLE IF EXISTS payment_events
        `);

        // Old table from previous schema

        await connection.execute(`
            DROP TABLE IF EXISTS order_adjustments
        `);

        await connection.execute(`
            DROP TABLE IF EXISTS order_items
        `);

        await connection.execute(`
            DROP TABLE IF EXISTS orders
        `);


        // ============================================================
        // ORDERS
        // ============================================================

        await connection.execute(`

            CREATE TABLE orders (

                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                order_number VARCHAR(100) NOT NULL,

                -- NULL for guest checkout
                customer_id BIGINT UNSIGNED NULL,

                -- Email used during checkout
                customer_email VARCHAR(255) NOT NULL,


                -- ship_to_customer   
                -- local_installer    
                -- mobile_installer   
                -- fedex_pickup       
                -- delivery method can take above values
                delivery_method VARCHAR(50) NOT NULL DEFAULT 'ship_to_customer',



                -- it can be installer id if customer chooses local_installer
                delivery_location_id VARCHAR(255) NULL,


                -- appointment booking date if customer chooses local_installer
                appointment_booking_date VARCHAR(500) NULL,

                -- appointment booking time range if customer chooses local_installer
                appointment_booking_time_range VARCHAR(500) NULL,

                -- ====================================================
                -- ORDER STATUS
                -- ====================================================

                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                /*
                    pending
                    processing
                    completed
                    cancelled
                */


                -- ====================================================
                -- PAYMENT STATUS
                -- ====================================================

                payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',

                /*
                    pending
                    paid
                    failed
                    partially_refunded
                    refunded
                */


                -- ====================================================
                -- FULFILLMENT STATUS
                -- ====================================================

                fulfillment_status VARCHAR(50)
                    NOT NULL DEFAULT 'unfulfilled',

                /*
                    unfulfilled
                    partially_fulfilled
                    fulfilled
                */


                currency VARCHAR(3) NOT NULL DEFAULT 'USD',


                -- ====================================================
                -- ORDER TOTALS
                --
                -- These store the final order totals at checkout.
                --
                -- The individual line items are stored in
                -- order_items.
                --
                -- These values are snapshots for quick access and
                -- historical accuracy.
                -- ====================================================

                subtotal DECIMAL(12, 2)
                    NOT NULL DEFAULT 0.00,

                discount_total DECIMAL(12, 2)
                    NOT NULL DEFAULT 0.00,

                shipping_total DECIMAL(12, 2)
                    NOT NULL DEFAULT 0.00,

                tax_total DECIMAL(12, 2)
                    NOT NULL DEFAULT 0.00,

                grand_total DECIMAL(12, 2)
                    NOT NULL DEFAULT 0.00,


                -- ====================================================
                -- BILLING ADDRESS
                --
                -- Snapshot at time of order.
                -- ====================================================

                billing_first_name VARCHAR(100) NULL,

                billing_last_name VARCHAR(100) NULL,

                billing_company VARCHAR(255) NULL,

                billing_address1 VARCHAR(255) NULL,

                billing_address2 VARCHAR(255) NULL,

                billing_city VARCHAR(100) NULL,

                billing_state VARCHAR(100) NULL,

                billing_postcode VARCHAR(30) NULL,

                billing_country VARCHAR(100) NULL,


                -- ====================================================
                -- SHIPPING ADDRESS
                --
                -- Snapshot at time of order.
                -- ====================================================

                shipping_first_name VARCHAR(100) NULL,

                shipping_last_name VARCHAR(100) NULL,

                shipping_company VARCHAR(255) NULL,

                shipping_address1 VARCHAR(255) NULL,

                shipping_address2 VARCHAR(255) NULL,

                shipping_city VARCHAR(100) NULL,

                shipping_state VARCHAR(100) NULL,

                shipping_postcode VARCHAR(30) NULL,
                
                shipping_country VARCHAR(100) NULL,


                -- ====================================================
                -- TIMESTAMPS
                -- ====================================================

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,


                admin_viewed_at TIMESTAMP NULL,

                -- ====================================================
                -- INDEXES
                -- ====================================================

                UNIQUE KEY unique_order_number (order_number),
                
                INDEX idx_customer_id (customer_id),

                INDEX idx_customer_email (customer_email),

                INDEX idx_status (status),

                INDEX idx_payment_status (payment_status),

                INDEX idx_fulfillment_status (fulfillment_status),

                INDEX idx_created_at (created_at),

                INDEX idx_admin_viewed_at (admin_viewed_at)
                
            );

        `);


        // ============================================================
        // ORDER ITEMS
        //
        // EVERYTHING CHARGED OR CREDITED ON THE ORDER
        //
        // Examples:
        //
        // product
        // shipping
        // fee
        // discount
        // surcharge
        // credit
        // other
        //
        // ============================================================

        await connection.execute(`

            CREATE TABLE order_items (

                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                order_id BIGINT UNSIGNED NOT NULL,


                -- ====================================================
                -- ORIGINAL PRODUCT
                --
                -- NULL for non-product line items.
                --
                -- Product:
                -- tire_inventory_id = 123
                --
                -- Shipping:
                -- tire_inventory_id = NULL
                --
                -- Fee:
                -- tire_inventory_id = NULL
                -- ====================================================

                tire_inventory_id BIGINT UNSIGNED NULL,


                -- ====================================================
                -- LINE ITEM NAME
                --
                -- Snapshot stored at time of purchase.
                --
                -- Examples:
                --
                -- Michelin Pilot Sport 4
                -- UPS Ground
                -- Installation Fee
                -- Summer Discount
                -- ====================================================

                name VARCHAR(500) NOT NULL,


                -- ====================================================
                -- LINE ITEM TYPE
                -- ====================================================

                type VARCHAR(50) NOT NULL DEFAULT 'product',

                /*
                    product
                    shipping
                    fee
                    discount
                    surcharge
                    credit
                    other
                */


                -- ====================================================
                -- SELECTED VEHICLE
                --
                -- Example:
                --
                -- 2012 BMW 550i GT xDrive Base |
                -- Hatchback | 4 Doors
                --
                -- NULL if no vehicle was selected.
                -- ====================================================

                selected_vehicle VARCHAR(1000) NULL,


                -- ====================================================
                -- QUANTITY
                -- ====================================================

                quantity INT UNSIGNED NOT NULL DEFAULT 1,


                -- ====================================================
                -- PRICING
                -- ====================================================

                -- Price per unit at the time of purchase

                unit_price DECIMAL(12, 2)
                    NOT NULL DEFAULT 0.00,


                -- Federal Excise Tax

                fet DECIMAL(12, 2)
                    NOT NULL DEFAULT 0.00,


                -- Quantity * unit_price

                subtotal DECIMAL(12, 2)
                    NOT NULL DEFAULT 0.00,


                -- Tax applied to this line item

                tax_total DECIMAL(12, 2)
                    NOT NULL DEFAULT 0.00,


                -- Final line item total

                total DECIMAL(12, 2)
                    NOT NULL DEFAULT 0.00,


                -- ====================================================
                -- TIMESTAMP
                -- ====================================================

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


                -- ====================================================
                -- INDEXES
                -- ====================================================

                INDEX idx_order_id (order_id),

                INDEX idx_tire_inventory_id (tire_inventory_id),

                INDEX idx_type (type),


                -- ====================================================
                -- FOREIGN KEY
                -- ====================================================

                FOREIGN KEY (order_id)

                    REFERENCES orders(id)

                    ON DELETE CASCADE,


                FOREIGN KEY (tire_inventory_id)
                    REFERENCES tire_inventory(id)
                    ON DELETE SET NULL


            );

        `);


        // ============================================================
        // PAYMENTS
        //
        // One order can have multiple payment records.
        //
        // Example:
        //
        // Payment attempt 1 -> failed
        // Payment attempt 2 -> paid
        //
        // ============================================================
        

        await connection.execute(`

            CREATE TABLE payments (

                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                order_id BIGINT UNSIGNED NOT NULL,


                -- ============================================================
                -- PAYMENT PROVIDER
                -- ============================================================

                -- Example:
                --
                -- whop
                -- stripe
                -- paypal

                provider VARCHAR(50) NOT NULL,


                -- ============================================================
                -- PROVIDER PAYMENT ID
                --
                -- The payment ID returned by the payment provider.
                --
                -- Whop example:
                -- pay_hx1HIt2ZjDEN2i
                --
                -- This is NOT our internal MySQL payment ID.
                -- Our internal ID is the "id" column above.
                -- ============================================================

                payment_id VARCHAR(255) NOT NULL,


                -- ============================================================
                -- PAYMENT AMOUNT
                -- ============================================================

                amount DECIMAL(12, 2)
                    NOT NULL DEFAULT 0.00,


                currency VARCHAR(3)
                    NOT NULL DEFAULT 'USD',


                -- ============================================================
                -- PAYMENT STATUS
                -- ============================================================

                status VARCHAR(50)
                    NOT NULL DEFAULT 'pending',

                /*
                    pending
                    authorized
                    paid
                    failed
                    refunded
                    partially_refunded
                */


                -- ============================================================
                -- TIMESTAMPS
                -- ============================================================

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,


                -- ============================================================
                -- INDEXES
                -- ============================================================

                INDEX idx_order_id (order_id),

                INDEX idx_status (status),


                -- ============================================================
                -- IDEMPOTENCY
                --
                -- The same provider payment can only exist once.
                --
                -- Example:
                --
                -- provider = whop
                -- payment_id = pay_hx1HIt2ZjDEN2i
                --
                -- If Whop sends the same payment event multiple times,
                -- the same payment cannot be inserted twice.
                -- ============================================================

                UNIQUE KEY unique_provider_payment (
                    provider,
                    payment_id
                ),


                -- ============================================================
                -- FOREIGN KEY
                -- ============================================================

                FOREIGN KEY (order_id)

                    REFERENCES orders(id)

                    ON DELETE CASCADE

            );

        `);
         
        await connection.execute(`
            CREATE TABLE payment_events (

                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                provider VARCHAR(50) NOT NULL,

                provider_event_id VARCHAR(255) NOT NULL,

                provider_payment_id VARCHAR(255) NOT NULL,

                order_number VARCHAR(255) NULL,

                event_type VARCHAR(100) NOT NULL,

                event_data JSON NOT NULL,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


                UNIQUE KEY unique_provider_event (
                    provider,
                    provider_event_id
                ),


                INDEX idx_provider_payment_id (
                    provider,
                    provider_payment_id
                ),


                INDEX idx_order_number (
                    order_number
                ),


                INDEX idx_event_type (
                    event_type
                )

            )
        `);

        // ============================================================
        // REFUNDS
        //
        // A refund is simply money returned to the customer.
        //
        // You do not need to specify which order item was refunded.
        //
        // The reason field explains why the refund was issued.
        //
        // Example:
        //
        // amount = 300.00
        // reason = "Customer returned 1 tire"
        //
        // Example:
        //
        // amount = 100.00
        // reason = "Installation fee refunded"
        //
        // ============================================================

        await connection.execute(`

            CREATE TABLE refunds (

                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,


                -- ====================================================
                -- ORDER
                -- ====================================================

                order_id BIGINT UNSIGNED NOT NULL,


                -- ====================================================
                -- PAYMENT
                --
                -- The payment associated with this refund.
                -- ====================================================

                payment_id BIGINT UNSIGNED NULL,


                -- ====================================================
                -- REFUND AMOUNT
                -- ====================================================

                amount DECIMAL(12, 2)
                    NOT NULL DEFAULT 0.00,


                currency VARCHAR(3)
                    NOT NULL DEFAULT 'USD',


                -- ====================================================
                -- REFUND STATUS
                -- ====================================================

                status VARCHAR(50)
                    NOT NULL DEFAULT 'pending',

                /*
                    pending
                    processing
                    completed
                    failed
                    cancelled
                */


                -- ====================================================
                -- REFUND REASON / NOTE
                -- ====================================================

                reason TEXT NULL,


                -- ====================================================
                -- PAYMENT PROVIDER
                -- ====================================================

                provider VARCHAR(50) NULL,


                -- ====================================================
                -- REFUND ID FROM PAYMENT PROVIDER
                -- ====================================================

                provider_refund_id VARCHAR(255) NULL,


                -- ====================================================
                -- REFUND DATE
                -- ====================================================

                refunded_at DATETIME NULL,


                -- ====================================================
                -- TIMESTAMPS
                -- ====================================================

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,


                -- ====================================================
                -- INDEXES
                -- ====================================================

                INDEX idx_order_id (order_id),

                INDEX idx_payment_id (payment_id),

                INDEX idx_provider_refund_id (
                    provider_refund_id
                ),

                INDEX idx_status (status),


                -- ====================================================
                -- FOREIGN KEYS
                -- ====================================================

                FOREIGN KEY (order_id)

                    REFERENCES orders(id)

                    ON DELETE CASCADE,
                
                UNIQUE KEY unique_provider_refund (
                    provider,
                    provider_refund_id
                ),

                FOREIGN KEY (payment_id)

                    REFERENCES payments(id)

                    ON DELETE SET NULL

            );

        `);





        // ============================================================
        // FULFILLMENTS
        // ============================================================

        await connection.execute(`

            CREATE TABLE fulfillments (

                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,


                -- ====================================================
                -- ORDER
                -- ====================================================

                order_id BIGINT UNSIGNED NOT NULL,


                -- ====================================================
                -- FULFILLMENT STATUS
                -- ====================================================

                status VARCHAR(50)
                    NOT NULL DEFAULT 'pending',

                /*
                    pending
                    processing
                    shipped
                    in_transit
                    out_for_delivery
                    delivered
                    cancelled
                    returned
                */


                -- ====================================================
                -- SHIPPING PROVIDER
                -- ====================================================

                provider VARCHAR(50) NULL,


                -- ====================================================
                -- PROVIDER FULFILLMENT / SHIPMENT ID
                -- ====================================================

                provider_fulfillment_id VARCHAR(255) NULL,


                -- ====================================================
                -- CARRIER
                -- ====================================================

                carrier VARCHAR(100) NULL,


                -- ====================================================
                -- SHIPPING SERVICE
                -- ====================================================

                service VARCHAR(255) NULL,


                -- ====================================================
                -- TRACKING
                -- ====================================================

                tracking_number VARCHAR(255) NULL,

                tracking_url VARCHAR(1000) NULL,


                -- ====================================================
                -- INTERNAL SHIPPING COST
                -- ====================================================

                shipping_cost DECIMAL(12, 2)
                    NOT NULL DEFAULT 0.00,
                

                -- ====================================================
                -- DATES
                -- ====================================================

                shipped_at DATETIME NULL,

                delivered_at DATETIME NULL,


                -- ====================================================
                -- TIMESTAMPS
                -- ====================================================

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,


                -- ====================================================
                -- INDEXES
                -- ====================================================

                INDEX idx_order_id (order_id),

                INDEX idx_tracking_number (tracking_number),

                INDEX idx_status (status),


                -- ====================================================
                -- FOREIGN KEY
                -- ====================================================

                FOREIGN KEY (order_id)

                    REFERENCES orders(id)

                    ON DELETE CASCADE

            );

        `);


        // ============================================================
        // FULFILLMENT ITEMS
        // ============================================================

        await connection.execute(`

            CREATE TABLE fulfillment_items (

                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,


                -- ====================================================
                -- FULFILLMENT
                -- ====================================================

                fulfillment_id BIGINT UNSIGNED NOT NULL,


                -- ====================================================
                -- ORDER ITEM
                --
                -- Product order item being fulfilled.
                -- ====================================================

                order_item_id BIGINT UNSIGNED NOT NULL,


                -- ====================================================
                -- QUANTITY
                --
                -- Quantity of this order item included in this
                -- fulfillment.
                -- ====================================================

                quantity INT UNSIGNED NOT NULL DEFAULT 1,


                -- ====================================================
                -- TIMESTAMPS
                -- ====================================================

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,


                -- ====================================================
                -- INDEXES
                -- ====================================================

                INDEX idx_fulfillment_id (fulfillment_id),

                INDEX idx_order_item_id (order_item_id),


                -- ====================================================
                -- PREVENT DUPLICATE ORDER ITEM
                -- IN THE SAME FULFILLMENT
                -- ====================================================

                UNIQUE KEY unique_fulfillment_order_item (
                    fulfillment_id,
                    order_item_id
                ),


                -- ====================================================
                -- FOREIGN KEYS
                -- ====================================================

                FOREIGN KEY (fulfillment_id)

                    REFERENCES fulfillments(id)

                    ON DELETE CASCADE,


                FOREIGN KEY (order_item_id)

                    REFERENCES order_items(id)

                    ON DELETE CASCADE

            );

        `);

         




        // ============================================================
        // SUCCESS
        // ============================================================

        return new Response("success");


    } catch (error) {
        
        console.error("Database setup error:", error);
        
        return new Response(
        
            JSON.stringify({

                success: false,

                error: error.message

            }),

            {

                status: 500,

                headers: {

                    "Content-Type": "application/json"

                }

            }

        );

    } finally {
        
        await connection.end();
        
    }

}