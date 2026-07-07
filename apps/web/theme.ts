"use client";

import { createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";
import { appPalette, getAppPalette } from "@/theme/palette";

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
  const palette = getAppPalette(mode);

  return createTheme({
    ...sharedThemeOptions,
    palette: {
      mode,
      primary: {
        main: appPalette.brand.primary,
      },
      secondary: {
        main: appPalette.brand.secondary,
      },
      background: {
        default: palette.canvas,
        paper: palette.surface,
      },
      text: {
        primary: palette.ink,
      },
    },
  });
}

export default createAppTheme("light");
