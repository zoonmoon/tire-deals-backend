import { NextResponse } from "next/server";

import openSearchClient from "@/app/api/setup-database/_lib/route";

const TIRES_INDEX = "all_tires";
const VEHICLES_INDEX = "all_vehicles";

// ======================================================
// GET VEHICLE
// ======================================================

async function getVehicle(vehicleId) {
  try {
    const response = await openSearchClient.get({
      index: VEHICLES_INDEX,
      id: vehicleId,
    });

    const result = response.body || response;

    if (!result.found) {
      return null;
    }

    return {
      id: result._id,
      ...result._source,
    };
  } catch (error) {
    // OpenSearch throws when document does not exist
    if (
      error?.meta?.statusCode === 404 ||
      error?.statusCode === 404
    ) {
      return null;
    }

    throw error;
  }
}


// ======================================================
// GET TIRE BY HANDLE
// ======================================================

async function getTireByHandle(handle) {
  const response = await openSearchClient.search({
    index: TIRES_INDEX,

    body: {
      query: {
        term: {
          handle: handle,
        },
      },

      size: 1,
    },
  });

  const result = response.body || response;

  const hits =
    result?.hits?.hits || [];

  if (!hits.length) {
    return null;
  }

  return {
    id: hits[0]._id,
    ...hits[0]._source,
  };
}


// ======================================================
// EXTRACT VEHICLE FITMENTS
// ======================================================
//
// ONLY:
//
// fitments
// optional_fitments
//
// NOT:
//
// plus_sizes
//
// ======================================================

function extractVehicleFitments(vehicle) {
  return [
    ...(vehicle.fitments || []),
    ...(vehicle.optional_fitments || []),
  ];
}


// ======================================================
// NORMALIZE FITMENT FORMAT
// ======================================================

function getFitmentFormat(fitment) {
  return String(
    fitment?.format || ""
  )
    .trim()
    .toUpperCase();
}


// ======================================================
// CHECK METRIC FITMENT
// ======================================================
//
// M = Metric
//
// Compare:
//
// section_width
// aspect_ratio
// rim_diameter
//
// ======================================================

function matchesMetricFitment(
  tire,
  fitment
) {
  return (
    tire.section_width ===
      fitment.section_width &&

    tire.aspect_ratio ===
      fitment.aspect_ratio &&

    tire.rim_diameter ===
      fitment.rim_diameter
  );
}


// ======================================================
// CHECK FLOTATION FITMENT
// ======================================================
//
// F = Flotation
//
// Compare:
//
// diameter
// inch_width
// rim_diameter
//
// ======================================================

function matchesFlotationFitment(
  tire,
  fitment
) {
  return (
    tire.diameter ===
      fitment.diameter &&

    tire.inch_width ===
      fitment.inch_width &&

    tire.rim_diameter ===
      fitment.rim_diameter
  );
}


// ======================================================
// CHECK WHETHER TIRE FITS VEHICLE
// ======================================================
//
// IMPORTANT:
//
// Tire format M:
//
// ONLY compared with M fitments
//
// Tire format F:
//
// ONLY compared with F fitments
//
// ======================================================

function checkTireFitment(
  tire,
  vehicleFitments
) {
  const tireFormat =
    String(
      tire.size_format || ""
    )
      .trim()
      .toUpperCase();


  // ====================================================
  // Only M and F are supported
  // ====================================================

  if (
    tireFormat !== "M" &&
    tireFormat !== "F"
  ) {
    return {
      fits: false,
      matchedFitment: null,
    };
  }


  // ====================================================
  // Find matching fitment
  // ====================================================

  for (
    const fitment
    of vehicleFitments
  ) {

    const fitmentFormat =
      getFitmentFormat(
        fitment
      );


    // ==================================================
    // NEVER compare different formats
    //
    // M tire -> M fitments only
    //
    // F tire -> F fitments only
    // ==================================================

    if (
      tireFormat !==
      fitmentFormat
    ) {
      continue;
    }


    // ==================================================
    // Metric
    // ==================================================

    if (
      tireFormat === "M"
    ) {

      if (
        matchesMetricFitment(
          tire,
          fitment
        )
      ) {

        return {
          fits: true,
          matchedFitment: fitment,
        };

      }

    }


    // ==================================================
    // Flotation
    // ==================================================

    if (
      tireFormat === "F"
    ) {

      if (
        matchesFlotationFitment(
          tire,
          fitment
        )
      ) {

        return {
          fits: true,
          matchedFitment: fitment,
        };

      }

    }

  }


  return {
    fits: false,
    matchedFitment: null,
  };
}


// ======================================================
// FORMAT VEHICLE FITMENT SIZE
// ======================================================
//
// This gives frontend a clean list of all sizes
// supported by the vehicle.
//
// ======================================================

