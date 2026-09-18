"use client";

import { useState, type SyntheticEvent } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/nextjs";
import { withSpan } from "@/lib/otel";
import { useBugReport } from "./BugReportContext";

export type BugReportCategory = "ui" | "calculation" | "error" | "feature" | "other";

type BugReportDialogProps = {
  readonly open?: boolean;
  readonly onClose?: () => void;
};

export function BugReportDialog({ open: propOpen, onClose: propOnClose }: BugReportDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const context = useBugReport();

  const isOpen = propOpen !== undefined ? propOpen : context.isBugReportOpen;

  const [category, setCategory] = useState<BugReportCategory>("ui");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleClose = () => {
    setMessage("");
    setErrorMessage(null);
    setSubmitSuccess(false);
    setIsSubmitting(false);
    if (propOnClose) {
      propOnClose();
    } else {
      context.closeBugReport();
    }
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await withSpan("ui.feedback.submit", async (span) => {
        const url = typeof window !== "undefined" ? window.location.href : "";
        const path = typeof window !== "undefined" ? window.location.pathname : "";

        span?.setAttribute("feedback.category", category);
        span?.setAttribute("feedback.url", url);

        const eventId = Sentry.captureFeedback(
          {
            message: `[${category.toUpperCase()}] ${message.trim()}`,
            email: email.trim() || undefined,
            url,
            source: "layout-dialog",
            tags: {
              category,
              path,
              source: "bug-report-dialog",
            },
          },
          {
            includeReplay: true,
          },
        );

        if (!eventId) {
          span?.setAttribute("error", true);
          throw new Error("Failed to capture feedback event");
        }
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          category,
          url: currentUrl,
        },
      });
      setErrorMessage(t("feedback.errorMessage"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={isSubmitting ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            bgcolor: "background.paper",
            backgroundImage: "none",
            p: { xs: 0.5, sm: 1 },
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
            }}
          >
            <BugReportRoundedIcon fontSize="small" />
          </Box>
          <Typography variant="h6" component="span" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
            {t("feedback.title")}
          </Typography>
        </Stack>
        <IconButton
          aria-label={t("feedback.close")}
          onClick={handleClose}
          disabled={isSubmitting}
          size="small"
          sx={{ color: "text.secondary" }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {submitSuccess ? (
        <DialogContent sx={{ px: 3, py: 4 }}>
          <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center", my: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: "success.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircleRoundedIcon sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("feedback.successTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
              {t("feedback.successMessage")}
            </Typography>
          </Stack>
        </DialogContent>
      ) : (
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogContent
            sx={{ px: 3, py: 1.5, display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("feedback.description")}
            </Typography>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            {/* カテゴリ選択 */}
            <FormControl size="small" fullWidth>
              <InputLabel id="bug-report-category-label">{t("feedback.category.label")}</InputLabel>
              <Select
                labelId="bug-report-category-label"
                label={t("feedback.category.label")}
                value={category}
                onChange={(e) => setCategory(e.target.value as BugReportCategory)}
                disabled={isSubmitting}
              >
                <MenuItem value="ui">{t("feedback.category.ui")}</MenuItem>
                <MenuItem value="calculation">{t("feedback.category.calculation")}</MenuItem>
                <MenuItem value="error">{t("feedback.category.error")}</MenuItem>
                <MenuItem value="feature">{t("feedback.category.feature")}</MenuItem>
                <MenuItem value="other">{t("feedback.category.other")}</MenuItem>
              </Select>
            </FormControl>

            {/* 本文 */}
            <TextField
              required
              fullWidth
              multiline
              rows={4}
              label={t("feedback.messageLabel")}
              placeholder={t("feedback.messagePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
              variant="outlined"
              size="small"
            />

            {/* メールアドレス（任意） */}
            <TextField
              fullWidth
              type="email"
              label={t("feedback.emailLabel")}
              placeholder={t("feedback.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              variant="outlined"
              size="small"
            />

            {/* URL表示 */}
            {currentUrl && (
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.text.primary, 0.04),
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", fontWeight: 600 }}
                >
                  {t("feedback.urlLabel")}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    wordBreak: "break-all",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                  }}
                >
                  {currentUrl}
                </Typography>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
            <Button onClick={handleClose} disabled={isSubmitting} color="inherit">
              {t("feedback.cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!message.trim() || isSubmitting}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SendRoundedIcon fontSize="small" />
                )
              }
              sx={{ minWidth: 100 }}
            >
              {isSubmitting ? t("feedback.sending") : t("feedback.send")}
            </Button>
          </DialogActions>
        </Box>
      )}
    </Dialog>
  );
}
