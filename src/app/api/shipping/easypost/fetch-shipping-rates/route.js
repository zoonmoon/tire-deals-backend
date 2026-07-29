import { EASYPOST_API_KEY } from '../utils';

const EasyPostClient = require('@easypost/api');

const client = new EasyPostClient(EASYPOST_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();

    const shipment = await client.Shipment.create({
      to_address: {
        name: body.to_address.name,
        street1: body.to_address.street1,
        street2: body.to_address.street2 || undefined,
        city: body.to_address.city,
        state: body.to_address.state,
        zip: body.to_address.zip,
        country: body.to_address.country,
        email: body.to_address.email,
        phone: body.to_address.phone,
      },

      from_address: {
        street1: body.from_address.street1,
        street2: body.from_address.street2 || undefined,
        city: body.from_address.city,
        state: body.from_address.state,
        zip: body.from_address.zip,
        country: body.from_address.country,
        company: body.from_address.company,
      },

      // COMPANY IS NECESSARY IN FROM_ADDRESS WHILE PURCHASING SHIPPING LABEL
      
      parcel: {
        length: body.parcel.length,
        width: body.parcel.width,
        height: body.parcel.height,
        weight: body.parcel.weight,
      },

    });

    return Response.json({
      success: true,
      shipment,
      rates: shipment.rates,
    });
      
  } catch (error) {

    console.log(error);

    return Response.json(
      {
        success: false,
        error: error.message,
        details: error,
      },
      {
        status: error.statusCode || 400,
      }
    );
  }
}