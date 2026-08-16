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
// Searches vehicle_key using wildcard.
//
// Examples:
//
// ?query=toyota
// ?query=toyota camry
// ?query=2023 toyota camry
//
// Each search term must exist somewhere inside
// vehicle_key.
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
    // "Toyota Camry"
    //
    // becomes:
    //
    // [
    //   "toyota",
    //   "camry"
    // ]
    // ==================================================

    const searchTerms =
      query
        .split(/\s+/)
        .map(normalize)
        .filter(Boolean);


    // ==================================================
    // Build wildcard conditions
    //
    // Every search term must match somewhere inside
    // vehicle_key.
    //
    // Example:
    //
    // "toyota camry"
    //
    // becomes:
    //
    // *toyota*
    //
    // AND
    //
    // *camry*
    // ==================================================

    const wildcardConditions =
      searchTerms.map(term => ({

        fuzzy: {

          make: {

            value:
              `${term}`
          }

        }

      }));


    // ==================================================
    // Search vehicles
    // ==================================================

    const response =
      await openSearchClient.search({

        index: INDEX_NAME,

        body: {

          size: 1000,

          track_total_hits: true,

          query: {

            fuzzy: {
                make: {
                    value: searchTerms.join(" ")
                }
            }

          },


          // ==================================================
          // Sort results
          // ==================================================

          sort: [

            {
              year: {
                order: "desc"
              }
            },

            {
              make: {
                order: "asc"
              }
            },

            {
              model: {
                order: "asc"
              }
            },

            {
              submodel: {
                order: "asc"
              }
            },

            {
              id: {
                order: "asc"
              }
            }

          ],


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
    // Duplicate detection is based on:
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
    // Build results
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
            year,
            make,
            model,
            submodelLabel

          ]
            .filter(Boolean)
            .join(" ");


        // ==================================================
        // Return frontend structure
        // ==================================================

        return {

          // Actual AutoSync vehicle ID

          key:
            vehicle.id,


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