"use client";

import { alpha, Box, Button, Chip, Grid, Snackbar, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useState, useCallback } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import BarChartIcon from "@mui/icons-material/BarChart";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { PokemonBuildCard } from "@/components/client/share/PokemonBuildCard";
import { SurfaceCard } from "@/components/common/SurfaceCard";
import type { SharedTeamSnapshot } from "@/lib/db/schema";
import { useSetAtom } from "jotai";
import { localTeamsAtom, activeTeamIdAtom } from "@/store/team/team";
import { ulid } from "ulid";
import { useRouter } from "next/navigation";
import { rounded } from "@/utils/styles";

// ── Props ────────────────────────────────────────────────────────────────────

export interface PartySharePageProps {
  readonly shareId: string;
  readonly snapshot: SharedTeamSnapshot;
  readonly createdAt: string;
}

// ── 空スロットのプレースホルダー ──────────────────────────────────────────────

function EmptySlotCard() {
  const theme = useTheme();
  return (
    <SurfaceCard
      sx={{
        borderStyle: "dashed",
        borderColor: alpha(theme.palette.divider, 0.5),
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
    </SurfaceCard>
  );
}

// ── メインコンポーネント ──────────────────────────────────────────────────────
export function PartySharePage({ shareId, snapshot, createdAt }: PartySharePageProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const setLocalTeams = useSetAtom(localTeamsAtom);
  const setActiveTeamId = useSetAtom(activeTeamIdAtom);

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

  // スナップショットを新しいチームとして localTeams に追加し、チームビルダーへ遷移
  const handleOpenInBuilder = useCallback(() => {
    const newId = ulid();
    setLocalTeams((prev) => [
      ...prev,
      {
        id: newId,
        name: snapshot.teamName,
        members: snapshot.members,
      },
    ]);
    setActiveTeamId(newId);
    router.push("/team-builder");
  }, [snapshot, setLocalTeams, setActiveTeamId, router]);

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
          borderColor: theme.palette.divider,
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
            alignItems: { xs: "flex-start", sm: "center" },
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ alignItems: "center", flexWrap: "wrap" }}
          >
            <Typography variant="caption" color="text.secondary">
              {t("share.createdAt", { date: formattedDate })}
            </Typography>
            {snapshot.showStats && (
              <Chip
                label={t("share.showStatsLabel")}
                size="small"
                icon={<BarChartIcon sx={{ fontSize: "0.85rem !important" }} />}
                sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600 }}
              />
            )}
          </Stack>

          {/* ボタン群 */}
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button
              variant="outlined"
              size="small"
              color={copied ? "success" : "primary"}
              startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
              onClick={handleCopy}
              disableElevation
              sx={{
                  fontSize: "0.75rem", transition: "all 0.2s",
                  ...rounded(2)
            }}
            >
              {copied ? t("share.linkCopied") : t("share.copyLink")}
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<EditNoteIcon />}
              onClick={handleOpenInBuilder}
              disableElevation
              sx={{
                  fontSize: "0.75rem",
                  ...rounded(2)
            }}
            >
              {t("share.openInBuilder")}
            </Button>
          </Stack>
        </Stack>
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
                <PokemonBuildCard pokemon={member} showStats={snapshot.showStats} />
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
