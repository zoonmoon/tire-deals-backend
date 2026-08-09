import { NextResponse } from "next/server";

import openSearchClient from "@/app/api/setup-database/_lib/route";

const TIRES_INDEX = "all_tires";
const REBATES_INDEX = "rebates";

// ======================================================
// NORMALIZE
// ======================================================
//
// Lowercase
// Remove spaces
// Remove special characters
// Keep only a-z and 0-9
//
// Example:
// "BRIDGESTONE" -> "bridgestone"
// "004-741"     -> "004741"
// "004741"      -> "004741"
// ======================================================

const normalize = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};

// ======================================================
// GET TIRE BY HANDLE
// ======================================================

async function getTireByHandle(handle) {
  const response = await openSearchClient.search({
    index: TIRES_INDEX,

    body: {
      size: 1,

      query: {
        term: {
          handle: handle,
        },
      },
    },
  });

  const result = response.body || response;

  const hits = result?.hits?.hits || [];

  if (!hits.length) {
    return null;
  }

  return {
    id: hits[0]._id,
    ...hits[0]._source,
  };
}

// ======================================================
// GET
// ======================================================
//
// Expected route:
//
// /api/storefront/rebates/[handle]
//
// Example:
//
// /api/storefront/rebates/bridgestone-alenza-001
//
// Optional:
//
// ?active=true
//
// ======================================================

export async function GET(request, { params }) {
  try {
    // ==================================================
    // GET HANDLE FROM ROUTE PARAMS
    // ==================================================

    const { handle } = await params;

    if (!handle) {
      return NextResponse.json(
        {
          success: false,
          message: "Tire handle is required",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // QUERY PARAMETERS
    // ==================================================

    const { searchParams } = new URL(request.url);

    const active = searchParams.get("active");

    // ==================================================
    // 1. FETCH TIRE BY HANDLE
    // ==================================================

    const tire = await getTireByHandle(handle);

    // ==================================================
    // TIRE NOT FOUND
    // ==================================================

    if (!tire) {
      return NextResponse.json(
        {
          success: false,
          message: "Tire not found",
        },
        {
          status: 404,
        }
      );
    }

    // ==================================================
    // 2. GET BRAND + MPN
    // ==================================================
    //
    // Tire index fields:
    //
    // brand
    // normalized_brand
    //
    // part_number
    // normalized_part_number
    //
    // ==================================================

    const brand = tire.brand || "";

    const partNumber = tire.part_number || "";

    // ==================================================
    // USE EXISTING NORMALIZED VALUES
    // FALL BACK TO NORMALIZATION
    // ==================================================

    const normalizedBrand =
      tire.normalized_brand ||
      normalize(brand);

    const normalizedPartNumber =
      tire.normalized_part_number ||
      normalize(partNumber);

    // ==================================================
    // 3. VALIDATE MATCHING DATA
    // ==================================================

    if (!normalizedBrand || !normalizedPartNumber) {
      return NextResponse.json({
        success: true,

        tire: {
          id: tire.id,
          handle: tire.handle,
          brand,
          part_number: partNumber,
          normalized_brand: normalizedBrand,
          normalized_part_number: normalizedPartNumber,
        },

        matching: {
          normalized_brand: normalizedBrand,
          normalized_product_code: normalizedPartNumber,
        },

        total: 0,

        rebates: [],

        message:
          "Tire does not have enough information to match rebates",
      });
    }

    // ==================================================
    // 4. BUILD REBATE FILTERS
    // ==================================================
    //
    // Rebate matching:
    //
    // rebates.normalized_brand
    //          ==
    // tires.normalized_brand
    //
    // AND
    //
    // rebates.normalized_product_code
    //          ==
    // tires.normalized_part_number
    //
    // ==================================================

    const filters = [
      {
        term: {
          normalized_brand: normalizedBrand,
        },
      },

      {
        term: {
          normalized_product_code: normalizedPartNumber,
        },
      },
    ];

    // ==================================================
    // OPTIONAL ACTIVE FILTER
    // ==================================================
    //
    // ?active=true
    //
    // Active means:
    //
    // start_date <= NOW
    //
    // AND
    //
    // end_date >= NOW
    //
    // ==================================================

    if (active === "true") {
      const now = new Date().toISOString();

      filters.push(
        {
          range: {
            start_date: {
              lte: now,
            },
          },
        },

        {
          range: {
            end_date: {
              gte: now,
            },
          },
        }
      );
    }

    // ==================================================
    // 5. SEARCH REBATES
    // ==================================================

    const rebateResponse =
      await openSearchClient.search({
        index: REBATES_INDEX,

        body: {
          size: 100,

          track_total_hits: true,

          query: {
            bool: {
              filter: filters,
            },
          },

          sort: [
            {
              start_date: {
                order: "desc",
              },
            },
          ],
        },
      });

    const rebateResult =
      rebateResponse.body ||
      rebateResponse;

    const rebateHits =
      rebateResult?.hits?.hits || [];

    // ==================================================
    // TOTAL
    // ==================================================

    const total =
      typeof rebateResult?.hits?.total ===
      "object"
        ? rebateResult.hits.total.value
        : rebateResult?.hits?.total || 0;

    // ==================================================
    // 6. FORMAT REBATES
    // ==================================================

    const rebates = rebateHits.map(
      (hit) => ({
        id: hit._id,
        ...hit._source,
      })
    );

    // ==================================================
    // 7. RESPONSE
    // ==================================================

    return NextResponse.json({
      success: true,

      tire: {
        id: tire.id,
        handle: tire.handle,

        brand,

        part_number:
          partNumber,

        normalized_brand:
          normalizedBrand,

        normalized_part_number:
          normalizedPartNumber,
      },
      
      matching: {
        normalized_brand:
          normalizedBrand,

        normalized_product_code:
          normalizedPartNumber,
      },

      active:
        active === "true",

      total,    

      rebates,
    });

    //  // 

  } catch (error) {
    console.error(
      "Failed to fetch rebates for tire:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to fetch rebates",

        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}