import Whop from "@whop/sdk";


const client = new Whop({
  apiKey: process.env.WHOP_API_KEY,
});


import { createOrderForWhopSession } from "./create_order";


export async function POST(request) {

    const totalStart = performance.now();

    try {

        const data = await request.json();

        // ============================================================
        // CREATE ORDER
        // ============================================================

        const orderStart = performance.now();

        const order =
            await createOrderForWhopSession(data);

        const timeItTookToCreateOrder =
            performance.now() - orderStart;


        if (!order?.orderNumber) {
            throw new Error("Failed to create order");
        }


        // ============================================================
        // CREATE WHOP CHECKOUT SESSION
        // ============================================================

        const checkoutStart = performance.now();

        const checkoutConfig =
            await client.checkoutConfigurations.create({

                plan: {
                    initial_price: 1,
                    company_id:
                        process.env.WHOP_BUSINESS_ID,
                    currency: "usd",
                    plan_type: "one_time",
                },

                metadata: {
                    order_number:
                        order.orderNumber,
                },

            });


        const timeItTookToCreateCheckoutSession =
            performance.now() - checkoutStart;


        // ============================================================
        // TOTAL SERVER TIME
        // ============================================================

        const timeItTookServerToProcessRequest =
            performance.now() - totalStart;


        return new Response(
            JSON.stringify({

                success: true,

                time_it_took_to_create_order:
                    `${Math.round(timeItTookToCreateOrder)} ms`,

                time_it_took_to_create_checkout_session_after_creating_order:
                    `${Math.round(timeItTookToCreateCheckoutSession)} ms`,

                time_it_took_server_to_process_full_request:
                    `${Math.round(timeItTookServerToProcessRequest)} ms`,

                checkoutConfig,
                order,

            }),
            {
                status: 200,

                headers: {
                    "Content-Type": "application/json",
                },
            }
        );


    } catch (error) {

        const timeItTookServerToProcessRequest =
            performance.now() - totalStart;

        console.error(error);

        return new Response(
            JSON.stringify({

                success: false,

                time_it_took_server_to_process_request:
                    `${Math.round(timeItTookServerToProcessRequest)} ms`,

                error:
                    error.message,

            }),
            {
                status: 500,

                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }
}