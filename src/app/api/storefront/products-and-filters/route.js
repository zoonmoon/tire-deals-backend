import openSearchClient from "../../setup-database/_lib/route";
import { propsOrderAndLabels } from "./props_order_and_label";

function capitalizeWords(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function POST(req) {
  try {
    // const { searchParams } = new URL(req.url);
    // let filtersParam = searchParams.get("selectedFilters");

    // let presets = searchParams.get("presets")

    // presets = JSON.parse(presets)

    // let parsedFilterParams = JSON.parse(filtersParam)


    const { presets, selectedFilters } = await req.json();
    let searchwQuery = selectedFilters.query

    let useSelectedVehicle = selectedFilters.useSelectedVehicle

    let parsedFilterParams = selectedFilters
    
    let page = parseInt(parsedFilterParams.page) 

    let sortBy = parsedFilterParams.sort_by

    let size = 36;

    const from = (page - 1) * size;

    if(from+size > 10000){
      size = 10000 - from
    }

    // Build filter clauses
    const filters = [];
 
    if (presets.vehicle?.selectedFlag && useSelectedVehicle) {
      const v = presets.vehicle.selected;
      
      filters.push({
        nested: {
          path: "fitment_data",
          query: {
            bool: {
              must: [
                // { term: { "fitment_data.vehicle_type": v.vehicle_types } },
                { term: { "fitment_data.year": parseInt(v.years) } },
                { term: { "fitment_data.make": v.makes } },
                { term: { "fitment_data.model": v.models } },
              ]
            }
          }
        }
      });
    }

    if (parsedFilterParams) {
      const parsedFilters = parsedFilterParams.attributes;

      parsedFilters.forEach(f => {
        if (!Array.isArray(f.values) || f.values.length === 0) return;

        filters.push({
          nested: {
            path: "custom_fields",
            query: {
              bool: {
                must: [
                  { term:  { "custom_fields.label": f.key }},
                  { terms: { "custom_fields.value": f.values }} // ✅ FIXED
                ]
              }
            }
          }
        });
      });
    }
    
    const collectionID = presets.collectionID

    if(collectionID){
      filters.push({
        terms: { categories: [collectionID] }
      });
    }

    filters.push({
      term: { is_visible: true }
    });







// Build a query that searches all relevant fields + applies filters
const boolQuery = {
  bool: {
    must: [],
    filter: filters
  }
};

    // if the user typed something, add a multi-field search
    if (searchwQuery && searchwQuery.trim() !== "") {
      // const lowerQuery = searchwQuery.toLowerCase();

      boolQuery.bool.must.push({
        bool: {
          should: [

            // 🔥 PARTIAL / ABBREVIATION MATCH (temp → temperature)
            ...(searchwQuery.length >= 3 ? [{
              wildcard: {
                title: {
                  value: `*${searchwQuery.toLowerCase()}*`,
                  case_insensitive: true,
                  boost: 10
                }
              }
            }] : []),

            // ✅ Exact phrase (full words)
            {
              match_phrase: {
                title: {
                  query: searchwQuery,
                  boost: 40
                }
              }
            },

            // ✅ Typo handling
            {
              multi_match: {
                query: searchwQuery,
                fuzziness: "AUTO",
                operator: "or",
                type: "best_fields",
                fields: [
                  "title^5",
                  "description^2"
                ],
                boost: 20
              }
            }

          ],
          minimum_should_match: 1
        }
      });

    } else {
      boolQuery.bool.must.push({ match_all: {} });
    }

    // OpenSearch query
    const body = {
      from,
      size,
      _source: [
        "title",
        "url",
        "price",
        "sale_price",
        "categories",
        "featured_image_url",
      ],
      query: boolQuery,


      aggs: {
        metafields: {
          nested: { path: "custom_fields" },
          aggs: {
            by_key: {
              terms: {
                field: "custom_fields.label",
                size: 50
              },
              aggs: {
                values: {
                  terms: {
                    field: "custom_fields.value",
                    size: 500
                  }
                }
              }
            }
          }
        }
      }

    };


    // Add sorting if provided
    if (sortBy) {
      if (sortBy === "price-high-to-low") {
        body.sort = [{ price: { order: "desc" } }];
      } else if (sortBy === "price-low-to-high") {
        body.sort = [{ price: { order: "asc" } }];
      }
      // you can extend with relevance, newest, etc.
    }

    const startTime = Date.now();
    const { body: response } = await openSearchClient.search({
      index: "products",
      body,
      request_cache: true
    });
    const endTime = Date.now();

    // Extract products
    const products = response.hits.hits.map(hit => hit._source);

    // Extract facets
    const filtersResult = {};
    const keysBuckets = response.aggregations?.metafields?.by_key?.buckets || [];


    // console.log("keybuckets", keysBuckets)

    keysBuckets.forEach(k => {
      filtersResult[k.key] = k.values.buckets.map(v => ({
        value: v.key
          .replaceAll('abs ', 'ABS')
          .replaceAll('bmw', 'BMW')
          .replaceAll('ac ', 'AC')
          .replaceAll('am/fm', 'AM/FM')
          .replaceAll('cd ' ,'CD')
          .replaceAll('dvd' ,'DVD')
          .replaceAll('ecu' ,'ECU')
          .replaceAll('oem' ,'OEM')
          .replaceAll('mp3' ,'MP3')
          .replaceAll('lcd ' ,'LCD')
          .replaceAll('usb' ,'USB')
          .replaceAll('ecm' ,'ECM')
          .replaceAll(' us ', 'US')
        ,
        count: v.doc_count
      }));
    });


    // console.log(Object.keys(propsOrderAndLabels))

// Create lowercase lookup mapping
const normalizedOrder = Object.keys(propsOrderAndLabels).map(k => k.toLowerCase());

// Build array ONLY for allowed keys and preserve order
let filtersArray = [];

for (const propKey of Object.keys(propsOrderAndLabels)) {
  // If OpenSearch returned this property AND it has options
  if (filtersResult[propKey]) {
    filtersArray.push({
      key: propKey,
      label: propsOrderAndLabels[propKey],
      options: filtersResult[propKey]
    });
  }
}

//  filtersArray = Object.entries(filtersResult).map(
//   ([key, options]) => ({
//     key,
//     label: key, // or transform later
//     options
//   })
// );


return new Response(
  JSON.stringify({
    products: products.map((p) => ({
      ...p,
      // bigc_images:
      //   p?.bigc_images?.find(i => i.is_thumbnail == true) ||
      //   p?.bigc_images?.[0] ||
      //   {
      //     url_standard:
      //       "https://cdn.shopify.com/s/files/1/0956/4930/0794/files/flow_satingray_8lug_white.jpg?v=1754662205",
      //     url_zoom:
      //       "https://cdn.shopify.com/s/files/1/0956/4930/0794/files/flow_satingray_8lug_white.jpg?v=1754662205"
      //   }
    }))
    .map((p) => ({...p})) 
    ,
    query: body,
    presets,
    filters: filtersArray,
    total: response.hits.total.value,
    timeTakenMs: endTime - startTime
  }),
  { status: 200, headers: { "Content-Type": "application/json" } }
);




  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
