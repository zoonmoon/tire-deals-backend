import openSearchClient from "../../setup-database/_lib/route";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("product_id");

  if (!productId) {
    return Response.json({ success: false, data: [] });
  }

  const query = {
    size: 1,
    query: {
      bool: {
        filter: [
          { term: { bigcommerce_id: productId } },
        ]
      }
    },
    _source: ["fitment_data"]
  };

  const res = await openSearchClient.search({
    index: "products",
    body: query
  });

  const hit = res.body.hits.hits[0];
  const fitmentData = hit?._source?.fitment_data || [];

  return Response.json({
    success: true,
    data: fitmentData
  });
}
