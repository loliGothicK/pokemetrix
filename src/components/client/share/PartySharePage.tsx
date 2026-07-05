"use client";

import {
  alpha,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useState, useCallback } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import { getAppPalette } from "@/theme/palette";
import { PokemonBuildCard } from "@/components/client/share/PokemonBuildCard";
import type { SharedTeamSnapshot } from "@/lib/db/schema";

// ── Props ────────────────────────────────────────────────────────────────────

export interface PartySharePageProps {
  shareId: string;
  snapshot: SharedTeamSnapshot;
  createdAt: string;
}

// ── 空スロットのプレースホルダー ──────────────────────────────────────────────

function EmptySlotCard() {
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: palette.surface,
        border: "1px dashed",
        borderColor: alpha(palette.edge, 0.5),
        borderRadius: 3,
        height: "100%",
        minHeight: 260,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: alpha(theme.palette.text.secondary, 0.35), fontStyle: "italic" }}
      >
        —
      </Typography>
    </Paper>
  );
}

// ── ローディングスケルトン ────────────────────────────────────────────────────

export function PartySharePageSkeleton() {
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 } }}>
      <Skeleton variant="text" width={240} height={48} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={120} height={24} sx={{ mb: 3 }} />
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid component="div" size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
            <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3 }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// ── エラー表示 ────────────────────────────────────────────────────────────────

export function PartySharePageError({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        maxWidth: 480,
        mx: "auto",
        px: 3,
        py: 10,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <ErrorOutlinedIcon sx={{ fontSize: 64, color: "text.disabled", opacity: 0.5 }} />
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {t("share.notFound")}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

// ── メインコンポーネント ──────────────────────────────────────────────────────

export function PartySharePage({ shareId, snapshot, createdAt }: PartySharePageProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);

  const [copied, setCopied] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${shareId}`
      : `/share/${shareId}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setSnackOpen(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API が使えない環境（古いブラウザ等）
    }
  }, [shareUrl]);

  const nonNullCount = snapshot.members.filter(Boolean).length;

  // 日付フォーマット（ロケール対応）
  const formattedDate = new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 5 },
      }}
    >
      {/* ── ヘッダー ─────────────────────────────────────────────── */}
      <Box
        sx={{
          mb: { xs: 3, sm: 4 },
          pb: 2,
          borderBottom: "1px solid",
          borderColor: palette.edge,
        }}
      >
        {/* チーム名 */}
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "1.5rem", sm: "2rem", md: "2.25rem" },
            letterSpacing: -0.5,
            mb: 1,
            lineHeight: 1.15,
          }}
        >
          {snapshot.teamName}
        </Typography>

        {/* メタ情報 + コピーボタン */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1.5, sm: 2 }}
          sx={{
            alignItems: { xs: "flex-start", sm: "center" }
          }}
        >
          <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Chip
              label={t("share.memberCount", { count: nonNullCount })}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontSize: "0.7rem",
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {t("share.createdAt", { date: formattedDate })}
            </Typography>
          </Stack>

          {/* リンクコピーボタン */}
          <Button
            variant={copied ? "contained" : "outlined"}
            size="small"
            color={copied ? "success" : "primary"}
            startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
            onClick={handleCopy}
            disableElevation
            sx={{
              borderRadius: 2,
              fontSize: "0.75rem",
              px: 2,
              minWidth: { xs: "auto", sm: 160 },
              transition: "all 0.2s",
            }}
          >
            {copied ? t("share.linkCopied") : t("share.copyLink")}
          </Button>
        </Stack>

        {/* URLプレビュー */}
        <Box
          sx={{
            mt: 1.5,
            px: 1.5,
            py: 0.75,
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.action.hover, 0.5),
            border: "1px solid",
            borderColor: palette.edge,
            display: "inline-flex",
            alignItems: "center",
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontFamily: "monospace",
              color: "text.secondary",
              fontSize: "0.7rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {shareUrl}
          </Typography>
        </Box>
      </Box>

      {/* ── パーティグリッド ─────────────────────────────────────── */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        {snapshot.members.map((member, index) => (
          <Grid
            component="div"
            size={{ xs: 12, sm: 6, lg: 4 }}
            key={index}
            sx={{ display: "flex" }}
          >
            {member ? (
              <Box sx={{ width: "100%" }}>
                <PokemonBuildCard pokemon={member} />
              </Box>
            ) : (
              <Box sx={{ width: "100%", minHeight: 260 }}>
                <EmptySlotCard />
              </Box>
            )}
          </Grid>
        ))}
      </Grid>

      {/* コピー完了スナックバー */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}
        message={t("share.linkCopied")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
