import ftp from "basic-ftp";
import { Writable } from "stream";
import { parse } from "csv-parse/sync";

import openSearchClient from "../../setup-database/_lib/route";

const INDEX_NAME = "rebates";
const BATCH_SIZE = 500;
const FTP_FILE_PATH = "/downloads/rebates.csv";

const REQUIRED_COLUMNS = [
  "ProductCode",
  "Brand",
  "Pattern",
  "DisplayName",
  "Form",
  "DescriptionPreview",
  "StartDate",
  "EndDate",
  "Amount",
  "AmountReason",
  "AmountTwo",
  "AmountTwoReason",
  "QtyRequired",
  "PreviewImageUrl",
  "BannerImageUrl",
  "HorizontalImageUrl",
];

// ======================================================
// NORMALIZATION
// ======================================================

function normalizeValue(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// ======================================================
// DATE PARSING
// AutoSync format:
// MM/DD/YYYY HH:mm:ss AM/PM
//
// Examples:
// 7/1/2026 12:00:00 AM
// 8/31/2026 12:00:00 AM
// ======================================================

function parseAutoSyncDate(value) {
  const input = String(value ?? "").trim();

  if (!input) {
    return null;
  }

  const match = input.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i
  );

  if (!match) {
    return null;
  }

  const [
    ,
    monthString,
    dayString,
    yearString,
    hourString,
    minuteString,
    secondString,
    amPm,
  ] = match;

  const month = Number(monthString);
  const day = Number(dayString);
  const year = Number(yearString);
  let hour = Number(hourString);
  const minute = Number(minuteString);
  const second = Number(secondString ?? 0);

  // ----------------------------------------------------
  // Basic range validation
  // ----------------------------------------------------

  if (month < 1 || month > 12) {
    return null;
  }

  if (day < 1 || day > 31) {
    return null;
  }

  if (minute < 0 || minute > 59) {
    return null;
  }

  if (second < 0 || second > 59) {
    return null;
  }

  // ----------------------------------------------------
  // AM/PM validation
  // ----------------------------------------------------

  if (amPm) {
    if (hour < 1 || hour > 12) {
      return null;
    }

    const normalizedAmPm = amPm.toUpperCase();

    if (normalizedAmPm === "AM") {
      hour = hour === 12 ? 0 : hour;
    } else if (normalizedAmPm === "PM") {
      hour = hour === 12 ? 12 : hour + 12;
    } else {
      return null;
    }
  } else {
    // If AM/PM is not supplied, treat hour as 24-hour time.
    if (hour < 0 || hour > 23) {
      return null;
    }
  }

  // ----------------------------------------------------
  // Strict calendar validation
  //
  // This catches invalid dates such as:
  // 2/31/2026
  // 4/31/2026
  // 13/1/2026
  // ----------------------------------------------------

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
      second
    )
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second
  ) {
    return null;
  }

  // ----------------------------------------------------
  // Return ISO date for OpenSearch
  // ----------------------------------------------------

  return date.toISOString();
}

// ======================================================
// DATE NORMALIZATION FOR DOCUMENT ID
//
// 2026-07-01T00:00:00.000Z
//         ↓
// 20260701
// ======================================================

function normalizeDateForId(isoDate) {
  return isoDate.replace(/\D/g, "").slice(0, 8);
}

// ======================================================
// AMOUNT
// ======================================================

function parseAmount(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return 0;
  }

  const cleaned = String(value)
    .replace(/[$,]/g, "")
    .trim();

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : 0;
}

// ======================================================
// INTEGER
// ======================================================

function parseInteger(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return 0;
  }

  const number = Number.parseInt(
    String(value).trim(),
    10
  );

  return Number.isFinite(number) ? number : 0;
}

// ======================================================
// CREATE OPENSEARCH DOCUMENT
// ======================================================

