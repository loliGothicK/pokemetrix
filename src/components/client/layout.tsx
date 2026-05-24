"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import type { ReactNode, MouseEvent } from "react";
import { useState } from "react";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import MenuList from "@mui/material/MenuList";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListSubheader from "@mui/material/ListSubheader";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import GroupWorkRoundedIcon from "@mui/icons-material/GroupWorkRounded";
import SportsMmaRoundedIcon from "@mui/icons-material/SportsMmaRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import FlashOnRoundedIcon from "@mui/icons-material/FlashOnRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import CatchingPokemonRoundedIcon from "@mui/icons-material/CatchingPokemonRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";

const SIDE_MENU_WIDTH = 320;
const sideMenuGroups = [
  {
    title: "Teambuilder",
    items: [
      { label: "Create Team", icon: <BuildRoundedIcon fontSize="small" /> },
      { label: "Draft Assistant", icon: <PsychologyRoundedIcon fontSize="small" /> },
      { label: "Core Finder", icon: <GroupWorkRoundedIcon fontSize="small" /> },
    ],
  },
  {
    title: "Battle",
    items: [
      { label: "Battle Record", icon: <SportsMmaRoundedIcon fontSize="small" /> },
      { label: "Matchup Planner", icon: <ShieldRoundedIcon fontSize="small" /> },
      { label: "Damage Calc", icon: <FlashOnRoundedIcon fontSize="small" /> },
    ],
  },
  {
    title: "Statistics",
    items: [
      { label: "Usage Trends", icon: <QueryStatsRoundedIcon fontSize="small" /> },
      { label: "Meta Tables", icon: <TableChartRoundedIcon fontSize="small" /> },
      { label: "Winrate Insights", icon: <InsightsRoundedIcon fontSize="small" /> },
    ],
  },
];

export default function SideMenu() {
  return (
    <Paper
      sx={{
        width: SIDE_MENU_WIDTH,
        maxWidth: "100%",
        borderRadius: 0,
        bgcolor: "rgba(255,255,255,0.72)",
      }}
    >
      <MenuList
        subheader={<li />}
        sx={{
          px: 2,
          py: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {sideMenuGroups.map((group, index) => (
          <Box key={group.title} sx={{ listStyle: "none" }}>
            <ListSubheader
              disableGutters
              sx={{
                mb: 1,
                bgcolor: "transparent",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "text.secondary",
                lineHeight: 1.2,
              }}
            >
              {group.title}
            </ListSubheader>
            {group.items.map((item) => (
              <MenuItem
                key={item.label}
                sx={{
                  borderRadius: 3,
                  minHeight: 44,
                  mb: 0.5,
                  "&:hover": {
                    bgcolor: "rgba(21,101,192,0.08)",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "primary.main" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </MenuItem>
            ))}
            {index < sideMenuGroups.length - 1 ? <Divider sx={{ mt: 1.25 }} /> : null}
          </Box>
        ))}
      </MenuList>
    </Paper>
  );
}

const pages = ["Products", "Pricing", "Blog"];
const settings = ["Profile", "Account", "Dashboard", "Logout"];

function ResponsiveAppBar() {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar
      color="transparent"
      elevation={0}
      position="sticky"
      sx={{
        top: 0,
        borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
        bgcolor: "rgba(243, 246, 251, 0.86)",
        backdropFilter: "blur(18px)",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: 72,
          px: { xs: 2, md: 3 },
          gap: 2,
        }}
      >
        <Box sx={{ flexGrow: { xs: 1, md: 0 }, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 40,
              height: 40,
              borderRadius: 3,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              boxShadow: "0 14px 30px rgba(21,101,192,0.24)",
            }}
          >
            <CatchingPokemonRoundedIcon fontSize="small" />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "primary.main" }}
            >
              POKEMETRIX
            </Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: "text.primary" }}>
              Analytics Console
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" }, justifyContent: "flex-end" }}>
          <IconButton
            size="large"
            aria-label="open navigation"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleOpenNavMenu}
            color="primary"
            sx={{
              border: "1px solid rgba(21,101,192,0.14)",
              bgcolor: "rgba(255,255,255,0.7)",
            }}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorElNav}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            open={Boolean(anchorElNav)}
            onClose={handleCloseNavMenu}
            sx={{ display: { xs: "block", md: "none" } }}
          >
            {pages.map((page) => (
              <MenuItem key={page} onClick={handleCloseNavMenu}>
                <Typography sx={{ textAlign: "center" }}>{page}</Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>

        <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, gap: 1, ml: 2 }}>
          {pages.map((page) => (
            <Button
              key={page}
              onClick={handleCloseNavMenu}
              sx={{
                color: "text.secondary",
                display: "block",
                minWidth: 0,
                px: 1.75,
                "&:hover": {
                  bgcolor: "rgba(21,101,192,0.08)",
                  color: "primary.main",
                },
              }}
            >
              {page}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1.25 }}>
          <Chip
            color="secondary"
            label="Live sync"
            size="small"
            sx={{
              borderRadius: 999,
              bgcolor: "rgba(0,137,123,0.12)",
              color: "secondary.dark",
              fontWeight: 700,
            }}
          />
          <IconButton
            color="primary"
            sx={{
              border: "1px solid rgba(21,101,192,0.14)",
              bgcolor: "rgba(255,255,255,0.72)",
            }}
          >
            <NotificationsNoneRoundedIcon fontSize="small" />
          </IconButton>
          <Tooltip title="Open settings">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0.25 }}>
              <Avatar
                alt="Remy Sharp"
                src="/static/images/avatar/2.jpg"
                sx={{ width: 38, height: 38, border: "2px solid rgba(21,101,192,0.18)" }}
              />
            </IconButton>
          </Tooltip>
          <Menu
            sx={{ mt: "45px" }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            {settings.map((setting) => (
              <MenuItem key={setting} onClick={handleCloseUserMenu}>
                <Typography sx={{ textAlign: "center" }}>{setting}</Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <ResponsiveAppBar />
        <Box
          sx={{
            flexGrow: 1,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: `${SIDE_MENU_WIDTH}px minmax(0, 1fr)`,
            },
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              display: { xs: "none", md: "flex" },
              flexDirection: "row",
              borderRight: "1px solid rgba(0,0,0,0.12)",
              overflow: "hidden",
            }}
          >
            <SideMenu />
          </Paper>
          {/* メインコンテンツエリア */}
          <Box
            component="main"
            sx={{
              minWidth: 0,
              overflowY: "auto",
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
