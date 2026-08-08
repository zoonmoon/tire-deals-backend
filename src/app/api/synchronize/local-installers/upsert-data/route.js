import fs from "fs/promises";
import path from "path";

import openSearchClient from "@/app/api/setup-database/_lib/route";

const INDEX_NAME = "all_installers";

const COMBINED_DIR = path.join(
  process.cwd(),
  "installer-data",
  "combined-installer-data"
);

const BATCH_SIZE = 500;
const MAX_RETRIES = 5;


// ======================================================
// Sleep
// ======================================================

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


// ======================================================
// Get installer files
// ======================================================

async function getInstallerFiles() {
  const files = await fs.readdir(COMBINED_DIR);

  return files.filter(
    (file) =>
      file.toLowerCase().endsWith(".json")
  );
}


// ======================================================
// Read installer files
// ======================================================

async function readInstallerBatch(
  files,
  startIndex
) {
  const batchFiles = files.slice(
    startIndex,
    startIndex + BATCH_SIZE
  );

  const installers = [];

  for (const file of batchFiles) {
    try {
      const filePath = path.join(
        COMBINED_DIR,
        file
      );

      const content = await fs.readFile(
        filePath,
        "utf8"
      );

      const installer = JSON.parse(content);

      installers.push({
        file,
        data: installer,
      });
    } catch (error) {
      console.error(
        `❌ Failed to read ${file}:`,
        error.message
      );
    }
  }

  return installers;
}


// ======================================================
// Bulk index installers
//
// _id = installer.id
//
// Using index means:
//
// Existing document:
//     → replaced/updated
//
// New document:
//     → created
//
// Therefore this is effectively an upsert for
// the complete installer document.
// ======================================================

async function bulkIndexInstallers(
  installers,
  attempt = 1
) {
  try {
    const bulkBody = [];

    for (const installer of installers) {
      const data = installer.data;

      const installerId = String(
        data.id
      );

      // -----------------------------------------------
      // INDEX operation
      // -----------------------------------------------

      bulkBody.push({
        index: {
          _index: INDEX_NAME,
          _id: installerId,
        },
      });

      // -----------------------------------------------
      // OpenSearch document
      //
      // Searchable fields are kept at top level.
      //
      // Entire combined JSON is also stored in raw.
      // -----------------------------------------------

      bulkBody.push({
        id: installerId,

        company_name:
          data.company_name ?? "",

        address_line1:
          data.address_line1 ?? "",

        address_line2:
          data.address_line2 ?? "",

        city:
          data.city ?? "",

        state:
          data.state ?? "",

        zip:
          data.zip ?? "",

        location:
          data.location ?? null,

        rating:
          data.rating ?? null,

        review_count:
          data.review_count ?? null,

        is_mobile_install:
          Boolean(
            data.is_mobile_install
          ),

        is_certified:
          Boolean(
            data.is_certified
          ),

        is_top_shop:
          Boolean(
            data.is_top_shop
          ),

        is_sponsored:
          Boolean(
            data.is_sponsored
          ),

        authorised_installer:
          Boolean(
            data.authorised_installer
          ),

        min_rim_size:
          data.min_rim_size ?? null,

        max_rim_size:
          data.max_rim_size ?? null,

        installer_product_sub_types:
          data.installer_product_sub_types || [],

        installation_price:
          data.installation_price ?? null,

        installation_sale_price:
          data.installation_sale_price ?? null,

        installation_4_tires_sale_price:
          data.installation_4_tires_sale_price ?? null,

        installation_cost_for_4_tires_in_cents:
          data.installation_cost_for_4_tires_in_cents ?? null,

        saving_cost:
          data.saving_cost ?? null,

        // ---------------------------------------------
        // ENTIRE COMBINED OBJECT
        // ---------------------------------------------

        raw: data,
      });
    }

    if (bulkBody.length === 0) {
      return {
        indexed: 0,
        failed: 0,
      };
    }

    // -----------------------------------------------
    // One bulk request
    // -----------------------------------------------

    const response =
      await openSearchClient.bulk({
        body: bulkBody,
      });

    const responseBody =
      response.body ?? response;

    const items =
      responseBody.items ?? [];

    let indexed = 0;
    let failed = 0;

    for (
      let i = 0;
      i < items.length;
      i++
    ) {
      const item =
        items[i];

      const result =
        item.index;

      if (!result?.error) {
        indexed++;
        continue;
      }

      failed++;

      console.error(
        `❌ Installer indexing failed: ${result._id}`,
        result.error
      );
    }

    return {
      indexed,
      failed,
    };
  } catch (error) {
    console.error(
      `❌ OpenSearch bulk request failed. ` +
        `Attempt ${attempt}/${MAX_RETRIES}`,
      error.message
    );

    if (attempt >= MAX_RETRIES) {
      throw error;
    }

    const delay =
      1000 *
      Math.pow(
        2,
        attempt - 1
      );

    console.log(
      `Retrying after ${delay}ms`
    );

    await sleep(delay);

    return bulkIndexInstallers(
      installers,
      attempt + 1
    );
  }
}


