import { writeFile, appendFile } from "node:fs/promises";
import path from "node:path";

import openSearchClient from "../setup-database/_lib/route";

const INDEX_NAME = "all_vehicles";
const BATCH_SIZE = 5000;

const OUTPUT_FILE = path.join(
  process.cwd(),
  "vehicle-oe-fitment-knowledge.txt"
);


// ======================================================
// Remove duplicate values
// ======================================================

function unique(values) {

  return [
    ...new Set(
      values
        .filter(Boolean)
        .map(value =>
          String(value).trim()
        )
        .filter(Boolean)
    )
  ];

}


// ======================================================
// Extract OE Tire Fitment
// ======================================================

function getOETireFitments(vehicle) {

  const fitments =
    Array.isArray(vehicle.fitments)
      ? vehicle.fitments
      : [];


  const tireSizes =
    fitments.flatMap(
      fitment => {

        const sizes = [];


        // Standard / front tire size

        if (
          fitment.tire_size
        ) {

          sizes.push(
            fitment.tire_size
          );

        }


        // Rear tire size
        // For staggered fitments

        if (
          fitment.tire_size_rear
        ) {

          sizes.push(
            fitment.tire_size_rear
          );

        }


        return sizes;

      }
    );


  return unique(
    tireSizes
  );

}


// ======================================================
// Format Vehicle
// ======================================================

function formatVehicle(
  vehicle
) {

  const oeTireSizes =
    getOETireFitments(
      vehicle
    );


  return [

    "VEHICLE FITMENT DATA",

    `Year: ${
      vehicle.year ??
      "Unknown"
    }`,

    `Make: ${
      vehicle.make ??
      "Unknown"
    }`,

    `Model: ${
      vehicle.model ??
      "Unknown"
    }`,

    `Submodel/Trim: ${
      vehicle.submodel ??
      "Unknown"
    }`,

    `Body: ${
      vehicle.body ??
      "Unknown"
    }`,

    `OE Tire Fitment: ${
      oeTireSizes.length
        ? oeTireSizes.join(", ")
        : "No OE tire size available"
    }`,

    "This record contains vehicle OE tire fitment information.",

    ""

  ].join("\n");

}


// ======================================================
// GET Route
// ======================================================

export async function GET() {

  try {

    console.log(
      "Starting vehicle fitment export..."
    );


    // ==================================================
    // Create / overwrite file
    // ==================================================

    await writeFile(

      OUTPUT_FILE,

      [

        "VEHICLE OE TIRE FITMENT KNOWLEDGE BASE",

        "",

        "IMPORTANT INSTRUCTIONS FOR AI:",

        "The following data contains vehicle OE tire fitment information.",

        "Use Year, Make, Model, Submodel/Trim, and Body to identify a vehicle.",

        "The OE Tire Fitment field contains the original-equipment tire size associated with the vehicle.",

        "Use this information as the source of truth when answering questions about OE tire sizes.",

        "If multiple vehicles match the Year, Make, and Model, use the Submodel/Trim to identify the correct vehicle.",

        "Do not guess or invent a tire size when no matching fitment exists.",

        "When a customer asks what tire size fits their vehicle, identify the matching vehicle and return the corresponding OE Tire Fitment.",

        "",

        "============================================================",

        ""

      ].join("\n"),

      "utf8"

    );


    // ==================================================
    // INITIAL SEARCH
    // ==================================================

    console.log(
      `Fetching first batch of ${BATCH_SIZE} vehicles...`
    );


    let response =
      await openSearchClient.search({

        // IMPORTANT:
        // index is OUTSIDE body

        index:
          INDEX_NAME,

        body: {

          size:
            BATCH_SIZE,

          _source: [

            "year",

            "make",

            "model",

            "submodel",

            "body",

            "fitments"

          ],

          query: {

            match_all: {}

          }

        },

        scroll:
          "5m"

      });


    // ==================================================
    // Read OpenSearch response
    // ==================================================

    let hits =
      response.body?.hits?.hits ||
      response.hits?.hits ||
      [];


    let scrollId =
      response.body?._scroll_id ||
      response._scroll_id;


    let total =
      0;


    let batchNumber =
      1;


    console.log(
      `Batch ${batchNumber}: ${hits.length} vehicles`
    );


    // ==================================================
    // PROCESS ALL BATCHES
    // ==================================================

    while (
      hits.length > 0
    ) {


      // ------------------------------------------------
      // Convert vehicles to text
      // ------------------------------------------------

      const text =

        hits

          .map(
            hit =>
              formatVehicle(
                hit._source
              )
          )

          .join("\n");


      // ------------------------------------------------
      // Append to TXT
      // ------------------------------------------------

      await appendFile(

        OUTPUT_FILE,

        text,

        "utf8"

      );


      total +=
        hits.length;


      console.log(

        `Batch ${batchNumber} exported: ${hits.length} vehicles`

      );


      console.log(

        `Total vehicles exported: ${total}`

      );


      // ------------------------------------------------
      // Fetch next batch
      // ------------------------------------------------

      response =
        await openSearchClient.scroll({

          scroll_id:
            scrollId,

          scroll:
            "5m"

        });


      // ------------------------------------------------
      // Get next hits
      // ------------------------------------------------

      hits =
        response.body?.hits?.hits ||
        response.hits?.hits ||
        [];


      scrollId =
        response.body?._scroll_id ||
        response._scroll_id;


      if (
        hits.length > 0
      ) {

        batchNumber++;


        console.log(

          `Fetching batch ${batchNumber}...`

        );

      }

    }


    // ==================================================
    // End Marker
    // ==================================================

    await appendFile(

      OUTPUT_FILE,

      [

        "",

        "============================================================",

        "END OF VEHICLE OE TIRE FITMENT DATA",

        `Total vehicles exported: ${total}`,

        "============================================================",

        ""

      ].join("\n"),

      "utf8"

    );


    console.log(
      "Vehicle export completed successfully."
    );


    console.log(
      `Total vehicles exported: ${total}`
    );


    return Response.json({

      success:
        true,

      message:
        "Vehicle fitment export completed",

      totalVehicles:
        total,

      file:
        OUTPUT_FILE

    });


  } catch (error) {

    console.error(

      "Vehicle export failed:",

      error

    );


    return Response.json(

      {

        success:
          false,

        message:
          error.message

      },

      {

        status:
          500

      }

    );

  }

}