"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true,
  shape: {
    borderRadius: 18,
  },
  palette: {
    primary: {
      main: "#1565c0",
    },
    secondary: {
      main: "#00897b",
    },
    background: {
      default: "#f3f6fb",
      paper: "#ffffff",
    },
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
});

export default theme;
