import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    // ======================================================
    // FILE PATHS
    // ======================================================

    const DATA_DIR = path.join(
      process.cwd(),
      "installer-data"
    );

    const INPUT_FILE = path.join(
      DATA_DIR,
      "2025_Gaz_zcta_national.txt"
    );

    const OUTPUT_FILE = path.join(
      DATA_DIR,
      "zip-coordinates.json"
    );

    // ======================================================
    // READ ZCTA FILE
    // ======================================================

    const content = await fs.readFile(
      INPUT_FILE,
      "utf8"
    );

    // ======================================================
    // SPLIT INTO LINES
    // ======================================================

    const lines = content
      .split(/\r?\n/)
      .filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      return Response.json(
        {
          success: false,
          message: "ZCTA file is empty or invalid",
        },
        { status: 400 }
      );
    }

    // ======================================================
    // HEADER
    // ======================================================

    const headers = lines[0]
      .split("|")
      .map((header) => header.trim());

    const geoidIndex =
      headers.indexOf("GEOID");

    const latitudeIndex =
      headers.indexOf("INTPTLAT");

    const longitudeIndex =
      headers.indexOf("INTPTLONG");

    if (
      geoidIndex === -1 ||
      latitudeIndex === -1 ||
      longitudeIndex === -1
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Required columns GEOID, INTPTLAT, INTPTLONG were not found",
        },
        { status: 400 }
      );
    }

    // ======================================================
    // BUILD ZIP → COORDINATES OBJECT
    // ======================================================

    const zipCoordinates = {};

    let processed = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split("|");

      const zip =
        columns[geoidIndex]?.trim();

      const latitude =
        columns[latitudeIndex]?.trim();

      const longitude =
        columns[longitudeIndex]?.trim();

      // ----------------------------------------------
      // Validate
      // ----------------------------------------------

      if (
        !zip ||
        !latitude ||
        !longitude
      ) {
        skipped++;
        continue;
      }

      const lat = Number(latitude);
      const lon = Number(longitude);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon)
      ) {
        skipped++;
        continue;
      }

      // ----------------------------------------------
      // Keep ZIP as string
      //
      // Important:
      // 00601 must remain "00601"
      // ----------------------------------------------

      zipCoordinates[zip] = {
        lat,
        lon,
      };

      processed++;
    }

    // ======================================================
    // WRITE JSON
    // ======================================================

    await fs.writeFile(
      OUTPUT_FILE,
      JSON.stringify(
        zipCoordinates,
        null,
        2
      ),
      "utf8"
    );

    // ======================================================
    // RESPONSE
    // ======================================================

    return Response.json({
      success: true,
      message:
        "ZIP coordinates JSON created successfully",

      inputFile:
        INPUT_FILE,

      outputFile:
        OUTPUT_FILE,

      totalProcessed:
        processed,

      totalSkipped:
        skipped,

      totalUniqueZips:
        Object.keys(
          zipCoordinates
        ).length,
    });

  } catch (error) {
    console.error(
      "❌ Failed to create ZIP coordinates JSON:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Failed to create ZIP coordinates JSON",

        error:
          error.message,
      },
      { status: 500 }
    );
  }
}