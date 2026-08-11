// app/api/setup/route.js

import { 
  allTiresSchema , 
  allVehiclesSchema, 
  localInstallersSchema, 
  rebatesSchema, 
  contactInquiriesSchema

} from "./schema";
import openSearchClient from "../_lib/route";

export async function GET() {
   
  try {

    // 



    const contactUS = await openSearchClient.indices.exists({ index: "contact_us_inquiries" });

    if (!contactUS.body) {

      await openSearchClient.indices.create({
        index: "contact_us_inquiries",
        body: contactInquiriesSchema,
      });

      // 

      console.log("contactInquiriesSchema index created ✅");

    } else {

      console.log("contactInquiriesSchema index already exists");

    }

    return 



    const rebates = await openSearchClient.indices.exists({ index: "rebates" });

    if (!rebates.body) {

      await openSearchClient.indices.create({
        index: "rebates",
        body: rebatesSchema,
      });

      // 

      console.log("rebatesSchema index created ✅");

    } else {

      console.log("rebatesSchema index already exists");

    }

    return

    const allInstallers = await openSearchClient.indices.exists({ index: "all_installers" });

    if (!allInstallers.body) {
      
      await openSearchClient.indices.create({
        index: "all_installers",
        body: localInstallersSchema,
      });
      
      console.log("localInstallersSchema index created ✅");

    } else {
      
      console.log("localInstallersSchema index already exists");

    }
    


    return
    
    const allVehicles = await openSearchClient.indices.exists({ index: "all_vehicles" });

    if (!allVehicles.body) {
      
      await openSearchClient.indices.create({
        index: "all_vehicles",
        body: allVehiclesSchema,
      });
      
      console.log("allVehiclesSchema index created ✅");

    } else {
      
      console.log("allVehiclesSchema index already exists");

    }

    


    const allTires = await openSearchClient.indices.exists({ index: "all_tires" });

    if (!allTires.body) {
      
      await openSearchClient.indices.create({
        index: "all_tires",
        body: allTiresSchema,
      });
      
      console.log("allTiresSchema index created ✅");

    } else {
      
      console.log("allTiresSchema index already exists");

    }
    
    return



    const wpsBrands = await openSearchClient.indices.exists({ index: "wps_brands" });

    if (!wpsBrands.body) {
      
      await openSearchClient.indices.create({
        index: "wps_brands",
        body: wpsBrandsSchema,
      });
      
      console.log("wpsBrandsSchema index created ✅");

    } else {
      
      console.log("wpsBrandsSchema index already exists");

    }
    
    return

    const sparkShippingProducts = await openSearchClient.indices.exists({ index: "spark_shipping_products" });
    
    if (!sparkShippingProducts.body) {
      await openSearchClient.indices.create({
        index: "spark_shipping_products",
        body: sparkShippingProductsSchema,
      });
      console.log("sparkShippingProductsSchema index created ✅");
    } else {
      console.log("sparkShippingProductsSchema index already exists");
    }

    

    const makeModelVehicleTypeSchemaExists = await openSearchClient.indices.exists({ index: "make_model_vehicle_type_map" });
    if (!makeModelVehicleTypeSchemaExists.body) {
      await openSearchClient.indices.create({
        index: "make_model_vehicle_type_map",
        body: makeModelVehicleTypeSchema,
      });
      console.log("makeModelVehicleTypeSchema index created ✅");
    } else {
      console.log("makeModelVehicleTypeSchema index already exists");
    }


     

    const turn14FitmentDataExists = await openSearchClient.indices.exists({ index: "turn14_fitment_data" });
    if (!turn14FitmentDataExists.body) {
      await openSearchClient.indices.create({
        index: "turn14_fitment_data",
        body: turn14FitmentDataSchema,
      });
      console.log("turn14_fitment_data index created ✅");
    } else {
      console.log("turn14_fitment_data index already exists");
    }

    return 

    // Create Products index
    const productsIndexExists = await openSearchClient.indices.exists({ index: "products" });
    if (!productsIndexExists.body) {
      await openSearchClient.indices.create({
        index: "products",
        body: productsSchema,
      });
      console.log("Products index created ✅");
    } else {
      console.log("Products index already exists");
    }
    
    // Create Categories index
    const categoriesIndexExists = await openSearchClient.indices.exists({ index: "categories" });
    if (!categoriesIndexExists.body) {
      await openSearchClient.indices.create({
        index: "categories",
        body: categoriesSchema,
      });
      console.log("Categories index created ✅");
    } else {
      console.log("Categories index already exists");
    }
    
    // Create Categories index
    const fitmentDataSchemaExists = await openSearchClient.indices.exists({ index: "fitment_data" });
    if (!fitmentDataSchemaExists.body) {
      await openSearchClient.indices.create({
        index: "fitment_data",
        body: fitmentDataSchema,
      });
      console.log("fitment data index created ✅");
    } else {
      console.log("fitment data index already exists");
    }

    return new Response("Indices created successfully ✅", { status: 200 });
  } catch (error) {
    console.error("Error creating indices ❌", error);
    return new Response("Failed to create indices ❌", { status: 500 });
  }
}


