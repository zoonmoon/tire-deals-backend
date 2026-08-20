import { createOrder } from ".";



export async function GET(){

    try{

        const order = await createOrder({

            customer_id: null,

            customer_email: "test@example.com",

            currency: "USD",


            billing_first_name: "John",

            billing_last_name: "Doe",

            billing_address1: "123 Main Street",

            billing_city: "New York",

            billing_state: "NY",

            billing_postcode: "10001",

            billing_country: "US",


            shipping_first_name: "John",

            shipping_last_name: "Doe",

            shipping_address1: "123 Main Street",

            shipping_city: "New York",

            shipping_state: "NY",

            shipping_postcode: "10001",

            shipping_country: "US",

            delivery_method: "ship_to_local_installer", 

            appointment_booking_date: "August 21, 2026, Monday",

            appointment_booking_time_range: "Morning",
            
            delivery_location_id: "74216",

            coupon_code: "SAVE34" ,
            
            items: [

                {

                    type: "product",

                    tire_inventory_id: 5,

                    quantity: 2,

                    selected_vehicle:
                        "2021 BMW M340i xDrive"

                },


                {

                    type: "product",

                    tire_inventory_id: 9,

                    quantity: 1,

                    selected_vehicle: null

                },


                {

                    type: "shipping",

                    name: "UPS Ground",

                    quantity: 1,

                    unit_price: 35,

                    tax_total: 0

                },


                {

                    type: "fee",

                    name: "Installation Fee",

                    quantity: 1,

                    unit_price: 50,

                    tax_total: 4

                }

            ]

        });


        console.log(order)

        return new Response(JSON.stringify(order))

    }catch(error){


        return new Response(
            JSON.stringify({
                success: false, 
                message: error.message
            })
        )

    }

}


// The returned result will be something like:

// {
//     success: true,

//     orderId: 123,

//     orderNumber: "ORD-1754123456789-12345",

//     currency: "USD",

//     totals: {
//         subtotal: 860,
//         discount_total: 0,
//         shipping_total: 35,
//         tax_total: 32,
//         grand_total: 927
//     },
// 
//     items: [...]
// }

// Then your next step is:

// createOrder()
//       ↓
// returns orderId + orderNumber
//       ↓
// create Whop checkout
//       ↓
// pass orderId/orderNumber to Whop metadata
//       ↓
// customer pays
//       ↓
// Whop webhook
//       ↓
// find order
//       ↓
// INSERT payments
//       ↓
// UPDATE orders.payment_status = 'paid'