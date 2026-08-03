import Whop from "@whop/sdk";

const client = new Whop({
  apiKey: process.env.WHOP_API_KEY,
});


export async function GET(){

    try{
        
        const checkoutConfig = await client.checkoutConfigurations.create(
            {
                plan: {
                    initial_price: 1,
                    company_id: process.env.WHOP_BUSINESS_ID,
                    currency: "usd" ,
                    plan_type: "one_time",
                },
                metadata: {
                    order_number: "order_4444",
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
