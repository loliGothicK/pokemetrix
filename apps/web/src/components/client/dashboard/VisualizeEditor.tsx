"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  alpha,
  Snackbar,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import type { DashboardWidget } from "@/store/dashboard/dashboard";
import { WidgetRenderer } from "./WidgetRenderer";
import { SqlEditor } from "./SqlEditor";
import { PRESET_TRANSFORMERS } from "./transformers";
import { WIDGET_TEMPLATES } from "./widgetTemplates";
import { widgetTypeLabelKey } from "./WidgetCard";
import { rounded } from "@/utils/styles";
import { generateRowTypeFromSql } from "@/lib/sql/engine";

// ─────────────────────────────────────────────────────────────────────────────
// Visualization Options Panel (right pane)
// ─────────────────────────────────────────────────────────────────────────────

function VisualizeOptionsPanel({
  widget,
  onChange,
  onTemplateApplied,
}: {
  readonly widget: DashboardWidget;
  readonly onChange: (updates: Partial<DashboardWidget>) => void;
  readonly onTemplateApplied: () => void;
}) {
  const { t } = useTranslation();

  const handleVisChange = (newVis: string) => {
    onChange({
      visualization: newVis as any,
      query: widget.query ?? "SELECT * FROM records LIMIT 10",
    });
  };

  return (
    <Stack spacing={3}>
      {/* Visualization type */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          {t("dashboard.visualize.visualizationType")}
        </Typography>
        <Select
          fullWidth
          size="small"
          value={widget.visualization ?? "table"}
          onChange={(e) => handleVisChange(e.target.value)}
        >
          <MenuItem value="table">Table</MenuItem>
          <MenuItem value="stat">Stat</MenuItem>
          <MenuItem value="gauge">Gauge</MenuItem>
          <MenuItem value="histogram">Histogram</MenuItem>
          <MenuItem value="heatmap">Heatmap</MenuItem>
        </Select>
      </Box>

      <Divider />

      {/* Quick templates */}
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
          <BoltRoundedIcon sx={{ fontSize: 16, color: "primary.main" }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t("dashboard.visualize.templatePicker")}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
          {t("dashboard.visualize.templatePickerDesc")}
        </Typography>
        <Stack spacing={1}>
          {WIDGET_TEMPLATES.map((tpl) => {
            const isActive =
              widget.query?.trim() === tpl.query.trim() &&
              (widget.transformer ?? "none") === tpl.transformer &&
              widget.visualization === tpl.visualization;

            return (
              <Paper
                key={tpl.id}
                variant="outlined"
                sx={{
                  cursor: "pointer",
                  transition: "all 0.15s",
                  borderColor: isActive ? "primary.main" : "divider",
                  bgcolor: isActive
                    ? (theme) => alpha(theme.palette.primary.main, 0.08)
                    : "transparent",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                  },
                  ...rounded(2),
                }}
                onClick={() => {
                  onChange({
                    query: tpl.query,
                    transformer: tpl.transformer,
                    visualization: tpl.visualization,
                  });
                  onTemplateApplied();
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t(tpl.labelKey)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t(tpl.descriptionKey)}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <Chip label={tpl.visualization} size="small" variant="outlined" />
                    {tpl.transformer !== "none" && (
                      <Chip
                        label={t(`dashboard.transformer.${tpl.transformer}`)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Transformer Panel (left pane, Transformer tab)
// ─────────────────────────────────────────────────────────────────────────────

function TransformerPanel({
  widget,
  onChange,
}: {
  readonly widget: DashboardWidget;
  readonly onChange: (updates: Partial<DashboardWidget>) => void;
}) {
  const { t } = useTranslation();
  const isCustom = widget.transformer === "custom";

  const rowTypeDeclaration = useMemo(() => {
    return generateRowTypeFromSql(widget.query || "SELECT * FROM records LIMIT 10");
  }, [widget.query]);

  const handleModeChange = (mode: "preset" | "custom") => {
    if (mode === "custom") {
      onChange({
        transformer: "custom",
        transformerCode:
          widget.transformerCode ??
          `export default function transform(rows: Rows) {
  return rows;
}`,
      });
    } else {
      onChange({ transformer: "none", transformerCode: undefined });
    }
  };

  return (
    <Stack
      spacing={2.5}
      sx={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      {/* Mode switcher */}
      <Box sx={{ flexShrink: 0 }}>
        <RadioGroup
          row
          value={isCustom ? "custom" : "preset"}
          onChange={(e) => handleModeChange(e.target.value as "preset" | "custom")}
        >
          <FormControlLabel
            value="preset"
            control={<Radio size="small" />}
            label={<Typography variant="body2">{t("dashboard.transformer.modePreset")}</Typography>}
          />
          <FormControlLabel
            value="custom"
            control={<Radio size="small" />}
            label={<Typography variant="body2">{t("dashboard.transformer.modeCustom")}</Typography>}
          />
        </RadioGroup>
      </Box>

      {/* Preset selector */}
      {!isCustom && (
        <Stack spacing={2} sx={{ flexShrink: 0 }}>
          <Select
            size="small"
            fullWidth
            value={widget.transformer ?? "none"}
            onChange={(e) => onChange({ transformer: e.target.value })}
          >
            {PRESET_TRANSFORMERS.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {t(p.labelKey)}
              </MenuItem>
            ))}
          </Select>
          {/* Description */}
          {(() => {
            const selected = PRESET_TRANSFORMERS.find(
              (p) => p.id === (widget.transformer ?? "none"),
            );
            return selected ? (
              <Typography variant="caption" color="text.secondary">
                {t(selected.descriptionKey)}
              </Typography>
            ) : null;
          })()}
        </Stack>
      )}

      {/* Custom JS editor */}
      {isCustom && (
        <Box
          sx={{ flexGrow: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 1 }}
        >
          <Typography variant="caption" color="text.secondary">
            {t("dashboard.transformer.customHelper")}
          </Typography>
          <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
            <SqlEditor
              language="typescript"
              rowTypeDeclaration={rowTypeDeclaration}
              value={
                widget.transformerCode ??
                `export default function transform(rows: Rows) {
  return rows;
}`
              }
              onChange={(val) => onChange({ transformerCode: val })}
            />
          </Box>
        </Box>
      )}
    </Stack>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main VisualizeEditor
// ─────────────────────────────────────────────────────────────────────────────

interface VisualizeEditorProps {
  readonly widget: DashboardWidget | null;
  readonly variableValues: Readonly<Record<string, string | null>>;
  readonly onClose: () => void;
  readonly onChange: (updates: Partial<DashboardWidget>) => void;
}

export function VisualizeEditor({
  widget,
  variableValues,
  onClose,
  onChange,
}: VisualizeEditorProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [tabIndex, setTabIndex] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  if (!widget) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.default",
      }}
    >
      {/* Toolbar */}
      <Toolbar
        disableGutters
        sx={{
          px: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          flexShrink: 0,
          gap: 2,
        }}
      >
        <IconButton onClick={onClose} aria-label={t("common.back")} size="small">
          <ArrowBackRoundedIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {widget.title ||
            (widgetTypeLabelKey(widget.templateId)
              ? t(widgetTypeLabelKey(widget.templateId) as string)
              : t("dashboard.visualize.title"))}
        </Typography>
        <Button startIcon={<CheckRoundedIcon />} onClick={onClose} variant="contained" size="small">
          {t("common.done")}
        </Button>
      </Toolbar>

      <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        {/* Left: Preview + Query/Transformer tabs */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRight: "1px solid",
            borderColor: "divider",
          }}
        >
          {/* Preview */}
          <Box
            sx={{
              flex: 2,
              display: "flex",
              flexDirection: "column",
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              borderBottom: "1px solid",
              borderColor: "divider",
              minHeight: 0,
            }}
          >
            <Box sx={{ px: 3, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                {t("dashboard.visualize.preview")}
              </Typography>
            </Box>
            <Box
              sx={{
                flexGrow: 1,
                overflow: "auto",
                p: 3,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 800,
                  height: "100%",
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  ...rounded(3),
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  {widget.title ||
                    (widgetTypeLabelKey(widget.templateId)
                      ? t(widgetTypeLabelKey(widget.templateId) as string)
                      : t("dashboard.widget.untitled", "New Widget"))}
                </Typography>
                <Box sx={{ height: "calc(100% - 32px)", overflow: "hidden" }}>
                  <WidgetRenderer widget={widget} editing={false} variableValues={variableValues} />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Query / Transformer tabs */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
              <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
                <Tab label="Query (SQL)" />
                <Tab
                  label={
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                      <span>{t("dashboard.transformer.label")}</span>
                      {widget.transformer && widget.transformer !== "none" && (
                        <Chip
                          label={
                            widget.transformer === "custom"
                              ? "JS"
                              : t(`dashboard.transformer.${widget.transformer}`)
                          }
                          size="small"
                          color="primary"
                          sx={{ height: 18, fontSize: 10 }}
                        />
                      )}
                    </Stack>
                  }
                />
              </Tabs>
            </Box>
            <Box
              sx={{
                flexGrow: 1,
                overflow: "hidden",
                position: "relative",
                p: tabIndex === 1 ? 2 : 0,
              }}
            >
              {tabIndex === 0 && (
                <SqlEditor
                  value={widget.query ?? "SELECT * FROM records LIMIT 10"}
                  onChange={(val) => onChange({ query: val })}
                />
              )}
              {tabIndex === 1 && <TransformerPanel widget={widget} onChange={onChange} />}
            </Box>
          </Box>
        </Box>

        {/* Right Pane: Options */}
        <Box
          sx={{
            width: { xs: "100%", md: 360 },
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ px: 3, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              {t("dashboard.visualize.options")}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3 }}>
            <VisualizeOptionsPanel
              widget={widget}
              onChange={onChange}
              onTemplateApplied={() => setSnackbarOpen(true)}
            />
          </Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Button variant="contained" fullWidth onClick={onClose}>
              {t("dashboard.visualize.applyAndClose")}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Template Applied Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSnackbarOpen(false)}>
          テンプレートを適用しました！
        </Alert>
      </Snackbar>
    </Box>
  );
}
