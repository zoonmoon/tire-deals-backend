import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(
  process.cwd(),
  "installer-data"
);

const LOCAL_INSTALLER_DATA_DIR = path.join(
  DATA_DIR,
  "local-installers-data"
);

const DETAILS_DIR = path.join(
  LOCAL_INSTALLER_DATA_DIR,
  "installer-details"
);

const REVIEWS_DIR = path.join(
  LOCAL_INSTALLER_DATA_DIR,
  "installer-reviews"
);

const SERVICES_DIR = path.join(
  LOCAL_INSTALLER_DATA_DIR,
  "installer-services"
);

const OUTPUT_DIR = path.join(
  DATA_DIR,
  "combined-installer-data"
);


// =====================================================
// COMBINE INSTALLER DATA
// =====================================================

async function combineInstallers() {
  await fs.mkdir(OUTPUT_DIR, {
    recursive: true,
  });

  const files = await fs.readdir(DETAILS_DIR);

  const installerFiles = files.filter(
    (file) =>
      file.toLowerCase().endsWith(".json")
  );

  console.log(
    `Found ${installerFiles.length} installer files`
  );

  let successCount = 0;
  let failedCount = 0;

  for (const file of installerFiles) {
    const installerId = path.basename(
      file,
      ".json"
    );

    try {
      // =================================================
      // DETAILS
      // =================================================

      const detailsPath = path.join(
        DETAILS_DIR,
        file
      );

      const details = JSON.parse(
        await fs.readFile(
          detailsPath,
          "utf8"
        )
      );

      // =================================================
      // REVIEWS
      // =================================================

      let reviews = null;

      const reviewsPath = path.join(
        REVIEWS_DIR,
        file
      );

      try {
        reviews = JSON.parse(
          await fs.readFile(
            reviewsPath,
            "utf8"
          )
        );
      } catch (error) {
        if (error.code === "ENOENT") {
          console.warn(
            `[${installerId}] Reviews file missing`
          );
        } else {
          throw error;
        }
      }

      // =================================================
      // SERVICES
      // =================================================

      let services = null;

      const servicesPath = path.join(
        SERVICES_DIR,
        file
      );

      try {
        services = JSON.parse(
          await fs.readFile(
            servicesPath,
            "utf8"
          )
        );
      } catch (error) {
        if (error.code === "ENOENT") {
          console.warn(
            `[${installerId}] Services file missing`
          );
        } else {
          throw error;
        }
      }

      // =================================================
      // EXTRACT DATA
      // =================================================

      const installer =
        details?.siteInstaller || {};

      const installerServices =
        services?.siteInstallerServices || {};

      const rating =
        installer?.rating || {};

      const productSubTypes =
        installerServices
          ?.installerProductSubTypes || [];

      // =================================================
      // NORMALIZED DOCUMENT
      // =================================================

      const combined = {
        // -----------------------------------------------
        // ID
        // -----------------------------------------------

        id: String(installerId),

        // -----------------------------------------------
        // SHOP
        // -----------------------------------------------

        company_name:
          installer.company || "",

        // -----------------------------------------------
        // ADDRESS
        // -----------------------------------------------

        address_line1:
          installer.addressLine1 || "",

        address_line2:
          installer.addressLine2 || "",

        city:
          installer.city || "",

        state:
          installer.state || "",

        zip:
          installer.zip || "",

        // -----------------------------------------------
        // GEO
        // -----------------------------------------------

        location:
          installer.geolocation
            ? {
                lat: Number(
                  installer.geolocation.latitude
                ),
                lon: Number(
                  installer.geolocation.longitude
                ),
              }
            : null,

        // -----------------------------------------------
        // RATING
        // -----------------------------------------------

        rating:
          rating.value != null
            ? Number(rating.value)
            : null,

        review_count:
          rating.quantity != null
            ? Number(rating.quantity)
            : null,

        // -----------------------------------------------
        // INSTALLER FLAGS
        // -----------------------------------------------

        is_mobile_install:
          Boolean(
            installer.isMobileInstall
          ),

        is_certified:
          Boolean(
            installer.isCertified
          ),

        is_top_shop:
          Boolean(
            installer.isTopShop
          ),

        is_sponsored:
          Boolean(
            installer.isSponsored
          ),

        authorised_installer:
          Boolean(
            installer.authorisedInstaller
          ),

        // -----------------------------------------------
        // RIM SIZE
        // -----------------------------------------------

        min_rim_size:
          installerServices.minRimSize != null
            ? Number(
                installerServices.minRimSize
              )
            : null,

        max_rim_size:
          installerServices.maxRimSize != null
            ? Number(
                installerServices.maxRimSize
              )
            : null,

        // -----------------------------------------------
        // PRODUCT TYPES
        // -----------------------------------------------

        installer_product_sub_types:
          productSubTypes
            .map(
              (item) => item?.name
            )
            .filter(Boolean),

        // -----------------------------------------------
        // PRICING
        // -----------------------------------------------

        installation_price:
          installerServices.installationPrice != null
            ? Number(
                installerServices.installationPrice
              )
            : null,

        installation_sale_price:
          productSubTypes[0]
            ?.installationPrice != null
            ? Number(
                productSubTypes[0]
                  .installationPrice
              )
            : null,

        installation_4_tires_sale_price:
          productSubTypes[0]
            ?.installation4TiresSalePrice != null
            ? Number(
                productSubTypes[0]
                  .installation4TiresSalePrice
              )
            : null,

        installation_cost_for_4_tires_in_cents:
          installer
            .installationCostFor4TiresInCents != null
            ? Number(
                installer
                  .installationCostFor4TiresInCents
              )
            : null,

        saving_cost:
          installer.savingCost != null
            ? Number(
                installer.savingCost
              )
            : null,

        // =================================================
        // RAW DATA
        // =================================================

        raw: {
          siteInstaller:
            details?.siteInstaller || null,

          reviewsList:
            reviews?.reviewsList || [],

          yelpReviewMetadata:
            reviews?.yelpReviewMetadata || null,

          siteInstallerServices:
            services?.siteInstallerServices || null,
        },
      };

      // =================================================
      // WRITE COMBINED FILE
      // =================================================

      const outputPath = path.join(
        OUTPUT_DIR,
        file
      );

      await fs.writeFile(
        outputPath,
        JSON.stringify(
          combined,
          null,
          2
        ),
        "utf8"
      );

      successCount++;

      console.log(
        `✓ ${installerId}.json`
      );
    } catch (error) {
      failedCount++;

      console.error(
        `✗ Failed ${installerId}.json`
      );

      console.error(error);
    }
  }

  return {
    total: installerFiles.length,
    success: successCount,
    failed: failedCount,
    outputDirectory: OUTPUT_DIR,
  };
}


// =====================================================
// NEXT.JS API ROUTE
// =====================================================

export async function GET() {
  try {
    const result =
      await combineInstallers();

    return Response.json({
      success: true,
      message:
        "Installer data combined successfully",
      ...result,
    });
  } catch (error) {
    console.error(
      "Failed to combine installer data:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Failed to combine installer data",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}