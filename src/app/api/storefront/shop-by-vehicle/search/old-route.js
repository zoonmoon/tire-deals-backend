import { NextResponse } from "next/server";

import openSearchClient from "@/app/api/setup-database/_lib/route";

const INDEX_NAME = "all_vehicles";


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
// GET /api/vehicles/search?query=toyota camry
//
// Searches vehicle_search.
//
// EVERY search term must match.
//
// Each individual term:
//
//     fuzzy OR wildcard
//
// Example:
//
// ?query=porsc carre 2004
//
// becomes:
//
//     (porsc fuzzy OR *porsc*)
//     AND
//     (carre fuzzy OR *carre*)
//     AND
//     (2004 fuzzy OR *2004*)
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
    // Normalize search terms
    //
    // Example:
    //
    // "Porsc Carre 2004"
    //
    // becomes:
    //
    // [
    //   "porsc",
    //   "carre",
    //   "2004"
    // ]
    // ==================================================

    const searchTerms =
      query
        .split(/\s+/)
        .map(normalize)
        .filter(Boolean);


    // ==================================================
    // Build conditions
    //
    // EVERY term is required.
    //
    // For EACH term:
    //
    // fuzzy OR wildcard
    // ==================================================

    const termConditions =
      searchTerms.map(term => ({

        bool: {

          should: [

            // ==========================================
            // Fuzzy matching
            //
            // Handles typos.
            //
            // porche -> porsche
            // carrear -> carrera
            // ==========================================

            {
              match: {

                vehicle_search: {
                  
                  query:
                    term,

                  fuzziness: 2


                }

              }

            },


            // ==========================================
            // Wildcard matching
            //
            // Handles partial/substring input.
            //
            // porsc -> porsche
            // carr  -> carrera
            // ==========================================

            {
              wildcard: {

                vehicle_search: {

                  value:
                    `*${term}*`

                }

              }

            }

          ],

          // At least ONE of fuzzy/wildcard
          // must match for this term.

          minimum_should_match:
            1

        }

      }));


    console.log(termConditions) 

    // ==================================================
    // Search vehicles
    // ==================================================

    const response =
      await openSearchClient.search({

        index: INDEX_NAME,

        body: {

          size: 1000,

          track_total_hits: true,


          // ==================================================
          // OUTER BOOL
          //
          // ALL search terms must match.
          // ==================================================

          query: {

            bool: {

              must:
                termConditions

            }

          },


          // ==================================================
          // Sort results
          // ==================================================

   


          // ==================================================
          // Fields required by frontend
          // ==================================================

          _source: [

            "id",

            "year",

            "make",

            "model",

            "submodel",

            "body",

            "doors",

            "vehicle_search",

            "vehicle_key"

          ]

        }

      });


    // ==================================================
    // Extract vehicles
    // ==================================================

    const vehicles =
      response.body
        ?.hits
        ?.hits
        ?.map(hit => hit._source)
        || [];


    // ==================================================
    // Calculate duplicate submodels
    //
    // Duplicate detection:
    //
    // YEAR + MAKE + MODEL + SUBMODEL
    // ==================================================

    const submodelCounts =
      new Map();


    for (const vehicle of vehicles) {

      const groupKey =
        [
          vehicle.year,
          vehicle.make,
          vehicle.model

        ].join("|");


      const submodel =
        vehicle.submodel || "";


      const countKey =
        `${groupKey}|${submodel}`;


      submodelCounts.set(

        countKey,

        (submodelCounts.get(countKey) || 0) + 1

      );

    }


    // ==================================================
    // Build frontend results
    // ==================================================

    const options =
      vehicles.map(vehicle => {

        const year =
          vehicle.year;


        const make =
          vehicle.make || "";


        const model =
          vehicle.model || "";


        const submodel =
          vehicle.submodel || "";


        const groupKey =
          [
            year,
            make,
            model

          ].join("|");


        const countKey =
          `${groupKey}|${submodel}`;


        const isDuplicate =
          submodelCounts.get(countKey) > 1;


        // ==================================================
        // Build submodel label
        // ==================================================

        let submodelLabel =
          submodel;


        if (isDuplicate) {

          const parts = [

            submodel,

            vehicle.body || null,

            vehicle.doors
              ? `${vehicle.doors} Door`
              : null

          ];


          submodelLabel =
            parts
              .filter(Boolean)
              .join(" ");

        }


        // ==================================================
        // Complete vehicle label
        // ==================================================

        const label =
          [
            make,
            model,
            year,
            submodelLabel

          ]
            .filter(Boolean)
            .join(" ");


        // ==================================================
        // Return frontend structure
        // ==================================================

        return {

          // Actual AutoSync vehicle ID

   

          // Complete vehicle label

          label,


          // Make

          make: {

            key:
              make,

            label:
              make

          },


          // Model

          model: {

            key:
              model,

            label:
              model

          },


          // Year

          year: {

            key:
              year,

            label:
              String(year)

          },


          // Submodel

          submodel: {

            key:
              vehicle.id,

            label:
              submodelLabel

          }

        };

      });


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

      "Vehicle search API error:",

      error

    );


    return NextResponse.json(

      {

        success: false,

        error:
          "Failed to search vehicles",

        message:
          error.message

      },

      {

        status: 500

      }

    );

  }

}