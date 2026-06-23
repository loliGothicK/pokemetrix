"use client";

import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { activeTeamIdAtom, Team } from "@/store/team/team";
import { useTeamsData } from "@/hooks/useTeamsData";
import { getAppPalette } from "@/theme/palette";

import TeamOverview from "@/components/client/team-builder/overview";
import TeamSlotDetail from "@/components/client/team-builder/slot-detail";

import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Button,
  Divider,
  Grid,
  useTheme,
  useMediaQuery,
  styled,
  Snackbar,
  Alert,
  Stack,
  Paper,
  FormControlLabel,
  Switch,
} from "@mui/material";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import AddIcon from "@mui/icons-material/Add";
import { exportPokepaste } from "@/lib/pokepaste";
import { ulid } from "ulid";
import ImportPokepasteDialog from "@/components/client/team-builder/importDialog";
import { MitamaError } from "@/errors/anyhow/error";
import { match } from "ts-pattern";
import { ParseError } from "@/errors/thiserror/thiserror";
import LinkIcon from "@mui/icons-material/Link";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const MAX_TEAM_SIZE = 6;
const drawerWidth = 240;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{ open?: boolean }>(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    height: "100%",
    overflowY: "auto",
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}
const AppBar = styled(MuiAppBar, { shouldForwardProp: (prop) => prop !== "open" })<AppBarProps>(
  ({ theme, open }) => ({
    position: "absolute",
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(["margin", "width"], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  }),
);

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

import * as React from "react";
import { alpha } from "@mui/material/styles";
import Menu, { MenuProps } from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import EditIcon from "@mui/icons-material/Edit";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import { activeTeamLintAtom } from "@/store/team/options";

const StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
    {...props}
  />
))(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color: "rgb(55, 65, 81)",
    boxShadow:
      "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    "& .MuiMenu-list": {
      padding: "4px 0",
    },
    "& .MuiMenuItem-root": {
      "& .MuiSvgIcon-root": {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
        ...theme.applyStyles("dark", {
          color: "inherit",
        }),
      },
      "&:active": {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
      },
    },
    ...theme.applyStyles("dark", {
      color: theme.palette.grey[300],
    }),
  },
}));

function ImportMenu({
  createTeamAction,
  onError,
}: {
  createTeamAction: (team: { members: Team["members"] }) => void;
  onError: (diagnostics: Diagnostics) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openPaste, setOpenPaste] = useState(false);
  const [openFromUrl, setOpenFromUrl] = useState(false);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <Button
        variant="contained"
        disableElevation
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
      >
        Import
      </Button>
      <StyledMenu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            setOpenFromUrl(true);
            handleClose();
          }}
          disableRipple
        >
          <EditIcon />
          From Pokepaste URL
        </MenuItem>
        <MenuItem
          onClick={() => {
            setOpenPaste(false);
            handleClose();
          }}
          disableRipple
        >
          <FileCopyIcon />
          From Paste
        </MenuItem>
      </StyledMenu>
      <ImportPokepasteDialog
        type={"paste"}
        open={openPaste}
        onClose={() => setOpenPaste(false)}
        onImport={(data) => createTeamAction(data)}
        onError={onError}
      />
      <ImportPokepasteDialog
        type={"url"}
        open={openFromUrl}
        onClose={() => setOpenFromUrl(false)}
        onImport={(data) => createTeamAction(data)}
        onError={onError}
      />
    </Box>
  );
}

function ExportMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [activeTeam] = useActiveTeam();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleMenuClick = (type: "clipboard" | "pokepaste") => async () => {
    if (activeTeam) {
      const paste = exportPokepaste(activeTeam);
      if (type === "clipboard") {
        await navigator.clipboard.writeText(paste);
      } else {
        // 動的にformを生成して別タブでPOST送信
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "https://pokepast.es/create";
        form.target = "_blank";

        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "paste";
        input.value = paste;

        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      }
    }
    handleClose();
  };

  return (
    <Box>
      <Button
        variant="contained"
        disableElevation
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
      >
        Export
      </Button>
      <StyledMenu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleMenuClick("clipboard")} disableRipple>
          <ContentCopyIcon />
          Copy Paste to Clipboard
        </MenuItem>
        <MenuItem onClick={handleMenuClick("pokepaste")} disableRipple>
          <LinkIcon />
          Make Pokepaste
        </MenuItem>
      </StyledMenu>
    </Box>
  );
}

