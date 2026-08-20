import { NextResponse } from "next/server";
import openSearchClient from "../../setup-database/_lib/route";

const TIRES_INDEX = "all_tires";
const VEHICLES_INDEX = "all_vehicles";

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;


// ======================================================
// GLOBAL TIRE FILTERS
// ======================================================

const GLOBAL_TIRE_FILTERS = [

  {
    term: {
      status: "active",
    },
  },

  {
    term: {
      is_mysql_mapped: true,
    },
  },

];


// ======================================================
// FILTER CONFIGURATION
// ======================================================

const FILTER_CONFIG = {

  // Basic

  brand: {
    field: "brand",
    type: "keyword",
  },

  model: {
    field: "model",
    type: "keyword",
  },

  size_format: {
    field: "size_format",
    type: "keyword",
  },


  // Metric

  section_width: {
    field: "section_width",
    type: "integer",
  },

  aspect_ratio: {
    field: "aspect_ratio",
    type: "integer",
  },


  // Flotation

  diameter: {
    field: "diameter",
    type: "float",
  },

  inch_width: {
    field: "inch_width",
    type: "float",
  },


  // Common

  rim_diameter: {
    field: "rim_diameter",
    type: "integer",
  },


  // Physical

  overall_diameter: {
    field: "overall_diameter",
    type: "float",
  },

  overall_width: {
    field: "overall_width",
    type: "float",
  },

  weight: {
    field: "weight",
    type: "float",
  },

  tread_depth: {
    field: "tread_depth",
    type: "float",
  },


  // Performance

  speed_rating: {
    field: "speed_rating",
    type: "keyword",
  },

  load_rating: {
    field: "load_rating",
    type: "keyword",
  },

  load_range: {
    field: "load_range",
    type: "keyword",
  },

  ply_rating: {
    field: "ply_rating",
    type: "integer",
  },

  sidewall: {
    field: "sidewall",
    type: "keyword",
  },


  // Classification

  vehicle_type_tags: {
    field: "vehicle_type_tags",
    type: "keyword",
  },

  segment_tags: {
    field: "segment_tags",
    type: "keyword",
  },

  origin_country: {
    field: "origin_country",
    type: "keyword",
  },

  winter_class: {
    field: "winter_class",
    type: "keyword",
  },

  run_flat: {
    field: "run_flat",
    type: "boolean",
  },

};


// ======================================================
// AGGREGATION CONFIGURATION
// ======================================================

const AGGREGATION_CONFIG = {

  brand: {
    field: "brand",
    size: 100,
  },

  model: {
    field: "model",
    size: 100,
  },

  size_format: {
    field: "size_format",
    size: 20,
  },


  // Tire Size

  section_width: {
    field: "section_width",
    size: 100,
  },

  aspect_ratio: {
    field: "aspect_ratio",
    size: 100,
  },

  diameter: {
    field: "diameter",
    size: 100,
  },

  inch_width: {
    field: "inch_width",
    size: 100,
  },

  rim_diameter: {
    field: "rim_diameter",
    size: 100,
  },


  // Physical

  overall_diameter: {
    field: "overall_diameter",
    size: 100,
  },

  overall_width: {
    field: "overall_width",
    size: 100,
  },

  weight: {
    field: "weight",
    size: 100,
  },

  tread_depth: {
    field: "tread_depth",
    size: 100,
  },


  // Performance

  speed_rating: {
    field: "speed_rating",
    size: 50,
  },

  load_rating: {
    field: "load_rating",
    size: 100,
  },

  load_range: {
    field: "load_range",
    size: 50,
  },

  ply_rating: {
    field: "ply_rating",
    size: 50,
  },

  sidewall: {
    field: "sidewall",
    size: 50,
  },


  // Classification

  vehicle_type_tags: {
    field: "vehicle_type_tags",
    size: 100,
  },

  segment_tags: {
    field: "segment_tags",
    size: 100,
  },

  origin_country: {
    field: "origin_country",
    size: 100,
  },

  winter_class: {
    field: "winter_class",
    size: 50,
  },

  run_flat: {
    field: "run_flat",
    size: 10,
  },

};


// ======================================================
// PARSE ARRAY PARAM
// ======================================================

function parseArrayParam(value) {

  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);

}


