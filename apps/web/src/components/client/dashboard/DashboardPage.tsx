"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
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
import { useTranslation } from "react-i18next";
import { useAtomValue } from "jotai";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { isAuthenticatedAtom } from "@/store/auth";
import { useDashboards } from "@/hooks/useDashboards";
import { useSeasons } from "@/hooks/useSeasons";
import { EmptyState } from "@/components/common/EmptyState";
import { ulid } from "ulid";
import type { Dashboard, DashboardWidget, WidgetType } from "@/store/dashboard/dashboard";
import { WidgetCard } from "./WidgetCard";
import { AddWidgetDialog } from "./AddWidgetDialog";

const GRID_COLUMNS = { xs: 2, sm: 4, md: 6, lg: 8 } as const;

function newWidget(type: WidgetType, seasonId: string | null, y: number): DashboardWidget {
  return {
    id: ulid(),
    type,
    title: "",
    seasonId,
    x: 0,
    y,
    w: type === "note" ? 3 : 4,
    h: type === "winRateSummary" || type === "note" ? 2 : 4,
  };
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const { dashboards, isLoading, createDashboard, updateDashboard, removeDashboard } =
    useDashboards();
  const { seasons } = useSeasons();

  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftLayout, setDraftLayout] = useState<readonly DashboardWidget[] | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const activeDashboard = useMemo(
    () => dashboards.find((d) => d.id === activeDashboardId) ?? null,
    [dashboards, activeDashboardId],
  );

  useEffect(() => {
    if (activeDashboardId === null && dashboards.length > 0) {
      const defaultDashboard = dashboards.find((d) => d.isDefault) ?? dashboards[0];
      setActiveDashboardId(defaultDashboard.id);
    }
  }, [dashboards, activeDashboardId]);

  const layout = editing ? (draftLayout ?? []) : (activeDashboard?.layout ?? []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleStartEdit = () => {
    if (!activeDashboard) return;
    setDraftLayout(activeDashboard.layout);
    setEditing(true);
  };

  const handleDiscard = () => {
    setDraftLayout(null);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!activeDashboard || draftLayout === null) return;
    await updateDashboard(activeDashboard.id, { layout: draftLayout });
    setEditing(false);
    setDraftLayout(null);
  };

  const handleCreateDashboard = async () => {
    const created = await createDashboard({
      name: t("dashboard.untitled"),
      layout: [],
      isDefault: dashboards.length === 0,
    });
    setActiveDashboardId(created.id);
  };

  const handleDeleteDashboard = async (dashboard: Dashboard) => {
    if (!window.confirm(t("dashboard.deleteConfirm", { name: dashboard.name }))) return;
    await removeDashboard(dashboard.id);
    setActiveDashboardId(null);
  };

  const handleToggleDefault = async (dashboard: Dashboard) => {
    await updateDashboard(dashboard.id, { isDefault: !dashboard.isDefault });
  };

  const handleAddWidget = (type: WidgetType, seasonId: string | null) => {
    setDraftLayout((prev) => [...(prev ?? []), newWidget(type, seasonId, prev?.length ?? 0)]);
  };

  const handleDeleteWidget = (id: string) => {
    setDraftLayout((prev) => (prev ?? []).filter((w) => w.id !== id));
  };

  const handleWidgetTitleChange = (id: string, title: string) => {
    setDraftLayout((prev) => (prev ?? []).map((w) => (w.id === id ? { ...w, title } : w)));
  };

  const handleWidgetOptionsChange = (id: string, options: Record<string, unknown>) => {
    setDraftLayout((prev) => (prev ?? []).map((w) => (w.id === id ? { ...w, options } : w)));
  };

  const handleWidgetResize = (id: string, dw: number, dh: number) => {
    setDraftLayout((prev) =>
      (prev ?? []).map((w) =>
        w.id === id
          ? {
              ...w,
              w: Math.min(Math.max(w.w + dw, 1), GRID_COLUMNS.lg),
              h: Math.max(w.h + dh, 1),
            }
          : w,
      ),
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDraftLayout((prev) => {
      if (!prev) return prev;
      const fromIndex = prev.findIndex((w) => w.id === active.id);
      const toIndex = prev.findIndex((w) => w.id === over.id);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = prev.slice();
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleStartRename = () => {
    if (!activeDashboard) return;
    setNameDraft(activeDashboard.name);
    setRenaming(true);
  };

  const handleCommitRename = async () => {
    if (!activeDashboard || !nameDraft.trim()) {
      setRenaming(false);
      return;
    }
    await updateDashboard(activeDashboard.id, { name: nameDraft.trim() });
    setRenaming(false);
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          {t("auth.loginRequired")}
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ alignItems: { md: "center" }, mb: 3 }}
      >
        {renaming ? (
          <TextField
            size="small"
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={handleCommitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCommitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
        ) : (
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, flexGrow: 1, cursor: activeDashboard ? "pointer" : "default" }}
            onClick={handleStartRename}
          >
            {activeDashboard?.name ?? t("dashboard.title")}
          </Typography>
        )}

        {dashboards.length > 0 && (
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 220 } }}>
            <InputLabel id="dashboard-select-label">{t("dashboard.selectLabel")}</InputLabel>
            <Select
              labelId="dashboard-select-label"
              label={t("dashboard.selectLabel")}
              value={activeDashboard?.id ?? ""}
              onChange={(e) => {
                setEditing(false);
                setDraftLayout(null);
                setActiveDashboardId(e.target.value || null);
              }}
            >
              {dashboards.map((dashboard) => (
                <MenuItem key={dashboard.id} value={dashboard.id}>
                  {dashboard.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {activeDashboard && !editing && (
          <Tooltip
            title={
              activeDashboard.isDefault ? t("dashboard.unsetDefault") : t("dashboard.setDefault")
            }
          >
            <IconButton onClick={() => handleToggleDefault(activeDashboard)} color="primary">
              {activeDashboard.isDefault ? <StarRoundedIcon /> : <StarBorderRoundedIcon />}
            </IconButton>
          </Tooltip>
        )}

        {activeDashboard && !editing && (
          <Tooltip title={t("common.delete")}>
            <IconButton onClick={() => handleDeleteDashboard(activeDashboard)} color="error">
              <DeleteRoundedIcon />
            </IconButton>
          </Tooltip>
        )}

        <Button startIcon={<AddRoundedIcon />} onClick={handleCreateDashboard} variant="outlined">
          {t("dashboard.newDashboard")}
        </Button>

        {activeDashboard &&
          (editing ? (
            <Stack direction="row" spacing={1}>
              <Button startIcon={<CloseRoundedIcon />} onClick={handleDiscard}>
                {t("common.cancel")}
              </Button>
              <Button
                startIcon={<AddRoundedIcon />}
                onClick={() => setAddDialogOpen(true)}
                variant="outlined"
              >
                {t("dashboard.addWidget")}
              </Button>
              <Button startIcon={<SaveRoundedIcon />} onClick={handleSave} variant="contained">
                {t("common.save")}
              </Button>
            </Stack>
          ) : (
            <Button startIcon={<EditRoundedIcon />} onClick={handleStartEdit} variant="contained">
              {t("common.edit")}
            </Button>
          ))}
      </Stack>

      {!activeDashboard ? (
        <EmptyState message={t("dashboard.noDashboards")} />
      ) : layout.length === 0 ? (
        <EmptyState message={t("dashboard.empty")} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={layout.map((w) => w.id)} strategy={rectSortingStrategy}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: `repeat(${GRID_COLUMNS.xs}, minmax(0, 1fr))`,
                  sm: `repeat(${GRID_COLUMNS.sm}, minmax(0, 1fr))`,
                  md: `repeat(${GRID_COLUMNS.md}, minmax(0, 1fr))`,
                  lg: `repeat(${GRID_COLUMNS.lg}, minmax(0, 1fr))`,
                },
                gridAutoRows: "120px",
                gap: 2,
              }}
            >
              {layout.map((widget) => (
                <WidgetCard
                  key={widget.id}
                  widget={widget}
                  editing={editing}
                  onDelete={() => handleDeleteWidget(widget.id)}
                  onTitleChange={(title) => handleWidgetTitleChange(widget.id, title)}
                  onOptionsChange={(options) => handleWidgetOptionsChange(widget.id, options)}
                  onResize={(dw, dh) => handleWidgetResize(widget.id, dw, dh)}
                />
              ))}
            </Box>
          </SortableContext>
        </DndContext>
      )}

      <AddWidgetDialog
        open={addDialogOpen}
        seasons={seasons}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAddWidget}
      />
    </Box>
  );
}
