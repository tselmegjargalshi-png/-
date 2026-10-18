import { ImageResponse } from "next/og";

export const alt = "NOMAD BUSINESS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#efebe2", padding: 72, color: "#1b1a17" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "#1b1a17", display: "flex", alignItems: "center", justifyContent: "center", color: "#efebe2", fontSize: 40, fontWeight: 800 }}>N</div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 8 }}>NOMAD BUSINESS</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 112, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>Mongolia, mapped.</div>
          <div style={{ marginTop: 24, fontSize: 34, color: "#6a655a" }}>Cafes, studios, salons and makers across the country.</div>
        </div>
        <div style={{ height: 8, width: 220, background: "#c4531f", borderRadius: 4 }} />
      </div>
    ),
    size,
  );
}
