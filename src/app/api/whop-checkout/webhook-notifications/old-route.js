import { Whop } from "@whop/sdk";

export const whopsdk = new Whop({
    apiKey: process.env.WHOP_API_KEY,
    webhookKey: btoa(process.env.WHOP_WEBHOOK_SECRET || ""),
});

export async function POST(request) {
  
  // Validate the webhook to ensure it's from Whop
  const requestBodyText = await request.text();
  const headers = Object.fromEntries(request.headers);
  const webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });


  console.log("new event arrived")
  console.log(webhookData)

  // Handle the webhook event
  if (webhookData.type === "payment.succeeded") {
    await handlePaymentSucceeded(webhookData.data);
  }

  // Make sure to return a 2xx status code quickly.
  // Otherwise the webhook will be retried.
  return new Response("OK", { status: 200 });

  
}


async function handlePaymentSucceeded(webhookData) {

  // This is a placeholder for a potentially long-running operation.
  // In a real scenario, you might fetch user data, update a database, etc.
  console.log("[PAYMENT SUCCEEDED]", webhookData);

  //  metadata: { order_number: 'ORD-1785723825551-18159' },

  // webhookData.metadata.order_number 
  
  // mark this order as paid :) okay

}