export type Diagnostics =
  | {
      severity: "success" | "info" | "warning";
      message: string;
    }
  | {
      severity: "error";
      message: MitamaError[];
    };

export default function TeamBuilderPage({
  regulation: _regulation,
  activeSlot,
}: {
  regulation?: string;
  activeSlot?: number;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const palette = getAppPalette(theme.palette.mode);
  // noSsr は付けない: サーバーとクライアント初回は false（デスクトップ）で一致させ、
  // マウント後に再評価してモバイルへ切り替える。これで hydration mismatch を防ぐ。
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const hasSelection =
    typeof activeSlot === "number" &&
    Number.isInteger(activeSlot) &&
    activeSlot >= 0 &&
    activeSlot < MAX_TEAM_SIZE;
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState<Diagnostics>({
    severity: "info",
    message: "Info",
  });

  const [activeTeamId, setActiveTeamId] = useAtom(activeTeamIdAtom);
  const { teams, isLoading, updateTeams } = useTeamsData();
  const [isLintOn, setIsLintOn] = useAtom(activeTeamLintAtom);

  // モバイルではチーム選択ドロワーを既定で閉じ、コンテンツ（戻るボタン/名前）に被らないようにする
  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  if (isLoading) return <Box sx={{ p: 3 }}>{t("teamBuilder.loading")}</Box>;

  const activeTeam = teams.find((t) => t.id === activeTeamId) || null;

  const handleCreateTeam = (team: { name?: string; members: Team["members"] }) => {
    const newTeam = {
      id: ulid(),
      name: team.name || t("teamBuilder.teamLabel", { index: teams.length + 1 }),
      members: team.members,
    };
    updateTeams([...teams, newTeam]);
    setActiveTeamId(newTeam.id);
  };

  const handleCreateNewTeam = () => {
    handleCreateTeam({
      name: t("teamBuilder.teamLabel", { index: teams.length + 1 }),
      members: Array(MAX_TEAM_SIZE).fill(null),
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        // モバイルは AppLayout のスクロール内で自然に縦積みする（内側で二重に 100vh を持たない）
        flexDirection: { xs: "column", md: "row" },
        position: "relative",
        overflow: { xs: "visible", md: "hidden" },
        height: { xs: "auto", md: "100vh" },
      }}
    >
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={5000}
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity={diagnostics.severity} sx={{ whiteSpace: "pre-wrap" }}>
          {match(diagnostics)
            .with({ severity: "error" }, ({ message }) => (
              <>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                  {message.length} errors occurred：
                </Typography>

                {/* エラーの数だけコンポーネントを縦に並べる */}
                <Stack spacing={1.5}>
                  {message.map((err, index) => (
                    <Box
                      key={index}
                      sx={{ pl: 1, borderLeft: "3px solid", borderColor: "error.main" }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {err.message}
                      </Typography>

                      {/* 前述の構造化データがあるなら、エラーごとにPaperを出す */}
                      {err instanceof ParseError && (
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1,
                            mt: 0.5,
                            bgcolor: "background.default",
                            fontFamily: "monospace",
                          }}
                        >
                          {err.meta.raw}
                        </Paper>
                      )}
                    </Box>
                  ))}
                </Stack>
              </>
            ))
            .otherwise(({ message }) => (
              <Typography>{message}</Typography>
            ))}
        </Alert>
      </Snackbar>

      {/* ── デスクトップ: inner AppBar + persistent Drawer ── */}
      {!isMobile && (
        <>
          <AppBar open={drawerOpen}>
            <Toolbar>
              <IconButton
                color="inherit"
                onClick={() => setDrawerOpen(true)}
                edge="start"
                sx={[{ mr: 2 }, drawerOpen && { display: "none" }]}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                {t("teamBuilder.title")}
              </Typography>
              {activeTeam && (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <FormControlLabel
                    control={<Switch checked={isLintOn} onChange={() => setIsLintOn(!isLintOn)} />}
                    label="Lint"
                  />
                  <ImportMenu
                    createTeamAction={handleCreateTeam}
                    onError={(diagnostics) => {
                      setDiagnostics(diagnostics);
                      setSnackbarOpen(true);
                    }}
                  />
                  <ExportMenu />
                </Box>
              )}
            </Toolbar>
          </AppBar>

          <Drawer
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
                position: "absolute",
                bgcolor: palette.surface,
                borderRight: "1px solid",
                borderColor: palette.edge,
              },
            }}
            variant="persistent"
            anchor="left"
            open={drawerOpen}
          >
            <DrawerHeader>
              <IconButton onClick={() => setDrawerOpen(false)}>
                {theme.direction === "ltr" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
            </DrawerHeader>
            <Divider sx={{ borderColor: palette.edge }} />
            <Box sx={{ p: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                fullWidth
                onClick={handleCreateNewTeam}
              >
                {t("teamBuilder.createTeam")}
              </Button>
            </Box>
            <Divider sx={{ borderColor: palette.edge }} />
            <List>
              {teams.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary={t("teamBuilder.noTeamsTitle")}
                    secondary={t("teamBuilder.noTeamsDescription")}
                  />
                </ListItem>
              ) : (
                teams.map((team) => (
                  <ListItem key={team.id} disablePadding>
                    <ListItemButton
                      selected={team.id === activeTeamId}
                      onClick={() => setActiveTeamId(team.id)}
                      sx={{
                        borderRadius: 2,
                        mx: 1,
                        mb: 0.5,
                        "&.Mui-selected": { bgcolor: palette.surfaceRaised },
                      }}
                    >
                      <ListItemIcon>
                        <WorkspacesIcon />
                      </ListItemIcon>
                      <ListItemText primary={team.name} />
                    </ListItemButton>
                  </ListItem>
                ))
              )}
            </List>
          </Drawer>
        </>
      )}

      <Main
        open={isMobile ? false : drawerOpen}
        sx={isMobile ? { ml: 0, height: "auto", overflowY: "visible" } : undefined}
      >
        {/* 絶対配置 AppBar 用のスペーサー。モバイルは AppBar が静的配置なので不要 */}
        {!isMobile && <DrawerHeader />}
        {!activeTeam ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              minHeight: { xs: 240, md: "100%" },
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h5" color="text.secondary">
                {t("teamBuilder.selectTeamHint")}
              </Typography>
            </Box>
          </Box>
        ) : isMobile ? (
          // モバイル: overview と育成画面を「別ページ（URL）」として出し分ける
          hasSelection ? (
            <TeamSlotDetail slot={activeSlot!} showBackButton />
          ) : (
            <TeamOverview
              activeSlot={hasSelection ? activeSlot : undefined}
              teams={teams}
              activeTeamId={activeTeamId}
              onSelectTeam={setActiveTeamId}
              onCreateTeam={handleCreateNewTeam}
            />
          )
        ) : (
          // デスクトップ: overview（一覧）＋ 選択中スロットの育成画面をマスター/ディテールで並べる
          <Grid container spacing={3}>
            <Grid component={"div"} size={{ xs: 12, md: 3 }} sx={{ height: "100%" }}>
              <TeamOverview activeSlot={hasSelection ? activeSlot : undefined} />
            </Grid>
            <Grid component={"div"} size={{ xs: 12, md: 9 }} sx={{ height: "100%" }}>
              {hasSelection ? (
                <TeamSlotDetail slot={activeSlot!} />
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    minHeight: 240,
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    {t("teamBuilder.slotDescription")}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        )}
      </Main>
    </Box>
  );
}