function formatFitmentSize(
  fitment
) {
  const format =
    getFitmentFormat(
      fitment
    );


  // ====================================================
  // Metric
  // ====================================================

  if (
    format === "M"
  ) {

    return {
      format: "M",

      section_width:
        fitment.section_width,

      aspect_ratio:
        fitment.aspect_ratio,

      rim_diameter:
        fitment.rim_diameter,

      size:
        `${fitment.section_width}/${fitment.aspect_ratio}R${fitment.rim_diameter}`,
    };

  }


  // ====================================================
  // Flotation
  // ====================================================

  if (
    format === "F"
  ) {

    return {
      format: "F",

      diameter:
        fitment.diameter,

      inch_width:
        fitment.inch_width,

      rim_diameter:
        fitment.rim_diameter,

      size:
        `${fitment.diameter}x${fitment.inch_width}R${fitment.rim_diameter}`,
    };

  }


  // ====================================================
  // Unknown format
  // ====================================================

  return {
    format,

    size: null,
  };
}


// ======================================================
// FORMAT TIRE
// ======================================================

function formatTire(
  tire
) {

  const thumbnail =
    `${tire.img_url_base || ""}${tire.img_thumb || ""}`;


  const images = [
    tire.img_front,
    tire.img_side1,
    tire.img_side2,
    tire.img_angle,
    tire.img_thumb,
  ]
    .filter(Boolean)
    .map(
      image =>
        `${tire.img_url_base || ""}${image}`
    );


  return {
    ...tire,

    thumbnail,

    images,
  };
}


// ======================================================
// GET
// ======================================================

export async function GET(
  request,
  { params }
) {

  try {

    // ==================================================
    // GET HANDLE
    // ==================================================

    const {
      handle
    } = await params;


    if (!handle) {

      return NextResponse.json(
        {
          success: false,
          error:
            "Tire handle is required",
        },
        {
          status: 400,
        }
      );

    }


    // ==================================================
    // GET VEHICLE ID
    // ==================================================

    const {
      searchParams
    } = new URL(
      request.url
    );


    const vehicleId =
      searchParams.get(
        "vehicleId"
      );


    if (!vehicleId) {

      return NextResponse.json(
        {
          success: false,
          error:
            "vehicleId is required",
        },
        {
          status: 400,
        }
      );

    }


    // ==================================================
    // FETCH VEHICLE + TIRE
    // ==================================================

    const [
      vehicle,
      tire
    ] = await Promise.all([

      getVehicle(
        vehicleId
      ),

      getTireByHandle(
        handle
      ),

    ]);


    // ==================================================
    // VEHICLE NOT FOUND
    // ==================================================

    if (!vehicle) {

      return NextResponse.json(
        {
          success: false,
          error:
            "Vehicle not found",
        },
        {
          status: 404,
        }
      );

    }


    // ==================================================
    // TIRE NOT FOUND
    // ==================================================

    if (!tire) {

      return NextResponse.json(
        {
          success: false,
          error:
            "Tire not found",
        },
        {
          status: 404,
        }
      );

    }


    // ==================================================
    // GET VEHICLE FITMENTS
    // ==================================================

    const vehicleFitments =
      extractVehicleFitments(
        vehicle
      );


    // ==================================================
    // ALL VEHICLE SIZES
    // ==================================================
    //
    // These include:
    //
    // fitments
    // optional_fitments
    //
    // NOT plus_sizes
    //
    // ==================================================

    const allSizes =
      vehicleFitments
        .map(
          formatFitmentSize
        )
        .filter(
          fitment =>
            fitment.size !== null
        );


    // ==================================================
    // CHECK TIRE FITMENT
    // ==================================================

    const fitmentResult =
      checkTireFitment(
        tire,
        vehicleFitments
      );


    // ==================================================
    // FORMAT VEHICLE
    // ==================================================

    const formattedVehicle = {

      id:
        vehicle.id,

      year:
        vehicle.year,

      make:
        vehicle.make,

      model:
        vehicle.model,

      submodel:
        vehicle.submodel,

      body:
        vehicle.body,

      doors:
        vehicle.doors,

    };


    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json({

      success: true,

      status:
        fitmentResult.fits
          ? "fits"
          : "does_not_fit",

      fits:
        fitmentResult.fits,


      // ================================================
      // Tire
      // ================================================

      tire:
        formatTire(
          tire
        ),


      // ================================================
      // Vehicle
      // ================================================

      vehicle:
        formattedVehicle,


      // ================================================
      // ALL VALID VEHICLE SIZES
      // ================================================

      vehicleFitments:
        allSizes,


      // ================================================
      // Matched fitment
      //
      // This will be null when tire doesn't fit.
      // ================================================

      matchedFitment:
        fitmentResult.matchedFitment
          ? formatFitmentSize(
              fitmentResult.matchedFitment
            )
          : null,

    });


  } catch (error) {

    console.error(
      "Tire fitment check failed:",
      error
    );


    return NextResponse.json(
      {
        success: false,

        error:
          "Failed to check tire fitment",

        message:
          error.message,
      },
      {
        status: 500,
      }
    );

  }

}