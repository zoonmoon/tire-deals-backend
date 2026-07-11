const STORE_HASH = process.env.BIGC_STORE_HASH;
const ACCESS_TOKEN = process.env.BIGC_ACCESS_TOKEN;
const BASE_URL = `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/catalog/products`;

import { fetchAllCategories } from "../new-and-updated-categories";
import { buildCategoryTree } from "../new-and-updated-categories/utils";
import { convertBigcResponseToElasticSearchForm, getAllBrands } from "./utils";
import { bulkUploadToOpensearchDatabase } from "./bulk_upload_to_os";

export async function synchronizeProducts(fullReindex = false) {

  let allProducts = 0;
  let page = 1;
  const limit = 250;
  const MAX_RETRIES = 5;

  let totalPages = null;

  let fetchModifiedSinceHoursAgo = 24 // fetch data modified in last 24 hours
  
  const ISOstringForModifiedSinceHoursAgo = new Date(Date.now() - fetchModifiedSinceHoursAgo * 60 * 60 * 1000).toISOString().slice(0, 19) + "Z";;

  const brandsMap = Object.fromEntries(
    (await getAllBrands()).map(b => [b.id.toString(), b.name])
  );
  

  const { roots, map:categoriesMap } = buildCategoryTree(await fetchAllCategories());
  

  while (true) {
    let retries = 0;
    
    while (retries < MAX_RETRIES) {

      try {

        let urlParams = [
            `limit=${limit}`,
            `page=${page}`,
            `include=images,custom_fields`,
            `direction=desc`,
            `sort=date_modified`
        ]

        if(!fullReindex){
          urlParams.push(`date_modified:min=${encodeURIComponent(ISOstringForModifiedSinceHoursAgo)}`)
        }

        const url = `${BASE_URL}?${urlParams.join('&')}`;


        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Auth-Token": ACCESS_TOKEN,
          },
        });

        
        // small delay between requests

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const json = await res.json();

        // 💥 STRICT VALIDATION
        if (
          !json ||
          !Array.isArray(json.data) ||
          !json.meta ||
          !json.meta.pagination ||
          typeof json.meta.pagination.total_pages !== "number"
        ) {
          throw new Error("Invalid API response structure");
        }

        const products = json.data;
          
        await bulkUploadToOpensearchDatabase(
        
          convertBigcResponseToElasticSearchForm(
            products,
            brandsMap,
            categoriesMap
          )

        )

        await new Promise(r => setTimeout(r, 200 ));

        allProducts += products.length 

        const pagination = json.meta.pagination;

        if (totalPages === null) {
          totalPages = pagination.total_pages;
        }

        console.log(`✅ Page ${page} fetched: ${products.length}`);


        // DONE
        if (page >= totalPages) {
          console.log(`🔥 DONE. Total products: ${allProducts}`);
          return ;
        }

        page++; // move forward ONLY on success

        break; // exit retry loop

      } catch (error) {
        retries++;

        console.log(
          `❌ Page ${page} failed (attempt ${retries}/${MAX_RETRIES}):`,
          error.message
        );

        if (retries >= MAX_RETRIES) {
          console.error("💀 CRITICAL: Max retries reached. Aborting process.");
          throw error; // 💥 HARD FAIL ENTIRE PROCESS
        }

        // small backoff
        await new Promise(r => setTimeout(r, 1000 * retries));
      }
    }
  }
}