// ======================================================
// PARSE FILTER PARAMETERS
// ======================================================

function parseFilterParams(searchParams) {

  const filters = {};


  for (
    const [key, config]
    of Object.entries(FILTER_CONFIG)
  ) {

    const rawValue =
      searchParams.get(key);

    if (!rawValue) {
      continue;
    }

    let values =
      parseArrayParam(rawValue);


    // Integer

    if (
      config.type === "integer"
    ) {

      values =
        values
          .map(Number)
          .filter(Number.isInteger);

    }


    // Float

    if (
      config.type === "float"
    ) {

      values =
        values
          .map(Number)
          .filter(
            value =>
              !Number.isNaN(value)
          );

    }


    // Boolean

    if (
      config.type === "boolean"
    ) {

      values =
        values
          .map(value => {

            if (value === "true") {
              return true;
            }

            if (value === "false") {
              return false;
            }

            return null;

          })
          .filter(
            value =>
              value !== null
          );

    }


    if (values.length > 0) {

      filters[key] =
        values;

    }

  }

  return filters;

}


// ======================================================
// GET VEHICLE
// ======================================================

async function getVehicle(vehicleId) {

  const response =
    await openSearchClient.get({

      index:
        VEHICLES_INDEX,

      id:
        vehicleId,

    });


  const result =
    response.body ||
    response;


  if (!result.found) {

    return null;

  }


  return result._source;
 // 
}



// ======================================================
// EXTRACT VEHICLE FITMENTS
// ======================================================
//
// ONLY:
//
// fitments
// optional_fitments
//
// NOT:
//
// plus_sizes
//
// ======================================================

function extractVehicleFitments(vehicle) {

  return [

    ...(vehicle.fitments || []),

    ...(vehicle.optional_fitments || []),

  ];

}


// ======================================================
// BUILD METRIC FITMENT QUERY
// ======================================================
//
// format = M
//
// Tire must match:
//
// section_width
// AND
// aspect_ratio
// AND
// rim_diameter
//
// ======================================================

function buildMetricFitmentQuery(fitment) {

  if (

    fitment.section_width === null ||
    fitment.section_width === undefined ||

    fitment.aspect_ratio === null ||
    fitment.aspect_ratio === undefined ||

    fitment.rim_diameter === null ||
    fitment.rim_diameter === undefined

  ) {

    return null;

  }


  return {

    bool: {

      filter: [

        {
          term: {
            section_width:
              fitment.section_width,
          },
        },

        {
          term: {
            aspect_ratio:
              fitment.aspect_ratio,
          },
        },

        {
          term: {
            rim_diameter:
              fitment.rim_diameter,
          },
        },

      ],

    },

  };

}


// ======================================================
// BUILD FLOTATION FITMENT QUERY
// ======================================================
//
// format = F
//
// Tire must match:
//
// diameter
// AND
// inch_width
// AND
// rim_diameter
//
// ======================================================

function buildFlotationFitmentQuery(fitment) {

  if (

    fitment.diameter === null ||
    fitment.diameter === undefined ||

    fitment.inch_width === null ||
    fitment.inch_width === undefined ||

    fitment.rim_diameter === null ||
    fitment.rim_diameter === undefined

  ) {

    return null;

  }


  return {

    bool: {

      filter: [

        {
          term: {
            diameter:
              fitment.diameter,
          },
        },

        {
          term: {
            inch_width:
              fitment.inch_width,
          },
        },

        {
          term: {
            rim_diameter:
              fitment.rim_diameter,
          },
        },

      ],

    },

  };

}


// ======================================================
// BUILD VEHICLE FITMENT QUERY
// ======================================================
//
// Each vehicle fitment is an OR.
//
// M fitment:
//
// section_width
// AND aspect_ratio
// AND rim_diameter
//
// F fitment:
//
// diameter
// AND inch_width
// AND rim_diameter
//
// ======================================================

