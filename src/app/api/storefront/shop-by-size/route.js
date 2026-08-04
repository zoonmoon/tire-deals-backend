import openSearchClient from "../../setup-database/_lib/route";

const INDEX_NAME = "all_tires";

// ======================================================
// Helpers
// ======================================================

const GLOBAL_INVENTORY_FILTERS=  [

  {
    term: {
      is_mysql_mapped: true
    }
  },

  {
    term: {
      status: "active"
    }
  },
  
]

function getNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

function cleanNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return value;
  }

  return Number(
    number.toFixed(2)
  );
}


// ======================================================
// GET /api/storefront/shop-by-size
// ======================================================

export async function GET(request) {

  const {
    searchParams
  } = new URL(request.url);


  // ====================================================
  // Read query params
  // ====================================================

  const sectionWidth =
    getNumber(
      searchParams.get(
        "section_width"
      )
    );


  const aspectRatio =
    getNumber(
      searchParams.get(
        "aspect_ratio"
      )
    );


  const diameter =
    getNumber(
      searchParams.get(
        "diameter"
      )
    );


  const inchWidth =
    getNumber(
      searchParams.get(
        "inch_width"
      )
    );


  const rimDiameter =
    getNumber(
      searchParams.get(
        "rim_diameter"
      )
    );


  try {


    // ==================================================
    // STEP 1
    //
    // No parameters
    //
    // Metric:
    // section_width
    //
    // Flotation:
    // diameter
    // ==================================================

    if (
      sectionWidth === null &&
      aspectRatio === null &&
      diameter === null &&
      inchWidth === null &&
      rimDiameter === null
    ) {


      const result =
        await openSearchClient.search({

          index: INDEX_NAME,

          body: {

            size: 0,

            aggs: {


              // ========================================
              // METRIC
              // ========================================

              metric: {

                filter: {

                  bool: {

                    filter: [

                      ...GLOBAL_INVENTORY_FILTERS,

                      {
                        term: {
                          size_format: "M"
                        }
                      }

                    ]

                  }

                },

                aggs: {

                  values: {

                    terms: {

                      field:
                        "section_width",

                      size: 1000,

                      order: {

                        _key: "asc"

                      }

                    }

                  }

                }

              },


              // ========================================
              // FLOTATION
              // ========================================

              flotation: {

                filter: {

                  bool: {

                    filter: [

                      ...GLOBAL_INVENTORY_FILTERS,

                      {
                        term: {
                          size_format: "F"
                        }
                      }

                    ]

                  }

                },

                aggs: {

                  values: {

                    terms: {

                      field:
                        "diameter",

                      size: 1000,

                      order: {

                        _key: "asc"

                      }

                    }

                  }

                }

              }

            }

          }

        });


      const metricOptions =

        result.body
          .aggregations
          .metric
          .values
          .buckets

          .map(item => ({

            value:
              cleanNumber(
                item.key
              ),

            key:
              "section_width",

            label:
              "Section Width",

            format:
              "M",

            step:
              1

          }));


      const flotationOptions =

        result.body
          .aggregations
          .flotation
          .values
          .buckets

          .map(item => ({

            value:
              cleanNumber(
                item.key
              ),

            key:
              "diameter",

            label:
              "Tire Height",

            format:
              "F",

            step:
              1

          }));


      return Response.json({

        step: 1,

        options: [

          ...metricOptions,

          ...flotationOptions

        ]

      });

    }


    // ==================================================
    // VALIDATE PARAMETER COMBINATIONS
    // ==================================================

    if (
      (
        sectionWidth !== null ||
        aspectRatio !== null
      ) &&
      (
        diameter !== null ||
        inchWidth !== null
      )
    ) {

      return Response.json(

        {

          error:
            "Cannot mix metric and flotation tire size parameters."

        },

        {

          status: 400

        }

      );

    }


    // ==================================================
    // BUILD DYNAMIC FILTERS
    //
    // Always:
    //
    // is_mysql_mapped = true
    // status = active
    //
    // Then add only populated params.
    // ==================================================

    const filters = [...GLOBAL_INVENTORY_FILTERS]

    
    // ==================================================
    // METRIC FLOW
    // ==================================================

    if (
      sectionWidth !== null
    ) {


      // -----------------------------------------------
      // Always filter metric tires
      // -----------------------------------------------

      filters.push({

        term: {

          size_format:
            "M"

        }

      });


      // -----------------------------------------------
      // Filter selected section width
      // -----------------------------------------------

      filters.push({

        term: {

          section_width:
            sectionWidth

        }

      });


      // ================================================
      // STEP 2
      //
      // section_width
      //
      // Return aspect_ratio
      // ================================================

      if (
        aspectRatio === null &&
        rimDiameter === null
      ) {


        const result =
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

                values: {

                  terms: {

                    field:
                      "aspect_ratio",

                    size: 1000,

                    order: {

                      _key: "asc"

                    }

                  }

                }

              }

            }

          });


        const options =

          result.body
            .aggregations
            .values
            .buckets

            .map(item => ({

              value:
                cleanNumber(
                  item.key
                ),

              key:
                "aspect_ratio",

              label:
                "Aspect Ratio",

              format:
                "M",

              step:
                2

            }));


        return Response.json({

          step: 2,

          options

        });

      }


      // =================================================
      // ADD ASPECT RATIO IF PROVIDED
      // =================================================

      if (
        aspectRatio !== null
      ) {

        filters.push({

          term: {

            aspect_ratio:
              aspectRatio

          }

        });

      }


      // ================================================
      // STEP 3
      //
      // section_width
      // aspect_ratio
      //
      // Return rim_diameter
      // ================================================

      if (
        aspectRatio !== null &&
        rimDiameter === null
      ) {


        const result =
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

                values: {

                  terms: {

                    field:
                      "rim_diameter",

                    size: 1000,

                    order: {

                      _key: "asc"

                    }

                  }

                }

              }

            }

          });


        const options =

          result.body
            .aggregations
            .values
            .buckets

            .map(item => ({

              value:
                cleanNumber(
                  item.key
                ),

              key:
                "rim_diameter",

              label:
                "Rim Diameter",

              format:
                "M",

              step:
                3

            }));


        return Response.json({

          step: 3,

          options

        });

      }


      // =================================================
      // ADD RIM DIAMETER IF PROVIDED
      // =================================================

      if (
        rimDiameter !== null
      ) {

        filters.push({

          term: {

            rim_diameter:
              rimDiameter

          }

        });

      }


      // ================================================
      // FINAL METRIC SEARCH
      // ================================================

      if (
        aspectRatio !== null &&
        rimDiameter !== null
      ) {


        const result =
          await openSearchClient.search({

            index: INDEX_NAME,

            body: {

              size: 100,

              query: {

                bool: {

                  filter: filters

                }

              }

            }

          });


        return Response.json({

          step: 4,

          format:
            "M",

          total:
            result.body.hits.total.value,

          tires:

            result.body.hits.hits

              .map(hit => ({

                id:
                  hit._id,

                ...hit._source

              }))

        });

      }

    }


    // ==================================================
    // FLOTATION FLOW
    // ==================================================

    if (
      diameter !== null
    ) {


      // -----------------------------------------------
      // Always filter flotation tires
      // -----------------------------------------------

      filters.push({

        term: {

          size_format:
            "F"

        }

      });


      // -----------------------------------------------
      // Filter selected tire diameter
      // -----------------------------------------------

      filters.push({

        term: {

          diameter:
            diameter

        }

      });


      // ================================================
      // STEP 2
      //
      // diameter
      //
      // Return inch_width
      // ================================================

      if (
        inchWidth === null &&
        rimDiameter === null
      ) {


        const result =
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

                values: {

                  terms: {

                    field:
                      "inch_width",

                    size: 1000,

                    order: {

                      _key: "asc"

                    }

                  }

                }

              }

            }

          });


        const options =

          result.body
            .aggregations
            .values
            .buckets

            .map(item => ({

              value:
                cleanNumber(
                  item.key
                ),

              key:
                "inch_width",

              label:
                "Tire Width",

              format:
                "F",

              step:
                2

            }));


        return Response.json({

          step: 2,

          options

        });

      }


      // =================================================
      // ADD INCH WIDTH IF PROVIDED
      // =================================================

      if (
        inchWidth !== null
      ) {

        filters.push({

          term: {

            inch_width:
              inchWidth

          }

        });

      }


      // ================================================
      // STEP 3
      //
      // diameter
      // inch_width
      //
      // Return rim_diameter
      // ================================================

      if (
        inchWidth !== null &&
        rimDiameter === null
      ) {


        const result =
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

                values: {

                  terms: {

                    field:
                      "rim_diameter",

                    size: 1000,

                    order: {

                      _key: "asc"

                    }

                  }

                }

              }

            }

          });


        const options =

          result.body
            .aggregations
            .values
            .buckets

            .map(item => ({

              value:
                cleanNumber(
                  item.key
                ),

              key:
                "rim_diameter",

              label:
                "Rim Diameter",

              format:
                "F",

              step:
                3

            }));


        return Response.json({

          step: 3,

          options

        });

      }


      // =================================================
      // ADD RIM DIAMETER IF PROVIDED
      // =================================================

      if (
        rimDiameter !== null
      ) {

        filters.push({

          term: {

            rim_diameter:
              rimDiameter

          }

        });

      }


      // ================================================
      // FINAL FLOTATION SEARCH
      // ================================================

      if (
        inchWidth !== null &&
        rimDiameter !== null
      ) {


        const result =
          await openSearchClient.search({

            index: INDEX_NAME,

            body: {

              size: 100,

              query: {

                bool: {

                  filter: filters

                }

              }

            }

          });


        return Response.json({

          step: 4,

          format:
            "F",

          total:
            result.body.hits.total.value,

          tires:

            result.body.hits.hits

              .map(hit => ({

                id:
                  hit._id,

                ...hit._source

              }))

        });

      }

    }


    // ==================================================
    // INVALID REQUEST
    // ==================================================

    return Response.json(

      {

        error:
          "Invalid or incomplete tire size parameters."

      },

      {

        status: 400

      }

    );


  } catch (error) {


    console.error(

      "❌ Shop by size API error:",

      error

    );


    return Response.json(

      {

        error:
          error.message ||
          "Internal server error"

      },

      {

        status: 500

      }

    );

  }

}