import { EASYPOST_API_KEY } from '../utils';

const EasyPostClient = require('@easypost/api');

const client = new EasyPostClient(EASYPOST_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();

    const address = await client.Address.createAndVerify({
      street1: body.street1,
      city: body.city,
      state: body.state,
      zip: body.zip,
      country: body.country,
      email: body.email,
      phone: body.phone,
    });

    return Response.json({
      success: true,
      address,
    });

  } catch (error) {


    console.log(error)

    return Response.json(
        {
            success: false,
            error: error.message,
            details: error,
        },
        { status: 400 }
    );


  }
}