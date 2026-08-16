import { NextResponse } from "next/server";

import openSearchClient from "@/app/api/setup-database/_lib/route";

const INDEX_NAME = "all_tires";


// ======================================================
// Global inventory filters
// ======================================================

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
// Normalize search term
// ======================================================

const normalize = (value) => {

  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

};


// ======================================================
// GET /api/storefront/shop-by-size/search?query=285
//
// Searches size_normalized using wildcard.
//
// Example indexed value:
//
//     28570r17 bfgoodrichallterraintako2
//
// Queries:
//
//     285
//     28570r17
//     285 goodrich
//     michelin 285
//
// Each search term must exist somewhere inside
// size_normalized.
// ======================================================

export async function GET(request) {

  try {

    // ==================================================
    // Read query
    // ==================================================

    const {
      searchParams
    } = new URL(request.url);


    const query =
      searchParams
        .get("query")
        ?.trim() || "";


    // ==================================================
    // Validate query
    // ==================================================

    if (!query) {

      return NextResponse.json(

        {
          success: false,

          error:
            "query parameter is required"
        },

        {
          status: 400
        }

      );

    }


    // ==================================================
    // Normalize each search term separately
    //
    // Example:
    //
    // "285/70R17 Goodrich"
    //
    // becomes:
    //
    // [
    //   "28570r17",
    //   "goodrich"
    // ]
    // ==================================================

    const searchTerm = normalize(query)


    // ==================================================
    // Build wildcard conditions
    //
    // Every term must match somewhere inside
    // size_normalized.
    //
    // Example:
    //
    // 285 goodrich
    //
    // becomes:
    //
    // *285*
    //
    // AND
    //
    // *goodrich*
    // ==================================================




    // ==================================================
    // Search tires
    // ==================================================

    const response =
      await openSearchClient.search({

        index: INDEX_NAME,

        body: {

          size: 10000,

          track_total_hits: true,

   
            "query": {
                "bool": {
                    "must": [
                        ...GLOBAL_INVENTORY_FILTERS,
                        {
                            "match": {
                                "size_search": {
                                    "query": searchTerm
                                }
                            }
                        }
                    ]
                }
            },



          // ============================================
          // Only return fields needed by frontend
          // ============================================

          _source: [

            "size",
            "size_format",

            "section_width",
            "aspect_ratio",

            "diameter",
            "inch_width",

            "rim_diameter"

          ]

        }

      });


    // ==================================================
    // Extract matching documents
    // ==================================================

    const hits =
      response.body
        ?.hits
        ?.hits || [];


    // ==================================================
    // Build unique size options
    // ==================================================

    const sizeMap =
      new Map();


    for (const hit of hits) {

      const tire =
        hit?._source;


      if (!tire) {
        continue;
      }


      const size =
        tire.size || "";


      if (!size) {
        continue;
      }


      // ==================================================
      // Skip duplicate sizes
      // ==================================================

      if (sizeMap.has(size)) {
        continue;
      }


      // ==================================================
      // METRIC
      // ==================================================

      if (
        tire.size_format === "M"
      ) {

        sizeMap.set(

          size,

          {

            label:
              size,

            format:
              "M",

            specs: {

              section_width:
                tire.section_width ?? null,

              aspect_ratio:
                tire.aspect_ratio ?? null,

              rim_diameter:
                tire.rim_diameter ?? null

            }

          }

        );

      }


      // ==================================================
      // FLOTATION
      // ==================================================

      else if (
        tire.size_format === "F"
      ) {

        sizeMap.set(

          size,

          {

            label:
              size,

            format:
              "F",

            specs: {

              diameter:
                tire.diameter ?? null,

              inch_width:
                tire.inch_width ?? null,

              rim_diameter:
                tire.rim_diameter ?? null

            }

          }

        );

      }

    }


    // ==================================================
    // Convert Map -> array
    // ==================================================

    const options =
      Array.from(
        sizeMap.values()
      );


    // ==================================================
    // Sort naturally
    // ==================================================

    options.sort(

      (a, b) =>

        a.label.localeCompare(

          b.label,

          undefined,

          {

            numeric: true,

            sensitivity: "base"

          }

        )

    );


    // ==================================================
    // Return response
    // ==================================================

    return NextResponse.json({

      success: true,

      level:
        "search",

      query,

      count:
        options.length,

      options

    });


  } catch (error) {

    console.error(

      "❌ Tire size search API error:",

      error

    );


    return NextResponse.json(

      {

        success: false,

        error:
          "Failed to search tire sizes",

        message:
          error.message

      },

      {

        status: 500

      }

    );

  }

}