import openSearchClient from "../../setup-database/_lib/route";

import { ZIP_COORDINATES_VS_LAT_LON } from "./zip_coordinates";

const INDEX_NAME = "all_installers";

const DEFAULT_RADIUS = "50mi";
const DEFAULT_SIZE = 1200;

export async function GET(request) {
  try {
    // ======================================================
    // Query parameters
    // ======================================================
    
    const { searchParams } =
      new URL(request.url);

    const zip =
      searchParams.get("zip")?.trim();

    const radius =
      searchParams.get("radius")?.trim() ||
      DEFAULT_RADIUS;

    const sizeParam =
      searchParams.get("size");

    const size =
      sizeParam
        ? Math.min(
            Math.max(
              Number(sizeParam),
              1
            ),
            100
          )
        : DEFAULT_SIZE;


    // ======================================================
    // Validate ZIP
    // ======================================================

    if (!zip) {
      return Response.json(
        {
          success: false,
          message: "ZIP code is required",
        },
        {
          status: 400,
        }
      );
    }


    // ======================================================
    // ZIP → latitude / longitude
    // ======================================================

    const coordinates =
      ZIP_COORDINATES_VS_LAT_LON[
        zip
      ];


    if (!coordinates) {
      return Response.json(
        {
          success: false,
          message:
            `ZIP code ${zip} was not found`,
        },
        {
          status: 404,
        }
      );
    }


    const {
      lat,
      lon,
    } = coordinates;


    // ======================================================
    // Search OpenSearch
    // ======================================================

    const response =
      await openSearchClient.search({
        index: INDEX_NAME,

        body: {
          size,

          track_total_hits: true,

          query: {
            geo_distance: {
              distance: radius,

              location: {
                lat,
                lon,
              },
            },
          },

          sort: [
            {
              _geo_distance: {
                location: {
                  lat,
                  lon,
                },

                order: "asc",

                unit: "mi",

                mode: "min",

                distance_type: "arc",
              },
            },
          ],
        },
      });


    const responseBody =
      response.body ?? response;


    // ======================================================
    // Format results
    // ======================================================

    const hits =
      responseBody.hits?.hits || [];


    const installers =
      hits.map((hit) => ({
        id: hit._id,

        ...hit._source,

        distance:
          hit.sort?.[0] ?? null,
      }));


    // ======================================================
    // Response
    // ======================================================

    return Response.json({
      success: true,

      search: {
        zip,

        latitude: lat,

        longitude: lon,

        radius,

        size,
      },

      total:
        responseBody.hits?.total?.value ??
        installers.length,

      installers,
    });

  } catch (error) {

    console.error(
      "❌ Installer search failed:",
      error
    );

    return Response.json(
      {
        success: false,

        message:
          "Failed to search installers",

        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}