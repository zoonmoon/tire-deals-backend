"use client";

import { useEffect, useMemo, useState } from "react";
import "./ProductsAndFilters.css";
import Link from "next/link";

const API_URL = "/api/storefront/products-and-filters";

const FILTER_LABELS = {
  brand: "Brand",
  model: "Model",
  size_format: "Size Format",

  section_width: "Section Width",
  aspect_ratio: "Aspect Ratio",
  diameter: "Diameter",
  inch_width: "Inch Width",
  rim_diameter: "Rim Diameter",

  overall_diameter: "Overall Diameter",
  overall_width: "Overall Width",
  weight: "Weight",
  tread_depth: "Tread Depth",

  speed_rating: "Speed Rating",
  load_rating: "Load Rating",
  load_range: "Load Range",
  ply_rating: "Ply Rating",
  sidewall: "Sidewall",

  vehicle_type_tags: "Vehicle Type",
  segment_tags: "Segment",
  origin_country: "Origin Country",
  winter_class: "Winter Class",
  run_flat: "Run Flat",
};

const FILTER_ORDER = [
  "brand",
  "model",
  "size_format",

  "section_width",
  "aspect_ratio",
  "diameter",
  "inch_width",
  "rim_diameter",

  "overall_diameter",
  "overall_width",
  "weight",
  "tread_depth",

  "speed_rating",
  "load_rating",
  "load_range",
  "ply_rating",
  "sidewall",

  "vehicle_type_tags",
  "segment_tags",
  "origin_country",
  "winter_class",
  "run_flat",
];

