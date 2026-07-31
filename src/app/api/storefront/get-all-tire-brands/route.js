import openSearchClient from "../../setup-database/_lib/route";
import { unstable_cache } from "next/cache";

const INDEX_NAME = "all_tires";

const AUTOSYNC_URL =
  "https://api.autosyncstudio.com/tires/brands";

const GLOBAL_INVENTORY_FILTERS = [

  {
    term: {
      is_mysql_mapped: true
    }
  },

  {
    term: {
      status: "active"
    }
  }

];


// ======================================================
// Fetch brands from AutoSync
// ======================================================


async function fetchAutoSyncBrands() {

  const url =
    `${AUTOSYNC_URL}` +
    `?i-logos=true` +
    `&p-size=500` +
    `&p-number=1` +
    `&key=${process.env.AUTOSYNC_API_KEY}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(30000),

    next: {
      revalidate: 60 * 60 * 24 * 5
    }
  });

  if (!response.ok) {
    throw new Error(
      `AutoSync brands HTTP ${response.status}`
    );
  }

  const data = await response.json();

  const logoBaseUrl =
    data.BrandLogosUrlBase || "";

  return (data.Brands || []).map(brand => ({
    name: brand.Brand,
    logo: brand.Logo
      ? `${logoBaseUrl}${brand.Logo}`
      : null
  }));
}



// ======================================================
// Fetch matching brands from AutoSync + OpenSearch
//
// Entire result cached for 5 days
// ======================================================

const getAvailableBrands =
  unstable_cache(

    async () => {

      // =================================================
      // Fetch BOTH at the same time
      // =================================================

      const [

        autoSyncBrands,

        openSearchResult

      ] = await Promise.all([

        // ===============================================
        // AutoSync brands
        // ===============================================

        fetchAutoSyncBrands(),


        // ===============================================
        // OpenSearch brands
        // ===============================================

        openSearchClient.search({

          index:
            INDEX_NAME,

          body: {

            size:
              0,

            query: {

              bool: {

                filter:
                  GLOBAL_INVENTORY_FILTERS

              }

            },

            aggs: {

              brands: {

                terms: {

                  field:
                    "brand",

                  size:
                    500,

                  order: {

                    _key:
                      "asc"

                  }

                }

              }

            }

          }

        })

      ]);


      // =================================================
      // Create AutoSync brand lookup
      //
      // Lowercase key makes matching
      // case-insensitive.
      // =================================================

      const autoSyncBrandMap =
        new Map(

          autoSyncBrands.map(
            brand => [

              brand.name
                .trim()
                .toLowerCase(),

              brand

            ]
          )

        );


      // =================================================
      // Get OpenSearch brand buckets
      // =================================================

      const openSearchBrands =

        openSearchResult
          .body
          .aggregations
          .brands
          .buckets;


      // =================================================
      // Return only brands existing in BOTH
      //
      // OpenSearch:
      //   is_mysql_mapped = true
      //   status = active
      //
      // AutoSync:
      //   brand exists
      //
      // Return:
      //   name
      //   logo
      // =================================================

      const brands =

        openSearchBrands

          .map(bucket => {

            const openSearchBrand =
              bucket.key
                .trim()
                .toLowerCase();


            const autoSyncBrand =
              autoSyncBrandMap.get(
                openSearchBrand
              );


            if (!autoSyncBrand) {

              return null;

            }


            return {

              name:
                autoSyncBrand.name,

              logo:
                autoSyncBrand.logo

            };

          })

          .filter(Boolean);


      return brands;

    },

    // Cache key
    [
      "available-tire-brands"
    ],

    // Cache options
    {
      revalidate:
        60 * 60 * 24 * 5
    }

  );


// ======================================================
// GET /api/storefront/tire-brands
// ======================================================

export async function GET() {

  try {

    const brands =
      await getAvailableBrands();


    return Response.json({

      brands

    });


  } catch (error) {

    console.error(

      "❌ Failed to fetch available tire brands:",

      error

    );


    return Response.json(

      {

        error:
          error.message ||
          "Failed to fetch tire brands"

      },

      {

        status:
          500

      }

    );

  }

}