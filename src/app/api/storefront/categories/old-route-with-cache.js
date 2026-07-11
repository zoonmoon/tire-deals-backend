import { unstable_cache } from "next/cache";
import openSearchClient from "../../setup-database/_lib/route";

// ------------------------------------
// CACHED FETCH FUNCTION
// ------------------------------------
const getCachedCategories = unstable_cache(
  async () => {
    const allCategories = [];
    const pageSize = 1000;

    let response = await openSearchClient.search({
      index: "categories",
      scroll: "1m",
      size: pageSize,
      body: {
        query: { match_all: {} }
      }
    });

    let scrollId = response.body._scroll_id;
    let hits = response.body.hits.hits;

    while (hits.length) {
      allCategories.push(
        ...hits.map(hit => ({
          id: hit._id,
          ...hit._source
        }))
      );

      response = await openSearchClient.scroll({
        scroll_id: scrollId,
        scroll: "1m"
      });

      scrollId = response.body._scroll_id;
      hits = response.body.hits.hits;
    }

    return allCategories;
  },
  ["categories-all-v1"], // 🔑 persistent cache key
  {
    revalidate: 86400 // optional TTL (still required by API)
  }
);

// ------------------------------------
// ROUTE HANDLER
// ------------------------------------
export async function GET() {
  try {
    const categories = await getCachedCategories();

    return Response.json({
      success: true,
      count: categories.length,
      categories
    });

  } catch (error) {
    return Response.json({
      success: false,
      msg: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
