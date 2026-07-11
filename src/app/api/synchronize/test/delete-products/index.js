import openSearchClient from "@/app/api/setup-database/_lib/route";

const STORE_HASH = process.env.BIGC_STORE_HASH;
const ACCESS_TOKEN = process.env.BIGC_ACCESS_TOKEN;

/* ------------------------------------------------------------
   Utils
------------------------------------------------------------ */

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/* ------------------------------------------------------------
   1) Fetch batch from OpenSearch
------------------------------------------------------------ */

async function fetchBatchProducts(size = 1000) {
  const query = {
    size,
    _source: ["bigcommerce_id"],
    sort: [{ _id: { order: "asc" } }],
    query: {
      bool: {
        must: [{ term: { is_visible: true } }],
        must_not: [{ term: { deleted: true } }],
      },
    },
  };

  const res = await openSearchClient.search({
    index: "products",
    body: query,
  });

  return res.body.hits.hits.map(hit => ({
    id: hit._id,
    bigc_id: hit._source?.bigcommerce_id,
  }));
}

/* ------------------------------------------------------------
   2) Delete product (with retry)
------------------------------------------------------------ */

async function deleteProduct(productId, attempt = 1) {
  const MAX_RETRIES = 3;

  const url = `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/catalog/products/${productId}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "X-Auth-Token": ACCESS_TOKEN,
        Accept: "application/json",
      },
    });

    /* ---- RATE LIMIT ---- */
    if (res.status === 429) {
      if (attempt >= MAX_RETRIES) {
        console.error(`❌ 429 FAIL → ${productId}`);
        return false;
      }

      const retryAfter = res.headers.get("Retry-After");
      const waitTime = retryAfter
        ? Number(retryAfter) * 1000
        : 500 * Math.pow(2, attempt);

      console.warn(`⏳ 429 retry ${attempt} → ${productId} (${waitTime}ms)`);

      await sleep(waitTime);
      return deleteProduct(productId, attempt + 1);
    }

    /* ---- OTHER ERRORS ---- */
    if (!res.ok) {
      if (res.status === 404) {
        console.log(`⚠️ Already deleted → ${productId}`);
        return true;
      }

      if (attempt >= MAX_RETRIES) {
        console.error(`❌ DELETE FAIL → ${productId} (${res.status})`);
        return false;
      }

      await sleep(500 * Math.pow(2, attempt));
      return deleteProduct(productId, attempt + 1);
    }

    return true;

  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      console.error(`❌ NETWORK FAIL → ${productId}`, err.message);
      return false;
    }

    await sleep(500 * Math.pow(2, attempt));
    return deleteProduct(productId, attempt + 1);
  }
}

/* ------------------------------------------------------------
   3) OpenSearch bulk update (mark deleted)
------------------------------------------------------------ */

async function markDeleted(products) {
  if (!products.length) return;

  const bulkBody = [];

  for (const p of products) {
    bulkBody.push(
      {
        update: {
          _index: "products",
          _id: String(p.id),
        },
      },
      {
        doc: { deleted: true },
        doc_as_upsert: true,
      }
    );
  }

  try {
    const res = await openSearchClient.bulk({
      refresh: true,
      body: bulkBody,
    });

    if (res.body.errors) {
      console.error("❌ OpenSearch bulk errors");
    }
  } catch (err) {
    console.error("❌ OpenSearch crash:", err.message);
  }
}

/* ------------------------------------------------------------
   4) Process batch (delete with concurrency)
------------------------------------------------------------ */

async function processBatch(osProducts) {
  const ids = osProducts
    .map(p => p.bigc_id)
    .filter(Boolean);

  if (!ids.length) return 0;

  const successList = [];

  for (let i = 0; i < ids.length; i += 3) {
    const chunk = ids.slice(i, i + 3);

    const results = await Promise.all(
      chunk.map(async (id) => {
        const success = await deleteProduct(Number(id));

        if (success) {
          console.log(`🗑 Deleted → ${id}`);
          successList.push(
            osProducts.find(p => String(p.bigc_id) === String(id))
          );
        } else {
          console.log(`❌ Failed → ${id}`);
        }

        return success;
      })
    );

    await sleep(50); // small pacing
  }

  console.log(`📝 Marking ${successList.length} as deleted in OpenSearch`);

  await markDeleted(successList);

  return osProducts.length;
}

/* ------------------------------------------------------------
   5) MAIN LOOP (runs until empty)
------------------------------------------------------------ */

export async function deleteAllTestProducts() {
  console.log("🚀 STARTING DELETE JOB");

  let total = 0;
  let iteration = 0;

  while (true) {
    iteration++;
    console.log(`\n🔁 Iteration ${iteration}`);

    const batch = await fetchBatchProducts(1000);

    if (!batch.length) {
      console.log("✅ DONE — no more products");
      break;
    }

    console.log(`📦 Batch size: ${batch.length}`);

    try {
      const processed = await processBatch(batch);
      total += processed;
    } catch (err) {
      console.error("❌ Batch crash (skipping):", err.message);
    }

    console.log(`📊 Total processed: ${total}`);
  }

  console.log("🎉 ALL PRODUCTS DELETED");
}