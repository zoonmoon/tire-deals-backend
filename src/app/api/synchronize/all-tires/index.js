import openSearchClient from "../../setup-database/_lib/route";

const INDEX_NAME = "all_tires";

const AUTOSYNC_URL = "https://api.autosyncstudio.com/tires";

const PAGE_SIZE = 500;
const MAX_RETRIES = 5;



function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

  

// ======================================================
// Fetch AutoSync page with retry
// ======================================================

async function fetchTiresPage(page, attempt = 1) {

  try {

    const url =
      `${AUTOSYNC_URL}` +
      `?i-inventory=true` +
      `&i-uid` +
      `&i-tags` +
      `&i-price=true` +
      `&i-img` +
      `&i-rebates` +
      `&i-specs` +
      `&p-size=${PAGE_SIZE}` +
      `&p-number=${page}` +
      `&key=${process.env.AUTOSYNC_API_KEY}`;



    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000)
    });



    if (!response.ok) {
      throw new Error(
        `AutoSync HTTP ${response.status}`
      );
    }



    const data = await response.json();



    if (
      !data ||
      !Array.isArray(data.Tires)
    ) {
      throw new Error(
        "Invalid AutoSync response: Tires missing"
      );
    }



    return data;



  } catch (error) {


    console.error(
      `❌ AutoSync page ${page} failed. Attempt ${attempt}/${MAX_RETRIES}`,
      error.message
    );



    if (attempt >= MAX_RETRIES) {

      console.error(
        `💀 Stopping import. Page ${page} failed after ${MAX_RETRIES} attempts`
      );

      throw error;
    }



    const delay =
      1000 * Math.pow(2, attempt - 1);



    console.log(
      `Retrying page ${page} after ${delay}ms`
    );


    await sleep(delay);



    return fetchTiresPage(
      page,
      attempt + 1
    );
  }
}



function generateHandle(tire) {

  return [
    tire.DisplayName,
    tire.Brand,
    tire.Uid
  ]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

}


// ======================================================
// Transform AutoSync Tire -> OpenSearch document
// ======================================================

function transformTire(tire, meta) {


  let size_format = "U";


  if (
    tire.AspectRatio !== null &&
    tire.AspectRatio !== undefined &&
    tire.SectionWidth !== null &&
    tire.SectionWidth !== undefined
  ) {

    size_format = "M";

  }
  else if (
    tire.Diameter !== null &&
    tire.Diameter !== undefined &&
    tire.InchWidth !== null &&
    tire.InchWidth !== undefined
  ) {

    size_format = "F";

  }


const normalize = (value) => {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
};



const rebates = Array.isArray(tire.Rebates)
  ? tire.Rebates.map((rebate) => {
      const info = Array.isArray(rebate.Info)
        ? rebate.Info[0]
        : null;

      return {
        amount: info?.Amount ?? null,

        description: info?.Description ?? null,

        description_preview:
          rebate.DescriptionPreview ?? null,

        qty_required:
          rebate.QtyRequired ?? null,

        url:
          rebate.Url ?? null,

        preview_img_url:
          rebate.PreviewImgUrl ?? null,

        banner_img_url:
          rebate.BannerImgUrl ?? null,

        horizontal_img_url:
          rebate.HorizontalImgUrl ?? null,

        start_date:
          rebate.StartDate ?? null,

        end_date:
          rebate.EndDate ?? null
      };
    })
  : [];

const contains_rebates = rebates.length > 0;


  return {
    
    rebates, 
    
    contains_rebates,

    
    // Identity

    uid: tire.Uid,

    handle: generateHandle(tire) || tire.Uid.toLowerCase(),

    part_number: tire.PartNumber,
    normalized_part_number: normalize(tire.PartNumber),


    // Basic

    brand: tire.Brand,
    normalized_brand: normalize(tire.Brand),

    
    model: tire.Model,

    title: tire.DisplayName,

    description: tire.Description,



    // Size

    size: tire.Size,

    size_format,

    
    section_width:
      tire.SectionWidth,


    aspect_ratio:
      tire.AspectRatio,


    diameter:
      tire.Diameter,


    inch_width:
      tire.InchWidth,


    rim_diameter:
      tire.RimDiameter,



    // Dimensions

    overall_diameter:
      tire.OverallDiameter,


    overall_width:
      tire.OverallWidth,


    weight:
      tire.Weight,


    tread_depth:
      tire.TreadDepth,



    // Attributes

    speed_rating:
      tire.SpeedRating,


    load_rating:
      tire.LoadRating,


    load_range:
      tire.LoadRange,


    ply_rating:
      tire.PlyRating,


    sidewall:
      tire.Sidewall,


    run_flat:
      tire.RunFlat,


    winter_class:
      tire.WinterClass,



    // Tags

    vehicle_type_tags:
      tire.VehicleTypeTags,


    segment_tags:
      tire.SegmentTags,



    // Images raw AutoSync fields

    img_url_base:
      meta.ImgUrlBase,


    rotation_img_url_base:
      meta.RotationImgUrlBase,


    img_front:
      tire.ImgFront,


    img_side1:
      tire.ImgSide1,


    img_side2:
      tire.ImgSide2,


    img_thumb:
      tire.ImgThumb,


    img_angle:
      tire.ImgAngle,



    // Extra

    origin_country:
      tire.OriginCountry,


    utqg:
      tire.Utqg

  };

}







// ======================================================
// Bulk upload to OpenSearch
// ======================================================

async function bulkUploadToOpenSearch(
  tires,
  attempt = 1
) {

  try {


    const body = [];



    for (const tire of tires) {


      body.push({

        update: {

          _index: INDEX_NAME,

          _id: tire.uid.toString()

        }

      });



      body.push({

        doc: tire,

        doc_as_upsert: true

      });

    }



    const response =
      await openSearchClient.bulk({

        refresh: false,

        body

      });



    if(response.errors){

      throw new Error(
        "OpenSearch bulk insert contained errors"
      );

    }



  } catch(error) {


    console.error(
      `❌ OpenSearch bulk failed attempt ${attempt}/${MAX_RETRIES}`,
      error.message
    );



    if(attempt >= MAX_RETRIES){

      throw error;

    }



    await sleep(
      1000 * attempt
    );



    return bulkUploadToOpenSearch(
      tires,
      attempt + 1
    );

  }

}







// ======================================================
// MAIN IMPORTER
// ======================================================

export async function syncAllTiresFromAutoSync() {


  let page = 1;


  let totalImported = 0;



  try {


    while(true) {


      console.log(
        `📥 Fetching AutoSync tire page ${page}`
      );



      const data =
        await fetchTiresPage(page);



      if(data.Tires.length === 0){

        throw new Error(
          `Empty tire response on page ${page}`
        );

      }



      const transformed =
        data.Tires.map(
          tire =>
            transformTire(
              tire,
              data
            )
        );



        console.log(transformed[0])

         


      await bulkUploadToOpenSearch(
        transformed
      );



      totalImported += transformed.length;



      console.log(
        `✅ Imported ${transformed.length} tires | Total: ${totalImported}`
      );



      if(!data.MoreItems){

        console.log(
          "🎉 AutoSync tire import completed"
        );

        break;

      }



      page++;



      // Stay safely below 20 req/sec

      await sleep(250);

    }





    await openSearchClient.indices.refresh({

      index: INDEX_NAME

    });



    console.log(
      `🔥 Finished. Total tires imported: ${totalImported}`
    );



  } catch(error){


    console.error(
      "💀 Tire import stopped:",
      error.message
    );


    throw error;

  }

}