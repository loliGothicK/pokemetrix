"use client";

import { alpha, Box, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SurfaceCard } from "@/components/common/SurfaceCard";
import { flexRowCenter } from "@/theme/sx";
import { WidgetRenderer } from "./WidgetRenderer";
import type { DashboardWidget } from "@/store/dashboard/dashboard";
import { DASHBOARD_GRID_MAX_COLS, DASHBOARD_GRID_MAX_ROWS } from "@/store/dashboard/dashboard";

/** ウィジェット種別ごとの既定タイトル（i18n キー） */
export const widgetTypeLabelKey = (type: DashboardWidget["type"]) =>
  `dashboard.widget.type.${type}` as const;

export function WidgetCard({
  widget,
  editing,
  onDelete,
  onTitleChange,
  onOptionsChange,
  onResize,
}: {
  readonly widget: DashboardWidget;
  readonly editing: boolean;
  readonly onDelete: () => void;
  readonly onTitleChange: (title: string) => void;
  readonly onOptionsChange: (options: Record<string, unknown>) => void;
  readonly onResize: (dw: number, dh: number) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: !editing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${widget.w}`,
    gridRow: `span ${widget.h}`,
  };

  const title = widget.title || t(widgetTypeLabelKey(widget.type));

  return (
    <Box ref={setNodeRef} style={style}>
      <SurfaceCard
        raised
        sx={{
          p: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
          opacity: isDragging ? 0.5 : 1,
          boxShadow: isDragging
            ? `0 8px 24px ${alpha(theme.palette.common.black, 0.18)}`
            : undefined,
        }}
      >
        <Stack direction="row" spacing={0.5} sx={{ ...flexRowCenter, mb: 1.5 }}>
          {editing && (
            <IconButton
              size="small"
              {...attributes}
              {...listeners}
              sx={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none", ml: -1 }}
              aria-label={t("dashboard.dragToReorder")}
            >
              <DragIndicatorRoundedIcon fontSize="small" />
            </IconButton>
          )}
          {editing ? (
            <TextField
              variant="standard"
              value={widget.title}
              placeholder={title}
              onChange={(e) => onTitleChange(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 100 } }}
              sx={{ flexGrow: 1 }}
            />
          ) : (
            <Typography variant="subtitle2" sx={{ fontWeight: 700, flexGrow: 1 }} noWrap>
              {title}
            </Typography>
          )}
          {editing && (
            <Stack direction="row" spacing={0.25}>
              <Tooltip title={t("dashboard.widthDecrease")}>
                <IconButton
                  size="small"
                  disabled={widget.w <= 1}
                  onClick={() => onResize(-1, 0)}
                  aria-label={t("dashboard.widthDecrease")}
                >
                  <RemoveRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("dashboard.widthIncrease")}>
                <IconButton
                  size="small"
                  disabled={widget.w >= DASHBOARD_GRID_MAX_COLS}
                  onClick={() => onResize(1, 0)}
                  aria-label={t("dashboard.widthIncrease")}
                >
                  <AddRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("dashboard.heightDecrease")}>
                <IconButton
                  size="small"
                  disabled={widget.h <= 1}
                  onClick={() => onResize(0, -1)}
                  aria-label={t("dashboard.heightDecrease")}
                  sx={{ transform: "rotate(90deg)" }}
                >
                  <RemoveRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("dashboard.heightIncrease")}>
                <IconButton
                  size="small"
                  disabled={widget.h >= DASHBOARD_GRID_MAX_ROWS}
                  onClick={() => onResize(0, 1)}
                  aria-label={t("dashboard.heightIncrease")}
                  sx={{ transform: "rotate(90deg)" }}
                >
                  <AddRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("common.delete")}>
                <IconButton
                  size="small"
                  onClick={onDelete}
                  aria-label={t("common.delete")}
                  sx={{
                    color: theme.palette.error.main,
                    "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.1) },
                  }}
                >
                  <DeleteRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Stack>
        <Box sx={{ flexGrow: 1, overflow: "auto", minHeight: 0 }}>
          <WidgetRenderer widget={widget} editing={editing} onOptionsChange={onOptionsChange} />
        </Box>
      </SurfaceCard>
    </Box>
  );
}
