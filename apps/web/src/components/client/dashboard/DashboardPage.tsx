"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  Divider,
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
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
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
import { useVariableValues } from "@/hooks/useVariableValues";
import { EmptyState } from "@/components/common/EmptyState";
import { ulid } from "ulid";
import type { Dashboard, DashboardVariable, DashboardWidget } from "@/store/dashboard/dashboard";
import { migrateWidget } from "@/store/dashboard/dashboard";
import { WidgetCard } from "./WidgetCard";
import { VariableBar } from "./VariableBar";
import { WidgetEditDrawer } from "./WidgetEditDrawer";
import { VisualizeEditor } from "./VisualizeEditor";
import "react-resizable/css/styles.css";

const GRID_COLUMNS = { xs: 2, sm: 4, md: 6, lg: 8 } as const;

function newEmptyWidget(y: number): DashboardWidget {
  return {
    id: ulid(),
    title: "",
    dataSource: { type: "season", seasonId: null },
    x: 0,
    y,
    w: 4,
    h: 4,
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
  const [draftVariables, setDraftVariables] = useState<readonly DashboardVariable[] | null>(null);

  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [visualizeWidgetId, setVisualizeWidgetId] = useState<string | null>(null);
  const [exitAnchorEl, setExitAnchorEl] = useState<null | HTMLElement>(null);
  const exitMenuOpen = Boolean(exitAnchorEl);

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

  // 後方互換: 旧フォーマット (seasonId 直持ち) のウィジェットを新フォーマットに変換
  const layout = useMemo(() => {
    const raw = editing ? (draftLayout ?? []) : (activeDashboard?.layout ?? []);
    return raw.map((w) => migrateWidget(w as any));
  }, [editing, draftLayout, activeDashboard?.layout]);

  const variables = editing ? (draftVariables ?? []) : (activeDashboard?.variables ?? []);

  // Variable の現在値管理
  const { values: variableValues, setVariableValue } = useVariableValues(variables);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleStartEdit = () => {
    if (!activeDashboard) return;
    setDraftLayout(activeDashboard.layout.map((w) => migrateWidget(w as any)));
    setDraftVariables(activeDashboard.variables ?? []);
    setEditing(true);
  };

  const handleDiscard = () => {
    setDraftLayout(null);
    setDraftVariables(null);
    setEditingWidgetId(null);
    setVisualizeWidgetId(null);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!activeDashboard || draftLayout === null) return;
    await updateDashboard(activeDashboard.id, {
      layout: draftLayout,
      variables: draftVariables ?? [],
    });
    setEditing(false);
    setDraftLayout(null);
    setDraftVariables(null);
    setEditingWidgetId(null);
    setVisualizeWidgetId(null);
  };

  const handleCreateDashboard = async () => {
    const created = await createDashboard({
      name: t("dashboard.untitled"),
      layout: [],
      variables: [],
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

  const handleAddWidget = () => {
    setDraftLayout((prev) => [...(prev ?? []), newEmptyWidget(prev?.length ?? 0)]);
  };

  const handleDeleteWidget = (id: string) => {
    if (editingWidgetId === id) setEditingWidgetId(null);
    setDraftLayout((prev) => (prev ?? []).filter((w) => w.id !== id));
  };

  const handleWidgetChange = (updated: DashboardWidget) => {
    setDraftLayout((prev) => (prev ?? []).map((w) => (w.id === updated.id ? updated : w)));
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

  const editingWidget = editingWidgetId
    ? (layout.find((w) => w.id === editingWidgetId) ?? null)
    : null;

  const visualizeWidget = visualizeWidgetId
    ? (layout.find((w) => w.id === visualizeWidgetId) ?? null)
    : null;

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
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* ===== ダッシュボードツールバー ===== */}
      <Box sx={{ p: { xs: 2, md: 3 }, pb: { xs: 1, md: 1.5 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ alignItems: { md: "center" } }}
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

          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 220 } }}>
            <InputLabel id="dashboard-select-label">{t("dashboard.selectLabel")}</InputLabel>
            <Select
              labelId="dashboard-select-label"
              value={activeDashboard?.id ?? ""}
              label={t("dashboard.title")}
              onChange={(e) => {
                if (e.target.value === "NEW") {
                  handleCreateDashboard();
                } else {
                  setEditing(false);
                  setDraftLayout(null);
                  setDraftVariables(null);
                  setEditingWidgetId(null);
                  setActiveDashboardId(e.target.value || null);
                }
              }}
            >
              {dashboards.map((dashboard) => (
                <MenuItem key={dashboard.id} value={dashboard.id}>
                  {dashboard.name}
                </MenuItem>
              ))}
              {dashboards.length > 0 && <Divider />}
              <MenuItem value="NEW">
                <ListItemIcon>
                  <AddRoundedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t("dashboard.newDashboard")}</ListItemText>
              </MenuItem>
            </Select>
          </FormControl>

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

          {activeDashboard &&
            (editing ? (
              <Stack direction="row" spacing={1}>
                <Button startIcon={<AddRoundedIcon />} onClick={handleAddWidget} variant="outlined">
                  {t("dashboard.addWidget")}
                </Button>
                <Button
                  id="exit-button"
                  aria-controls={exitMenuOpen ? "exit-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={exitMenuOpen ? "true" : undefined}
                  onClick={(e) => setExitAnchorEl(e.currentTarget)}
                  endIcon={<KeyboardArrowDownRoundedIcon />}
                  variant="contained"
                >
                  {t("common.exit")}
                </Button>
                <Menu
                  id="exit-menu"
                  anchorEl={exitAnchorEl}
                  open={exitMenuOpen}
                  onClose={() => setExitAnchorEl(null)}
                >
                  <MenuItem
                    onClick={() => {
                      handleSave();
                      setExitAnchorEl(null);
                    }}
                  >
                    <ListItemIcon>
                      <SaveRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t("common.saveAndExit")}</ListItemText>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setExitAnchorEl(null);
                      if (window.confirm(t("common.discardConfirm"))) {
                        handleDiscard();
                      }
                    }}
                  >
                    <ListItemIcon>
                      <CloseRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t("common.discardAndExit")}</ListItemText>
                  </MenuItem>
                </Menu>
              </Stack>
            ) : (
              <Button startIcon={<EditRoundedIcon />} onClick={handleStartEdit} variant="contained">
                {t("common.edit")}
              </Button>
            ))}
        </Stack>
      </Box>

      {/* ===== Variable バー（変数があるか編集モードの場合のみ表示） ===== */}
      {activeDashboard && (
        <VariableBar
          variables={variables}
          variableValues={variableValues}
          seasons={seasons}
          editing={editing}
          onVariableValueChange={setVariableValue}
          onVariablesChange={(vars) => setDraftVariables(vars)}
        />
      )}

      {/* ===== メインコンテンツ ===== */}
      {visualizeWidget ? (
        <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
          <VisualizeEditor
            widget={visualizeWidget}
            variableValues={variableValues}
            onClose={() => setVisualizeWidgetId(null)}
            onChange={(updates) => handleWidgetChange({ ...visualizeWidget, ...updates })}
          />
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, display: "flex", overflow: "hidden" }}>
          <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, pt: { xs: 1, md: 1.5 }, overflowY: "auto" }}>
            {!activeDashboard ? (
              <EmptyState message={t("dashboard.noDashboards")} />
            ) : layout.length === 0 ? (
              <EmptyState message={t("dashboard.empty")} />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={layout.map((w) => w.id)} strategy={rectSortingStrategy}>
                  <Box sx={{ position: "relative" }}>
                    {/* 編集中の背景グリッド */}
                    {editing && (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          zIndex: 0,
                          pointerEvents: "none",
                          overflow: "hidden",
                          display: "grid",
                          gridTemplateColumns: {
                            xs: `repeat(${GRID_COLUMNS.xs}, minmax(0, 1fr))`,
                            sm: `repeat(${GRID_COLUMNS.sm}, minmax(0, 1fr))`,
                            md: `repeat(${GRID_COLUMNS.md}, minmax(0, 1fr))`,
                            lg: `repeat(${GRID_COLUMNS.lg}, minmax(0, 1fr))`,
                          },
                          gridAutoRows: "120px",
                          "&::after": {
                            content: '""',
                            position: "absolute",
                            inset: 0,
                            border: "1px dashed",
                            borderColor: (theme) => alpha(theme.palette.divider, 0.4),
                            pointerEvents: "none",
                          },
                        }}
                      >
                        {Array.from({ length: 150 }).map((_, i) => (
                          <Box
                            key={`bg-grid-${i}`}
                            sx={{
                              borderRight: "1px dashed",
                              borderBottom: "1px dashed",
                              borderColor: (theme) => alpha(theme.palette.divider, 0.4),
                            }}
                          />
                        ))}
                      </Box>
                    )}

                    {/* ウィジェット */}
                    <Box
                      sx={{
                        position: "relative",
                        zIndex: 1,
                        display: "grid",
                        gridTemplateColumns: {
                          xs: `repeat(${GRID_COLUMNS.xs}, minmax(0, 1fr))`,
                          sm: `repeat(${GRID_COLUMNS.sm}, minmax(0, 1fr))`,
                          md: `repeat(${GRID_COLUMNS.md}, minmax(0, 1fr))`,
                          lg: `repeat(${GRID_COLUMNS.lg}, minmax(0, 1fr))`,
                        },
                        gridAutoRows: "120px",
                      }}
                    >
                      {layout.map((widget) => (
                        <WidgetCard
                          key={widget.id}
                          widget={widget}
                          editing={editing}
                          variableValues={variableValues}
                          onDelete={() => handleDeleteWidget(widget.id)}
                          onEditClick={() => setEditingWidgetId(widget.id)}
                          onResize={(dw, dh) => handleWidgetResize(widget.id, dw, dh)}
                        />
                      ))}
                    </Box>
                  </Box>
                </SortableContext>
              </DndContext>
            )}
          </Box>
          {editingWidgetId !== null && editing && !visualizeWidgetId && (
            <WidgetEditDrawer
              open={true}
              widget={editingWidget}
              seasons={seasons}
              variables={variables}
              variableValues={variableValues}
              onClose={() => setEditingWidgetId(null)}
              onChange={handleWidgetChange}
              onDelete={() => {
                if (editingWidgetId) handleDeleteWidget(editingWidgetId);
              }}
              onVisualizeClick={() => {
                setVisualizeWidgetId(editingWidgetId);
                setEditingWidgetId(null);
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );
}
