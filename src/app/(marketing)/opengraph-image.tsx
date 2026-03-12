import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Barron & Folly — Autonomous Execution Engine";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0A08",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(circle, #2A2A26 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: 0.4,
          }}
        />

        {/* Orange accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #FF8400, #FFB366, #FF8400)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 24,
              color: "#FF8400",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "24px",
              fontWeight: 600,
            }}
          >
            Barron & Folly
          </div>

          <div
            style={{
              fontSize: 64,
              color: "#F5F5F0",
              lineHeight: 1.1,
              fontWeight: 300,
              marginBottom: "24px",
              maxWidth: "900px",
            }}
          >
            Autonomous Execution Engine for Growing Companies
          </div>

          <div
            style={{
              fontSize: 22,
              color: "#6E6E6A",
              lineHeight: 1.5,
              maxWidth: "700px",
            }}
          >
            Software, systems, and brand infrastructure — deployed on demand. No
            contracts.
          </div>
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            left: "80px",
            display: "flex",
            gap: "32px",
            fontSize: 14,
            color: "#6E6E6A",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <span>Agentic Execution</span>
          <span style={{ color: "#2A2A26" }}>·</span>
          <span>Systems Architecture</span>
          <span style={{ color: "#2A2A26" }}>·</span>
          <span>Brand & Experience</span>
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            right: "80px",
            fontSize: 14,
            color: "#FF8400",
            letterSpacing: "0.05em",
          }}
        >
          barronfolly.com
        </div>
      </div>
    ),
    { ...size }
  );
}