export default function ProductsAndFilters() {
  const [data, setData] = useState(null);

  const [loading, setLoading] =
    useState(false);

  const [selectedFilters, setSelectedFilters] =
    useState({});

  const [sort, setSort] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  // =====================================================
  // PRICE FILTER STATE
  // =====================================================

  const [minPrice, setMinPrice] =
    useState("");

  const [maxPrice, setMaxPrice] =
    useState("");

  // =====================================================
  // PRICE ERROR
  // =====================================================

  const [priceError, setPriceError] =
    useState("");

  // =====================================================
  // VEHICLE ID FROM URL
  // =====================================================

  const vehicleId = useMemo(() => {
    if (
      typeof window === "undefined"
    ) {
      return null;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    return params.get(
      "vehicleId"
    );
  }, []);

  // =====================================================
  // INITIAL URL STATE
  // =====================================================

  useEffect(() => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    const filters = {};

    // ---------------------------------------------
    // NORMAL FILTERS
    // ---------------------------------------------

    for (
      const key of FILTER_ORDER
    ) {
      const value =
        params.get(key);

      if (!value) {
        continue;
      }

      filters[key] =
        value
          .split(",")
          .map(
            (item) =>
              item.trim()
          )
          .filter(Boolean);
    }

    setSelectedFilters(
      filters
    );

    // ---------------------------------------------
    // SORT
    // ---------------------------------------------

    setSort(
      params.get("sort") || ""
    );

    // ---------------------------------------------
    // PAGE
    // ---------------------------------------------

    const urlPage =
      Number(
        params.get("page")
      ) || 1;

    setPage(
      urlPage
    );

    // ---------------------------------------------
    // PRICE
    // ---------------------------------------------

    setMinPrice(
      params.get(
        "min_price"
      ) || ""
    );

    setMaxPrice(
      params.get(
        "max_price"
      ) || ""
    );
  }, []);

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  async function fetchProducts({
    nextFilters = selectedFilters,
    nextSort = sort,
    nextPage = page,

    nextMinPrice = minPrice,
    nextMaxPrice = maxPrice,
  } = {}) {
    if (!vehicleId) {
      return;
    }

    setLoading(
      true
    );

    try {
      const params =
        new URLSearchParams();

      // =================================================
      // VEHICLE ID
      // =================================================

      params.set(
        "vehicleId",
        vehicleId
      );

      // =================================================
      // NORMAL FILTERS
      // =================================================

      for (
        const [
          filterName,
          values,
        ] of Object.entries(
          nextFilters
        )
      ) {
        if (
          !values ||
          values.length === 0
        ) {
          continue;
        }

        params.set(
          filterName,
          values.join(",")
        );
      }

      // =================================================
      // PRICE FILTER
      // =================================================

      if (
        nextMinPrice !== "" &&
        nextMinPrice !== null &&
        nextMinPrice !== undefined
      ) {
        params.set(
          "min_price",
          String(
            nextMinPrice
          )
        );
      }

      if (
        nextMaxPrice !== "" &&
        nextMaxPrice !== null &&
        nextMaxPrice !== undefined
      ) {
        params.set(
          "max_price",
          String(
            nextMaxPrice
          )
        );
      }

      // =================================================
      // SORT
      // =================================================

      if (
        nextSort
      ) {
        params.set(
          "sort",
          nextSort
        );
      }

      // =================================================
      // PAGINATION
      // =================================================

      params.set(
        "page",
        String(
          nextPage
        )
      );

      params.set(
        "limit",
        "24"
      );

      // =================================================
      // UPDATE URL
      // =================================================

      window.history.replaceState(
        {},
        "",
        `${
          window.location.pathname
        }?${params.toString()}`
      );

      // =================================================
      // API REQUEST
      // =================================================

      const response =
        await fetch(
          `${API_URL}?${params.toString()}`,
          {
            cache:
              "no-store",
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.message ||
            result.error ||
            "Failed to fetch products"
        );
      }

      setData(
        result
      );
    } catch (
      error
    ) {
      console.error(
        "Failed to fetch products:",
        error
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  // =====================================================
  // INITIAL FETCH
  // =====================================================

  useEffect(() => {
    if (!vehicleId) {
      return;
    }

    fetchProducts();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  // =====================================================
  // TOGGLE FILTER
  // =====================================================

  function toggleFilter(
    filterName,
    value
  ) {
    const stringValue =
      String(
        value
      );

    const currentValues =
      selectedFilters[
        filterName
      ] || [];

    const exists =
      currentValues.includes(
        stringValue
      );

    let newValues;

    if (
      exists
    ) {
      newValues =
        currentValues.filter(
          (item) =>
            item !==
            stringValue
        );
    } else {
      newValues = [
        ...currentValues,
        stringValue,
      ];
    }

    const nextFilters = {
      ...selectedFilters,
    };

    if (
      newValues.length > 0
    ) {
      nextFilters[
        filterName
      ] =
        newValues;
    } else {
      delete nextFilters[
        filterName
      ];
    }

    setSelectedFilters(
      nextFilters
    );

    setPage(
      1
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    fetchProducts({
      nextFilters,
      nextSort: sort,
      nextPage: 1,

      // IMPORTANT:
      // Preserve price filter
      nextMinPrice:
        minPrice,

      nextMaxPrice:
        maxPrice,
    });
  }

  // =====================================================
  // CLEAR ONE FILTER
  // =====================================================

  function clearFilter(
    filterName
  ) {
    const nextFilters = {
      ...selectedFilters,
    };

    delete nextFilters[
      filterName
    ];

    setSelectedFilters(
      nextFilters
    );

    setPage(
      1
    );

    fetchProducts({
      nextFilters,
      nextSort: sort,
      nextPage: 1,

      nextMinPrice:
        minPrice,

      nextMaxPrice:
        maxPrice,
    });
  }

  // =====================================================
  // CLEAR ALL NORMAL FILTERS
  // =====================================================

  function clearAllFilters() {
    setSelectedFilters(
      {}
    );

    setPage(
      1
    );

    fetchProducts({
      nextFilters: {},
      nextSort: sort,
      nextPage: 1,

      // Keep price
      nextMinPrice:
        minPrice,

      nextMaxPrice:
        maxPrice,
    });
  }

  // =====================================================
  // APPLY PRICE FILTER
  // =====================================================

  function applyPriceFilter() {
    setPriceError(
      ""
    );

    const min =
      minPrice === ""
        ? null
        : Number(
            minPrice
          );

    const max =
      maxPrice === ""
        ? null
        : Number(
            maxPrice
          );

    // ---------------------------------------------
    // MIN VALIDATION
    // ---------------------------------------------

    if (
      min !== null &&
      (!Number.isFinite(
        min
      ) ||
        min < 0)
    ) {
      setPriceError(
        "Minimum price must be 0 or greater."
      );

      return;
    }

    // ---------------------------------------------
    // MAX VALIDATION
    // ---------------------------------------------

    if (
      max !== null &&
      (!Number.isFinite(
        max
      ) ||
        max < 0)
    ) {
      setPriceError(
        "Maximum price must be 0 or greater."
      );

      return;
    }

    // ---------------------------------------------
    // MIN > MAX
    // ---------------------------------------------

    if (
      min !== null &&
      max !== null &&
      min > max
    ) {
      setPriceError(
        "Minimum price cannot be greater than maximum price."
      );

      return;
    }

    // ---------------------------------------------
    // RESET PAGE
    // ---------------------------------------------

    setPage(
      1
    );

    // ---------------------------------------------
    // FETCH
    // ---------------------------------------------

    fetchProducts({
      nextFilters:
        selectedFilters,

      nextSort:
        sort,

      nextPage:
        1,

      nextMinPrice:
        minPrice,

      nextMaxPrice:
        maxPrice,
    });
  }

  // =====================================================
  // CLEAR PRICE FILTER
  // =====================================================

  function clearPriceFilter() {
    setMinPrice(
      ""
    );

    setMaxPrice(
      ""
    );

    setPriceError(
      ""
    );

    setPage(
      1
    );

    fetchProducts({
      nextFilters:
        selectedFilters,

      nextSort:
        sort,

      nextPage:
        1,

      // Explicitly remove price
      nextMinPrice:
        "",

      nextMaxPrice:
        "",
    });
  }

  // =====================================================
  // SORT
  // =====================================================

  function handleSort(
    event
  ) {
    const nextSort =
      event.target.value;

    setSort(
      nextSort
    );

    setPage(
      1
    );

    fetchProducts({
      nextFilters:
        selectedFilters,

      nextSort,

      nextPage: 1,

      // Preserve price
      nextMinPrice:
        minPrice,

      nextMaxPrice:
        maxPrice,
    });
  }

  // =====================================================
  // PAGINATION
  // =====================================================

  function goToPage(
    nextPage
  ) {
    if (
      nextPage < 1
    ) {
      return;
    }

    if (
      data?.totalPages &&
      nextPage >
        data.totalPages
    ) {
      return;
    }

    setPage(
      nextPage
    );

    fetchProducts({
      nextFilters:
        selectedFilters,

      nextSort:
        sort,

      nextPage,

      // Preserve price
      nextMinPrice:
        minPrice,

      nextMaxPrice:
        maxPrice,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =====================================================
  // NO VEHICLE
  // =====================================================

  if (!vehicleId) {
    return (
      <div className="products-page">

        <div className="empty-state">

          <h2>
            Vehicle ID is required
          </h2>

          <p>
            Please select a vehicle first.
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // INITIAL LOADING
  // =====================================================

  if (
    !data &&
    loading
  ) {
    return (
      <div className="products-page">

        <div className="initial-loading">

          <div className="loading-spinner" />

          <p>
            Loading tires...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // DATA
  // =====================================================

  const availableFilters =
    data?.filters || {};

  const products =
    data?.tires || [];

  // =====================================================
  // VEHICLE DATA
  // =====================================================

  const vehicle =
    data?.vehicle ||
    data?.selectedVehicle ||
    null;

  // =====================================================
  // VEHICLE FITMENTS
  // =====================================================

  const vehicleFitments =
    data?.vehicleFitments || [];

  // =====================================================
  // UNIQUE OEM TIRE SIZE PAIRS
  // =====================================================

  const fitmentSizePairs =
    Array.from(
      new Set(
        vehicleFitments
          .map(
            (fitment) => {
              if (
                fitment.tire_size &&
                fitment.tire_size_rear
              ) {
                return `${fitment.tire_size} / ${fitment.tire_size_rear}`;
              }

              return (
                fitment.tire_size ||
                null
              );
            }
          )
          .filter(Boolean)
      )
    );

  // =====================================================
  // ACTIVE NORMAL FILTER COUNT
  // =====================================================

  const activeNormalFilterCount =
    Object.values(
      selectedFilters
    ).reduce(
      (
        total,
        values
      ) =>
        total +
        values.length,
      0
    );

  // =====================================================
  // PRICE FILTER ACTIVE
  // =====================================================

  const priceFilterActive =
    minPrice !== "" ||
    maxPrice !== "";

  // =====================================================
  // TOTAL ACTIVE FILTER COUNT
  // =====================================================

  const activeFilterCount =
    activeNormalFilterCount +
    (priceFilterActive
      ? 1
      : 0);

  return (
    <div className="products-page">

      {/* =================================================
          SELECTED VEHICLE
      ================================================= */}

      <section className="selected-vehicle-section">

        <div className="products-container">

          <div className="selected-vehicle-card">

            <div className="selected-vehicle-content">

              <div className="selected-vehicle-label">
                Selected Vehicle
              </div>

              <h2>
                {vehicle ? (
                  <>
                    {vehicle.year}{" "}
                    {vehicle.make}{" "}
                    {vehicle.model}

                    {vehicle.submodel && (
                      <>
                        {" "}
                        {vehicle.submodel}
                      </>
                    )}
                  </>
                ) : (
                  `Vehicle ID: ${vehicleId}`
                )}
              </h2>

              {(
                vehicle?.body ||
                vehicle?.doors
              ) && (
                <p>

                  {vehicle.body}

                  {vehicle.body &&
                    vehicle.doors && (
                      <>
                        {" "}
                        •{" "}
                      </>
                    )}

                  {vehicle.doors && (
                    <>
                      {vehicle.doors} Doors
                    </>
                  )}

                </p>
              )}

            </div>

            <div className="selected-vehicle-id">

              <span>
                Vehicle ID
              </span>

              <strong>
                {vehicleId}
              </strong>

            </div>

          </div>

          {/* =================================================
              OEM TIRE SIZES
          ================================================= */}

          {fitmentSizePairs.length >
            0 && (
            <div className="oem-tire-sizes">

              <div className="oem-tire-sizes-header">

                <div>

                  <h3>
                    OEM Tire Sizes
                  </h3>

                  <p>
                    Available tire sizes for this vehicle
                  </p>

                </div>

                <span className="oem-size-count">

                  {fitmentSizePairs.length}{" "}
                  fitments

                </span>

              </div>

              <div className="oem-tire-size-list">

                {fitmentSizePairs.map(
                  (size) => (
                    <div
                      key={size}
                      className="oem-tire-size-chip"
                    >
                      {size}
                    </div>
                  )
                )}

              </div>

            </div>
          )}

        </div>

      </section>

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="products-header">

        <div className="products-container header-inner">

          <div className="header-info">

            <h1>
              Tires
            </h1>

            <p>
              {data?.total || 0} tires found
            </p>

          </div>

          <div className="header-actions">

            <button
              type="button"
              className="mobile-filter-button"
              onClick={() =>
                setMobileFiltersOpen(
                  true
                )
              }
            >

              <span>
                Filters
              </span>

              {activeFilterCount >
                0 && (
                <span className="filter-count">
                  {activeFilterCount}
                </span>
              )}

            </button>

            <div className="sort-wrapper">

              <span className="sort-label">
                Sort by
              </span>

              <select
                value={sort}
                onChange={
                  handleSort
                }
                className="sort-select"
              >

                <option value="">
                  Relevance
                </option>

                <option value="price_asc">
                  Price: Low to High
                </option>

                <option value="price_desc">
                  Price: High to Low
                </option>

                <option value="brand_asc">
                  Brand: A-Z
                </option>

              </select>

            </div>

          </div>

        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <div className="products-container products-layout">

        {/* =================================================
            MOBILE OVERLAY
        ================================================= */}

        {mobileFiltersOpen && (
          <div
            className="filter-overlay"
            onClick={() =>
              setMobileFiltersOpen(
                false
              )
            }
          />
        )}

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside
          className={`filter-sidebar ${
            mobileFiltersOpen
              ? "filter-sidebar-open"
              : ""
          }`}
        >

          {/* =================================================
              SIDEBAR HEADER
          ================================================= */}

          <div className="sidebar-header">

            <div>

              <h2>
                Filters
              </h2>

              {activeFilterCount >
                0 && (
                <p>
                  {activeFilterCount} selected
                </p>
              )}

            </div>

            <button
              type="button"
              className="mobile-close-button"
              onClick={() =>
                setMobileFiltersOpen(
                  false
                )
              }
            >
              ×
            </button>

          </div>

          {/* =================================================
              CLEAR ALL NORMAL FILTERS
          ================================================= */}

          {activeNormalFilterCount >
            0 && (
            <button
              type="button"
              className="clear-all-button"
              onClick={
                clearAllFilters
              }
            >
              Clear all filters
            </button>
          )}

          {/* =================================================
              PRICE FILTER
              
              THIS ALWAYS SHOWS
              
              IT DOES NOT DEPEND ON
              availableFilters
          ================================================= */}

          <div className="filter-group price-filter-group">

            <div className="filter-group-header">

              <h3>
                Price
              </h3>

              {priceFilterActive && (
                <button
                  type="button"
                  onClick={
                    clearPriceFilter
                  }
                  className="filter-clear-button"
                >
                  Clear
                </button>
              )}

            </div>

            <div className="price-inputs">

              {/* MIN PRICE */}

              <div className="price-input-wrapper">

                <label htmlFor="min-price">
                  Min Price
                </label>

                <div className="price-input-container">

                  <span className="price-symbol">
                    $
                  </span>

                  <input
                    id="min-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={
                      minPrice
                    }
                    onChange={(
                      event
                    ) => {
                      setMinPrice(
                        event.target.value
                      );

                      setPriceError(
                        ""
                      );
                    }}
                  />

                </div>

              </div>

              {/* MAX PRICE */}

              <div className="price-input-wrapper">

                <label htmlFor="max-price">
                  Max Price
                </label>

                <div className="price-input-container">

                  <span className="price-symbol">
                    $
                  </span>

                  <input
                    id="max-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="1000"
                    value={
                      maxPrice
                    }
                    onChange={(
                      event
                    ) => {
                      setMaxPrice(
                        event.target.value
                      );

                      setPriceError(
                        ""
                      );
                    }}
                  />

                </div>

              </div>

              {/* PRICE ERROR */}

              {priceError && (
                <div className="price-error">
                  {priceError}
                </div>
              )}

              {/* APPLY */}

              <button
                type="button"
                className="apply-price-button"
                onClick={
                  applyPriceFilter
                }
              >
                Apply Price
              </button>

            </div>

          </div>

          {/* =================================================
              ACTIVE FILTERS
          ================================================= */}

          {activeFilterCount >
            0 && (
            <div className="active-filters">

              {/* PRICE ACTIVE CHIP */}

              {priceFilterActive && (
                <button
                  type="button"
                  className="active-filter-chip"
                  onClick={
                    clearPriceFilter
                  }
                >

                  {minPrice !== "" &&
                    `$${minPrice}`}

                  {minPrice !== "" &&
                    maxPrice !== "" &&
                    " - "}

                  {maxPrice !== "" &&
                    `$${maxPrice}`}

                  <span>
                    ×
                  </span>

                </button>
              )}

              {/* NORMAL ACTIVE FILTERS */}

              {Object.entries(
                selectedFilters
              ).flatMap(
                ([
                  filterName,
                  values,
                ]) =>
                  values.map(
                    (value) => (
                      <button
                        key={`${filterName}-${value}`}
                        type="button"
                        className="active-filter-chip"
                        onClick={() =>
                          toggleFilter(
                            filterName,
                            value
                          )
                        }
                      >

                        {value}

                        <span>
                          ×
                        </span>

                      </button>
                    )
                  )
              )}

            </div>
          )}

          {/* =================================================
              FILTER GROUPS
          ================================================= */}

          <div className="filter-groups">

            {FILTER_ORDER.map(
              (
                filterName
              ) => {

                const options =
                  availableFilters[
                    filterName
                  ];

                if (
                  !options ||
                  options.length ===
                    0
                ) {
                  return null;
                }

                const selected =
                  selectedFilters[
                    filterName
                  ] || [];

                return (
                  <div
                    key={
                      filterName
                    }
                    className="filter-group"
                  >

                    <div className="filter-group-header">

                      <h3>
                        {
                          FILTER_LABELS[
                            filterName
                          ] ||
                          filterName
                        }
                      </h3>

                      {selected.length >
                        0 && (
                        <button
                          type="button"
                          onClick={() =>
                            clearFilter(
                              filterName
                            )
                          }
                          className="filter-clear-button"
                        >
                          Clear
                        </button>
                      )}

                    </div>

                    <div className="filter-options">

                      {options.map(
                        (
                          option
                        ) => {

                          const value =
                            String(
                              option.value
                            );

                          const checked =
                            selected.includes(
                              value
                            );

                          return (
                            <label
                              key={
                                value
                              }
                              className={`filter-option ${
                                checked
                                  ? "filter-option-selected"
                                  : ""
                              }`}
                            >

                              <div className="filter-option-left">

                                <input
                                  type="checkbox"
                                  checked={
                                    checked
                                  }
                                  onChange={() =>
                                    toggleFilter(
                                      filterName,
                                      value
                                    )
                                  }
                                />

                                <span>
                                  {value}
                                </span>

                              </div>

                              <span className="option-count">
                                {
                                  option.count
                                }
                              </span>

                            </label>
                          );
                        }
                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </aside>

        {/* =================================================
            PRODUCT AREA
        ================================================= */}

        <main className="product-area">

          {/* =================================================
              ACTIVE FILTER SUMMARY
          ================================================= */}

          {activeFilterCount >
            0 && (
            <div className="active-summary">

              <div className="active-summary-title">
                Active filters
              </div>

              <div className="active-summary-list">

                {/* PRICE SUMMARY */}

                {priceFilterActive && (
                  <button
                    type="button"
                    className="summary-chip"
                    onClick={
                      clearPriceFilter
                    }
                  >

                    {minPrice !== "" &&
                      `$${minPrice}`}

                    {minPrice !== "" &&
                      maxPrice !== "" &&
                      " - "}

                    {maxPrice !== "" &&
                      `$${maxPrice}`}

                    <span>
                      ×
                    </span>

                  </button>
                )}

                {/* NORMAL FILTER SUMMARY */}

                {Object.entries(
                  selectedFilters
                ).flatMap(
                  ([
                    filterName,
                    values,
                  ]) =>
                    values.map(
                      (value) => (
                        <button
                          key={`${filterName}-${value}`}
                          type="button"
                          className="summary-chip"
                          onClick={() =>
                            toggleFilter(
                              filterName,
                              value
                            )
                          }
                        >

                          {value}

                          <span>
                            ×
                          </span>

                        </button>
                      )
                    )
                )}

              </div>

              {/* CLEAR NORMAL FILTERS */}

              {activeNormalFilterCount >
                0 && (
                <button
                  type="button"
                  className="summary-clear"
                  onClick={
                    clearAllFilters
                  }
                >
                  Clear all
                </button>
              )}

            </div>
          )}

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <div className="updating-bar">

              <div className="small-spinner" />

              Updating products...

            </div>
          )}

          {/* =================================================
              PRODUCTS
          ================================================= */}

          {products.length >
          0 ? (
            <div className="product-grid">

              {products.map(
                (
                  product
                ) => (
                  <ProductCard
                    key={
                      product.id
                    }
                    product={
                      product
                    }
                    vehicleId={vehicleId}
                  />
                )
              )}

            </div>
          ) : (
            <div className="empty-state">

              <div className="empty-icon">
                🔍
              </div>

              <h2>
                No tires found
              </h2>

              <p>
                Try removing some filters
                to see more products.
              </p>

              {activeFilterCount >
                0 && (
                <button
                  type="button"
                  onClick={() => {

                    clearAllFilters();

                    clearPriceFilter();

                  }}
                  className="empty-clear-button"
                >
                  Clear all filters
                </button>
              )}

            </div>
          )}

          {/* =================================================
              PAGINATION
          ================================================= */}

          {data?.totalPages >
            1 && (
            <div className="pagination">

              <button
                type="button"
                disabled={
                  page <= 1 ||
                  loading
                }
                onClick={() =>
                  goToPage(
                    page - 1
                  )
                }
                className="pagination-button"
              >
                ← Previous
              </button>

              <div className="pagination-info">

                Page{" "}

                <strong>
                  {page}
                </strong>

                {" "}of{" "}

                <strong>
                  {
                    data.totalPages
                  }
                </strong>

              </div>

              <button
                type="button"
                disabled={
                  page >=
                    data.totalPages ||
                  loading
                }
                onClick={() =>
                  goToPage(
                    page + 1
                  )
                }
                className="pagination-button"
              >
                Next →

              </button>

            </div>
          )}

        </main>

      </div>

    </div>
  );
}


// =======================================================
// PRODUCT CARD
// =======================================================

function ProductCard({
  product,
  vehicleId
}) {
  const image =
    product.image ||
    product.images?.[0] ||
    product.thumbnail ||
    null;

  return (
    <article className="product-card">

      {/* IMAGE */}

      <div className="product-image-wrapper">

        {image ? (
          <img
            src={image}
            alt={
              product.title ||
              product.model ||
              "Tire"
            }
            className="product-image"
          />
        ) : (
          <div className="no-image">
            No Image
          </div>
        )}

      </div>

      {/* CONTENT */}

      <div className="product-content">

        <div className="product-brand">

          {product.brand ||
            "Unknown Brand"}

        </div>

        <h3 className="product-title">

          {product.model ||
            product.title ||
            "Tire"}

        </h3>

        {product.size && (
          <div className="product-size">

            {product.size}

          </div>
        )}

        <div className="product-footer">

          <div className="product-price">

            {product.price !==
              undefined &&
            product.price !==
              null ? (
              <>
                $
                {Number(
                  product.price
                ).toFixed(2)}
              </>
            ) : (
              "Price unavailable"
            )}

          </div>


           <Link
            href={'/frontend/product/'+product.handle+'/?vehicleId='+vehicleId || ''}
           >
              <button
                type="button"
                className="view-product-button"
              >
                View
              </button>
           </Link>


        </div>

      </div>

    </article>
  );
}