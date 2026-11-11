import { ImageResponse } from "next/og";

export const alt = "NEXUS ONE – Your Digital Ecosystem";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "linear-gradient(130deg, #090912, #211541)", color: "#f4efff", flexDirection: "column", justifyContent: "center", paddingLeft: 104 }}>
      <div style={{ position: "absolute", display: "flex", top: 43, right: 68, width: 535, height: 535, borderRadius: 300, border: "2px solid #6c55c1" }} />
      <div style={{ position: "absolute", display: "flex", top: 90, right: 115, width: 440, height: 440, borderRadius: 250, border: "2px solid #4f3d8f" }} />
      <div style={{ position: "absolute", display: "flex", top: 131, right: 156, width: 358, height: 358, borderRadius: 220, border: "2px solid #3e306f" }} />
      <div style={{ display: "flex", fontSize: 22, color: "#c0acff", letterSpacing: 4 }}>YOUR DIGITAL ECOSYSTEM</div>
      <div style={{ display: "flex", fontSize: 111, fontWeight: 700, letterSpacing: -8, marginTop: 6 }}>
        NEXUS <span style={{ color: "#ac91ff", marginLeft: 23 }}>ONE</span>
      </div>
      <div style={{ display: "flex", fontSize: 30, color: "#dad0f5" }}>One ecosystem. Endless possibilities.</div>
    </div>,
    size,
  );
}
