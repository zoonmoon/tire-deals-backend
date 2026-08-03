import { createOrder } from "../../order";

export async function createOrderForWhopSession(){

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
    
    return order 

}