function createRebateDocument(row) {
  const productCode =
    String(row.ProductCode ?? "").trim();

  const brand =
    String(row.Brand ?? "").trim();

  // ----------------------------------------------------
  // Normalize matching values
  // ----------------------------------------------------

  const normalizedProductCode =
    normalizeValue(productCode);

  const normalizedBrand =
    normalizeValue(brand);

  // ----------------------------------------------------
  // Validate dates
  // ----------------------------------------------------

  const startDate =
    parseAutoSyncDate(row.StartDate);

  const endDate =
    parseAutoSyncDate(row.EndDate);

  if (!startDate || !endDate) {
    return {
      document: null,
      reason: "INVALID_DATE",
    };
  }

  // ----------------------------------------------------
  // Validate rebate period
  //
  // End date should not be before start date.
  // ----------------------------------------------------

  if (
    new Date(endDate).getTime() <
    new Date(startDate).getTime()
  ) {
    return {
      document: null,
      reason: "END_DATE_BEFORE_START_DATE",
    };
  }

  // ----------------------------------------------------
  // Normalize dates for deterministic _id
  // ----------------------------------------------------

  const normalizedStartDate =
    normalizeDateForId(startDate);

  const normalizedEndDate =
    normalizeDateForId(endDate);

  // ----------------------------------------------------
  // Deterministic OpenSearch document ID
  //
  // Example:
  // 004741_bridgestone_20260701_20260831
  // ----------------------------------------------------

  const id = [
    normalizedProductCode,
    normalizedBrand,
    normalizedStartDate,
    normalizedEndDate,
  ].join("_");

  // ----------------------------------------------------
  // Create document according to rebatesSchema
  // ----------------------------------------------------

  const document = {
    id,

    // =========================
    // IDENTITY
    // =========================

    product_code: productCode,

    brand,

    pattern:
      String(row.Pattern ?? "").trim(),

    display_name:
      String(row.DisplayName ?? "").trim(),

    // =========================
    // NORMALIZED MATCHING
    // =========================

    normalized_product_code:
      normalizedProductCode,

    normalized_brand:
      normalizedBrand,

    // =========================
    // REBATE
    // =========================

    amount:
      parseAmount(row.Amount),

    amount_two:
      parseAmount(row.AmountTwo),

    amount_reason:
      String(row.AmountReason ?? "").trim(),

    amount_two_reason:
      String(row.AmountTwoReason ?? "").trim(),

    qty_required:
      parseInteger(row.QtyRequired),

    description_preview:
      String(row.DescriptionPreview ?? "").trim(),

    // =========================
    // DATES
    // =========================

    start_date: startDate,

    end_date: endDate,

    // =========================
    // ASSETS
    // =========================

    form_url:
      String(row.Form ?? "").trim(),

    preview_image_url:
      String(row.PreviewImageUrl ?? "").trim(),

    banner_image_url:
      String(row.BannerImageUrl ?? "").trim(),

    horizontal_image_url:
      String(row.HorizontalImageUrl ?? "").trim(),
  };

  return {
    document,
    reason: null,
  };
}

// ======================================================
// DOWNLOAD rebates.csv FROM AUTOSYNC FTP
// ======================================================

async function downloadRebatesCsv() {
  const client = new ftp.Client();

  client.ftp.verbose = false;

  try {
    const host =
      process.env.AUTOSYNC_FTP_HOST;

    const user =
      process.env.AUTOSYNC_FTP_USERNAME;

    const password =
      process.env.AUTOSYNC_FTP_PASSWORD;

    if (!host || !user || !password) {
      throw new Error(
        "Missing AUTOSYNC_FTP_HOST, AUTOSYNC_FTP_USERNAME, or AUTOSYNC_FTP_PASSWORD"
      );
    }

    await client.access({
      host,
      user,
      password,
      secure: false,
    });

    console.log(
      "Connected to AutoSync FTP"
    );

    const chunks = [];

    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      },
    });

    await client.downloadTo(
      writable,
      FTP_FILE_PATH
    );

    const csvBuffer =
      Buffer.concat(chunks);

    console.log(
      `Downloaded ${FTP_FILE_PATH}: ${csvBuffer.length} bytes`
    );

    return csvBuffer.toString("utf8");

  } finally {
    client.close();
  }
}

// ======================================================
// BULK INDEX
// ======================================================

