import { writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";

import openSearchClient from "../setup-database/_lib/route";

const INDEX_NAME = "all_vehicles";
const BATCH_SIZE = 5000;
const TOTAL_CHUNKS = 10;

const OUTPUT_DIR = path.join(
  process.cwd(),
  "vehicle-oe-fitment-pdfs"
);


// ======================================================
// AI INSTRUCTIONS
// ======================================================

const AI_INSTRUCTIONS = `Vehicle Fitment

VEHICLE OE TIRE FITMENT KNOWLEDGE BASE

IMPORTANT INSTRUCTIONS FOR AI:

The following data contains vehicle OE (Original Equipment) tire fitment information.

Use the following vehicle attributes to identify the correct vehicle:

Year

Make

Model

Submodel

Body

The "OE Tire Fitment" field contains the original-equipment tire size(s) for the corresponding vehicle.

VEHICLE SELECTION FLOW:

Ask the customer for the vehicle Year.

Ask the customer for the vehicle Make.

Ask the customer for the vehicle Model.

After receiving the Year, Make, and Model, identify all matching vehicles in this knowledge base.

If multiple Submodel options are available for the selected Year, Make, and Model, present the available Submodel options to the customer and allow the customer to choose one.

After the customer selects a Submodel, check whether the selected Year, Make, Model, and Submodel uniquely identify one vehicle.

If the selected Year, Make, Model, and Submodel match multiple vehicles, present the available Body options to the customer and allow the customer to choose the correct Body.

Once the vehicle is uniquely identified, use the corresponding vehicle record to provide the OE Tire Fitment.

If the vehicle is already uniquely identified by the Year, Make, Model, and Submodel, do not ask for Body unnecessarily. Provide the corresponding OE Tire Fitment directly.

If no matching vehicle or OE tire fitment is found in this knowledge base, clearly state that the requested fitment could not be found.

IMPORTANT RULES:

Do not guess, assume, or invent a tire size.

Only provide tire sizes that are supported by the vehicle fitment data in this knowledge base.

Do not provide a specific tire size until the vehicle has been uniquely identified.

When multiple options are available, present the available options to the customer and let the customer choose rather than asking them to manually type the information.

Use the vehicle information provided by the customer together with the available options in this knowledge base to progressively identify the correct vehicle.

============================================================
`;


// ======================================================
// Remove duplicate values
// ======================================================

function unique(values) {

  return [
    ...new Set(
      values
        .filter(Boolean)
        .map(value => String(value).trim())
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


        if (fitment.tire_size) {

          sizes.push(
            fitment.tire_size
          );

        }


        if (fitment.tire_size_rear) {

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

function formatVehicle(vehicle) {

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

    `Submodel: ${
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

    "------------------------------------------------------------",

    ""

  ].join("\n");

}


// ======================================================
// Create PDF
// ======================================================

async function createPDF(
  filePath,
  vehicles,
  chunkNumber
) {

  const pdfDoc =
    await PDFDocument.create();


  const font =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );


  const boldFont =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );


  const PAGE_WIDTH = 612;
  const PAGE_HEIGHT = 792;
  const MARGIN = 45;
  const FONT_SIZE = 8;
  const LINE_HEIGHT = 11;


  let page =
    pdfDoc.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT
    ]);


  let y =
    PAGE_HEIGHT -
    MARGIN;


  function addPage() {

    page =
      pdfDoc.addPage([
        PAGE_WIDTH,
        PAGE_HEIGHT
      ]);


    y =
      PAGE_HEIGHT -
      MARGIN;

  }


  function writeLine(
    text,
    bold = false
  ) {

    if (
      y <
      MARGIN
    ) {

      addPage();

    }


    page.drawText(
      text,
      {

        x:
          MARGIN,

        y,

        size:
          FONT_SIZE,

        font:
          bold
            ? boldFont
            : font

      }
    );


    y -=
      LINE_HEIGHT;

  }


  // ====================================================
  // PDF TITLE
  // ====================================================

  writeLine(

    `VEHICLE OE TIRE FITMENT KNOWLEDGE BASE - CHUNK ${chunkNumber}`,

    true

  );


  writeLine("");


  // ====================================================
  // AI INSTRUCTIONS
  // ====================================================

  const instructionLines =
    AI_INSTRUCTIONS.split("\n");


  for (
    const line
    of instructionLines
  ) {

    writeLine(
      line
    );

  }


  // ====================================================
  // VEHICLE DATA
  // ====================================================

  for (
    const vehicle
    of vehicles
  ) {

    const vehicleText =
      formatVehicle(
        vehicle
      );


    const lines =
      vehicleText.split("\n");


    for (
      const line
      of lines
    ) {

      writeLine(
        line
      );

    }

  }


  // ====================================================
  // Save PDF
  // ====================================================

  const pdfBytes =
    await pdfDoc.save();


  await writeFile(
    filePath,
    pdfBytes
  );

}


// ======================================================
// GET Route
// ======================================================

export async function GET() {

  try {

    console.log(
      "Starting vehicle fitment PDF export..."
    );


    // ==================================================
    // Create output directory
    // ==================================================

    const fs =
      await import(
        "node:fs/promises"
      );


    await fs.mkdir(

      OUTPUT_DIR,

      {
        recursive: true
      }

    );


    // ==================================================
    // INITIAL SEARCH
    // ==================================================

    console.log(

      `Fetching first batch of ${BATCH_SIZE} vehicles...`

    );


    let response =
      await openSearchClient.search({

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


    const allVehicles = [];


    // ==================================================
    // FETCH ALL VEHICLES
    // ==================================================

    while (
      hits.length > 0
    ) {

      for (
        const hit
        of hits
      ) {

        if (
          hit._source
        ) {

          allVehicles.push(
            hit._source
          );

        }

      }


      console.log(

        `Fetched ${allVehicles.length} vehicles...`

      );


      response =
        await openSearchClient.scroll({

          scroll_id:
            scrollId,

          scroll:
            "5m"

        });


      hits =
        response.body?.hits?.hits ||
        response.hits?.hits ||
        [];


      scrollId =
        response.body?._scroll_id ||
        response._scroll_id;

    }


    console.log(

      `Total vehicles fetched: ${allVehicles.length}`

    );


    // ==================================================
    // SPLIT INTO 10 CHUNKS
    // ==================================================

    const chunkSize =
      Math.ceil(

        allVehicles.length /
        TOTAL_CHUNKS

      );


    const createdFiles = [];


    for (
      let i = 0;
      i < TOTAL_CHUNKS;
      i++
    ) {

      const start =
        i *
        chunkSize;


      const end =
        Math.min(

          start +
          chunkSize,

          allVehicles.length

        );


      const chunkVehicles =
        allVehicles.slice(

          start,

          end

        );


      const chunkNumber =
        i + 1;


      const filePath =
        path.join(

          OUTPUT_DIR,

          `vehicle-oe-fitment-${String(
            chunkNumber
          ).padStart(
            2,
            "0"
          )}.pdf`

        );


      console.log(

        `Creating PDF ${chunkNumber}/${TOTAL_CHUNKS}: ${chunkVehicles.length} vehicles`

      );


      await createPDF(

        filePath,

        chunkVehicles,

        chunkNumber

      );


      createdFiles.push(
        filePath
      );

    }


    // ==================================================
    // COMPLETE
    // ==================================================

    console.log(

      "All 10 PDF files created successfully."

    );


    return Response.json({

      success:
        true,

      message:
        "Vehicle fitment PDFs created successfully",

      totalVehicles:
        allVehicles.length,

      totalPDFs:
        TOTAL_CHUNKS,

      files:
        createdFiles

    });


  } catch (error) {

    console.error(

      "Vehicle PDF export failed:",

      error

    );


    return Response.json(

      {

        success:
          false,

        message:
          error?.message ||
          "Unknown error"

      },

      {

        status:
          500

      }

    );

  }

}