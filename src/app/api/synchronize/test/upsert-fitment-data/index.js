import fs from "fs";
import { Client } from "@opensearch-project/opensearch";

// 🔧 OpenSearch client
const openSearchClient = new Client({
  node: `https://${process.env.OPENSEARCH_USERNAME}:${process.env.OPENSEARCH_PASSWORD}@${process.env.OPENSEARCH_HOST}:${process.env.OPENSEARCH_PORT}`,
  ssl: {
    rejectUnauthorized: false,
  },
});

const INDEX_NAME = "fitment_data"; // 🔥 change if needed
const CHUNK_SIZE = 5000;
const MAX_RETRIES = 5;

// ⏱ sleep helper
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 🚀 Bulk upsert one chunk
async function bulkUpsertFitmentChunk(chunk, chunkIndex, attempt = 1) {
  try {
    const body = [];

    for (const item of chunk) {
      body.push({
        update: {
          _index: INDEX_NAME,
          _id: item.id,
        },
      });

      body.push({
        doc: item,
        doc_as_upsert: true,
      });
    }

    const response = await openSearchClient.bulk({
      refresh: false, // faster
      body,
    });

    if (response.body.errors) {
      console.log(`⚠️ Chunk ${chunkIndex}: partial failures detected`);
    }

    console.log(`✅ Chunk ${chunkIndex} uploaded (${chunk.length} docs)`);

  } catch (err) {
    console.error(`❌ Chunk ${chunkIndex} failed (attempt ${attempt}): ${err.message}`);

    if (attempt < MAX_RETRIES) {
      console.log(`🔁 Retrying chunk ${chunkIndex}...`);
      await sleep(500 * attempt);
      return bulkUpsertFitmentChunk(chunk, chunkIndex, attempt + 1);
    }

    throw err;
  }
}

// 📥 Main function
export async function uploadFitmentDataFromFile(filePath = "./fitment_data.json") {
  console.log("📥 Reading fitment file...");

  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  console.log(`📊 Total records: ${data.length}`);

  let processed = 0;
  let chunkIndex = 0;

  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    chunkIndex++;

    console.log(`🚀 Uploading chunk ${chunkIndex} (${chunk.length} records)...`);

    await bulkUpsertFitmentChunk(chunk, chunkIndex);

    processed += chunk.length;

    console.log(`📈 Progress: ${processed}/${data.length}`);
  }

  // 🔥 refresh index after all uploads
  await openSearchClient.indices.refresh({ index: INDEX_NAME });

  console.log("🎉 All fitment data uploaded successfully!");
}