"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { ulid } from "ulid";
import type { DashboardVariable } from "@/store/dashboard/dashboard";
import type { Season } from "@/store/battle-record/battleRecord";

interface VariableEditDialogProps {
  readonly open: boolean;
  readonly variable: DashboardVariable | null; // null = 新規追加
  readonly seasons: readonly Season[];
  readonly onClose: () => void;
  readonly onSave: (variable: DashboardVariable) => void;
  readonly onDelete?: (variableId: string) => void;
}

export function VariableEditDialog({
  open,
  variable,
  seasons,
  onClose,
  onSave,
  onDelete,
}: VariableEditDialogProps) {
  const { t } = useTranslation();
  const isNew = variable === null;

  const [name, setName] = useState(variable?.name ?? "");
  const [label, setLabel] = useState(variable?.label ?? "");
  const [defaultSeasonId, setDefaultSeasonId] = useState<string>(variable?.defaultSeasonId ?? "");

  // ダイアログが開くたびに状態をリセット
  useEffect(() => {
    if (open) {
      setName(variable?.name ?? "");
      setLabel(variable?.label ?? "");
      setDefaultSeasonId(variable?.defaultSeasonId ?? "");
    }
  }, [open, variable]);

  const handleSave = () => {
    if (!name.trim() || !label.trim()) return;
    onSave({
      id: variable?.id ?? ulid(),
      name: name.trim(),
      label: label.trim(),
      type: "season",
      defaultSeasonId: defaultSeasonId || null,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!variable) return;
    if (window.confirm(t("dashboard.variable.deleteConfirm", { label: variable.label }))) {
      onDelete?.(variable.id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {isNew ? t("dashboard.variable.addTitle") : t("dashboard.variable.editTitle")}
          </Typography>
          {!isNew && onDelete && (
            <Tooltip title={t("common.delete")}>
              <IconButton size="small" color="error" onClick={handleDelete}>
                <DeleteRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={t("dashboard.variable.nameLabel")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            fullWidth
            helperText={t("dashboard.variable.nameHelper")}
            slotProps={{ htmlInput: { maxLength: 50 } }}
          />
          <TextField
            label={t("dashboard.variable.displayLabel")}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            size="small"
            fullWidth
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          <FormControl size="small" fullWidth>
            <InputLabel id="variable-default-season-label">
              {t("dashboard.variable.defaultSeason")}
            </InputLabel>
            <Select
              labelId="variable-default-season-label"
              label={t("dashboard.variable.defaultSeason")}
              value={defaultSeasonId}
              onChange={(e) => setDefaultSeasonId(e.target.value)}
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
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button variant="contained" onClick={handleSave} disabled={!name.trim() || !label.trim()}>
          {isNew ? t("common.add") : t("common.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
