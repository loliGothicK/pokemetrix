"use client";

import { useState, useCallback } from "react";
import { Button, CircularProgress, Snackbar, Alert } from "@mui/material";
import IosShareIcon from "@mui/icons-material/IosShare";
import CheckIcon from "@mui/icons-material/Check";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useActiveTeam } from "@/hooks/useActiveTeam";

type ShareState = "idle" | "loading" | "success" | "error";

export function ShareButton() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTeam] = useActiveTeam();
  const [shareState, setShareState] = useState<ShareState>("idle");
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<"success" | "error">("success");

  const handleShare = useCallback(async () => {
    if (!activeTeam) return;
    setShareState("loading");

    const snapshot = {
      teamName: activeTeam.name,
      members: activeTeam.members,
    };

    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const { id } = (await res.json()) as { id: string };
      setShareState("success");
      setSnackMessage(t("share.shareSuccess"));
      setSnackSeverity("success");
      setSnackOpen(true);

      // 少し待ってからシェアページへ遷移
      setTimeout(() => {
        router.push(`/share/${id}`);
        setShareState("idle");
      }, 800);
    } catch {
      setShareState("error");
      setSnackMessage(t("share.shareError"));
      setSnackSeverity("error");
      setSnackOpen(true);
      setTimeout(() => setShareState("idle"), 2000);
    }
  }, [activeTeam, t, router]);

  const isLoading = shareState === "loading";
  const isSuccess = shareState === "success";

  return (
    <>
      <Button
        variant="contained"
        disableElevation
        color={isSuccess ? "success" : "primary"}
        disabled={isLoading || !activeTeam}
        startIcon={
          isLoading ? (
            <CircularProgress size={16} color="inherit" />
          ) : isSuccess ? (
            <CheckIcon />
          ) : (
            <IosShareIcon />
          )
        }
        onClick={handleShare}
        sx={{ transition: "all 0.2s", minWidth: 120 }}
      >
        {isLoading
          ? t("share.sharing")
          : isSuccess
            ? t("share.shareSuccess")
            : t("share.shareTeam")}
      </Button>

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackSeverity}
          onClose={() => setSnackOpen(false)}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
