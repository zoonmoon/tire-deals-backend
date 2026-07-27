export async function POST(request) {
  try {
    const event = await request.json();

    console.log('================================');
    console.log('EASYPOST WEBHOOK RECEIVED');
    console.log('================================');
    console.log(JSON.stringify(event, null, 2));

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