console.log("ProductGridAndFilters loader script has loaded!");

// ===== IMPORTS =====
import * as React from "react";
import * as ReactDOM from "react-dom/client";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";

import ProductGridAndFilters from "../_frontend-components/product-grid-and-filters";
import GarageVehicleWidget from "../_frontend-components/ymm-widget/my-garage-widget";
import HomePageYMMwidget from "../_frontend-components/ymm-widget/home-page-widget";
import FitmentVerificationWidget from "../_frontend-components/ymm-widget/fitment-verification-widget";

// ===== SHARED SHADOW + MUI RENDERER =====
function renderIntoShadow({
  hostId,
  Component,
  props = {},
}) {
  const container = document.getElementById(hostId);
  if (!container) {
    console.error(`Missing #${hostId} element in DOM`);
    return;
  }

  // Create or reuse shadow root (DO NOT overwrite this)
  const shadowRoot =
    container.shadowRoot || container.attachShadow({ mode: "open" });

    // let   shadowRoot = container

  // Clear previous render
  shadowRoot.innerHTML = "";

  // Internal mount node
  const mountNode = document.createElement("div");
  shadowRoot.appendChild(mountNode);

  // Emotion cache INSIDE shadow root
  const cache = createCache({
    key: "css",
    prepend: true,
    container: shadowRoot,
  });

  // MUI theme forcing overlays to stay inside shadow
  const theme = createTheme({
    components: {
      MuiPopover: { defaultProps: { container: mountNode } },
      MuiPopper: { defaultProps: { container: mountNode } },
      MuiModal: { defaultProps: { container: mountNode } },
    },
  });

  ReactDOM.createRoot(mountNode).render(
    <CacheProvider value={cache}>
      <CssVarsProvider>
        <CssBaseline />
        <ThemeProvider theme={theme}>
          <Component {...props} />
        </ThemeProvider>
      </CssVarsProvider>
    </CacheProvider>
  );
}

// ===== PUBLIC LOADERS =====

function loadProductGridAndFilters(collectionID, searchQuery, disableYMM, presetAttributes) {

  console.log("Calling loadProductGridAndFilters from inside");

  renderIntoShadow({
    hostId: "product-grid-and-filters-wrapper",
    Component: ProductGridAndFilters,
    props: {
      endpoint: "https://mad-lads-moto-storefront-search-nsd49.ondigitalocean.app",
      collectionID,
      searchQuery,
      disableYMM,
      presetAttributes,
    },
  });
}

window.loadProductGridAndFilters = loadProductGridAndFilters;

function addMyGarage(pageType) {
  renderIntoShadow({
    hostId: "my-garage",
    Component: GarageVehicleWidget,
    props: {
      endpoint: "https://mad-lads-moto-storefront-search-nsd49.ondigitalocean.app",
      page_type: pageType,
    },
  });
}

window.addMyGarage = addMyGarage;

function loadHomePageYMMwidget() {
  renderIntoShadow({
    hostId: "home-page-ymm-widget",
    Component: HomePageYMMwidget,
    props: {
      endpoint: "https://mad-lads-moto-storefront-search-nsd49.ondigitalocean.app",
    },
  });
}

window.loadHomePageYMMwidget = loadHomePageYMMwidget;

function verifyFitmentWidget(productID) {
  renderIntoShadow({
    hostId: "verify-fitment-widget",
    Component: FitmentVerificationWidget,
    props: {
      endpoint: "https://mad-lads-moto-storefront-search-nsd49.ondigitalocean.app",
      productId: productID,
    },
  });
}

window.verifyFitmentWidget = verifyFitmentWidget;