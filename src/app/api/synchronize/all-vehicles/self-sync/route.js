import openSearchClient from "@/app/api/setup-database/_lib/route";

const INDEX_NAME = "all_vehicles";

const BATCH_SIZE = 500;
const MAX_RETRIES = 5;


// ======================================================
// Sleep
// ======================================================

function sleep(ms) {

  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );

}


// ======================================================
// Normalize Vehicle Part
// ======================================================

function normalizeVehiclePart(value) {

  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

}


// ======================================================
// Generate Local Vehicle Search
// ======================================================

function generateLocalVehicleSearch(vehicle) {

  const variants = new Set();


  const year =
    normalizeVehiclePart(vehicle.year);

  const make =
    normalizeVehiclePart(vehicle.make);

  const model =
    normalizeVehiclePart(vehicle.model);

  const submodel =
    normalizeVehiclePart(vehicle.submodel);

  const body =
    normalizeVehiclePart(vehicle.body);

  const doors =
    normalizeVehiclePart(vehicle.doors);


  // ==================================================
  // Individual parts
  // ==================================================

  if (year)
    variants.add(year);

  if (make)
    variants.add(make);

  if (model)
    variants.add(model);

  if (submodel)
    variants.add(submodel);

  if (body)
    variants.add(body);

  if (doors)
    variants.add(doors);


  // ==================================================
  // Normal combinations
  // ==================================================

  if (make && model) {

    variants.add(
      `${make} ${model}`
    );

  }


  if (model && submodel) {

    variants.add(
      `${model} ${submodel}`
    );

  }


  if (make && model && submodel) {

    variants.add(
      `${make} ${model} ${submodel}`
    );

  }


  if (year && make && model) {

    variants.add(
      `${year} ${make} ${model}`
    );

  }


  if (year && make && model && submodel) {

    variants.add(
      `${year} ${make} ${model} ${submodel}`
    );

  }


  if (make && model && submodel && body) {

    variants.add(
      `${make} ${model} ${submodel} ${body}`
    );

  }


  if (
    year &&
    make &&
    model &&
    submodel &&
    body &&
    doors
  ) {

    variants.add(
      `${year} ${make} ${model} ${submodel} ${body} ${doors}`
    );

  }


  // ==================================================
  // NO-SPACE combinations
  //
  // Porsche911
  // ToyotaCamry
  // Porsche911Carrera
  // ==================================================

  if (make && model) {

    variants.add(
      `${make}${model}`
    );

  }


  if (model && submodel) {

    variants.add(
      `${model}${submodel}`
    );

  }


  if (make && model && submodel) {

    variants.add(
      `${make}${model}${submodel}`
    );

  }


  if (year && make && model) {

    variants.add(
      `${year}${make}${model}`
    );

  }


  if (year && make && model && submodel) {

    variants.add(
      `${year}${make}${model}${submodel}`
    );

  }


  return Array.from(variants).join(" ");

}


// ======================================================
// Bulk Update vehicle_search
// ======================================================

async function bulkUpdateVehicleSearch(
  vehicles,
  attempt = 1
) {

  try {

    const body = [];


    for (const vehicle of vehicles) {

      const vehicleSearch =
        generateLocalVehicleSearch(vehicle);


        console.log(vehicleSearch)


      body.push({

        update: {

          _index: INDEX_NAME,

          _id: vehicle._id

        }

      });


      body.push({

        doc: {

          vehicle_search:
            vehicleSearch

        }

      });

    }


    if (body.length === 0) {

      return;

    }


    const response =
      await openSearchClient.bulk({

        refresh: false,

        body

      });


    if (response.body?.errors) {

      const failed =
        response.body.items
          .filter(
            item =>
              item.update?.error
          );


      console.error(
        "Failed vehicle updates:",
        failed.slice(0, 5)
      );


      throw new Error(
        `Bulk update failed for ${failed.length} documents`
      );

    }

  } catch (error) {

    console.error(

      `Bulk update failed ${attempt}/${MAX_RETRIES}:`,

      error.message

    );


    if (attempt >= MAX_RETRIES) {

      throw error;

    }


    await sleep(
      1000 * Math.pow(2, attempt - 1)
    );


    return bulkUpdateVehicleSearch(
      vehicles,
      attempt + 1
    );

  }

}


// ======================================================
// Rebuild vehicle_search for ALL vehicles
// ======================================================

async function rebuildVehicleSearch() {

  let scrollId = null;

  let totalProcessed = 0;


  try {

    // ==================================================
    // Initial search
    // ==================================================

    let response =
      await openSearchClient.search({

        index: INDEX_NAME,

        scroll: "5m",

        size: BATCH_SIZE,

        _source: [

          "year",
          "make",
          "model",
          "submodel",
          "body",
          "doors"

        ],

        body: {

          query: {

            match_all: {}

          }

        }

      });


    // ==================================================
    // OpenSearch JS client wraps response in body
    // ==================================================

    scrollId =
      response.body?._scroll_id;


    if (!scrollId) {

      throw new Error(
        "OpenSearch did not return a scroll ID"
      );

    }


    // ==================================================
    // Process batches
    // ==================================================

    while (true) {

      const vehicles =
        response.body?.hits?.hits || [];


      if (vehicles.length === 0) {

        break;

      }


      console.log(
        `Processing ${vehicles.length} vehicles...`
      );


      // ==================================================
      // Update ONLY vehicle_search
      // ==================================================

      await bulkUpdateVehicleSearch(

        vehicles.map(hit => ({

          _id:
            hit._id,

          ...hit._source

        }))

      );


      totalProcessed +=
        vehicles.length;


      console.log(
        `Updated vehicle_search: ${totalProcessed}`
      );


      // ==================================================
      // Get next batch
      // ==================================================

      response =
        await openSearchClient.scroll({

          scroll_id:
            scrollId,

          scroll:
            "5m"

        });


      scrollId =
        response.body?._scroll_id;


      if (!scrollId) {

        throw new Error(
          "OpenSearch did not return the next scroll ID"
        );

      }

    }


  } finally {

    // ==================================================
    // Clear scroll
    // ==================================================

    if (scrollId) {

      try {

        await openSearchClient.clearScroll({

          scroll_id:
            scrollId

        });

      } catch (error) {

        console.error(

          "Failed to clear scroll:",

          error.message

        );

      }

    }

  }


  // ====================================================
  // Refresh index
  // ====================================================

  await openSearchClient.indices.refresh({

    index: INDEX_NAME

  });


  console.log(
    `Vehicle search rebuild completed: ${totalProcessed}`
  );


  return {

    success: true,

    totalProcessed

  };

}


// ======================================================
// GET
// ======================================================

export async function GET() {

  try {

    const result =
      await rebuildVehicleSearch();


    return Response.json(result);


  } catch (error) {

    console.error(
      "Vehicle search rebuild failed:",
      error
    );


    return Response.json(

      {
        success: false,

        error:
          error.message

      },

      {
        status: 500
      }

    );

  }

}