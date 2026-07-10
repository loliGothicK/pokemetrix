"use client";

import { Box, Container, Link, Stack, Typography, useTheme } from "@mui/material";
import NextLink from "next/link";
import { getAppPalette } from "@/theme/palette";

export function Footer() {
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);

  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: "auto",
        borderTop: "1px solid",
        borderColor: palette.edge,
        bgcolor: palette.surface,
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={3} sx={{ alignItems: "center" }}>
          <Stack direction="row" spacing={4} sx={{ flexWrap: "wrap", justifyContent: "center" }}>
            <Link
              component={NextLink}
              href="#"
              color="text.secondary"
              variant="body2"
              underline="hover"
            >
              About
            </Link>
            <Link
              component={NextLink}
              href="#"
              color="text.secondary"
              variant="body2"
              underline="hover"
            >
              Privacy Policy
            </Link>
            <Link
              component={NextLink}
              href="#"
              color="text.secondary"
              variant="body2"
              underline="hover"
            >
              Terms of Service
            </Link>
            <Link
              component={NextLink}
              href="#"
              color="text.secondary"
              variant="body2"
              underline="hover"
            >
              Contact
            </Link>
          </Stack>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 600 }}>
            Content is available under{" "}
            <Link
              href="https://creativecommons.org/licenses/by-nc-sa/2.5/"
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"
              underline="always"
            >
              Attribution-NonCommercial-ShareAlike 2.5
            </Link>
            .
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
