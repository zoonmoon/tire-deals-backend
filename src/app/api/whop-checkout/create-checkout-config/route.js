import Whop from "@whop/sdk";


const client = new Whop({
  apiKey: process.env.WHOP_API_KEY,
});


import { createOrderForWhopSession } from "./create_order";


export async function POST(request) {

    try {
        
        const data = await request.json();

        const order = await createOrderForWhopSession(data);

        if (!order?.orderNumber) {
            throw new Error("Failed to create order");
        }

        const checkoutConfig =
            await client.checkoutConfigurations.create({
                plan: {
                    initial_price: 1,
                    company_id: process.env.WHOP_BUSINESS_ID,
                    currency: "usd",
                    plan_type: "one_time",
                },

                metadata: {
                    order_number: order.orderNumber,
                },
            });

        console.log(checkoutConfig);

        return new Response(
            JSON.stringify({
                checkoutConfig,
                order
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

    } catch (error) {

        console.error(error);

        return new Response(
            JSON.stringify({
                success:false,
                error: error.message,
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
