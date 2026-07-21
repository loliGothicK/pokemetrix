"use client";

import { useState } from "react";
import { Button, CircularProgress, Snackbar, Alert, Tooltip, Box, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckIcon from "@mui/icons-material/Check";
import { useAtom, useAtomValue } from "jotai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { localTeamsAtom, Team } from "@/store/team/team";
import { isAuthenticatedAtom } from "@/store/auth";
import { saveTeamsToServer } from "@services/teams";
import { teamSchema } from "@/lib/validator/team";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import { formatTeamValidationIssues } from "@/lib/validator/format-issues";

export function CloudSaveButton() {
  const { t } = useTranslation();
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [localTeams, setLocalTeams] = useAtom(localTeamsAtom);
  const [activeTeam] = useActiveTeam();
  const queryClient = useQueryClient();

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<"success" | "error">("success");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const serverTeams = queryClient.getQueryData<readonly Team[]>(["teams"]) ?? [];

      const mergedTeams = [
        ...serverTeams.map((st) => localTeams.find((lt) => lt.id === st.id) ?? st),
        ...localTeams.filter((lt) => !serverTeams.some((st) => st.id === lt.id)),
      ];

      const validTeams = mergedTeams.filter((t) => teamSchema.safeParse(t).success);
      await saveTeamsToServer(validTeams);
      return validTeams;
    },
    onSuccess: async (validTeams) => {
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
      setLocalTeams((prev) => prev.filter((t) => !validTeams.some((vt) => vt.id === t.id)));

      setSnackMessage(t("teamBuilder.saveSuccess") || "クラウドに保存しました");
      setSnackSeverity("success");
      setSnackOpen(true);
    },
    onError: (error) => {
      setSnackMessage(error.message);
      setSnackSeverity("error");
      setSnackOpen(true);
    },
  });

  if (!isAuthenticated || !activeTeam) return null;

  const hasUnsavedChanges = localTeams.some((t) => t.id === activeTeam.id);
  const parseResult = teamSchema.safeParse(activeTeam);
  const isDraft = !parseResult.success;
  const draftReasons = formatTeamValidationIssues(parseResult, t, activeTeam.members);

  const isLoading = saveMutation.isPending;
  const isSuccess = saveMutation.isSuccess && !hasUnsavedChanges;

  const button = (
    <Button
      variant={hasUnsavedChanges ? "contained" : "outlined"}
      disableElevation
      color={hasUnsavedChanges ? (isDraft ? "warning" : "primary") : "inherit"}
      disabled={isLoading || !hasUnsavedChanges || isDraft}
      startIcon={
        isLoading ? (
          <CircularProgress size={16} color="inherit" />
        ) : isSuccess ? (
          <CheckIcon />
        ) : (
          <CloudUploadIcon />
        )
      }
      onClick={() => saveMutation.mutate()}
      sx={{ transition: "all 0.2s", minWidth: 140 }}
    >
      {isLoading
        ? (t("teamBuilder.saving") || "Saving...")
        : isSuccess
          ? (t("teamBuilder.saved") || "Saved to Cloud")
          : isDraft
            ? (t("teamBuilder.draft") || "Draft")
            : (t("teamBuilder.saveToCloud") || "Save to Cloud")}
    </Button>
  );

  return (
    <>
      {isDraft && draftReasons.length > 0 ? (
        <Tooltip
          arrow
          title={
            <Box sx={{ p: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                {t("teamBuilder.draftReasonTitle") || "このチームを保存できない理由"}
              </Typography>
              {draftReasons.map((reason, i) => (
                <Typography key={i} variant="caption" sx={{ display: "block" }}>
                  • {reason}
                </Typography>
              ))}
            </Box>
          }
        >
          {/* disabled な Button は ref を受け取れないため span でラップ */}
          <span>{button}</span>
        </Tooltip>
      ) : (
        button
      )}

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
