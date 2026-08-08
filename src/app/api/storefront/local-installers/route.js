
import openSearchClient from "../../setup-database/_lib/route";

import { ZIP_COORDINATES_VS_LAT_LON } from "../../synchronize/local-installers/zip_coordinates";

const INDEX_NAME = "all_installers";

const DEFAULT_RADIUS = "10mi";
const DEFAULT_SIZE = 500;

export async function GET(request) {
  try {     
    // ======================================================
    // Query parameters
    // ======================================================
    
    const { searchParams } =
      new URL(request.url);

    const zip =
      searchParams.get("zip")?.trim();

    const shopName =
    searchParams.get("shop_name")?.trim();


    const isMobileInstallParam =
    searchParams.get("is_mobile_install");

    const isMobileInstall =
    isMobileInstallParam === "true";

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

    const filters = [
    {
        geo_distance: {
        distance: radius,
        location: {
            lat,
            lon,
        },
        },
    },
    ];


    if (isMobileInstall) {
    filters.push({
        term: {
        is_mobile_install: true,
        },
    });
    }


    if (shopName) {
    filters.push({
        match_phrase: {
        company_name: shopName,
        },
    });
    }



    const response =
    await openSearchClient.search({
        index: "all_installers",

        body: {
        size,

        track_total_hits: true,

        query: {
            bool: {
            filter: filters,
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


    let installers =
      hits.map((hit) => ({
        id: hit._id,

        ...hit._source,


      
        distance:
        hit.sort?.[0] != null
            ? {
                number: Number(
                hit.sort[0].toFixed(2)
                ),
                label: "mi",
            }
            : {
                number: null,
                label: "mi",
            },



      }));


        installers = installers.map((i) => {
        const {
            raw,
            installation_sale_price,
            installation_4_tires_sale_price,
            installation_cost_for_4_tires_in_cents,
            ...installer
        } = i;

        return {
            ...installer,

            installerDetails:
            raw?.raw?.siteInstaller || {},

            reviews:
            raw?.raw?.reviewsList || [],

            yelpReviewMetadata:
            raw?.raw?.yelpReviewMetadata || {},

            siteInstallerServices:
            raw?.raw?.siteInstallerServices || {},
        };
        });

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