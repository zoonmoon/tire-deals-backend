import openSearchClient from "../../setup-database/_lib/route";

export async function GET() {

  try {

    const allCategories = [];
    const pageSize = 1000;

    let response = await openSearchClient.search({
      index: "categories",
      scroll: "1m",
      size: pageSize,
      body: {
        query: {
          term: {
            is_visible: true
          }
        }
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

    return Response.json({
      success: true,
      count: allCategories.length,
      categories: allCategories
    });

  } catch (error) {

    return Response.json({
      success: false,
      msg:
        error instanceof Error
          ? error.message
          : "Unknown error"
    });

  }

}