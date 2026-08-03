import Whop from "@whop/sdk";

const client = new Whop({
  apiKey: process.env.WHOP_API_KEY,
});

import { createOrderForWhopSession } from "./create_order";

export async function GET(){

    try{
        
        let order  = await createOrderForWhopSession() 

        if(!order.orderNumber){
            throw new Error("failed to create order") 
        }
        
        const checkoutConfig = await client.checkoutConfigurations.create(
            {
                plan: {
                    initial_price: 1,
                    company_id: process.env.WHOP_BUSINESS_ID,
                    currency: "usd" ,
                    plan_type: "one_time",
                },
                metadata: {
                    order_number: order.orderNumber,
                },
            }
        );

        return new Response(
            JSON.stringify({checkoutConfig}),
            {status: 200}
        );

    }catch(error){
        
        console.log(error)
        
        return new Response("Internal Server Error", {status: 500});
    
    }

}