function buildVehicleFitmentQuery(
  vehicleFitments
) {

  if (
    !vehicleFitments.length
  ) {

    return null;

  }


  const fitmentQueries = [];


  for (
    const fitment
    of vehicleFitments
  ) {

    const format =

      String(
        fitment.format || ""
      )
        .trim()
        .toUpperCase();


    let query = null;


    // Metric

    if (
      format === "M"
    ) {

      query =
        buildMetricFitmentQuery(
          fitment
        );

    }


    // Flotation

    if (
      format === "F"
    ) {

      query =
        buildFlotationFitmentQuery(
          fitment
        );

    }


    if (query) {

      fitmentQueries.push(
        query
      );

    }

  }


  if (
    !fitmentQueries.length
  ) {

    return null;

  }


  return {

    bool: {

      should:
        fitmentQueries,

      minimum_should_match:
        1,

    },

  };

}


// ======================================================
// BUILD USER FILTER QUERIES
// ======================================================
//
// excludeFilter:
//
// Used ONLY for facet aggregations.
//
// Example:
//
// Current aggregation = brand
//
// Then:
//
// brand filter is excluded
//
// but all other filters remain.
//
// ======================================================



function buildFilterQueries(
  filters,
  excludeFilter = null,
  priceRange = {}
) {

  const queries = [];

  for (
    const [
      filterName,
      values
    ]
    of Object.entries(filters)
  ) {

    if (
      filterName === excludeFilter
    ) {
      continue;
    }

    const config =
      FILTER_CONFIG[filterName];

    if (!config) {
      continue;
    }

    if (!values.length) {
      continue;
    }

    queries.push({
      terms: {
        [config.field]: values,
      },
    });

  }

  // ==========================================
  // PRICE RANGE
  // ==========================================

  if (
    Object.keys(priceRange).length > 0
  ) {

    queries.push({

      range: {

        price:
          priceRange,

      },

    });

  }

  return queries;

}



// ======================================================
// BUILD FACET AGGREGATIONS
// ======================================================
//
// THIS IS THE IMPORTANT PART.
//
// Every aggregation:
//
// 1. Uses global aggregation context.
//
// 2. Applies:
//    status = active
//
// 3. Applies:
//    is_mysql_mapped = true
//
// 4. Applies vehicle compatibility.
//
// 5. Applies ALL selected filters EXCEPT
//    the filter currently being aggregated.
//
// Example:
//
// URL:
//
// ?vehicleId=16754
// &brand=Accelera,Arisun
//
// Brand aggregation:
//
// active
// AND mysql mapped
// AND vehicle compatible
//
// NO brand filter.
//
// Therefore it can return:
//
// Accelera
// Arisun
// Atlas
// Atturo
// Bridgestone
// Continental
// Cooper
// etc.
//
// ======================================================

function buildAggregations(
  filters,
  vehicleFitmentQuery,
  priceRange
) {

  const aggs = {};


  for (
    const [
      filterName,
      config
    ]
    of Object.entries(
      AGGREGATION_CONFIG
    )
  ) {


    // ==================================================
    // Filters for this aggregation
    //
    // EXCLUDES the current filter.
    // ==================================================

    const otherFilterQueries =

      buildFilterQueries(

        filters,

        filterName,

        priceRange

      );


    // ==================================================
    // Build base filter
    //
    // These are ALWAYS applied.
    // ==================================================

    const aggregationFilters = [

      // Always active

      ...GLOBAL_TIRE_FILTERS,


      // Always vehicle compatible

      vehicleFitmentQuery,


      // All OTHER selected filters

      ...otherFilterQueries,

    ]

      .filter(Boolean);


    // ==================================================
    // GLOBAL AGGREGATION
    // ==================================================
    //
    // This is critical.
    //
    // It prevents the main search query from
    // automatically applying the current facet filter.
    //
    // Example:
    //
    // Main query:
    //
    // brand = Accelera OR Arisun
    //
    // Brand aggregation:
    //
    // DOES NOT inherit brand filter.
    //
    // ==================================================

    aggs[filterName] = {

      global: {},

      aggs: {

        filtered: {

          filter: {

            bool: {

              filter:
                aggregationFilters,

            },

          },

          aggs: {

            values: {

              terms: {

                field:
                  config.field,

                size:
                  config.size,

                order: {

                  _key:
                    "asc",

                },

              },

            },

          },

        },

      },

    };

  }


  return aggs;

}


// ======================================================
// FORMAT AGGREGATIONS
// ======================================================

