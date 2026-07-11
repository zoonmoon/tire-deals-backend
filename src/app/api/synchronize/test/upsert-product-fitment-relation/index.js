import { Client } from '@opensearch-project/opensearch';
import { readFileSync } from 'fs';

const openSearchClient = new Client({
  node: `https://${process.env.OPENSEARCH_USERNAME}:${process.env.OPENSEARCH_PASSWORD}@${process.env.OPENSEARCH_HOST}:${process.env.OPENSEARCH_PORT}`,
  ssl: { rejectUnauthorized: false },
});

const PRODUCTS_INDEX = 'products';
const FITMENT_INDEX = 'fitment_data';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 🔹 Random picker (no duplicates)
function pickRandom(arr, n) {
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// 🔹 Bulk helper
async function bulkRequest(body, attempt = 1) {
  const MAX_RETRIES = 5;
  try {
    await openSearchClient.bulk({ refresh: false, body });
  } catch (err) {
    console.error(`❌ Bulk error (attempt ${attempt}):`, err.message);
    if (attempt < MAX_RETRIES) {
      await sleep(500 * attempt);
      return bulkRequest(body, attempt + 1);
    }
    throw err;
  }
}

export async function assignFitmentToProducts() {

  // 1️⃣ Load data
  const products = JSON.parse(readFileSync('all_products.json', 'utf-8'));
  const fitmentRows = JSON.parse(readFileSync('fitment_data.json', 'utf-8'));

  console.log(`✅ Products: ${products.length}`);
  console.log(`✅ Fitment rows: ${fitmentRows.length}`);

  // 2️⃣ Group fitment by vehicle_type
  const fitmentByVehicleType = {};

  for (const row of fitmentRows) {
    const key = row.vehicle_type.toLowerCase().trim();
    if (!fitmentByVehicleType[key]) fitmentByVehicleType[key] = [];
    fitmentByVehicleType[key].push(row);
  }

  console.log(`✅ Vehicle types: ${Object.keys(fitmentByVehicleType).length}`);

  const PRODUCTS_BATCH = 100;
  const FITMENT_PER_PRODUCT = 50;

  let processed = 0;
  let updatedProducts = 0;
  let totalYMMUpserts = 0;

  // 3️⃣ Process in batches of 100 products
  for (let i = 0; i < products.length; i += PRODUCTS_BATCH) {

    const batch = products.slice(i, i + PRODUCTS_BATCH);

    const productBulkBody = [];
    const fitmentBulkBody = [];

    for (const product of batch) {

      const customFields = product.custom_fields || [];

      const vehicleTypeField = customFields.find(
        cf => cf.label?.toLowerCase().trim() === 'vehicle type'
      );

      if (!vehicleTypeField) continue;

      const vehicleType = vehicleTypeField.value?.toLowerCase().trim();
      const pool = fitmentByVehicleType[vehicleType];

      if (!pool || pool.length === 0) continue;

      // 🎯 pick 50 RANDOM rows
      const selected = pickRandom(pool, FITMENT_PER_PRODUCT);

      // ✅ build nested fitment_data for product
      const nestedFitment = selected.map(row => ({
        vehicle_type: row.vehicle_type,
        make: row.make,
        model: row.model,
        year: row.year,
      }));
      
      // 🔹 update product
      productBulkBody.push({
        update: { _index: PRODUCTS_INDEX, _id: product._id }
      });
      productBulkBody.push({
        doc: { fitment_data: nestedFitment }
      });

      updatedProducts++;

      // 🔹 build fitment index docs (explode)
      for (const row of selected) {
        const newId = `${product._id}-${row.id}`;

        fitmentBulkBody.push({
          update: { _index: FITMENT_INDEX, _id: newId }
        });

        fitmentBulkBody.push({
          doc: {
            id: newId,
            product_id: product._id,
            year: row.year,
            make: row.make,
            model: row.model,
            vehicle_type: row.vehicle_type,
            notes: row.notes || ""
          },
          doc_as_upsert: true
        });

        totalYMMUpserts++;
      }

      processed++;
    }

    // 🚀 bulk update products
    if (productBulkBody.length > 0) {
      await bulkRequest(productBulkBody);
    }

    // 🚀 bulk upsert fitment_data
    if (fitmentBulkBody.length > 0) {
      await bulkRequest(fitmentBulkBody);
    }

    console.log(
      `📦 Batch done | Processed: ${processed} | Products updated: ${updatedProducts} | YMM upserts: ${totalYMMUpserts}`
    );
  }

  console.log(`\n✅ DONE`);
  console.log(`Products updated: ${updatedProducts}`);
  console.log(`Total YMM rows upserted: ${totalYMMUpserts}`);

}