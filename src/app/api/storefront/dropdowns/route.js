// import { unstable_cache } from "next/cache";
import { fetchFitmentDropdowns } from ".";

export const revalidate = 86400; // 1 day

// // Wrap your expensive function in a persistent server-side cache
// const getCachedDropdowns =  unstable_cache(
//   async () => {
//     return await fetchFitmentDropdowns();
//   },
//   ["fitment-dropdowns-v2"],            // unique cache key
//   { revalidate: 5 }              // 1 day revalidation
// );

export async function GET(req) {
  try {

    const { searchParams } = new URL(req.url);

    const selected = {
      // vehicle_type: searchParams.get("vehicle_type") || "",
      year: searchParams.get("year") || "",
      make: searchParams.get("make") || "",
      model: searchParams.get("model") || "",
    };
    
    const dropdowns = await fetchFitmentDropdowns(selected);

    return Response.json({
      success: true,
      dropdowns,
schema: {
  // vehicle_types:   { sort_order: 0, label: "Select Vehicle Type",   backend: "vehicle_type" },
  years:   { sort_order: 1, label: "Select Year",   backend: "year" },
  makes:   { sort_order: 2, label: "Select Make",   backend: "make" },
  models:  { sort_order: 3, label: "Select Model",  backend: "model" },
}

    });
  } catch (error) {
    return Response.json({
      success: false,
      msg: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
