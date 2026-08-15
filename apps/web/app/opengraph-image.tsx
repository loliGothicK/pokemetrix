import { ImageResponse } from "next/og";

export const alt = "Pokemetrix - Analytics Workspace for Pokémon Battle";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: "40px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: "white",
          marginBottom: "40px",
          boxShadow: "0 0 40px rgba(255,255,255,0.2)",
        }}
      >
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            border: "8px solid #0f172a",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(to bottom, #ef4444 50%, white 50%)",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "8px",
              background: "#0f172a",
              position: "absolute",
              top: "42px",
            }}
          />
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "white",
              border: "6px solid #0f172a",
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          fontSize: 100,
          fontWeight: "bold",
          letterSpacing: "-0.05em",
          color: "white",
          marginBottom: "20px",
          textShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        Pokemetrix
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 42,
          color: "#94a3b8",
          fontWeight: 500,
          letterSpacing: "-0.02em",
        }}
      >
        Analytics Workspace for Pokémon Battle
      </div>
    </div>,
    {
      ...size,
    },
  );
}