// export async function GET() {
//   try {
//     // List all indices
//     const indices = await openSearchClient.cat.indices({ format: "json" });
    
//     // Return JSON response
//     return new Response(JSON.stringify(indices.body, null, 2), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error) {
//     console.error("Error fetching indices ❌", error);
//     return new Response("Failed to fetch indices ❌", { status: 500 });
//   }
// }


export async function DELETE() {
   
  try {
    // Delete Products index if exists
    const fitmentDataIndexExists = await openSearchClient.indices.exists({ index: "fitment_data" });
    if (fitmentDataIndexExists.body) {
      await openSearchClient.indices.delete({ index: "fitment_data" });
      console.log("Products index deleted 🗑️");
    } else {
      console.log("Products index does not exist");
    }
    // Delete Products index if exists
    const productsIndexExists = await openSearchClient.indices.exists({ index: "products" });
    if (productsIndexExists.body) {
      await openSearchClient.indices.delete({ index: "products" });
      console.log("Products index deleted 🗑️");
    } else {
      console.log("Products index does not exist");
    }

    // Delete Categories index if exists
    const categoriesIndexExists = await openSearchClient.indices.exists({ index: "categories" });
    if (categoriesIndexExists.body) {
      await openSearchClient.indices.delete({ index: "categories" });
      console.log("Categories index deleted 🗑️");
    } else {
      console.log("Categories index does not exist");
    }

    return new Response("Indices deleted successfully 🗑️", { status: 200 });
  } catch (error) {
    console.error("Error deleting indices ❌", error);
    return new Response("Failed to delete indices ❌", { status: 500 });
  }
}


export async function PUT() {
  
  return 
  try {
    // Check if the products index exists
    const productsIndexExists = await openSearchClient.indices.exists({ index: "categories" });

    if (!productsIndexExists.body) {
      return new Response("cateogires index does not exist ❌", { status: 404 });
    }
    
        // Update the mapping to include compatibility_info with expandable fields
    await openSearchClient.indices.putMapping({
      index: "products",
      body: {

        properties: {

          "bigc_name": {
            "type": "text"
          },

          "bigc_price": {
            "type": "float"
          },

          "bigc_sale_price": {
            "type": "float"
          },

          "bigc_sku": {
            "type": "keyword"
          },

          "bigc_description": {
            "type": "text"
          },

          "bigc_url": {
            "type": "keyword"
          },

          "bigc_images": {
            "type": "nested",
            "properties": {
              "url_standard": { "type": "keyword" },
              "url_zoom": { "type": "keyword" },
              "is_thumbnail": { "type": "boolean" }
            }
          },

          "bigc_custom_fields": {
            "type": "nested",
            "properties": {
              "name":   { "type": "keyword" },
              "values": { "type": "keyword" }
            }
          }

        }
      }
    });
    // await openSearchClient.indices.putMapping({
    //   index: "categories",
    //   body: {
    //     properties: {
    //       name: {type: "keyword"},
    //       full_path: {type: "text"}
    //     }
    //   }
    // });

    console.log("categories mapping updated with expandable compatibility_info ✅");
    return new Response("categories mapping updated successfully ✅", { status: 200 });

  } catch (error) {
    console.error("Error updating categories mapping ❌", error);
    return new Response("Failed to update categories mapping ❌", { status: 500 });
  }
}
