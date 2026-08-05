"use client";

import { Box, Container, Link, Stack, Typography, useTheme } from "@mui/material";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { flexRowCenter } from "@/theme/sx";

export function Footer() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: "auto",
        borderTop: "1px solid",
        borderColor: theme.palette.divider,
        bgcolor: "transparent",
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={3} sx={flexRowCenter}>
          <Stack direction="row" spacing={4} sx={{ flexWrap: "wrap", justifyContent: "center" }}>
            <Link
              component={NextLink}
              href="/docs"
              color="text.secondary"
              variant="body2"
              underline="hover"
            >
              {t("navigation.items.docs")}
            </Link>
            <Link
              component={NextLink}
              href="/blog"
              color="text.secondary"
              variant="body2"
              underline="hover"
            >
              {t("navigation.items.blog")}
            </Link>
            <Link
              component={NextLink}
              href="/privacy"
              color="text.secondary"
              variant="body2"
              underline="hover"
            >
              {t("navigation.items.privacy")}
            </Link>
            <Link
              component={NextLink}
              href="/terms"
              color="text.secondary"
              variant="body2"
              underline="hover"
            >
              {t("navigation.items.terms")}
            </Link>
            <Link
              component={NextLink}
              href="mailto:loligothick+pokemetrix@gmail.com"
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
