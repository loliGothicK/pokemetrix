"use client";

import { useRef } from "react";
import {
  Box,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  ListItemSecondaryAction,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import Add from "@mui/icons-material/Add";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import type { SxProps, Theme } from "@mui/material/styles";
import type { Season } from "@/store/battle-record/battleRecord";

/** ドロップダウン内の「新規シーズン」を表すセンチネル値 */
const NEW_SEASON = "__new_season__";

interface SeasonSelectProps {
  readonly seasons: readonly Season[];
  readonly value: string | null;
  readonly onChange: (seasonId: string | null) => void;
  readonly onNew: () => void;
  readonly onEdit: (season: Season) => void;
  readonly onDelete: (season: Season) => void;
  readonly label?: string;
  readonly sx?: SxProps<Theme>;
}

/**
 * シーズン選択のドロップダウン。作成・編集・削除の操作を
 * リスト内（各項目のアイコン + 末尾の「新規シーズン」）に押し込む。
 *
 * open の controlled 管理は行わない（anchorEl 警告を防ぐため）。
 * アイコンの onMouseDown で e.preventDefault() してフォーカス移動を阻止し、
 * onClick で inputRef.current.blur() を呼ぶことで Select を自然に閉じる。
 */
export function SeasonSelect({
  seasons,
  value,
  onChange,
  onNew,
  onEdit,
  onDelete,
  label,
  sx,
}: SeasonSelectProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const active = seasons.find((s) => s.id === value) ?? null;
  const labelId = "season-select-inline-label";

  /** ドロップダウンを閉じる（blur で Select のポップアップが閉じる） */
  const closeDropdown = () => inputRef.current?.blur();

  return (
    <FormControl size="small" sx={sx}>
      {label && (
        <InputLabel id={labelId} shrink>
          {label}
        </InputLabel>
      )}
      <Select
        labelId={label ? labelId : undefined}
        label={label}
        value={active?.id ?? ""}
        displayEmpty
        inputRef={inputRef}
        onChange={(e) => {
          const next = e.target.value;
          if (next === NEW_SEASON) {
            onNew();
            return;
          }
          onChange(next || null);
        }}
        renderValue={() =>
          active ? (
            active.name
          ) : (
            <Typography component="span" color="text.secondary">
              {t("battleRecord.season.none")}
            </Typography>
          )
        }
      >
        {seasons.map((season) => (
          <MenuItem key={season.id} value={season.id} sx={{ pr: 9 /* アイコン2つ分の余白 */ }}>
            <Box sx={{ flexGrow: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
              {season.name}
            </Box>
            <ListItemSecondaryAction>
              <IconButton
                size="small"
                edge="end"
                aria-label={t("common.edit")}
                /* preventDefault でフォーカスが外れるのを防ぎ、
                   blur() で明示的に Select を閉じてから onEdit を呼ぶ */
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  closeDropdown();
                  onEdit(season);
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                edge="end"
                color="error"
                aria-label={t("common.delete")}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  closeDropdown();
                  onDelete(season);
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          </MenuItem>
        ))}
        {seasons.length > 0 && <Divider />}
        <MenuItem value={NEW_SEASON}>
          <Add fontSize="small" sx={{ mr: 1 }} />
          {t("battleRecord.season.new")}
        </MenuItem>
      </Select>
    </FormControl>
  );
}
