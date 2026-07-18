"use client";

import {
  alpha,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import type { DashboardVariable } from "@/store/dashboard/dashboard";
import type { Season } from "@/store/battle-record/battleRecord";
import { VariableEditDialog } from "./VariableEditDialog";

interface VariableBarProps {
  readonly variables: readonly DashboardVariable[];
  readonly variableValues: Readonly<Record<string, string | null>>;
  readonly seasons: readonly Season[];
  readonly editing: boolean;
  readonly onVariableValueChange: (variableId: string, seasonId: string | null) => void;
  readonly onVariablesChange: (variables: readonly DashboardVariable[]) => void;
}

export function VariableBar({
  variables,
  variableValues,
  seasons,
  editing,
  onVariableValueChange,
  onVariablesChange,
}: VariableBarProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const [editingVariable, setEditingVariable] = useState<DashboardVariable | null | "new">(null);

  // 変数が0件 かつ 非編集モード → バーを非表示
  if (variables.length === 0 && !editing) return null;

  const handleSave = (variable: DashboardVariable) => {
    const idx = variables.findIndex((v) => v.id === variable.id);
    if (idx === -1) {
      onVariablesChange([...variables, variable]);
    } else {
      const next = variables.slice();
      next.splice(idx, 1, variable);
      onVariablesChange(next);
    }
  };

  const handleDelete = (variableId: string) => {
    onVariablesChange(variables.filter((v) => v.id !== variableId));
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
          px: { xs: 2, md: 3 },
          py: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
          minHeight: 48,
        }}
      >
        {/* 変数アイコン */}
        <TuneRoundedIcon sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }} />

        {/* 各 Variable のドロップダウン */}
        {variables.map((variable) => (
          <Stack key={variable.id} direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
            {/* 編集モードはラベルをクリッカブル Chip にする */}
            {editing ? (
              <Chip
                label={variable.label}
                size="small"
                variant="outlined"
                onClick={() => setEditingVariable(variable)}
                sx={{
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 11,
                  height: 22,
                  "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                }}
              />
            ) : (
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                {variable.label}:
              </Typography>
            )}

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel id={`var-${variable.id}-label`} shrink sx={{ fontSize: 12 }}>
                {variable.label}
              </InputLabel>
              <Select
                labelId={`var-${variable.id}-label`}
                label={variable.label}
                value={variableValues[variable.id] ?? ""}
                onChange={(e) => onVariableValueChange(variable.id, e.target.value || null)}
                displayEmpty
                sx={{
                  fontSize: 12,
                  "& .MuiSelect-select": { py: 0.5 },
                }}
              >
                <MenuItem value="">{t("dashboard.widget.allSeasons")}</MenuItem>
                {seasons.map((season) => (
                  <MenuItem key={season.id} value={season.id} sx={{ fontSize: 12 }}>
                    {season.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        ))}

        {/* 編集モードのみ: 変数追加ボタン */}
        {editing && (
          <Button
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={() => setEditingVariable("new")}
            variant="outlined"
            sx={{ fontSize: 12, py: 0.5 }}
          >
            {t("dashboard.variable.add")}
          </Button>
        )}
      </Box>

      <VariableEditDialog
        open={editingVariable !== null}
        variable={editingVariable === "new" ? null : (editingVariable ?? null)}
        seasons={seasons}
        onClose={() => setEditingVariable(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
}
