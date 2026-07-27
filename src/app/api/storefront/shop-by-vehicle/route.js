import { NextResponse } from "next/server";

import openSearchClient
  from "../../setup-database/_lib/route";


const INDEX_NAME = "all_vehicles";




// ======================================================
// GET /api/vehicles
//
// No params
//     -> Makes + default image
//
// ?make=Toyota
//     -> Models
//
// ?make=Toyota&model=Camry
//     -> Years
//
// ?make=Toyota&model=Camry&year=2023
//     -> Submodels
//
// ?make=Toyota&model=Camry&year=2023&submodel=SE
//     -> ALL matching vehicles
// ======================================================


import { unstable_cache } from "next/cache";

const getCachedMakes = unstable_cache(
  async () => {

    const response =
      await openSearchClient.search({

        index: INDEX_NAME,

        body: {

          size: 0,

          aggs: {

            makes: {

              terms: {

                field: "make",

                size: 10000,

                order: {
                  _key: "asc"
                }

              },

              aggs: {

                default_vehicle: {

                  top_hits: {

                    size: 1,

                    sort: [
                      {
                        id: {
                          order: "asc"
                        }
                      }
                    ],

                    _source: [
                      "make",
                      "images",
                      "img_url_base"
                    ]

                  }

                }

              }

            }

          }

        }

      });


    const makeBuckets =
      response.body
        ?.aggregations
        ?.makes
        ?.buckets || [];


    return makeBuckets.map(
      bucket => {

        const vehicle =
          bucket
            .default_vehicle
            ?.hits
            ?.hits?.[0]
            ?._source;


        const image =
          vehicle?.images?.img_001 ||
          vehicle?.images?.img_014 ||
          vehicle?.images?.img_032 ||
          null;


        const img_url_base =
          vehicle?.img_url_base || null;


        const image_url =
          image
            ? `${img_url_base || ""}${image?.["240"] || image}`
            : null;


        return {

          key:
            bucket.key,

          label: 
            bucket.key,

          count:
            bucket.doc_count,

          image_url

        };

      }

    );

  },

  ["vehicle-makes"],

  {
    revalidate: 86400
  }

);

