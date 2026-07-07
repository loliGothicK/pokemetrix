"use client";

import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import CatchingPokemonRoundedIcon from "@mui/icons-material/CatchingPokemonRounded";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import FlashOnRoundedIcon from "@mui/icons-material/FlashOnRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import PokemetrixIcon from "@/components/icons/Pokemetrix";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import SportsMmaRoundedIcon from "@mui/icons-material/SportsMmaRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  alpha,
  type PaletteMode,
} from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAuthSync } from "@/hooks/useAuthSync";
import { TeamMergeDialog } from "@/components/client/TeamMergeDialog";
import { AuthButton } from "@/components/client/AuthButton";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import i18n, { defaultLanguage, supportedLanguageOptions } from "@/i18n/config";
import { createAppTheme } from "../../../theme";
import { getAppPalette } from "@/theme/palette";
import MenuIcon from "@mui/icons-material/Menu";

const SIDE_MENU_WIDTH = 240;

const STORAGE_KEYS = {
  language: "pokemetrix-language",
  mode: "pokemetrix-color-mode",
} as const;

type SideMenuItem = {
  readonly labelKey: string;
  readonly icon: ReactNode;
  readonly route?: string;
};

type SideMenuGroup = {
  readonly titleKey: string;
  readonly items: readonly SideMenuItem[];
};

const sideMenuGroups: SideMenuGroup[] = [
  {
    titleKey: "navigation.groups.teambuilder",
    items: [
      {
        labelKey: "navigation.items.createTeam",
        icon: <BuildRoundedIcon fontSize="small" />,
        route: "/team-builder",
      },
      {
        labelKey: "navigation.items.myBox",
        icon: <CatchingPokemonRoundedIcon fontSize="small" />,
        route: "/box",
      },
    ],
  },
  {
    titleKey: "navigation.groups.battle",
    items: [
      {
        labelKey: "navigation.items.battleRecord",
        icon: <SportsMmaRoundedIcon fontSize="small" />,
        route: "/battle-record",
      },
      {
        labelKey: "navigation.items.damageCalc",
        icon: <FlashOnRoundedIcon fontSize="small" />,
      },
    ],
  },
  {
    titleKey: "navigation.groups.statistics",
    items: [
      {
        labelKey: "navigation.items.usageTrends",
        icon: <QueryStatsRoundedIcon fontSize="small" />,
      },
      {
        labelKey: "navigation.items.metaTables",
        icon: <TableChartRoundedIcon fontSize="small" />,
      },
      {
        labelKey: "navigation.items.winrateInsights",
        icon: <InsightsRoundedIcon fontSize="small" />,
        route: "/battle-analytics",
      },
    ],
  },
] as const;

