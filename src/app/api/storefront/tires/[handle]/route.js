import { NextResponse } from "next/server";
import openSearchClient from "../../../setup-database/_lib/route";

const INDEX_NAME = "all_tires";

export async function GET(request, { params }) {
  try {
    const { handle } = await params;

    if (!handle) {
      return NextResponse.json(
        {
          success: false,
          message: "Product handle is required",
        },
        {
          status: 400,
        }
      );
    }

    // Find product by handle
    const response = await openSearchClient.search({
      index: INDEX_NAME,
      body: {
        query: {
          term: {
            handle: handle,
          },
        },
        size: 1,
      },
    });

    const hits = response.body?.hits?.hits || [];

    if (hits.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        {
          status: 404,
        }
      );
    }

    let product = hits[0]._source;

    product = {
        ...product, 
        thumbnail: ( product?.img_url_base || "") + ( product?.img_thumb || ""),
    }
    
    const productImages = [
        product.img_front,
        product.img_side1,
        product.img_side2,
        product.img_angle,
    ]
    .filter(Boolean)
    .map(
        (image) =>
        `${product.img_url_base}${image}`
    );

    product.images = productImages

    return NextResponse.json({
      success: true,
      product,
    });
    
  } catch (error) {
    console.error("❌ Failed to fetch tire:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}