"use client";

import {
  alpha,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import type { DashboardVariable, DashboardWidget, DataSource } from "@/store/dashboard/dashboard";
import type { Season } from "@/store/battle-record/battleRecord";
import { widgetTypeLabelKey } from "./WidgetCard";

const DRAWER_WIDTH = 400;

/** タブパネルのラッパー */
function TabPanel({
  value,
  index,
  children,
}: {
  readonly value: number;
  readonly index: number;
  readonly children: React.ReactNode;
}) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ flexGrow: 1, overflowY: "auto", p: 3 }}>
      {value === index && children}
    </Box>
  );
}

/** DataSource 設定パネル */
function DataSourcePanel({
  widget,
  seasons,
  variables,
  onChange,
}: {
  readonly widget: DashboardWidget;
  readonly seasons: readonly Season[];
  readonly variables: readonly DashboardVariable[];
  readonly onChange: (dataSource: DataSource) => void;
}) {
  const { t } = useTranslation();
  const ds = widget.dataSource;

  return (
    <Stack spacing={3}>
      {/* ソースタイプ選択 */}
      <FormControl size="small" fullWidth>
        <InputLabel id="ds-type-label">{t("dashboard.datasource.type")}</InputLabel>
        <Select
          labelId="ds-type-label"
          label={t("dashboard.datasource.type")}
          value={ds.type}
          onChange={(e) => {
            if (e.target.value === "season") {
              onChange({ type: "season", seasonId: null });
            } else {
              onChange({
                type: "variable",
                variableId: variables[0]?.id ?? "",
              });
            }
          }}
        >
          <MenuItem value="season">{t("dashboard.datasource.season")}</MenuItem>
          <MenuItem value="variable" disabled={variables.length === 0}>
            {t("dashboard.datasource.variable")}
            {variables.length === 0 && ` (${t("dashboard.datasource.noVariables")})`}
          </MenuItem>
        </Select>
      </FormControl>

      {/* シーズン直指定 */}
      {ds.type === "season" && (
        <FormControl size="small" fullWidth>
          <InputLabel id="ds-season-label" shrink>
            {t("battleRecord.season.label")}
          </InputLabel>
          <Select
            labelId="ds-season-label"
            label={t("battleRecord.season.label")}
            value={ds.seasonId ?? ""}
            onChange={(e) => onChange({ type: "season", seasonId: e.target.value || null })}
            displayEmpty
          >
            <MenuItem value="">{t("dashboard.widget.allSeasons")}</MenuItem>
            {seasons.map((season) => (
              <MenuItem key={season.id} value={season.id}>
                {season.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Variable 参照 */}
      {ds.type === "variable" && (
        <FormControl size="small" fullWidth>
          <InputLabel id="ds-var-label">{t("dashboard.datasource.variableLabel")}</InputLabel>
          <Select
            labelId="ds-var-label"
            label={t("dashboard.datasource.variableLabel")}
            value={ds.variableId}
            onChange={(e) => onChange({ type: "variable", variableId: e.target.value })}
          >
            {variables.map((v) => (
              <MenuItem key={v.id} value={v.id}>
                {v.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Stack>
  );
}

interface WidgetEditDrawerProps {
  readonly open: boolean;
  readonly widget: DashboardWidget | null;
  readonly seasons: readonly Season[];
  readonly variables: readonly DashboardVariable[];
  readonly variableValues: Readonly<Record<string, string | null>>;
  readonly onClose: () => void;
  readonly onChange: (widget: DashboardWidget) => void;
  readonly onDelete: () => void;
  readonly onVisualizeClick: () => void;
}

export function WidgetEditDrawer({
  widget,
  seasons,
  variables,
  onClose,
  onChange,
  onDelete,
  onVisualizeClick,
}: WidgetEditDrawerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [tab, setTab] = useState(0);

  if (!widget) return null;

  const handleDelete = () => {
    if (!window.confirm(t("dashboard.widget.deleteConfirm"))) return;
    onDelete();
    onClose();
  };

  return (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        borderLeft: "1px solid",
        borderColor: "divider",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Drawer ヘッダー */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          flexShrink: 0,
          gap: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {t("dashboard.widget.edit")}
        </Typography>
        <Tooltip title={t("common.delete")}>
          <IconButton
            size="small"
            onClick={handleDelete}
            sx={{
              color: "error.main",
              "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.1) },
            }}
          >
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t("common.close")}>
          <IconButton size="small" onClick={onClose}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* タブ */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{ borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}
      >
        <Tab label={t("dashboard.widget.tab.general")} id="drawer-tab-0" />
        <Tab label={t("dashboard.widget.tab.dataSource")} id="drawer-tab-1" />
        <Tab label={t("dashboard.widget.tab.visualize")} id="drawer-tab-2" />
      </Tabs>

      {/* General タブ */}
      <TabPanel value={tab} index={0}>
        <Stack spacing={3}>
          <TextField
            label={t("dashboard.widget.titleLabel")}
            value={widget.title}
            onChange={(e) => onChange({ ...widget, title: e.target.value })}
            size="small"
            fullWidth
            slotProps={{ htmlInput: { maxLength: 100 } }}
            placeholder={
              widgetTypeLabelKey(widget.templateId)
                ? t(widgetTypeLabelKey(widget.templateId) as string)
                : t("dashboard.widget.untitled")
            }
          />
        </Stack>
      </TabPanel>

      {/* DataSource タブ */}
      <TabPanel value={tab} index={1}>
        <DataSourcePanel
          widget={widget}
          seasons={seasons}
          variables={variables}
          onChange={(dataSource) => onChange({ ...widget, dataSource })}
        />
      </TabPanel>

      {/* Visualize タブ */}
      <TabPanel value={tab} index={2}>
        <Stack spacing={3}>
          <Button
            variant="outlined"
            startIcon={<OpenInFullRoundedIcon />}
            onClick={onVisualizeClick}
            fullWidth
          >
            {t("dashboard.visualize.openFullscreen")}
          </Button>
        </Stack>
      </TabPanel>

      {/* フッター */}
      <Box
        sx={{
          mt: "auto",
          p: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Button variant="contained" fullWidth onClick={onClose}>
          {t("common.done")}
        </Button>
      </Box>
    </Box>
  );
}
