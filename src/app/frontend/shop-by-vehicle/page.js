"use client";

import { useEffect, useState } from "react";

const API_URL =
  "/api/storefront/shop-by-vehicle";

export default function ShopByVehicleTest() {

  // ==================================================
  // State
  // ==================================================

  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [submodels, setSubmodels] = useState([]);
  const [vehicles, setVehicles] = useState([]);


  // ==================================================
  // Selected values
  // ==================================================

  const [selectedMake, setSelectedMake] =
    useState("");

  const [selectedModel, setSelectedModel] =
    useState("");

  const [selectedYear, setSelectedYear] =
    useState("");

  // IMPORTANT:
  // submodel.key = VEHICLE ID
  //
  // Example:
  // submodel.key = "18590"
  //
  // selectedSubmodel will therefore contain:
  // "18590"

  const [selectedSubmodel, setSelectedSubmodel] =
    useState("");


  // ==================================================
  // Loading
  // ==================================================

  const [loadingMakes, setLoadingMakes] =
    useState(false);

  const [loadingModels, setLoadingModels] =
    useState(false);

  const [loadingYears, setLoadingYears] =
    useState(false);

  const [loadingSubmodels, setLoadingSubmodels] =
    useState(false);

  const [loadingVehicles, setLoadingVehicles] =
    useState(false);


  // ==================================================
  // Error
  // ==================================================

  const [error, setError] =
    useState(null);


  // ==================================================
  // Load Makes
  // ==================================================

  useEffect(() => {

    loadMakes();

  }, []);


  async function loadMakes() {

    try {

      setLoadingMakes(true);

      setError(null);

      const response =
        await fetch(API_URL);

      if (!response.ok) {

        throw new Error(
          "Failed to load makes"
        );

      }

      const data =
        await response.json();

      console.log(
        "Makes:",
        data
      );

      setMakes(
        data.options || []
      );

    } catch (error) {

      console.error(error);

      setError(
        error.message
      );

    } finally {

      setLoadingMakes(false);

    }

  }


  // ==================================================
  // Make Changed
  // ==================================================

  async function handleMakeChange(event) {

    const make =
      event.target.value;

    setSelectedMake(make);

    setSelectedModel("");

    setSelectedYear("");

    setSelectedSubmodel("");

    setModels([]);

    setYears([]);

    setSubmodels([]);

    setVehicles([]);

    if (!make) {

      return;

    }

    try {

      setLoadingModels(true);

      setError(null);

      const params =
        new URLSearchParams({

          make

        });

      const response =
        await fetch(
          `${API_URL}?${params.toString()}`
        );

      if (!response.ok) {

        throw new Error(
          "Failed to load models"
        );

      }

      const data =
        await response.json();

      console.log(
        "Models:",
        data
      );

      setModels(
        data.options || []
      );

    } catch (error) {

      console.error(error);

      setError(
        error.message
      );

    } finally {

      setLoadingModels(false);

    }

  }


  // ==================================================
  // Model Changed
  // ==================================================

  async function handleModelChange(event) {

    const model =
      event.target.value;

    setSelectedModel(model);

    setSelectedYear("");

    setSelectedSubmodel("");

    setYears([]);

    setSubmodels([]);

    setVehicles([]);

    if (!model) {

      return;

    }

    try {

      setLoadingYears(true);

      setError(null);

      const params =
        new URLSearchParams({

          make:
            selectedMake,

          model

        });

      const response =
        await fetch(
          `${API_URL}?${params.toString()}`
        );

      if (!response.ok) {

        throw new Error(
          "Failed to load years"
        );

      }

      const data =
        await response.json();

      console.log(
        "Years:",
        data
      );

      setYears(
        data.options || []
      );

    } catch (error) {

      console.error(error);

      setError(
        error.message
      );

    } finally {

      setLoadingYears(false);

    }

  }


  // ==================================================
  // Year Changed
  // ==================================================

  async function handleYearChange(event) {

    const year =
      event.target.value;

    setSelectedYear(year);

    setSelectedSubmodel("");

    setSubmodels([]);

    setVehicles([]);

    if (!year) {

      return;

    }

    try {

      setLoadingSubmodels(true);

      setError(null);

      const params =
        new URLSearchParams({

          make:
            selectedMake,

          model:
            selectedModel,

          year

        });

      const response =
        await fetch(
          `${API_URL}?${params.toString()}`
        );

      if (!response.ok) {

        throw new Error(
          "Failed to load submodels"
        );

      }

      const data =
        await response.json();

      console.log(
        "Submodel options:",
        data
      );

      setSubmodels(
        data.options || []
      );

    } catch (error) {

      console.error(error);

      setError(
        error.message
      );

    } finally {

      setLoadingSubmodels(false);

    }

  }


  // ==================================================
  // Submodel Changed
  //
  // IMPORTANT:
  //
  // submodel.key = VEHICLE ID
  //
  // Therefore:
  //
  // selectedSubmodel = VEHICLE ID
  //
  // Example:
  //
  // selectedSubmodel = "18590"
  //
  // Shop Tires URL:
  //
  // /frontend/product-grid-and-filters?vehicleId=18590
  // ==================================================

  async function handleSubmodelChange(event) {

    // This is the VEHICLE ID
    const vehicleId =
      event.target.value;

    setSelectedSubmodel(
      vehicleId
    );

    setVehicles([]);

    if (!vehicleId) {

      return;

    }

    try {

      setLoadingVehicles(true);

      setError(null);

      const params =
        new URLSearchParams({

          make:
            selectedMake,

          model:
            selectedModel,

          year:
            selectedYear,

          // VEHICLE ID
          submodel:
            vehicleId

        });

      console.log(
        "Fetching vehicle ID:",
        vehicleId
      );

      const response =
        await fetch(
          `${API_URL}?${params.toString()}`
        );

      if (!response.ok) {

        throw new Error(
          "Failed to load vehicle"
        );

      }

      const data =
        await response.json();

      console.log(
        "Selected vehicle:",
        data
      );

      setVehicles(
        data.vehicles || []
      );

    } catch (error) {

      console.error(error);

      setError(
        error.message
      );

    } finally {

      setLoadingVehicles(false);

    }

  }


  // ==================================================
  // SHOP TIRES
  // ==================================================

  function handleShopTires() {

    if (!selectedSubmodel) {

      return;

    }

    window.location.href =
      `/frontend/product-grid-and-filters?vehicleId=${encodeURIComponent(
        selectedSubmodel
      )}`;

  }


  // ==================================================
  // Render
  // ==================================================

  return (

    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: "40px 20px",
        boxSizing: "border-box",
        background: "#f6f7f9"
      }}
    >

      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto"
        }}
      >

        {/* ============================================
            HEADER
        ============================================ */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "35px"
          }}
        >

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "32px",
              fontWeight: "700"
            }}
          >
            Shop By Vehicle
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "15px"
            }}
          >
            Select your vehicle to find compatible tires
          </p>

        </div>


        {/* ============================================
            VEHICLE SELECTOR
        ============================================ */}

        <div
          style={{
            background: "#ffffff",
            padding: "30px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow:
              "0 8px 30px rgba(0, 0, 0, 0.06)"
          }}
        >

          {/* MAKE */}

          <div
            style={{
              marginBottom: "20px"
            }}
          >

            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >
              Make
            </label>

            <select
              value={selectedMake}
              onChange={handleMakeChange}
              disabled={loadingMakes}
              style={selectStyle}
            >

              <option value="">

                {loadingMakes
                  ? "Loading makes..."
                  : "Select Make"
                }

              </option>

              {makes.map(
                (make) => (

                  <option
                    key={make.key}
                    value={make.key}
                  >

                    {make.label}

                  </option>

                )
              )}

            </select>

          </div>


          {/* MODEL */}

          <div
            style={{
              marginBottom: "20px"
            }}
          >

            <label
              style={labelStyle}
            >
              Model
            </label>

            <select
              value={selectedModel}
              onChange={handleModelChange}
              disabled={
                !selectedMake ||
                loadingModels
              }
              style={selectStyle}
            >

              <option value="">

                {loadingModels
                  ? "Loading models..."
                  : "Select Model"
                }

              </option>

              {models.map(
                (model) => (

                  <option
                    key={model.key}
                    value={model.key}
                  >

                    {model.label}

                  </option>

                )
              )}

            </select>

          </div>


          {/* YEAR */}

          <div
            style={{
              marginBottom: "20px"
            }}
          >

            <label
              style={labelStyle}
            >
              Year
            </label>

            <select
              value={selectedYear}
              onChange={handleYearChange}
              disabled={
                !selectedModel ||
                loadingYears
              }
              style={selectStyle}
            >

              <option value="">

                {loadingYears
                  ? "Loading years..."
                  : "Select Year"
                }

              </option>

              {years.map(
                (year) => (

                  <option
                    key={year.key}
                    value={year.key}
                  >

                    {year.label}

                  </option>

                )
              )}

            </select>

          </div>


          {/* SUBMODEL */}

          <div
            style={{
              marginBottom: "10px"
            }}
          >

            <label
              style={labelStyle}
            >
              Submodel / Vehicle Configuration
            </label>

            <select
              value={selectedSubmodel}
              onChange={
                handleSubmodelChange
              }
              disabled={
                !selectedYear ||
                loadingSubmodels
              }
              style={selectStyle}
            >

              <option value="">

                {loadingSubmodels
                  ? "Loading submodels..."
                  : "Select Submodel"
                }

              </option>

              {submodels.map(
                (submodel) => (

                  <option
                    key={submodel.key}
                    value={submodel.key}
                  >

                    {submodel.label}

                  </option>

                )
              )}

            </select>

          </div>


          {/* ==========================================
              SELECTED VEHICLE ID
          ========================================== */}

          {selectedSubmodel && (

            <div
              style={{
                marginTop: "20px",
                padding: "14px 16px",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "8px"
              }}
            >

              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "4px"
                }}
              >
                Selected Vehicle ID
              </div>

              <strong
                style={{
                  fontSize: "16px"
                }}
              >
                {selectedSubmodel}
              </strong>

            </div>

          )}


          {/* ==========================================
              SHOP TIRES BUTTON
          ========================================== */}

          {selectedSubmodel && (

            <button
              type="button"
              onClick={handleShopTires}
              style={{
                width: "100%",
                height: "52px",
                marginTop: "20px",
                border: "none",
                borderRadius: "8px",
                background: "#111827",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                transition:
                  "background 0.2s ease"
              }}
            >
              Shop Tires
            </button>

          )}

        </div>


        {/* ============================================
            ERROR
        ============================================ */}

        {error && (

          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              borderRadius: "8px",
              border:
                "1px solid #fecaca",
              background:
                "#fef2f2",
              color: "#dc2626"
            }}
          >

            Error:
            {" "}
            {error}

          </div>

        )}


        {/* ============================================
            LOADING VEHICLE
        ============================================ */}

        {loadingVehicles && (

          <div
            style={{
              marginTop: "25px",
              textAlign: "center",
              color: "#6b7280"
            }}
          >

            Loading selected vehicle...

          </div>

        )}


        {/* ============================================
            VEHICLE RESULTS
        ============================================ */}

        {!loadingVehicles &&
         selectedSubmodel && (

          <div
            style={{
              marginTop: "30px"
            }}
          >

            <h2>
              Selected Vehicle:
              {" "}
              {vehicles.length}
            </h2>


            {vehicles.length === 0 && (

              <div
                style={{
                  padding: "20px",
                  background: "#ffffff",
                  borderRadius: "8px",
                  border:
                    "1px solid #e5e7eb"
                }}
              >

                No vehicle found.

              </div>

            )}


            {vehicles.map(
              (vehicle, index) => (

                <div
                  key={
                    vehicle._id ||
                    vehicle.id ||
                    index
                  }
                  style={{
                    marginBottom: "20px",
                    padding: "20px",
                    background: "#ffffff",
                    border:
                      "1px solid #e5e7eb",
                    borderRadius: "8px"
                  }}
                >

                  <h3>
                    Vehicle #{index + 1}
                  </h3>


                  <div>
                    <strong>
                      ID:
                    </strong>
                    {" "}
                    {vehicle.id}
                  </div>


                  <div>
                    <strong>
                      Chassis ID:
                    </strong>
                    {" "}
                    {vehicle.default_chassis_id}
                  </div>


                  <div>
                    <strong>
                      Vehicle:
                    </strong>
                    {" "}
                    {vehicle.year}
                    {" "}
                    {vehicle.make}
                    {" "}
                    {vehicle.model}
                    {" "}
                    {vehicle.submodel}
                  </div>


                  <div>
                    <strong>
                      Body:
                    </strong>
                    {" "}
                    {vehicle.body || "N/A"}
                  </div>


                  <div>
                    <strong>
                      Doors:
                    </strong>
                    {" "}
                    {vehicle.doors || "N/A"}
                  </div>


                  <div>
                    <strong>
                      Type:
                    </strong>
                    {" "}
                    {vehicle.type || "N/A"}
                  </div>


                  <div>
                    <strong>
                      Default Chassis:
                    </strong>
                    {" "}
                    {vehicle.default_chassis_id || "N/A"}
                  </div>


                  <pre
                    style={{
                      marginTop: "15px",
                      padding: "15px",
                      background: "#f5f5f5",
                      overflow: "auto",
                      maxHeight: "500px"
                    }}
                  >

                    {JSON.stringify(
                      vehicle,
                      null,
                      2
                    )}

                  </pre>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>

  );

}


// ==================================================
// Shared Styles
// ==================================================

const labelStyle = {

  display: "block",

  marginBottom: "8px",

  fontSize: "14px",

  fontWeight: "600"

};


const selectStyle = {

  width: "100%",

  height: "48px",

  padding: "0 14px",

  border:
    "1px solid #d1d5db",

  borderRadius: "7px",

  background: "#ffffff",

  color: "#111827",

  fontSize: "14px",

  outline: "none",

  cursor: "pointer",

  boxSizing: "border-box"

};