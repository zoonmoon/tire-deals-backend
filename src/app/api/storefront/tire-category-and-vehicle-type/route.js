import openSearchClient from "../../setup-database/_lib/route";

const INDEX_NAME = "all_tires";

export async function GET() {
  try {
    const result = await openSearchClient.search({
      index: INDEX_NAME,

      body: {
        size: 0,

        aggs: {
          vehicle_type_tags: {
            terms: {
              field: "vehicle_type_tags",
              size: 1000
            }
          },

          segment_tags: {
            terms: {
              field: "segment_tags",
              size: 1000
            }
          }
        }
      }
    });

    // Depending on your OpenSearch client version,
    // aggregations may be inside result.body or directly on result.

    const aggregations =
      result.body?.aggregations ||
      result.aggregations;

    const vehicleTypeTags =
      aggregations?.vehicle_type_tags?.buckets?.map(
        bucket => bucket.key
      ) || [];

    const segmentTags =
      aggregations?.segment_tags?.buckets?.map(
        bucket => bucket.key
      ) || [];

    return Response.json({
      success: true,

      vehicle_type_tags: vehicleTypeTags,

      segment_tags: segmentTags
    });

  } catch (error) {

    console.error(
      "Failed to fetch tire tags:",
      error
    );

    return Response.json(
      {
        success: false,
        error: error.message
      },
      {
        status: 500
      }
    );
  }
}