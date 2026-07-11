import openSearchClient from "../../setup-database/_lib/route";
import { performance } from "perf_hooks";

// ------------------------------------------------------
// BASE QUERY
// ------------------------------------------------------

export function buildFitmentBaseQuery(selected = {}) {
  const filters = [];

  if (selected.vehicle_type) {
    filters.push({ term: { vehicle_type: selected.vehicle_type } });
  }

  if (selected.year) {
    filters.push({ term: { year: selected.year } });
  }

  if (selected.make) {
    filters.push({ term: { make: selected.make } });
  }

  if (selected.model) {
    filters.push({ term: { model: selected.model } });
  }

  return filters.length
    ? { bool: { filter: filters } }
    : { match_all: {} };
}

// ------------------------------------------------------
// MAIN FUNCTION
// ------------------------------------------------------

export async function fetchFitmentDropdowns(selected = {}) {
  const t0 = performance.now();

  let nextField = "year";

  // if (selected.vehicle_type && !selected.year) {
  //   nextField = "year";
  // } else if (selected.year && !selected.make) {
  //   nextField = "make";
  // } else if (selected.make && !selected.model) {
  //   nextField = "model";
  // }


  if (selected.year && !selected.make) {
    nextField = "make";
  } else if (selected.make && !selected.model) {
    nextField = "model";
  }



  if(nextField == "vehicle_type"){

    return {
      "vehicle_types": [
        {
          key: "Dirt Bike",
          label: "Dirt Bike",
        },
        {
          key: "ATV",
          label: "ATV",
        },
        {
          key: "UTV / SXS",
          label: "UTV / SXS",
        },
        {
          key: "ADV / Dual Sport",
          label: "ADV / Dual Sport",
        },
        {
          key: "Street",
          label: "Street",
        },
        {
          key: "Snowmobile",
          label: "Snowmobile",
        },
        {
          key: "V-Twin",
          label: "V-Twin",
        },
      ],
      "years": [],
      "makes": [],
      "models": []
    }

  }


  const dropdowns = {
    // vehicle_types: [],
    years: [],
    makes: [],
    models: []
  };

  const baseQuery = buildFitmentBaseQuery(selected);

  

  // ------------------------------------------------------
  // SINGLE AGG QUERY
  // ------------------------------------------------------

  const res = await openSearchClient.search({
    index: "fitment_data",
    body: {
      size: 0,
      query: baseQuery,
      aggs: {
        dropdown: {
          terms: {
            field: nextField,
            size: 500,
            order: nextField === "year" ? { _key: "desc" } : { _count: "desc" }
          }
        }
      }
    }
  });

  const buckets = res.body.aggregations.dropdown.buckets;

  const mapped = buckets.map(b => ({
    key: b.key,
    label: b.key
  }));

  // map to correct response key
  // if (nextField === "vehicle_type") dropdowns.vehicle_types = mapped;
  if (nextField === "year") dropdowns.years = mapped;
  if (nextField === "make") dropdowns.makes = mapped;
  if (nextField === "model") dropdowns.models = mapped;

  const tEnd = performance.now();
  console.log("✅ TOTAL time:", (tEnd - t0).toFixed(2), "ms");

  return dropdowns;
}