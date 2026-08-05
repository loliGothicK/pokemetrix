"use client";

import { createTheme } from "@mui/material/styles";

import { brandColors, darkPalette, lightPalette } from "@/theme/palette";

const sharedThemeOptions = {
  cssVariables: {
    colorSchemeSelector: "data-mui-color-scheme",
  },
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

export const theme = createTheme({
  ...sharedThemeOptions,
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: brandColors.primary,
        },
        secondary: {
          main: brandColors.secondary,
        },
        background: lightPalette.background,
        divider: lightPalette.divider,
        dividerSoft: lightPalette.dividerSoft,
        text: {
          primary: lightPalette.text.primary,
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: brandColors.primary,
        },
        secondary: {
          main: brandColors.secondary,
        },
        background: darkPalette.background,
        divider: darkPalette.divider,
        dividerSoft: darkPalette.dividerSoft,
        text: {
          primary: darkPalette.text.primary,
        },
      },
    },
  },
});

export default theme;
