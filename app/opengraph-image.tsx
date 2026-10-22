import { ImageResponse } from "next/og";

export const alt = "Akib Arifeen. I make AI feel handmade.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Hex values are sRGB conversions of tokens.css: paper oklch(95.5% 0.012 75), ink oklch(22% 0.012 60),
// ink-2 oklch(38% 0.012 60), accent oklch(63% 0.15 33). ImageResponse cannot read CSS variables or oklch().
// Font: Fraunces is not in the repo and the docs only load fonts from local files, so this uses the
// default font bundled with next/og (Geist Regular).
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#f5efe7",
          color: "#1f1915",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: "#47413c" }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, background: "#d4614a" }} />
          Akib Arifeen
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 104, lineHeight: 1.05, letterSpacing: -2, display: "flex", flexWrap: "wrap" }}>
            I make AI feel&nbsp;<span style={{ color: "#d4614a" }}>handmade.</span>
          </div>
          <div style={{ width: 120, height: 6, background: "#d4614a", marginTop: 40 }} />
        </div>
        <div style={{ fontSize: 32, color: "#47413c" }}>Software engineer, Hong Kong</div>
      </div>
    ),
    { ...size },
  );
}
