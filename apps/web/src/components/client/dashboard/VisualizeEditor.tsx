"use client";

import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
  alpha,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { WidgetRenderer } from "./WidgetRenderer";
import type { DashboardWidget } from "@/store/dashboard/dashboard";
import { SqlEditor } from "./SqlEditor";

function VisualizeOptionsPanel({
  widget,
  onChange,
}: {
  readonly widget: DashboardWidget;
  readonly onChange: (updates: Partial<DashboardWidget>) => void;
}) {
  const { t } = useTranslation();

  const handleVisChange = (newVis: string) => {
    onChange({
      visualization: newVis as any,
      query: widget.query ?? "SELECT * FROM ? LIMIT 10",
    });
  };

  const handleOptionChange = (key: string, value: unknown) => {
    onChange({
      options: {
        ...(widget.options ?? {}),
        [key]: value,
      },
    });
  };

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          {t("dashboard.visualize.visualizationType", "Visualization Type")}
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
        </Select>
      </Box>

      <Divider />

      {/* Type specific options can go here */}
      <Box>
        <Typography variant="body2" color="text.secondary">
          Options for {widget.visualization ?? widget.templateId}...
        </Typography>
        {/* Placeholder for future options like column mapping, min/max for gauge, etc. */}
      </Box>
    </Stack>
  );
}

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
            t(`dashboard.widget.type.${widget.templateId ?? ""}`) ||
            t("dashboard.visualize.title")}
        </Typography>
        <Button startIcon={<CheckRoundedIcon />} onClick={onClose} variant="contained" size="small">
          {t("common.done")}
        </Button>
      </Toolbar>

      <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        {/* Left: Preview & Query */}
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
          {/* Top Half: Preview */}
          <Box
            sx={{
              flex: 1,
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
                  height: 300,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  p: 3,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  {widget.title || t(`dashboard.widget.type.${widget.templateId}`)}
                </Typography>
                <Box sx={{ height: "calc(100% - 32px)", overflow: "hidden" }}>
                  <WidgetRenderer widget={widget} editing={false} variableValues={variableValues} />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Bottom Half: Query Tab */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
                <Tab label="Query (SQL)" />
              </Tabs>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: "hidden", position: "relative" }}>
              {tabIndex === 0 && (
                <SqlEditor
                  value={widget.query ?? "SELECT * FROM ? LIMIT 10"}
                  onChange={(val) => onChange({ query: val })}
                />
              )}
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
            <VisualizeOptionsPanel widget={widget} onChange={onChange} />
          </Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Button variant="contained" fullWidth onClick={onClose}>
              {t("dashboard.visualize.applyAndClose")}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
