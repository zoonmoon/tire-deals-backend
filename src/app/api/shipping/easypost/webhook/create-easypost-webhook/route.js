const EasyPostClient = require('@easypost/api');

import { EASYPOST_API_KEY } from '../../utils';

const client = new EasyPostClient(EASYPOST_API_KEY);

export async function POST() {

  try { 

    const webhook = await client.Webhook.create({
        url: 'https://yourdomain.com/api/webhooks/easypost',
        webhook_secret: process.env.EASYPOST_WEBHOOK_SECRET,
    });
    
    console.log(webhook);

    return Response.json({
      success: true,
    });

  } catch (error) {
    
    console.error('Webhook error:', error);

    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 }
    );
  }
}
