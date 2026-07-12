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
          `radial-gradient(circle at 15% 10%, ${alpha(theme.palette.primary.main, 0.22)}, transparent 40%)`,
          `radial-gradient(circle at 85% 90%, ${alpha(theme.palette.secondary.main, 0.16)}, transparent 40%)`,
          `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.defaultAlt} 100%)`,
        ].join(", "),
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Stack spacing={6} sx={{ alignItems: "center" }}>
          <Stack direction={"row"} sx={{ alignItems: "center" }}>
            <PokemetrixIcon
              sx={{
                width: { xs: 120, md: 200 },
                height: { xs: 120, md: 200 },
              }}
            />
            <Stack spacing={2} sx={{ textAlign: "center", alignItems: "center" }}>
              <Typography
                variant="overline"
                sx={{ color: "primary.main", fontWeight: 800, letterSpacing: "0.2em" }}
              >
                {t("app.subtitle")}
              </Typography>
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
                color="text.secondary"
                sx={{ fontSize: "1.1rem", display: { xs: "none", md: "block" } }}
              >
                {t("home.description")}
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
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                    minHeight: tool.primary ? 240 : 180,
                    textDecoration: "none",
                    borderRadius: 4,
                    p: 5,
                    bgcolor: alpha(theme.palette.background.paperTint, tool.primary ? 0.8 : 0.4),
                    backdropFilter: "blur(12px)",
                    border: "1px solid",
                    borderColor: tool.primary
                      ? alpha(theme.palette.primary.main, 0.3)
                      : theme.palette.dividerSoft,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      borderColor: tool.primary
                        ? theme.palette.primary.main
                        : theme.palette.divider,
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
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.background.paper, 0.5),
                        boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.05)}`,
                      }}
                    >
                      {tool.icon}
                    </Box>
                    <ArrowForwardIosRoundedIcon
                      className="arrow-icon"
                      sx={{ color: "text.disabled", fontSize: 20, transition: "0.2s" }}
                    />
                  </Stack>
                  <Stack spacing={1} sx={{ pl: 2 }}>
                    <Typography
                      variant={tool.primary ? "h4" : "h6"}
                      sx={{ fontWeight: 700, color: "text.primary" }}
                    >
                      {tool.title}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {tool.desc}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