export async function GET(request) {

  try {


    // ==================================================
    // Read query parameters
    // ==================================================

    const {
      searchParams
    } = new URL(request.url);


    const make =
      searchParams.get("make")?.trim() || null;


    const model =
      searchParams.get("model")?.trim() || null;


    const yearParam =
      searchParams.get("year")?.trim() || null;


    const submodel =
      searchParams.get("submodel")?.trim() || null;



    // ==================================================
    // Validate year
    // ==================================================

    let year = null;


    if (yearParam) {

      year = Number(yearParam);


      if (!Number.isInteger(year)) {

        return NextResponse.json(

          {
            success: false,

            error:
              "year must be a valid integer"
          },

          {
            status: 400
          }

        );

      }

    }



    // ==================================================
    // Build filters dynamically
    // ==================================================

    const filters = [];


    if (make) {

      filters.push({

        term: {

          make: make

        }

      });

    }


    if (model) {

      filters.push({

        term: {

          model: model

        }

      });

    }


    if (year !== null) {

      filters.push({

        term: {

          year: year

        }

      });

    }






    // ==================================================
    // Determine current level
    // ==================================================

    let level;


    if (!make) {

      level = "make";

    }

    else if (!model) {

      level = "model";

    }

    else if (year === null) {

      level = "year";

    }

    else if (!submodel) {

      level = "submodel";

    }else{
        level = "vehicles";
    }



    // ==================================================
    // FINAL STEP
    //
    // Make + Model + Year + Submodel
    //
    // Return ALL matching vehicle documents
    // ==================================================



    if (level === "vehicles") {

        const response =
            await openSearchClient.search({

            index: INDEX_NAME,

            body: {

                size: 1,

                query: {

                term: {

                    id: submodel

                }

                }

            }

            });


        const vehicles =
            response.body?.hits?.hits?.map(
            hit => ({
                ...hit._source,
                _id: hit._id
            })
            ) || [];


        return NextResponse.json({

            success: true,

            level: "vehicles",

            selection: {

            make,
            model,
            year,

            // This is actually vehicle ID
            submodel

            },

            count:
            vehicles.length,

            vehicles

        });

    }



    if (level === "submodel") {

        const response =
            await openSearchClient.search({

            index: INDEX_NAME,

            body: {

                size: 10000,

                track_total_hits: true,

                query: {

                bool: {

                    filter: filters

                }

                },

                sort: [

                {

                    id: {

                    order: "asc"

                    }

                }

                ]

            }

            });


        // ==================================================
        // Get all matching vehicle documents
        // ==================================================

            const vehicles =
            response.body.hits.hits.map(

            hit => ({

                ...hit._source,

                _id: hit._id

            })

            );


        // ==================================================
        // Count occurrences of each submodel
        //
        // Example:
        //
        // Komfort -> 2
        // Premium -> 1
        //
        // If a submodel occurs more than once,
        // Body + Doors will be added to its label.
        // ==================================================

        const submodelCounts =
            new Map();


        for (const vehicle of vehicles) {

            const submodel =
            vehicle.submodel || "";


            submodelCounts.set(

            submodel,

            (submodelCounts.get(submodel) || 0) + 1

            );

        }


        // ==================================================
        // Generate submodel options
        // ==================================================

        const options =
            vehicles.map(

            vehicle => {

                const submodel =
                vehicle.submodel || "";


                const isDuplicate =
                submodelCounts.get(submodel) > 1;


                // ----------------------------------------------
                // If submodel occurs once:
                //
                // Komfort
                //
                // If submodel occurs multiple times:
                //
                // Komfort Convertible 2 Door
                // Komfort Sedan 4 Door
                // ----------------------------------------------

                let label =
                submodel;


                if (isDuplicate) {

                const parts = [

                    submodel,

                    vehicle.body || null,

                    vehicle.doors
                    ? `${vehicle.doors} Door`
                    : null

                ];


                label =
                    parts
                    .filter(Boolean)
                    .join(" ");

                }


                return {

                    // Actual AutoSync vehicle ID
                    key:
                        vehicle.id,

                    // User-facing label
                    label,

                    // One exact vehicle represented
                    count:
                        1

                };

            }

            );


        // ==================================================
        // Return Submodel Options
        // ==================================================

        return NextResponse.json({

            success: true,

            level: "submodel",

            selection: {

            make,

            model,

            year,

            submodel: null

            },

            count:
            options.length,

            options

        });

    }


    // ==================================================
    // MAKE LEVEL
    //
    // GET /api/vehicles
    //
    // Return:
    //
    // - make
    // - vehicle count
    // - default image
    // - img_url_base
    // ==================================================


        if (level === "make") {

            const options =
                await getCachedMakes();

            return NextResponse.json({

                success: true,

                level: "make",

                count: options.length,

                options

            });

        }




    // ==================================================
    // MODEL / YEAR / SUBMODEL
    //
    // Regular aggregation
    // ==================================================

    const response =
      await openSearchClient.search({

        index: INDEX_NAME,


        body: {

          size: 0,


          query: {

            bool: {

              filter: filters

            }

          },


          aggs: {

            options: {

              terms: {

                field: level,

                size: 10000,

                order: {

                  _key: "asc"

                }

              }

            }

          }

        }

      });



    // ==================================================
    // Extract buckets
    // ==================================================

    const buckets =
      response
        .body
        .aggregations
        ?.options
        ?.buckets || [];



    // ==================================================
    // Format options
    // ==================================================

    const options =
      buckets.map(

        bucket => ({

          key:
            bucket.key,

          label:
            bucket.key,

          count:
            bucket.doc_count

        })

      );



    // ==================================================
    // Return cascading options
    // ==================================================

    return NextResponse.json({

      success: true,

      level,

      selection: {

        make,

        model,

        year,

        submodel

      },


      count:
        options.length,


      options

    });



  } catch (error) {


    console.error(

      "Vehicle API error:",

      error

    );


    return NextResponse.json(

      {

        success: false,

        error:
          "Failed to fetch vehicles",

        message:
          error.message

      },

      {

        status: 500

      }

    );

  }

}