import fs from "node:fs/promises";
import path from "node:path";

export const metadata = {
  title: "Vehicle OE Tire Fitment Knowledge",
  description: "Vehicle OE tire fitment information",
};

export default async function VehicleFitmentPage() {

  const filePath = path.join(
    process.cwd(),
    "public",
    "vehicle-oe-fitment-knowledge.txt"
  );

  const content =
    await fs.readFile(
      filePath,
      "utf8"
    );

  return (
    <main
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h1>
        Vehicle OE Tire Fitment Knowledge
      </h1>

      <pre
        style={{
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
          lineHeight: "1.6",
          background: "#f5f5f5",
          padding: "20px",
          borderRadius: "8px",
          overflowX: "auto",
        }}
      >
        {content}
      </pre>

    </main>
  );
}