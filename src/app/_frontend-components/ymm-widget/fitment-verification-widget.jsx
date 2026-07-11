"use client";
import { useRef, useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import CustomButton from "../custom-button";
const Button = CustomButton;

import YMMwidget from ".";

const STORAGE_KEY = "ymm_history";

function notifyVehicleChange() {
  window.dispatchEvent(
    new CustomEvent("ymm-vehicle-changed-from-verify-fitment-widget")
  );
}

export default function FitmentVerificationWidget({ endpoint, productId }) {
  const [loading, setLoading] = useState(true);
  const [fitmentData, setFitmentData] = useState([]);
  const [fitmentResult, setFitmentResult] = useState(null);

  const resultRef = useRef(null);
  const [scrollIntoView, setScrollIntoView] = useState(false);

  const glassStyle = {
    background: "white",
    boxShadow: "0 8px 24px rgba(11,51,160,0.3)",
    padding: "20px",
  };

  function doesVehicleFit(fitmentData, selected) {
    if (!fitmentData?.length || !selected) return false;

    return fitmentData.some(f => (
      String(f.year) === String(selected.years) &&
      f.make === selected.makes &&
      f.model === selected.models 
    ));
  }

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(
        `${endpoint}/api/1storefront/fitment-data-for-product?product_id=${productId}`
      );
      const json = await res.json();
      setFitmentData(json.data || []);
      setLoading(false);
    }
    fetchData();
  }, [productId]);

  useEffect(() => {
    if (scrollIntoView && resultRef.current) {
      const header = document.querySelector("header");
      const headerHeight = header?.offsetHeight || 0;

      const top =
        resultRef.current.getBoundingClientRect().top +
        window.pageYOffset;

      window.scrollTo({
        top: top - headerHeight - 16,
        behavior: "smooth",
      });

      setScrollIntoView(false);
    }
  }, [scrollIntoView]);

  useEffect(() => {
    notifyVehicleChange();
    if (!fitmentData.length) return;

    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const selected =
      arr.find(v => v.selectedFlag) ||
      arr.sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!selected?.selected || !selected?.fullObj) return;

    setFitmentResult({
      vehicle: selected.fullObj,
      fits: doesVehicleFit(fitmentData, selected.selected),
    });
  }, [fitmentData]);

  const ymmCallback = () => {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const selected = arr.find(v => v.selectedFlag);

    if (!selected?.selected || !selected?.fullObj) return;

    setFitmentResult({
      vehicle: selected.fullObj,
      fits: doesVehicleFit(fitmentData, selected.selected),
    });

    setScrollIntoView(true);

    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });

    notifyVehicleChange();
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", py: 3 }}>
        <CircularProgress sx={{ color: "#0B33A0" }} />
      </Box>
    );
  }

  if (!fitmentData.length) return null;

  /* ================= YMM FORM ================= */

  if (!fitmentResult) {
    return (
      <div>
        <YMMwidget
          endpoint={endpoint}
          containerStyles={glassStyle}
          heading="Verify fitment with your vehicle"
          headingStyles={{ color: "black" }}
          buttonLabel="Check Fitment"
          callback={ymmCallback}
        />
      </div>
    );
  }

  /* ================= RESULT ================= */

  const { fits, vehicle } = fitmentResult;
  const borderColor = fits ? "green" : "red";

  return (
    <div ref={resultRef}>
      <div
        style={{
          border: `3px solid ${borderColor}`,
          borderRadius: "6px",
          padding: "22px",
          textAlign: "center",
        }}
      >
<div
  style={{
    display: "flex",
    justifyContent: "center",
    lineHeight: 1,
  }}
>
  {fits ? <CheckIcon /> : <CancelIcon />}
</div>


        <div
          style={{
            fontWeight: "bold",
            color: borderColor,
            fontSize: '18px',
            marginTop: "14px",
          }}
        >
          {fits
            ? "This part fits your vehicle"
            : "This part does not fit your vehicle"}
        </div>

        <div
          style={{
            marginTop: "8px",
            whiteSpace: "nowrap",
            fontSize: '16px',
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {Object.values(vehicle)
            .slice(0, 4)
            .map(v => v.label)
            .join(" ")}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginTop: fits ? "8px" : "16px",
            alignItems: "center",
          }}
        >
          {!fits && (
            <Button
              variant="filled"
              
              sx={{backgroundColor:"black", width: "100%", padding: "14px" }}
              onClick={() => (window.location.href = "/search.php")}
            >
              View Parts That Fit
            </Button>
          )}

          <Button
            variant="outlined"
            onClick={() => setFitmentResult(null)}
            hoverBackgroundColor="rgba(0,0,0,0.05)"
            sx={{
              border: "none",
              color:"black",
              borderBottom: "1px solid rgba(0,0,0,0.5)",
              borderRadius: 0,
              fontWeight: "normal",
              paddingBottom: "4px",
              background: "transparent",
            }}
          >
            Change Vehicle
          </Button>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      style={{ display: "block", lineHeight: 1 }}
      aria-hidden
    >
      <circle cx="20" cy="20" r="20" fill="#1E8E3E" />
      <path
        d="M11 21.5l5.2 5.2L29 14"
        fill="none"
        stroke="#fff"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CancelIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      style={{ display: "block", lineHeight: 1 }}
      aria-hidden
    >
      <circle cx="20" cy="20" r="20" fill="#D93025" />
      <path
        d="M14 14l12 12M26 14l-12 12"
        fill="none"
        stroke="#fff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
