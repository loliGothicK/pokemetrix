"use client";

import GoogleIcon from "@mui/icons-material/Google";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isAuthenticatedAtom } from "@/store/auth";
import {useTranslation} from "react-i18next";

export function AuthButton() {
  const { t } = useTranslation();
  const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [user, setUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const supabase = createClient();

  // 初期セッション確認 + 認証状態の購読
  useEffect(() => {
    // 現在のユーザーを取得
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsAuthenticated(!!user);
    });

    // 認証状態変化を購読
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setIsAuthenticated(!!nextUser);
    });

    return () => subscription.unsubscribe();
  }, [supabase, setIsAuthenticated]);

  const handleGoogleLogin = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setAnchorEl(null);
  }, [supabase]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setAnchorEl(null);
  }, [supabase]);

  // ── ログイン済み ──────────────────────────
  if (user) {
    return (
      <>
        <Tooltip title={user.email ?? t("auth.account")}>
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            size="small"
            aria-label="account menu"
            aria-controls="account-menu"
            aria-haspopup="true"
            aria-expanded={Boolean(anchorEl)}
          >
            <Avatar
              src={user.user_metadata?.avatar_url as string | undefined}
              sx={{ width: 32, height: 32, fontSize: 14 }}
            >
              {(user.email?.[0] ?? "U").toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          id="account-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          slotProps={{ paper: { sx: { minWidth: 200, borderRadius: 2 } } }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {(user.user_metadata?.full_name as string | undefined) ?? t("auth.user")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutRoundedIcon fontSize="small" />
            </ListItemIcon>
            {t("auth.logout")}
          </MenuItem>
        </Menu>
      </>
    );
  }

  // ── 未ログイン ────────────────────────────
  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<PersonRoundedIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="login menu"
        aria-controls="login-menu"
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl)}
        sx={{ borderRadius: 2 }}
      >
        {t("auth.login")}
      </Button>

      <Menu
        id="login-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { minWidth: 200, borderRadius: 2 } } }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleGoogleLogin}>
          <ListItemIcon>
            <GoogleIcon fontSize="small" />
          </ListItemIcon>
          {t("auth.loginWithGoogle")}
        </MenuItem>
      </Menu>
    </>
  );
}
