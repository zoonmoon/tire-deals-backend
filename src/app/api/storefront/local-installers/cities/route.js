import openSearchClient from "@/app/api/setup-database/_lib/route";
import { unstable_cache } from "next/cache";

const INDEX_NAME = "all_installers";

const getInstallerLocations = unstable_cache(
  async () => {
    const response =
      await openSearchClient.search({
        index: INDEX_NAME,

        body: {
          size: 0,

          aggs: {
            locations: {
              composite: {
                size: 20000,

                sources: [
                  {
                    city: {
                      terms: {
                        field: "city",
                      },
                    },
                  },
                  {
                    zip: {
                      terms: {
                        field: "zip",
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      });

    const responseBody =
      response.body ?? response;

    const buckets =
      responseBody.aggregations
        ?.locations
        ?.buckets || [];

    return buckets.map((bucket) => ({
      name: bucket.key.city,
      zip: bucket.key.zip,
      num_installers: bucket.doc_count,
    }));
  },

  ["all-installers-locations"],

  {
    revalidate: 60 * 60 * 24 * 115,
  }
);
// //
export async function GET() {
  try {
    const cities =
      await getInstallerLocations();

    return Response.json({
      success: true,
      cities,
    });

  } catch (error) {
    console.error(
      "❌ Failed to fetch installer cities:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Failed to fetch installer cities",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}