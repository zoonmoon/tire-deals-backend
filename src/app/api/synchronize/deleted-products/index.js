// const STORE_HASH = process.env.BIGC_STORE_HASH;
// const ACCESS_TOKEN = process.env.BIGC_ACCESS_TOKEN;
// const BASE_URL = `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/catalog/products`;

// import { bulkUploadToOpensearchDatabase, fetchAllActiveProductIdsFromOpenSearch } from "../new-and-updated-products/bulk_upload_to_os";

// async function fetchAllProductsFromBigCommerce() {

//   let allProductsIDs = [];
//   let page = 1;
//   const limit = 250;
//   const MAX_RETRIES = 5;

//   let totalPages = null;

//   while (true) {
//     let retries = 0;
    
//     while (retries < MAX_RETRIES) {

//       try {

//         let urlParams = [
//             `limit=${limit}`,
//             `page=${page}`,
//             `include_fields=id`
//         ]

//         const url = `${BASE_URL}?${urlParams.join('&')}`;


//         const res = await fetch(url, {
//           method: "GET",
//           headers: {
//             "Accept": "application/json",
//             "Content-Type": "application/json",
//             "X-Auth-Token": ACCESS_TOKEN,
//           },
//         });

        
//         // small delay between requests

//         if (!res.ok) {
//           throw new Error(`HTTP ${res.status} ${res.statusText}`);
//         }

//         const json = await res.json();

//         // 💥 STRICT VALIDATION
//         if (
//           !json ||
//           !Array.isArray(json.data) ||
//           !json.meta ||
//           !json.meta.pagination ||
//           typeof json.meta.pagination.total_pages !== "number"
//         ) {
//           throw new Error("Invalid API response structure");
//         }

//         const products = json.data.map(p => p.id.toString());

//         await new Promise(r => setTimeout(r, 5000 ));

//         allProductsIDs.push(...products)

//         const pagination = json.meta.pagination;

//         if (totalPages === null) {
//           totalPages = pagination.total_pages;
//         }

//         console.log(`✅ Page ${page} fetched: ${products.length}`);

//         // DONE
//         if (page >= totalPages) {
//           return allProductsIDs;
//         }

//         page++; // move forward ONLY on success

//         break; // exit retry loop

//       } catch (error) {
//         retries++;

//         console.log(
//           `❌ Page ${page} failed (attempt ${retries}/${MAX_RETRIES}):`,
//           error.message
//         );

//         if (retries >= MAX_RETRIES) {
//           console.error("💀 CRITICAL: Max retries reached. Aborting process.");
//           throw error; // 💥 HARD FAIL ENTIRE PROCESS
//         }

//         // small backoff
//         await new Promise(r => setTimeout(r, 1000 * retries));
//       }
//     }
//   }
// }


// export async function synchronizeDeletedProducts() {

//   console.log("fetching all active product ids from opensearch")

//   let allActiveProductIDsFromOpenSearch = await fetchAllActiveProductIdsFromOpenSearch();
//   console.log("allActiveProductIDsFromOpenSearch", allActiveProductIDsFromOpenSearch.length);

//   console.log("fetching all products from bigcommerce")
//   let allProductsFromBigCommerce = await fetchAllProductsFromBigCommerce();
//   console.log("allProductsFromBigCommerce", allProductsFromBigCommerce.length);

//   // ✅ Create Set, O(n) complexity
//   const bigCommerceIDSet = new Set(allProductsFromBigCommerce);

//   // 🧹 Immediately free array memory
//   allProductsFromBigCommerce = null;

//   // ✅ Compute deleted
//   const productsDeletedInBigCommerce = allActiveProductIDsFromOpenSearch.filter(
//     id => !bigCommerceIDSet.has(id)
//   );

//   console.log("🗑️ Deleted products count:", productsDeletedInBigCommerce.length);

//   // 🧹 Free remaining large array
//   allActiveProductIDsFromOpenSearch = null;

//   if(productsDeletedInBigCommerce.length > 1000 ) return 
  
//   const BATCH_SIZE = 1000;

//   for (let i = 0; i < productsDeletedInBigCommerce.length; i += BATCH_SIZE) {

//     const batch = productsDeletedInBigCommerce.slice(i, i + BATCH_SIZE);
    
//     await bulkUploadToOpensearchDatabase(batch.map(id => ({
//       bigcommerce_id: id, 
//       is_visible: false, 
//       is_deleted: true,
//     })))
    
//   }

//   console.log("Deletion successful")

// }