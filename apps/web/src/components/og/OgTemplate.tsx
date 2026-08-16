import React from "react";

interface OgTemplateProps {
  title?: string;
  subtitle?: string;
}

export function OgTemplate({
  title = "Pokemetrix",
  subtitle = "Analytics Workspace for Pokémon Battle",
}: OgTemplateProps) {
  return (
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
          width: "140px",
          height: "140px",
          borderRadius: "50%",
          background: "white",
          marginBottom: "40px",
          boxShadow: "0 0 40px rgba(255,255,255,0.2)",
          padding: "10px",
        }}
      >
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="120" height="120">
          <circle
            cx="100"
            cy="100"
            r="84"
            fill="none"
            stroke="#0f172a"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="339.89 187.89"
            strokeDashoffset="0"
            transform="rotate(-90 100 100)"
          />
          <circle
            cx="100"
            cy="100"
            r="84"
            fill="none"
            stroke="#66C5D0"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="145.67 382.11"
            strokeDashoffset="-361.0"
            transform="rotate(-90 100 100)"
          />
          <rect x="47" y="55" width="16" height="33" rx="6" fill="#66C5D0" />
          <rect x="77" y="35" width="16" height="48" rx="6" fill="#66C5D0" />
          <rect x="107" y="45" width="16" height="38" rx="6" fill="#66C5D0" />
          <rect x="137" y="65" width="16" height="23" rx="6" fill="#66C5D0" />
          <line
            x1="34.873"
            y1="100.794"
            x2="165.374"
            y2="100.197"
            stroke="#0f172a"
            strokeWidth="11.865"
            strokeLinecap="round"
            strokeDasharray="40.4 60.4"
            strokeDashoffset="6"
          />
          <circle cx="100" cy="100" r="24" fill="none" stroke="#0f172a" strokeWidth="12" />
          <circle cx="100" cy="100" r="8" fill="#0f172a" />
        </svg>
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
          textAlign: "center",
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 42,
          color: "#94a3b8",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          textAlign: "center",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}
