import type { PaletteMode } from "@mui/material";

export const appPalette = {
  brand: {
    primary: "#1565c0",
    secondary: "#00897b",
  },
  light: {
    canvas: "#f3f6fb",
    canvasAlt: "#eef3f8",
    surface: "#ffffff",
    surfaceRaised: "rgba(255, 255, 255, 0.96)",
    surfaceTint: "rgba(255, 255, 255, 0.86)",
    edge: "rgba(15, 23, 42, 0.12)",
    edgeSoft: "rgba(21, 101, 192, 0.12)",
    glowPrimary: "rgba(21, 101, 192, 0.22)",
    glowSecondary: "rgba(0, 137, 123, 0.16)",
    ink: "#0f172a",
    iconShadow: "0 14px 30px rgba(21,101,192,0.24)",
  },
  dark: {
    canvas: "#050816",
    canvasAlt: "#0b1220",
    surface: "#0d1427",
    surfaceRaised: "rgba(17, 24, 39, 0.92)",
    surfaceTint: "rgba(17, 24, 39, 0.88)",
    edge: "rgba(148, 163, 184, 0.18)",
    edgeSoft: "rgba(96, 165, 250, 0.18)",
    glowPrimary: "rgba(59, 130, 246, 0.28)",
    glowSecondary: "rgba(45, 212, 191, 0.20)",
    ink: "#e5eefb",
    iconShadow: "0 18px 40px rgba(2, 6, 23, 0.62)",
  },
} as const;

export type AppPaletteMode = keyof Pick<typeof appPalette, "light" | "dark">;

export function getAppPalette(mode: PaletteMode) {
  return mode === "dark" ? appPalette.dark : appPalette.light;
}
