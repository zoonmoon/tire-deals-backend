import { EASYPOST_API_KEY } from '../utils';

const EasyPostClient = require('@easypost/api');

const client = new EasyPostClient(EASYPOST_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      shipmentId,
      rateId,
    } = body;

    if (!shipmentId || !rateId) {
      return Response.json(
        {
          success: false,
          error: 'shipmentId and rateId are required.',
        },
        { status: 400 }
      );
    }

    // Retrieve the shipment
    const retrievedShipment = await client.Shipment.retrieve(shipmentId);

    // Find the rate selected by the customer
    const selectedRate = retrievedShipment.rates.find(
      (rate) => rate.id === rateId
    );

    if (!selectedRate) {
      return Response.json(
        {
          success: false,
          error: 'Selected rate was not found for this shipment.',
        },
        { status: 404 }
      );
    }

    // Buy the selected shipping rate
    const purchasedShipment = await client.Shipment.buy(
      retrievedShipment.id,
      selectedRate
    );

    return Response.json({
      success: true,
      shipment: purchasedShipment,
    });

  } catch (error) {
    console.error('EasyPost shipment purchase error:', error);

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