// ======================================================
// MAIN SYNC
// ======================================================

export default async function syncInstallersToOpenSearch() {
  try {
    console.log(
      "🚀 Starting installer → OpenSearch sync"
    );

    console.log(
      `📂 Reading from: ${COMBINED_DIR}`
    );

    // ==================================================
    // Check index
    // ==================================================

    const indexExists =
      await openSearchClient.indices.exists({
        index: INDEX_NAME,
      });

    const exists =
      indexExists.body ?? indexExists;

    if (!exists) {
      throw new Error(
        `OpenSearch index "${INDEX_NAME}" does not exist`
      );
    }

    console.log(
      `✅ OpenSearch index "${INDEX_NAME}" exists`
    );

    // ==================================================
    // Get files
    // ==================================================

    const files =
      await getInstallerFiles();

    console.log(
      `📦 Found ${files.length} installer files`
    );

    let totalProcessed = 0;
    let totalIndexed = 0;
    let totalFailed = 0;

    // ==================================================
    // Process batches
    // ==================================================

    for (
      let startIndex = 0;
      startIndex < files.length;
      startIndex += BATCH_SIZE
    ) {
      const installers =
        await readInstallerBatch(
          files,
          startIndex
        );

      if (
        installers.length === 0
      ) {
        continue;
      }

      console.log(
        `🔄 Processing ${startIndex + 1}` +
          `-${Math.min(
            startIndex + BATCH_SIZE,
            files.length
          )}` +
          ` of ${files.length}`
      );

      const result =
        await bulkIndexInstallers(
          installers
        );

      totalProcessed +=
        installers.length;

      totalIndexed +=
        result.indexed;

      totalFailed +=
        result.failed;

      console.log(
        `📊 Batch complete | ` +
          `Processed: ${installers.length} | ` +
          `Indexed: ${result.indexed} | ` +
          `Failed: ${result.failed}`
      );

      console.log(
        `📈 Total | ` +
          `Processed: ${totalProcessed} | ` +
          `Indexed: ${totalIndexed} | ` +
          `Failed: ${totalFailed}`
      );
    }

    // ==================================================
    // Final summary
    // ==================================================

    console.log(
      "======================================"
    );

    console.log(
      "🎉 Installer → OpenSearch sync complete"
    );

    console.log(
      `Total processed: ${totalProcessed}`
    );

    console.log(
      `Total indexed: ${totalIndexed}`
    );

    console.log(
      `Total failed: ${totalFailed}`
    );

    console.log(
      "======================================"
    );

    return {
      success: true,
      totalProcessed,
      totalIndexed,
      totalFailed,
    };
  } catch (error) {
    console.error(
      "💀 Installer → OpenSearch sync failed:",
      error
    );

    throw error;
  }
}

export async function GET(){


    await syncInstallersToOpenSearch()

}