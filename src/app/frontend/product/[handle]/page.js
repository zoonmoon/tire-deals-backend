
"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function ProductPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const handle = params?.handle;
  const vehicleId = searchParams.get("vehicleId");

  const [product, setProduct] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [vehicleFitments, setVehicleFitments] = useState([]);

  const [fitmentStatus,  setFitmentStatus] = useState(null);

  // arjun 
  
  const [productLoading, setProductLoading] = useState(true);
  const [fitmentLoading, setFitmentLoading] = useState(false);

  const [productError, setProductError] = useState(null);
  const [fitmentError, setFitmentError] = useState(null);

  // ======================================================
  // FETCH PRODUCT
  // ======================================================

  useEffect(() => {
    if (!handle) {
      return;
    }

    async function fetchProduct() {
      try {
        setProductLoading(true);
        setProductError(null);

        const response = await fetch(
          `/api/storefront/tires/${encodeURIComponent(handle)}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || `Failed to fetch product (${response.status})`
          );
        }

        setProduct(data.product);
      } catch (error) {
        console.error("Product fetch failed:", error);
        setProductError(error.message);
      } finally {
        setProductLoading(false);
      }
    }

    fetchProduct();
  }, [handle]);

  // ======================================================
  // FETCH FITMENT
  // ======================================================

  useEffect(() => {
    if (!handle || !vehicleId) {
      setVehicle(null);
      setVehicleFitments([]);
      setFitmentStatus(null);
      setFitmentError(null);

      return;
    }

    async function fetchFitment() {
      try {
        setFitmentLoading(true);
        setFitmentError(null);

        const response = await fetch(
          `/api/storefront/tires/${encodeURIComponent(
            handle
          )}/fitment-check?vehicleId=${encodeURIComponent(vehicleId)}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || `Fitment check failed (${response.status})`
          );
        }

        setFitmentStatus(data.fits);

        setVehicle(data.vehicle || null);

        setVehicleFitments(data.vehicleFitments || []);
      } catch (error) {
        console.error("Fitment check failed:", error);

        setFitmentError(error.message);

        setFitmentStatus(null);
        setVehicle(null);
        setVehicleFitments([]);
      } finally {
        setFitmentLoading(false);
      }
    }

    fetchFitment();
  }, [handle, vehicleId]);

  // ======================================================
  // PRODUCT LOADING
  // ======================================================

  if (productLoading) {
    return (
      <main className="page">
        <div className="message">
          Loading product...
        </div>

        <style jsx>{`
          .page {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
          }

          .message {
            padding: 80px 20px;
            text-align: center;
            font-size: 18px;
          }
        `}</style>
      </main>
    );
  }

  // ======================================================
  // PRODUCT ERROR
  // ======================================================

  if (productError) {
    return (
      <main className="page">
        <div className="message">
          <h1>Product not found</h1>
          <p>{productError}</p>
        </div>

        <style jsx>{`
          .page {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
          }

          .message {
            padding: 80px 20px;
            text-align: center;
          }
        `}</style>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="page">
        <div className="message">
          Product not found
        </div>

        <style jsx>{`
          .page {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
          }

          .message {
            padding: 80px 20px;
            text-align: center;
          }
        `}</style>
      </main>
    );
  }

  // ======================================================
  // MAIN PAGE
  // ======================================================

  return (
    <main className="page">
      <div
        className={
          vehicleId
            ? "main-layout with-fitment"
            : "main-layout"
        }
      >
        {/* ==================================================
            PRODUCT
        ================================================== */}

        <section className="product-section">
          {/* PRODUCT IMAGE */}

          <div className="gallery">
            <div className="main-image-container">
              {product.thumbnail ? (
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="main-image"
                />
              ) : (
                <div className="no-image">
                  No image available
                </div>
              )}
            </div>

            {/* THUMBNAILS */}

            {product.images &&
              product.images.length > 0 && (
                <div className="thumbnails">
                  {product.images.map((image, index) => (
                    <div
                      className="thumbnail"
                      key={`${image}-${index}`}
                    >
                      <img
                        src={image}
                        alt={`${product.title} image ${
                          index + 1
                        }`}
                      />
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* PRODUCT INFORMATION */}

          <div className="product-info">
            <div className="brand">
              {product.brand}
            </div>

            <h1>
              {product.title}
            </h1>

            {product.model && (
              <p className="model">
                Model: {product.model}
              </p>
            )}

            <div className="price">
              ${Number(product.price || 0).toFixed(2)}
            </div>

            {/* PRODUCT DETAILS */}

            <div className="details">
              <div className="detail">
                <span>Tire Size</span>
                <strong>
                  {product.size || "-"}
                </strong>
              </div>

              <div className="detail">
                <span>Load Rating</span>
                <strong>
                  {product.load_rating || "-"}
                </strong>
              </div>

              <div className="detail">
                <span>Speed Rating</span>
                <strong>
                  {product.speed_rating || "-"}
                </strong>
              </div>

              <div className="detail">
                <span>Load Range</span>
                <strong>
                  {product.load_range || "-"}
                </strong>
              </div>

              <div className="detail">
                <span>Sidewall</span>
                <strong>
                  {product.sidewall || "-"}
                </strong>
              </div>

              <div className="detail">
                <span>Quantity</span>
                <strong>
                  {product.quantity ?? 0}
                </strong>
              </div>
            </div>

            {/* DESCRIPTION */}

            {product.description && (
              <div className="description">
                <h2>Description</h2>

                <p>
                  {product.description}
                </p>
              </div>
            )}

            {/* ADD TO CART */}

            <button
              className="add-to-cart"
              disabled={
                !product.quantity ||
                product.quantity <= 0
              }
            >
              {product.quantity > 0
                ? "Add to Cart"
                : "Out of Stock"}
            </button>
          </div>
        </section>

        {/* ==================================================
            VEHICLE FITMENT
        ================================================== */}

        {vehicleId && (
          <section className="fitment-section">
            <div className="fitment-title">
              <div>
                <h2>
                  Vehicle Fitment
                </h2>

                <p>
                  Vehicle ID: {vehicleId}
                </p>
              </div>
            </div>

            {/* LOADING */}

            {fitmentLoading && (
              <div className="fitment-loading">
                Checking tire fitment...
              </div>
            )}

            {/* ERROR */}

            {!fitmentLoading &&
              fitmentError && (
                <div className="fitment-error">
                  <strong>
                    Unable to check fitment
                  </strong>

                  <p>
                    {fitmentError}
                  </p>
                </div>
              )}

            {/* VEHICLE */}

            {!fitmentLoading &&
              !fitmentError &&
              vehicle && (
                <div className="vehicle-card">
                  <h3>
                    Selected Vehicle
                  </h3>

                  <div className="vehicle-name">
                    {vehicle.year}{" "}
                    {vehicle.make}{" "}
                    {vehicle.model}

                    {vehicle.submodel
                      ? ` ${vehicle.submodel}`
                      : ""}
                  </div>

                  <div className="vehicle-details">
                    {vehicle.body && (
                      <span>
                        Body: {vehicle.body}
                      </span>
                    )}

                    {vehicle.doors && (
                      <span>
                        Doors: {vehicle.doors}
                      </span>
                    )}
                  </div>
                </div>
              )}

            {/* FITS */}

            {!fitmentLoading &&
              !fitmentError &&
              fitmentStatus === true && (
                <div className="fits">
                  <div className="status-icon">
                    ✓
                  </div>

                  <div>
                    <strong>
                      This tire fits your vehicle
                    </strong>

                    <p>
                      This tire matches a supported
                      tire size for this vehicle.
                    </p>
                  </div>
                </div>
              )}

            {/* DOES NOT FIT */}

            {!fitmentLoading &&
              !fitmentError &&
              fitmentStatus === false && (
                <div className="does-not-fit">
                  <div className="status-icon">
                    ×
                  </div>

                  <div>
                    <strong>
                      This tire does not fit your vehicle
                    </strong>

                    <p>
                      This tire does not match any
                      supported tire size for this vehicle.
                    </p>
                  </div>
                </div>
              )}

            {/* ALL VEHICLE FITMENTS */}

            {!fitmentLoading &&
              !fitmentError &&
              vehicleFitments.length > 0 && (
                <div className="vehicle-fitments">
                  <h3>
                    Tire Sizes That Fit This Vehicle
                  </h3>

                  <p className="fitment-description">
                    These are the tire sizes supported
                    by the selected vehicle.
                  </p>

                  <div className="fitment-list">
                    {vehicleFitments.map(
                      (fitment, index) => (
                        <div
                          className="fitment-item"
                          key={`${fitment.size}-${index}`}
                        >
                          <strong>
                            {fitment.size}
                          </strong>

                          <span>
                            {fitment.format === "M"
                              ? "Metric"
                              : fitment.format === "F"
                              ? "Flotation"
                              : fitment.format}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* NO FITMENTS */}

            {!fitmentLoading &&
              !fitmentError &&
              vehicleFitments.length === 0 &&
              vehicle && (
                <div className="no-fitments">
                  No tire fitments were found for
                  this vehicle.
                </div>
              )}
          </section>
        )}
      </div>

      {/* ==================================================
          STYLES
      ================================================== */}

      <style jsx>{`
        .page {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 24px;
          box-sizing: border-box;
        }

        .main-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          align-items: start;
        }

        .main-layout.with-fitment {
          grid-template-columns:
            minmax(0, 1.4fr)
            minmax(350px, 0.8fr);
        }

        .product-section {
          min-width: 0;
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(0, 1fr);
          gap: 35px;
          padding: 25px;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          background: #ffffff;
          box-sizing: border-box;
        }

        .gallery {
          min-width: 0;
        }

        .main-image-container {
          width: 100%;
          height: 420px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #eeeeee;
          border-radius: 10px;
          overflow: hidden;
          background: #ffffff;
        }

        .main-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 20px;
          box-sizing: border-box;
        }

        .no-image {
          color: #777777;
        }

        .thumbnails {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 15px;
        }

        .thumbnail {
          width: 75px;
          height: 75px;
          padding: 5px;
          border: 1px solid #dddddd;
          border-radius: 6px;
          box-sizing: border-box;
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .product-info {
          min-width: 0;
        }

        .brand {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .product-info h1 {
          margin: 0;
          font-size: 28px;
          line-height: 1.3;
        }

        .model {
          margin: 10px 0 0;
          color: #666666;
        }

        .price {
          margin: 25px 0;
          font-size: 32px;
          font-weight: 700;
        }

        .details {
          border-top: 1px solid #eeeeee;
          border-bottom: 1px solid #eeeeee;
        }

        .detail {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 12px 0;
          border-bottom: 1px solid #eeeeee;
        }

        .detail:last-child {
          border-bottom: none;
        }

        .detail span {
          color: #666666;
        }

        .detail strong {
          text-align: right;
        }

        .description {
          margin-top: 25px;
        }

        .description h2 {
          margin: 0 0 10px;
          font-size: 20px;
        }

        .description p {
          margin: 0;
          color: #555555;
          line-height: 1.6;
        }

        .add-to-cart {
          width: 100%;
          margin-top: 25px;
          padding: 15px 20px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .add-to-cart:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .fitment-section {
          min-width: 0;
          padding: 25px;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          background: #fafafa;
          box-sizing: border-box;
        }

        .fitment-title {
          margin-bottom: 25px;
        }

        .fitment-title h2 {
          margin: 0;
          font-size: 24px;
        }

        .fitment-title p {
          margin: 6px 0 0;
          color: #777777;
          font-size: 13px;
        }

        .fitment-loading {
          padding: 40px 20px;
          text-align: center;
          color: #666666;
        }

        .fitment-error {
          padding: 18px;
          border: 1px solid #f1c2c2;
          border-radius: 8px;
          background: #fff0f0;
        }

        .fitment-error p {
          margin: 5px 0 0;
        }

        .vehicle-card {
          margin-bottom: 20px;
          padding: 20px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: #ffffff;
        }

        .vehicle-card h3 {
          margin: 0 0 10px;
          font-size: 16px;
        }

        .vehicle-name {
          font-size: 20px;
          font-weight: 600;
          line-height: 1.4;
        }

        .vehicle-details {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 10px;
          color: #666666;
          font-size: 14px;
        }

        .fits,
        .does-not-fit {
          display: flex;
          gap: 15px;
          align-items: flex-start;
          margin-bottom: 25px;
          padding: 18px;
          border-radius: 8px;
        }

        .fits {
          border: 1px solid #b9e6c8;
          background: #eaf8ef;
        }

        .does-not-fit {
          border: 1px solid #f1c2c2;
          background: #fff0f0;
        }

        .status-icon {
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: #ffffff;
          font-size: 20px;
          font-weight: 700;
        }

        .fits .status-icon {
          background: #28a745;
        }

        .does-not-fit .status-icon {
          background: #dc3545;
        }

        .fits strong,
        .does-not-fit strong {
          display: block;
          margin-bottom: 5px;
        }

        .fits p,
        .does-not-fit p {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
        }

        .vehicle-fitments {
          margin-top: 10px;
        }

        .vehicle-fitments h3 {
          margin: 0 0 5px;
          font-size: 18px;
        }

        .fitment-description {
          margin: 0;
          color: #666666;
          font-size: 14px;
        }

        .fitment-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 15px;
        }

        .fitment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 14px 16px;
          border: 1px solid #e5e5e5;
          border-radius: 7px;
          background: #ffffff;
        }

        .fitment-item span {
          padding: 4px 8px;
          border-radius: 4px;
          background: #f1f1f1;
          color: #777777;
          font-size: 12px;
        }

        .no-fitments {
          padding: 20px;
          border: 1px solid #eeeeee;
          border-radius: 8px;
          background: #ffffff;
          color: #666666;
        }

        @media (max-width: 1100px) {
          .main-layout.with-fitment {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 750px) {
          .page {
            padding: 20px 15px;
          }

          .product-section {
            grid-template-columns: 1fr;
            padding: 15px;
          }

          .main-image-container {
            height: 300px;
          }

          .product-info h1 {
            font-size: 23px;
          }

          .price {
            font-size: 27px;
          }

          .fitment-section {
            padding: 15px;
          }

          .fitment-item {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
