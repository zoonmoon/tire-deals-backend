import { NextResponse } from "next/server";
import openSearchClient from "../../setup-database/_lib/route";


const INDEX_NAME = "rebates";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // ======================================================
    // PAGINATION
    // ======================================================

    const pageParam = parseInt(searchParams.get("page") || DEFAULT_PAGE, 10);
    const limitParam = parseInt(
      searchParams.get("limit") || DEFAULT_LIMIT,
      10
    );

    const page = Number.isFinite(pageParam) && pageParam > 0
      ? pageParam
      : DEFAULT_PAGE;

    const limit = Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_LIMIT)
      : DEFAULT_LIMIT;

    const from = (page - 1) * limit;

    // ======================================================
    // OPTIONAL FILTERS
    // ======================================================

    const brand = searchParams.get("brand");
    const productCode = searchParams.get("productCode");

    // ======================================================
    // CURRENT DATE/TIME
    // ======================================================

    const now = new Date().toISOString();

    // ======================================================
    // ACTIVE REBATE FILTER
    //
    // start_date <= now
    // AND
    // end_date >= now
    // ======================================================

    const filters = [
      {
        range: {
          start_date: {
            lte: now
          }
        }
      },
      {
        range: {
          end_date: {
            gte: now
          }
        }
      }
    ];

    // ======================================================
    // OPTIONAL BRAND FILTER
    // ======================================================

    if (brand) {
      filters.push({
        term: {
          normalized_brand: brand
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
        }
      });
    }

    // ======================================================
    // OPTIONAL PRODUCT CODE FILTER
    // ======================================================

    if (productCode) {
      filters.push({
        term: {
          normalized_product_code: productCode
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
        }
      });
    }

    // ======================================================
    // OPENSEARCH QUERY
    // ======================================================

    const response = await openSearchClient.search({
      index: INDEX_NAME,
      body: {
        from,
        size: limit,

        track_total_hits: true,

        query: {
          bool: {
            filter: filters
          }
        },

        // Most recent/ending rebate first
        sort: [
          {
            end_date: {
              order: "asc"
            }
          }
        ]
      }
    });

    // ======================================================
    // RESULTS
    // ======================================================

    const hits = response.body?.hits?.hits || [];

    const total =
      typeof response.body?.hits?.total === "object"
        ? response.body.hits.total.value
        : response.body?.hits?.total || 0;

    const totalPages = Math.ceil(total / limit);

    const rebates = hits.map((hit) => ({
      id: hit._id,
      ...hit._source
    }));

    // ======================================================
    // RESPONSE
    // ======================================================

    return NextResponse.json({
      success: true,

      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },

      rebates
    });
  } catch (error) {
    console.error("Failed to fetch rebates:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch rebates",
        error: error.message
      },
      { status: 500 }
    );
  }
}