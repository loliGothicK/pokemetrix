"use client";

import CatchingPokemonRoundedIcon from "@mui/icons-material/CatchingPokemonRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import InventoryRoundedIcon from "@mui/icons-material/InventoryRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import { alpha, Box, Container, Grid, Paper, Stack, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import PokemetrixIcon from "@/components/icons/Pokemetrix";

export default function Home() {
  const theme = useTheme();
  const { t } = useTranslation();

  const tools = [
    {
      id: "team-builder",
      icon: <CatchingPokemonRoundedIcon sx={{ fontSize: 40 }} color="primary" />,
      title: t("home.tools.teamBuilder.title"),
      desc: t("home.tools.teamBuilder.desc"),
      href: "/team-builder",
      gridSpan: { xs: 12, md: 8 },
      primary: true,
    },
    {
      id: "box",
      icon: <InventoryRoundedIcon sx={{ fontSize: 32 }} color="secondary" />,
      title: t("home.tools.box.title"),
      desc: t("home.tools.box.desc"),
      href: "/box",
      gridSpan: { xs: 12, sm: 6, md: 4 },
      primary: false,
    },
    {
      id: "battle-record",
      icon: <HistoryRoundedIcon sx={{ fontSize: 32 }} color="info" />,
      title: t("home.tools.battleRecord.title"),
      desc: t("home.tools.battleRecord.desc"),
      href: "/battle-record",
      gridSpan: { xs: 12, sm: 6, md: 6 },
      primary: false,
    },
    {
      id: "battle-analytics",
      icon: <QueryStatsRoundedIcon sx={{ fontSize: 32 }} color="success" />,
      title: t("home.tools.battleAnalytics.title"),
      desc: t("home.tools.battleAnalytics.desc"),
      href: "/battle-analytics",
      gridSpan: { xs: 12, sm: 6, md: 6 },
      primary: false,
    },
  ];

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        background: [
          `radial-gradient(circle at 15% 10%, rgba(var(--mui-palette-primary-mainChannel) / 0.22), transparent 40%)`,
          `radial-gradient(circle at 85% 90%, rgba(var(--mui-palette-secondary-mainChannel) / 0.16), transparent 40%)`,
          `linear-gradient(180deg, var(--mui-palette-background-default) 0%, var(--mui-palette-background-defaultAlt) 100%)`,
        ].join(", "),
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Stack spacing={6} sx={{ alignItems: "flex-start" }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 2, md: 0 }}
            sx={{ alignItems: "center", gap: 4 }}
          >
            <PokemetrixIcon
              sx={{
                width: { xs: 120, md: 200 },
                height: { xs: 120, md: 200 },
                flexShrink: 0,
              }}
            />
            <Stack spacing={2} sx={{ textAlign: "center", alignItems: "center" }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "2.5rem", md: "4rem" },
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                }}
              >
                {t("home.title")}
              </Typography>
              <Typography
                variant="overline"
                sx={{ color: "primary.main", fontWeight: 800, letterSpacing: "0.2em" }}
              >
                {t("app.subtitle")}
              </Typography>
            </Stack>
          </Stack>

          {/* Bento Grid Tools Section */}
          <Grid container spacing={3}>
            {tools.map((tool) => (
              <Grid size={{ ...tool.gridSpan }} key={tool.id}>
                <Paper
                  component="a"
                  href={tool.href}
                  elevation={0}
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "row", md: "column" },
                    alignItems: { xs: "center", md: "normal" },
                    justifyContent: "space-between",
                    height: "100%",
                    minHeight: { xs: "auto", md: tool.primary ? 240 : 180 },
                    textDecoration: "none",
                    borderRadius: 4,
                    p: { xs: 3, md: 5 },
                    gap: { xs: 2, md: 0 },
                    bgcolor: tool.primary ? "background.paperRaised" : "background.paperTint",
                    backdropFilter: "blur(12px)",
                    border: "1px solid",
                    borderColor: tool.primary ? "rgba(21, 101, 192, 0.3)" : "dividerSoft",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      borderColor: tool.primary ? "primary.main" : "divider",
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
                      "& .arrow-icon": { transform: "translateX(4px)", color: "primary.main" },
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
                  >
                    <Box
                      sx={{
                        p: { xs: 1, md: 1.5 },
                        borderRadius: 3,
                        bgcolor: "rgba(var(--mui-palette-background-paperChannel) / 0.5)",
                        boxShadow: `0 4px 12px rgba(0,0,0, 0.05)`,
                        display: "flex",
                        flexShrink: 0,
                      }}
                    >
                      {/* Scale down the icon slightly on mobile */}
                      <Box
                        sx={{ transform: { xs: "scale(0.8)", md: "scale(1)" }, display: "flex" }}
                      >
                        {tool.icon}
                      </Box>
                    </Box>
                    <ArrowForwardIosRoundedIcon
                      className="arrow-icon"
                      sx={{
                        display: { xs: "none", md: "block" },
                        color: "text.disabled",
                        fontSize: 20,
                        transition: "0.2s",
                      }}
                    />
                  </Stack>
                  <Stack spacing={{ xs: 0.5, md: 1 }} sx={{ pl: { xs: 0, md: 2 }, flexGrow: 1 }}>
                    <Typography
                      variant={tool.primary ? "h4" : "h6"}
                      sx={{
                        fontWeight: 700,
                        color: "text.primary",
                        fontSize: { xs: tool.primary ? "1.25rem" : "1rem", md: undefined },
                      }}
                    >
                      {tool.title}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      variant="body2"
                      sx={{
                        fontSize: { xs: "0.75rem", md: "0.875rem" },
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {tool.desc}
                    </Typography>
                  </Stack>
                  <ArrowForwardIosRoundedIcon
                    className="arrow-icon"
                    sx={{
                      display: { xs: "block", md: "none" },
                      color: "text.disabled",
                      fontSize: 16,
                      transition: "0.2s",
                      flexShrink: 0,
                    }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
