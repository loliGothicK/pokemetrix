"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Season } from "@/store/battle-record/battleRecord";
import type { WidgetType } from "@/store/dashboard/dashboard";
import { widgetTypeLabelKey } from "./WidgetCard";

const WIDGET_TYPES: readonly WidgetType[] = [
  "winRateSummary",
  "winRateTrend",
  "orderSplit",
  "topOpponents",
  "recentRecords",
  "ratingTrend",
  "note",
];

export function AddWidgetDialog({
  open,
  seasons,
  onClose,
  onAdd,
}: {
  readonly open: boolean;
  readonly seasons: readonly Season[];
  readonly onClose: () => void;
  readonly onAdd: (type: WidgetType, seasonId: string | null) => void;
}) {
  const { t } = useTranslation();
  const [type, setType] = useState<WidgetType>("winRateSummary");
  const [seasonId, setSeasonId] = useState<string>("");

  const handleAdd = () => {
    onAdd(type, seasonId || null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("dashboard.addWidget")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl size="small" fullWidth>
            <InputLabel id="widget-type-label">{t("dashboard.widget.typeLabel")}</InputLabel>
            <Select
              labelId="widget-type-label"
              label={t("dashboard.widget.typeLabel")}
              value={type}
              onChange={(e) => setType(e.target.value as WidgetType)}
            >
              {WIDGET_TYPES.map((widgetType) => (
                <MenuItem key={widgetType} value={widgetType}>
                  {t(widgetTypeLabelKey(widgetType))}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {type !== "note" && (
            <FormControl size="small" fullWidth>
              <InputLabel id="widget-season-label">{t("battleRecord.season.label")}</InputLabel>
              <Select
                labelId="widget-season-label"
                label={t("battleRecord.season.label")}
                value={seasonId}
                onChange={(e) => setSeasonId(e.target.value)}
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
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button variant="contained" onClick={handleAdd}>
          {t("dashboard.addWidget")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