function SideMenuContent({ onNavigate }: { readonly onNavigate?: () => void }) {
  const { t } = useTranslation();

  return (
    <List
      sx={{
        px: 2,
        py: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      {sideMenuGroups.map((group, index) => (
        <Box key={group.titleKey} sx={{ listStyle: "none" }}>
          <Typography
            variant="overline"
            sx={{
              display: "block",
              mb: 1,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "text.secondary",
              lineHeight: 1.2,
            }}
          >
            {t(group.titleKey)}
          </Typography>
          {group.items.map((item) => {
            const content = item.route ? (
              <ListItemButton
                component={Link}
                href={item.route}
                onClick={onNavigate}
                sx={{
                  borderRadius: 3,
                  minHeight: 44,
                  mb: 0.5,
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "primary.main" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={t(item.labelKey)} />
              </ListItemButton>
            ) : (
              <ListItemButton
                disabled
                sx={{
                  borderRadius: 3,
                  minHeight: 44,
                  mb: 0.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "primary.main" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={t(item.labelKey)} />
              </ListItemButton>
            );

            return <Box key={item.labelKey}>{content}</Box>;
          })}
          {index < sideMenuGroups.length - 1 ? <Divider sx={{ mt: 1.25 }} /> : null}
        </Box>
      ))}
    </List>
  );
}

function AppControls({
  language,
  mode,
  onLanguageChange,
  onToggleMode,
}: {
  readonly language: string;
  readonly mode: PaletteMode;
  readonly onLanguageChange: (language: string) => void;
  readonly onToggleMode: () => void;
}) {
  const { t } = useTranslation();
  const palette = getAppPalette(mode);

  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="language-select-label">{t("preferences.language")}</InputLabel>
        <Select
          labelId="language-select-label"
          label={t("preferences.language")}
          value={language}
          onChange={(event) => onLanguageChange(event.target.value)}
          sx={{ bgcolor: palette.surface }}
        >
          {supportedLanguageOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Tooltip title={mode === "dark" ? t("preferences.darkMode") : t("preferences.lightMode")}>
        <IconButton
          color="primary"
          onClick={onToggleMode}
          aria-label={mode === "dark" ? t("preferences.darkMode") : t("preferences.lightMode")}
          sx={{
            border: "1px solid",
            borderColor: palette.edge,
            bgcolor: palette.surface,
            borderRadius: 2.5,
          }}
        >
          {mode === "dark" ? (
            <LightModeRoundedIcon fontSize="small" />
          ) : (
            <DarkModeRoundedIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
      <AuthButton />
    </Stack>
  );
}

function ResponsiveAppBar({
  language,
  mode,
  onLanguageChange,
  onToggleMode,
  onOpenNav,
}: {
  readonly language: string;
  readonly mode: PaletteMode;
  readonly onLanguageChange: (language: string) => void;
  readonly onToggleMode: () => void;
  readonly onOpenNav: () => void;
}) {
  const { t } = useTranslation();
  const palette = getAppPalette(mode);

  // モードに応じたグラデーション背景
  const appBarBg =
    mode === "dark"
      ? "linear-gradient(135deg, rgba(13,20,39,0.92) 0%, rgba(11,18,32,0.88) 100%)"
      : "linear-gradient(135deg, rgba(255,255,255,0.90) 0%, rgba(243,246,251,0.86) 100%)";

  // ロゴエリアの輝きアクセント
  const logoGlow =
    mode === "dark"
      ? `drop-shadow(0 0 10px ${palette.glowPrimary})`
      : `drop-shadow(0 2px 6px ${palette.glowPrimary})`;

  return (
    <AppBar
      color="transparent"
      elevation={0}
      position="sticky"
      sx={{
        top: 0,
        borderBottom: "1px solid",
        borderColor: palette.edge,
        background: appBarBg,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: { xs: 60, md: 68 },
          px: { xs: 1.5, sm: 2, md: 3 },
          gap: { xs: 1, md: 2 },
        }}
      >
        {/* ===== 左: ハンバーガー（モバイル）+ ロゴ ===== */}
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: { xs: 1, md: 1.5 } }}>
          <IconButton
            size="medium"
            aria-label={t("navigation.openMenu")}
            onClick={onOpenNav}
            color="primary"
            sx={{
              display: { xs: "inline-flex", md: "none" },
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>

          {/* ロゴ + ブランド名 */}
          <Box
            component={Link}
            href="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              textDecoration: "none",
              "&:hover .logo-icon": { filter: logoGlow, transform: "scale(1.06)" },
              "&:hover .brand-text": { opacity: 1 },
            }}
          >
            {/* アイコン */}
            <Box
              className="logo-icon"
              sx={{
                width: { xs: 34, md: 38 },
                height: { xs: 34, md: 38 },
                transition: "filter 0.25s ease, transform 0.25s ease",
                flexShrink: 0,
              }}
            >
              <PokemetrixIcon sx={{ width: 38, height: 38 }} />
            </Box>

            {/* ブランド名 — md以上で表示 */}
            <Box
              className="brand-text"
              sx={{
                display: "flex",
                flexDirection: "column",
                opacity: 0.9,
                transition: "opacity 0.2s ease",
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontSize: { sm: 13, md: 14 },
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  lineHeight: 1,
                  background:
                    mode === "dark"
                      ? "linear-gradient(90deg, #60a5fa 0%, #7dd8e0 100%)"
                      : "linear-gradient(90deg, #1565c0 0%, #00897b 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                POKEMETRIX
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  color: "text.secondary",
                  lineHeight: 1.4,
                  mt: 0.25,
                }}
              >
                {t("appBar.tagline", "ANALYTICS WORKSPACE")}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ===== 右: デスクトップ フルコントロール ===== */}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <AppControls
            language={language}
            mode={mode}
            onLanguageChange={onLanguageChange}
            onToggleMode={onToggleMode}
          />
        </Box>

        {/* ===== 右: モバイル — テーマ切り替え + Auth ===== */}
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ display: { xs: "flex", md: "none" }, alignItems: "center" }}
        >
          <Tooltip title={mode === "dark" ? t("preferences.darkMode") : t("preferences.lightMode")}>
            <IconButton
              color="primary"
              onClick={onToggleMode}
              size="small"
              aria-label={mode === "dark" ? t("preferences.darkMode") : t("preferences.lightMode")}
              sx={{
                border: "1px solid",
                borderColor: palette.edge,
                bgcolor: palette.surface,
                borderRadius: 2.5,
              }}
            >
              {mode === "dark" ? (
                <LightModeRoundedIcon fontSize="small" />
              ) : (
                <DarkModeRoundedIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <AuthButton />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

function MobileNavigation({
  open,
  onClose,
  language,
  onLanguageChange,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly language: string;
  readonly onLanguageChange: (language: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        display: { xs: "block", md: "none" },
        "& .MuiDrawer-paper": {
          width: "min(92vw, 320px)",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 1,
        }}
      >
        <Typography sx={{ fontWeight: 700, px: 1 }}>{t("teamBuilder.title")}</Typography>
        <IconButton onClick={onClose} aria-label="close navigation">
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <SideMenuContent onNavigate={onClose} />
      </Box>
      <Divider />
      {/* 言語切り替え */}
      <Box sx={{ px: 2, py: 2 }}>
        <FormControl size="small" fullWidth>
          <InputLabel id="mobile-language-select-label">{t("preferences.language")}</InputLabel>
          <Select
            labelId="mobile-language-select-label"
            label={t("preferences.language")}
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
          >
            {supportedLanguageOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Drawer>
  );
}

function AuthSyncEffect() {
  const { isMergeOpen, mergeEntries, setMergeEntries, onMergeCommit, onMergeCancel } =
    useAuthSync();
  return (
    <TeamMergeDialog
      open={isMergeOpen}
      entries={mergeEntries}
      setEntriesAction={setMergeEntries}
      onCommitAction={onMergeCommit}
      onCancelAction={onMergeCancel}
    />
  );
}

export function AppLayout({
  children,
}: Readonly<{
  readonly children: ReactNode;
}>) {
  const [mode, setMode] = useState<PaletteMode>("light");
  const [language, setLanguage] = useState<string>(defaultLanguage);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const palette = useMemo(() => getAppPalette(mode), [mode]);

  useEffect(() => {
    const storedLanguage =
      window.localStorage.getItem(STORAGE_KEYS.language) ??
      i18n.resolvedLanguage ??
      defaultLanguage;
    const normalizedLanguage = supportedLanguageOptions.some(
      (option) => option.value === storedLanguage,
    )
      ? storedLanguage
      : defaultLanguage;
    setLanguage(normalizedLanguage);
    void i18n.changeLanguage(normalizedLanguage);

    const storedMode = window.localStorage.getItem(STORAGE_KEYS.mode);
    if (storedMode === "dark" || storedMode === "light") {
      setMode(storedMode);
      return;
    }

    setMode(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.language, language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.mode, mode);
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  useEffect(() => {
    const handleLanguageChanged = (nextLanguage: string) => {
      if (supportedLanguageOptions.some((option) => option.value === nextLanguage)) {
        setLanguage(nextLanguage);
      }
    };

    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  const handleLanguageChange = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    void i18n.changeLanguage(nextLanguage);
  };

  const handleToggleMode = () => {
    setMode((currentMode) => (currentMode === "dark" ? "light" : "dark"));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSyncEffect />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            overflow: "hidden",
            width: "100%",
            bgcolor: palette.canvas,
          }}
        >
          <ResponsiveAppBar
            language={language}
            mode={mode}
            onLanguageChange={handleLanguageChange}
            onToggleMode={handleToggleMode}
            onOpenNav={() => setMobileNavOpen(true)}
          />
          <MobileNavigation
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            language={language}
            onLanguageChange={handleLanguageChange}
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: `${SIDE_MENU_WIDTH}px minmax(0, 1fr)`,
              },
              flexGrow: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                display: { xs: "none", md: "flex" },
                flexDirection: "row",
                borderRight: "1px solid",
                borderColor: palette.edge,
                bgcolor: palette.surface,
                overflow: "hidden",
              }}
            >
              <Box sx={{ width: SIDE_MENU_WIDTH }}>
                <SideMenuContent />
              </Box>
            </Paper>
            <Box
              component="main"
              sx={{
                minHeight: "100vh",
                minWidth: "100%",
                margin: "0 auto",
                overflowY: "auto",
              }}
            >
              {children}
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
