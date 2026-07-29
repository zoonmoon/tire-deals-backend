export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("order_number");

  const orders = {
    "678": {
      orderNumber: "678",
      status: "In Transit",
      estimated_delivery: "july 28",
    },
    "345": {
      orderNumber: "345",
      status: "Delivered",
      estimated_delivery: "July 1",
    },
  };

  if (!orders[orderNumber]) {
    return Response.json(
      {
        success: false,
        message: "Order not found",
      },
      { status: 404 }
    );
  }

  return Response.json({
    success: true,
    order: orders[orderNumber],
  });
}