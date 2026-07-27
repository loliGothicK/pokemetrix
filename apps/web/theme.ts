"use client";

import { createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";
import { brandColors, darkPalette, lightPalette } from "@/theme/palette";

const sharedThemeOptions = {
  cssVariables: true,
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily:
      '"Segoe UI", "Helvetica Neue", Helvetica, Arial, "Hiragino Sans", "Yu Gothic UI", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: "-0.04em",
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 20,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
} as const;

export function createAppTheme(mode: PaletteMode) {
  const modePalette = mode === "dark" ? darkPalette : lightPalette;

  return createTheme({
    ...sharedThemeOptions,
    palette: {
      mode,
      primary: {
        main: brandColors.primary,
      },
      secondary: {
        main: brandColors.secondary,
      },
      background: modePalette.background,
      divider: modePalette.divider,
      dividerSoft: modePalette.dividerSoft,
      text: {
        primary: modePalette.text.primary,
      },
    },
  });
}

export default createAppTheme("light");