async function bulkIndexRebates(documents) {
  let indexedCount = 0;

  for (
    let start = 0;
    start < documents.length;
    start += BATCH_SIZE
  ) {
    const batch =
      documents.slice(
        start,
        start + BATCH_SIZE
      );

    const operations = [];

    for (const document of batch) {
      operations.push({
        index: {
          _index: INDEX_NAME,
          _id: document.id,
        },
      });

      operations.push(document);
    }

    const response =
      await openSearchClient.bulk({
        body: operations,
        refresh: false,
      });

    const responseBody =
      response.body ?? response;

    if (responseBody.errors) {
      const errors = [];

      for (
        const item of responseBody.items ?? []
      ) {
        const result = item.index;

        if (result?.error) {
          errors.push({
            id: result._id,
            error: result.error,
          });
        }
      }

      console.error(
        `OpenSearch bulk errors in batch ${Math.floor(start / BATCH_SIZE) + 1}:`,
        errors
      );

      throw new Error(
        `OpenSearch bulk indexing failed for ${errors.length} documents`
      );
    }

    indexedCount += batch.length;

    console.log(
      `Indexed ${indexedCount}/${documents.length} rebates`
    );
  }

  return indexedCount;
}

// ======================================================
// MAIN SYNC
// ======================================================

export async function GET() {
  try {
    console.log(
      "Starting AutoSync rebates synchronization..."
    );

    // ==================================================
    // 1. Download CSV
    // ==================================================

    const csvContent =
      await downloadRebatesCsv();

    // ==================================================
    // 2. Parse CSV
    // ==================================================

    const rows = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    console.log(
      `CSV rows found: ${rows.length}`
    );

    if (!rows.length) {
      return Response.json({
        success: true,
        message:
          "rebates.csv contains no rows",
        totalRows: 0,
        indexed: 0,
        skipped: 0,
      });
    }

    // ==================================================
    // 3. Validate CSV columns
    // ==================================================

    const csvColumns =
      Object.keys(rows[0]);

    const missingColumns =
      REQUIRED_COLUMNS.filter(
        column =>
          !csvColumns.includes(column)
      );

    if (missingColumns.length) {
      throw new Error(
        `Missing required CSV columns: ${missingColumns.join(", ")}`
      );
    }

    // ==================================================
    // 4. Convert CSV → OpenSearch documents
    // ==================================================

    const documents = [];

    const skippedRows = [];

    for (
      let index = 0;
      index < rows.length;
      index++
    ) {
      const row = rows[index];

      const productCode =
        String(row.ProductCode ?? "").trim();

      const brand =
        String(row.Brand ?? "").trim();

      // ----------------------------------------------
      // Required identity fields
      // ----------------------------------------------

      if (!productCode || !brand) {
        skippedRows.push({
          row: index + 2,
          productCode,
          brand,
          reason:
            "MISSING_PRODUCT_CODE_OR_BRAND",
        });

        continue;
      }

      const result =
        createRebateDocument(row);

      if (!result.document) {
        skippedRows.push({
          row: index + 2,
          productCode,
          brand,
          startDate: row.StartDate,
          endDate: row.EndDate,
          reason: result.reason,
        });

        continue;
      }

      documents.push(result.document);
    }

    console.log(
      `Valid rebate documents: ${documents.length}`
    );

    console.log(
      `Skipped rows: ${skippedRows.length}`
    );

    // ==================================================
    // 5. Bulk index in batches of 500
    // ==================================================

    const indexed =
      await bulkIndexRebates(
        documents
      );

    // ==================================================
    // 6. Refresh index
    // ==================================================

    await openSearchClient.indices.refresh({
      index: INDEX_NAME,
    });

    console.log(
      "AutoSync rebates synchronization completed."
    );

    return Response.json({
      success: true,

      index: INDEX_NAME,

      totalCsvRows:
        rows.length,

      validDocuments:
        documents.length,

      indexed,

      skipped:
        skippedRows.length,

      batchSize:
        BATCH_SIZE,

      skippedRows,
    });

  } catch (error) {
    console.error(
      "AutoSync rebates synchronization failed:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          error?.message ||
          "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}