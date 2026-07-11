import openSearchClient from "../../setup-database/_lib/route";


const INDEX_NAME = "all_vehicles";

const AUTOSYNC_URL =
  "https://api.autosyncstudio.com/vehicles";


const PAGE_SIZE = 500;
const MAX_RETRIES = 5;



function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}




// ======================================================
// Fetch vehicles page with retry
// ======================================================

async function fetchVehiclesPage(page, attempt = 1) {


  try {


    const url =
      `${AUTOSYNC_URL}` +
      `?i-img` +
      `&i-fitments` +
      `&i-optionalFitments` +
      `&i-plusSizes` +
      `&p-size=${PAGE_SIZE}` +
      `&p-number=${page}` +
      `&key=${process.env.AUTOSYNC_API_KEY}`;



    const response = await fetch(url, {

      signal: AbortSignal.timeout(30000)

    });



    if(!response.ok){

      throw new Error(
        `AutoSync HTTP ${response.status}`
      );

    }



    const data =
      await response.json();



    if(
      !data ||
      !Array.isArray(data.Vehicles)
    ){

      throw new Error(
        "Invalid AutoSync response: Vehicles missing"
      );

    }



    return data;



  } catch(error){


    console.error(
      `❌ Vehicle page ${page} failed attempt ${attempt}/${MAX_RETRIES}`,
      error.message
    );



    if(attempt >= MAX_RETRIES){

      console.error(
        `💀 Vehicle import stopped. Page ${page} failed`
      );

      throw error;

    }



    const delay =
      1000 * Math.pow(2, attempt - 1);



    await sleep(delay);



    return fetchVehiclesPage(
      page,
      attempt + 1
    );


  }

}






// ======================================================
// Transform Vehicle
// ======================================================

function transformVehicle(vehicle, meta){


  return {


    // ==========================
    // Identity
    // ==========================


    id:
      vehicle.Id,


    chassis_id:
      vehicle.DefaultChassisId,



    // ==========================
    // YMM SEARCH
    // ==========================


    year:
      vehicle.Year,


    make:
      vehicle.Make,


    model:
      vehicle.Model,


    submodel:
      vehicle.Submodel,



    vehicle_type:
      vehicle.Type,



    body:
      vehicle.Body,



    bed:
      vehicle.Bed,



    doors:
      vehicle.Doors,



    // ==========================
    // Vehicle Specs
    // ==========================


    bolt_circle:
      vehicle.BoltCircle,


    bore:
      vehicle.Bore,


    bore_rear:
      vehicle.BoreRear,


    lug_count:
      vehicle.LugCount,


    drw:
      vehicle.Drw,



    // ==========================
    // Fitments
    // ==========================


    fitments:
      vehicle.Fitments || [],



    optional_fitments:
      vehicle.OptionalFitments || [],



    plus_sizes:
      vehicle.PlusSizes || [],



    // ==========================
    // Flags
    // ==========================


    staggered:
      vehicle.Staggered,


    staggered_diameter:
      vehicle.StaggeredDiameter,


    staggered_width:
      vehicle.StaggeredWidth,



    race_tires:
      vehicle.RaceTires,



    // ==========================
    // Images
    // ==========================


    img_url_base:
      meta.ImgUrlBase,


    img_001:
      vehicle.Img001 || null,


    img_014:
      vehicle.Img014 || null,


    img_032:
      vehicle.Img032 || null,


    img_color_id:
      vehicle.ImgColorId,



    // ==========================
    // Meta
    // ==========================


    load_rating:
      vehicle.LoadRating,


    load_rating_rear:
      vehicle.LoadRatingRear,


    max_wheel_load:
      vehicle.MaxWheelLoad


  };


}







// ======================================================
// Bulk Upload
// ======================================================


async function bulkUploadToOpenSearch(
  vehicles,
  attempt = 1
){


  try {


    const body = [];



    for(const vehicle of vehicles){


      body.push({

        update: {

          _index: INDEX_NAME,

          _id:
            vehicle.id.toString()

        }

      });



      body.push({

        doc: vehicle,

        doc_as_upsert:true

      });


    }




    const response =
      await openSearchClient.bulk({

        refresh:false,

        body

      });



    if(response.errors){

      throw new Error(
        "OpenSearch bulk insert failed"
      );

    }



  } catch(error){


    console.error(
      `❌ OpenSearch bulk error attempt ${attempt}/${MAX_RETRIES}`,
      error.message
    );



    if(attempt >= MAX_RETRIES){

      throw error;

    }



    await sleep(
      1000 * attempt
    );



    return bulkUploadToOpenSearch(
      vehicles,
      attempt + 1
    );


  }


}







// ======================================================
// MAIN SYNC
// ======================================================


export async function syncAllVehiclesFromAutoSync(){



  let page = 1;

  let totalImported = 0;



  try {



    while(true){



      console.log(
        `📥 Fetching vehicle page ${page}`
      );



      const data =
        await fetchVehiclesPage(page);




      if(data.Vehicles.length === 0){

        throw new Error(
          `Empty vehicle response page ${page}`
        );

      }




      const transformed =
        data.Vehicles.map(vehicle =>
          transformVehicle(
            vehicle,
            data
          )
        );



        console.log(transformed[0]) 

        return ;



      await bulkUploadToOpenSearch(
        transformed
      );



      totalImported += transformed.length;



      console.log(
        `✅ Imported ${transformed.length} vehicles | Total ${totalImported}`
      );





      if(!data.MoreItems){

        console.log(
          "🎉 Vehicle import completed"
        );

        break;

      }




      page++;



      // stay safe below API limit

      await sleep(50);



    }





    await openSearchClient.indices.refresh({

      index: INDEX_NAME

    });




    console.log(
      `🔥 Finished vehicles import ${totalImported}`
    );



  }catch(error){


    console.error(
      "💀 Vehicle sync stopped:",
      error.message
    );


    throw error;

  }


}