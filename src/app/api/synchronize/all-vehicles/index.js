import openSearchClient from "../../setup-database/_lib/route";


const INDEX_NAME = "all_vehicles";


const AUTOSYNC_URL =
  "https://api.autosyncstudio.com/vehicles";


const PAGE_SIZE = 500;

const MAX_RETRIES = 5;



function sleep(ms){

  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );

}



// ======================================================
// Fetch Vehicles Page
// ======================================================

async function fetchVehiclesPage(
  page,
  attempt = 1
){


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



    const response =
      await fetch(url, {

        signal:
          AbortSignal.timeout(30000)

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
        "Invalid AutoSync response"
      );

    }



    return data;



  }catch(error){


    console.error(
      `Vehicle page ${page} failed ${attempt}/${MAX_RETRIES}`,
      error.message
    );



    if(attempt >= MAX_RETRIES){

      throw error;

    }



    await sleep(
      1000 * Math.pow(2, attempt - 1)
    );



    return fetchVehiclesPage(
      page,
      attempt + 1
    );


  }

}




// ======================================================
// Fitment Transformer
// ======================================================

function transformFitment(item){


  return {


    id:
      item.Id,


    chassis_id:
      item.ChassisId,



    format:
      item.Format,



    name:
      item.Name || null,



    tire_size:
      item.TireSize || null,


    section_width:
      item.SectionWidth,


    aspect_ratio:
      item.AspectRatio,


    rim_diameter:
      item.RimDiameter,


    rim_width:
      item.RimWidth,


    inch_width:
      item.InchWidth,


    diameter:
      item.Diameter,



    speed_rating:
      item.SpeedRating,



    offset:
      item.Offset,


    min_offset:
      item.MinOffset,


    max_offset:
      item.MaxOffset,



    tire_size_rear:
      item.TireSizeRear,


    section_width_rear:
      item.SectionWidthRear,


    aspect_ratio_rear:
      item.AspectRatioRear,


    rim_diameter_rear:
      item.RimDiameterRear,


    rim_width_rear:
      item.RimWidthRear,


    inch_width_rear:
      item.InchWidthRear,


    diameter_rear:
      item.DiameterRear,


    speed_rating_rear:
      item.SpeedRatingRear,



    offset_rear:
      item.OffsetRear,


    min_offset_rear:
      item.MinOffsetRear,


    max_offset_rear:
      item.MaxOffsetRear


  };


}





// ======================================================
// Plus Size Transformer
// ======================================================

function transformPlusSize(item){


  return {


    chassis_id:
      item.ChassisId,


    type:
      item.Type,

    format:
    item.Format,

    tire_size:
      item.TireSize,



    section_width:
      item.SectionWidth,


    aspect_ratio:
      item.AspectRatio,


    rim_diameter:
      item.RimDiameter,


    rim_width:
      item.RimWidth,



    inch_width:
      item.InchWidth,


    diameter:
      item.Diameter,



    min_offset:
      item.MinOffset,


    max_offset:
      item.MaxOffset,



    notes:
      item.Notes || []

  };

}





// ======================================================
// Vehicle Transformer
// ======================================================

function transformVehicle(
  vehicle,
  meta
){


  const make =
    vehicle.Make || "";


  const model =
    vehicle.Model || "";



  return {


    // Identity

    id:
      vehicle.Id.toString(),


    default_chassis_id:
      vehicle.DefaultChassisId?.toString(),



    vehicle_key:
      `${vehicle.Year}-${make}-${model}-${vehicle.Submodel || ""}`
      .toLowerCase()
      .trim()
      .replace(/\s+/g,"-"),



    ymm_key:
      `${vehicle.Year}-${make}-${model}`
      .toLowerCase()
      .trim()
      .replace(/\s+/g,"-"),




    // YMM

    year:
      vehicle.Year,


    make,


    model,


    submodel:
      vehicle.Submodel,


    make_model:
      `${make} ${model}`.trim(),



    type:
      vehicle.Type,


    body:
      vehicle.Body,



    doors:
      vehicle.Doors,


    bed:
      vehicle.Bed,



    // Specs

    bolt_circle:
      vehicle.BoltCircle,


    bore:
      vehicle.Bore,


    bore_rear:
      vehicle.BoreRear,


    lug_count:
      vehicle.LugCount,


    max_wheel_load:
      vehicle.MaxWheelLoad,


    drw:
      vehicle.Drw,



    // Images

    img_url_base:
      meta.ImgUrlBase,


    images: {

      img_001:
        vehicle.Img001 || null,


      img_014:
        vehicle.Img014 || null,


      img_032:
        vehicle.Img032 || null


    },




    // Fitments

    fitments:
      (vehicle.Fitments || [])
      .map(transformFitment),



    optional_fitments:
      (vehicle.OptionalFitments || [])
      .map(transformFitment),



    plus_sizes:
      (vehicle.PlusSizes || [])
      .map(transformPlusSize),




    // Flags

    staggered:
      vehicle.Staggered,


    staggered_diameter:
      vehicle.StaggeredDiameter,


    staggered_width:
      vehicle.StaggeredWidth,


    race_tires:
      vehicle.RaceTires,



    load_rating:
      vehicle.LoadRating,


    load_rating_rear:
      vehicle.LoadRatingRear



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
            vehicle.id

        }

      });



      body.push({

        doc: vehicle,

        doc_as_upsert:true

      });


    }


    const response =
      await openSearchClient.bulk({
    
        refresh:true,

        body

      });



    if(response.errors){


      const failed =
        response.items
        .filter(
          item =>
          item.update?.error
        );



      console.error(
        failed.slice(0,3)
      );



      throw new Error(
        "Bulk insert failed"
      );

    }



  }catch(error){


    console.error(
      `Bulk failed ${attempt}/${MAX_RETRIES}`,
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



  while(true){


    console.log(
      `Fetching vehicle page ${page}`
    );



    const data =
      await fetchVehiclesPage(page);



    if(
      data.Vehicles.length === 0
    ){

      break;

    }



    const vehicles =
      data.Vehicles.map(vehicle =>
        transformVehicle(
          vehicle,
          data
        )
      );



    console.log(vehicles[0])

     


    await bulkUploadToOpenSearch(
      vehicles
    );



    totalImported +=
      vehicles.length;



    console.log(
      `Imported ${vehicles.length} | Total ${totalImported}`
    );



    if(!data.MoreItems){

      break;

    }



    page++;


    await sleep(50);


  }



  await openSearchClient.indices.refresh({

    index: INDEX_NAME

  });



  console.log(
    `Vehicle import completed ${totalImported}`
  );


}