function formatAggregations(
  aggregations
) {

  const filters = {};


  for (
    const [
      filterName,
      aggregation
    ]
    of Object.entries(
      aggregations || {}
    )
  ) {


    filters[filterName] =

      (

        aggregation
          ?.filtered
          ?.values
          ?.buckets

        ||

        []

      )

        .map(
          bucket => ({

            value:
              bucket.key,

            count:
              bucket.doc_count,

          })
        );

  }


  return filters;

}


// ======================================================
// FORMAT TIRE
// ======================================================

function formatTire(hit) {

  return {

    id:
      hit._id,

    score:
      hit._score,

    ...hit._source,

  };

}


// ======================================================
// GET
// ======================================================

export async function GET(request) {

  try {

    // ==================================================
    // URL
    // ==================================================

    const {
      searchParams
    } =

      new URL(
        request.url
      );


    // ==================================================
    // VEHICLE ID
    // ==================================================

    const vehicleId =

      searchParams.get(
        "submodel"
      );
      

    if (!vehicleId) {

      // return NextResponse.json(

      //   {

      //     success:
      //       false,

      //     error:
      //       "vehicleId is required",

      //   },

      //   {

      //     status:
      //       400,

      //   }

      // );

    }





    // ==================================================
    // PAGINATION
    // ==================================================

    const page =

      Math.max(

        1,

        Number(

          searchParams.get(
            "page"
          )

        ) || 1

      );


    const limit =

      Math.min(

        MAX_PAGE_SIZE,

        Math.max(

          1,

          Number(

            searchParams.get(
              "limit"
            )

          ) ||
          DEFAULT_PAGE_SIZE

        )

      );


    const from =

      (
        page - 1
      ) * limit;


    // ==================================================
    // PARSE FILTERS
    // ==================================================

    const filters =

      parseFilterParams(
        searchParams
      );



      const minPriceParam =
        searchParams.get("min_price");

      const maxPriceParam =
        searchParams.get("max_price");

      const priceRange = {};

      const minPrice =
        Number(minPriceParam);

      const maxPrice =
        Number(maxPriceParam);

        
      // Valid minimum price
      if (
        minPriceParam !== null &&
        Number.isFinite(minPrice) &&
        minPrice >= 0
      ) {

        priceRange.gte =
          minPrice;

      }


      // Valid maximum price
      if (
        maxPriceParam !== null &&
        Number.isFinite(maxPrice) &&
        maxPrice >= 0
      ) {

        priceRange.lte =
          maxPrice;

      }


      // If min > max, ignore the entire price filter
      if (
        priceRange.gte !== undefined &&
        priceRange.lte !== undefined &&
        priceRange.gte > priceRange.lte
      ) {

        // Reset price filter
        Object.keys(priceRange).forEach(
          key => delete priceRange[key]
        );

      }





    const appliedFilters = {
      ...filters,
    };

    if (Object.keys(priceRange).length > 0) {
      appliedFilters.price = priceRange;
    }

    // ==================================================
    // GET VEHICLE
    // ==================================================

    let vehicle = null;

    let vehicleFitments = [];

    let vehicleFitmentQuery = null;


    if (vehicleId) {

      vehicle =

      await getVehicle(
        vehicleId
      );

      if (!vehicle) {

        return NextResponse.json(

          {

            success:
              false,

            error:
              "Vehicle not found",

          },

          {

            status:
              404,

          }

        );

      }

      // ==================================================
      // VEHICLE FITMENTS
      // ==================================================
      //
      // Only:
      //
      // fitments
      // optional_fitments
      //
      // NOT plus_sizes
      //
      // ==================================================

      vehicleFitments =

      extractVehicleFitments(
        vehicle
      );


      // ==================================================
      // VEHICLE COMPATIBILITY QUERY
      // ==================================================

      vehicleFitmentQuery =

      buildVehicleFitmentQuery(
        vehicleFitments
      );

    }

    // if (!vehicleFitmentQuery) {

    //   return NextResponse.json({

    //     success:
    //       true,

    //     vehicle: {

    //       id:
    //         vehicle.id,

    //       year:
    //         vehicle.year,

    //       make:
    //         vehicle.make,

    //       model:
    //         vehicle.model,

    //       submodel:
    //         vehicle.submodel,

    //       body:
    //         vehicle.body,

    //       doors:
    //         vehicle.doors,

    //     },

    //     vehicleFitments,

    //     tires: [],

    //     total: 0,

    //     page,

    //     limit,

    //     totalPages: 0,

    //     appliedFilters:
    //       appliedFilters,

    //     filters: {},

    //   });

    // }


    // ==================================================
    // USER FILTER QUERIES
    // ==================================================

    const filterQueries =

      buildFilterQueries(
        filters,
        null,
        priceRange
      );


    // ==================================================
    // MAIN SEARCH FILTERS
    // ==================================================
    //
    // ALWAYS:
    //
    // status = active
    // is_mysql_mapped = true
    // vehicle compatibility
    //
    // PLUS:
    //
    // user filters
    //
    // ==================================================


    const must = [
      ...GLOBAL_TIRE_FILTERS,

      vehicleFitmentQuery,

      ...filterQueries,

      // Price range
      // Object.keys(priceRange).length > 0
      //   ? {
      //       range: {
      //         price: priceRange,
      //       },
      //     }
      //   : null,

    ].filter(Boolean);



    // ==================================================
    // BUILD AGGREGATIONS
    // ==================================================

    const aggs =

      buildAggregations(

        filters,

        vehicleFitmentQuery,

        priceRange

      );


    // ==================================================
    // SORT
    // ==================================================

    const sortParam =

      searchParams.get(
        "sort"
      );


    let sort = [

      {
        _score:
          "desc",
      },

    ];


    // Price ascending

    if (
      sortParam ===
      "price_asc"
    ) {

      sort = [

        {

          price: {

            order:
              "asc",

            missing:
              "_last",

          },

        },

      ];

    }


    // Price descending

    if (
      sortParam ===
      "price_desc"
    ) {

      sort = [

        {

          price: {

            order:
              "desc",

            missing:
              "_last",

          },

        },

      ];

    }


    // Brand ascending

    if (
      sortParam ===
      "brand_asc"
    ) {

      sort = [

        {

          brand: {

            order:
              "asc",

          },

        },

      ];

    }


    // ==================================================
    // OPENSEARCH SEARCH
    // ==================================================

    const response =

      await openSearchClient.search({

        index:
          TIRES_INDEX,

        body: {

          from,

          size:
            limit,

          track_total_hits:
            true,


          // ==========================================
          // MAIN SEARCH
          // ==========================================

          query: {

            bool: {

              filter:
                must,

            },

          },


          // ==========================================
          // FACETS
          // ==========================================

          aggs,


          // ==========================================
          // SORT
          // ==========================================

          sort,

        },

      });


    // ==================================================
    // NORMALIZE OPENSEARCH RESPONSE
    // ==================================================

    const result =

      response.body ||
      response;


    // ==================================================
    // TIRES
    // ==================================================

    const tires =

      (

        result
          ?.hits
          ?.hits

        ||

        []

      )

        .map(
          formatTire
        );


    // ==================================================
    // TOTAL
    // ==================================================

    const total =

      typeof result
        ?.hits
        ?.total ===
      "object"

        ? result.hits.total.value

        : result.hits.total;


    // ==================================================
    // FILTER OPTIONS
    // ==================================================

    const availableFilters =

      formatAggregations(

        result
          ?.aggregations

      );


    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json({

      success:
        true,


      // Vehicle



      vehicle: vehicle
        ? {
            id: vehicle.id,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            submodel: vehicle.submodel,
            body: vehicle.body,
            doors: vehicle.doors,
          }
        : null,
    
      // Vehicle fitments

      vehicleFitments,

      // Tires

      tires: tires.map(t => ({
        ...t, 
        tire_inventory_id: t.mysql_id,  
        thumbnail: ( t?.img_url_base || "") + ( t?.img_thumb || "") 
      })),

      // Pagination

      total,

      page,

      limit,

      totalPages:

        Math.ceil(

          total /
          limit

        ),


      // Applied filters

      appliedFilters:
        appliedFilters,


      // Available filters

      filters:
        availableFilters,

    });


  } catch (error) {

    console.error(

      "Tire search failed:",

      error

    );


    return NextResponse.json(

      {

        success:
          false,

        error:
          "Failed to fetch tires",

        message:
          error.message,

      },

      {

        status:
          500,

      }

    );

  }

}