"use client";

import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
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
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MergeEntry } from "@/hooks/useAuthSync";
import { Dispatch, SetStateAction } from "react";
import { rounded } from "@/utils/styles";

// ─────────────────────────────────────────────
// 各チーム行
// ─────────────────────────────────────────────
function MergeRow({
  entry,
  onToggle,
}: {
  readonly entry: MergeEntry;
  readonly onToggle: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const isPicked = entry.action === "pick";

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        border: "1px solid",
        borderColor: isPicked ? "primary.main" : "divider",
        bgcolor: isPicked ? "action.selected" : "action.disabledBackground",
        opacity: isPicked ? 1 : 0.5,
        transition: "all 0.15s ease",
        cursor: isDragging ? "grabbing" : "default",
        ...rounded(2),
      }}
    >
      {/* ドラッグハンドル */}
      <IconButton
        size="small"
        {...attributes}
        {...listeners}
        sx={{ cursor: "grab", color: "text.disabled", touchAction: "none" }}
        aria-label="drag to reorder"
      >
        <DragIndicatorRoundedIcon fontSize="small" />
      </IconButton>

      {/* ソース (local / server) */}
      <Chip
        label={entry.source}
        size="small"
        color={entry.source === "local" ? "warning" : "info"}
        variant="outlined"
        sx={{ fontFamily: "monospace", fontSize: 11, minWidth: 58 }}
      />

      {/* チーム名 */}
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          fontWeight: 500,
          color: isPicked ? "text.primary" : "text.disabled",
          textDecoration: isPicked ? "none" : "line-through",
        }}
      >
        {entry.team.name || "(無名チーム)"}
      </Typography>

      {/* pick / drop トグル */}
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Button
          size="small"
          variant={isPicked ? "contained" : "outlined"}
          color="primary"
          onClick={() => isPicked || onToggle(entry.id)}
          sx={{ minWidth: 52, fontFamily: "monospace", fontSize: 12, py: 0.25 }}
        >
          pick
        </Button>
        <Button
          size="small"
          variant={!isPicked ? "contained" : "outlined"}
          color="error"
          onClick={() => !isPicked || onToggle(entry.id)}
          sx={{ minWidth: 52, fontFamily: "monospace", fontSize: 12, py: 0.25 }}
        >
          drop
        </Button>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────
// ダイアログ本体
// ─────────────────────────────────────────────
type TeamMergeDialogProps = {
  readonly open: boolean;
  readonly entries: MergeEntry[];
  readonly setEntriesAction: Dispatch<SetStateAction<MergeEntry[]>>;
  readonly onCommitAction: () => Promise<void>;
  readonly onCancelAction: () => void;
};

export function TeamMergeDialog({
  open,
  entries,
  setEntriesAction,
  onCommitAction,
  onCancelAction,
}: TeamMergeDialogProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setEntriesAction((prev) => {
        const oldIndex = prev.findIndex((e) => e.id === active.id);
        const newIndex = prev.findIndex((e) => e.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleToggle = (id: string) => {
    setEntriesAction((prev) =>
      prev.map((e) => (e.id === id ? { ...e, action: e.action === "pick" ? "drop" : "pick" } : e)),
    );
  };

  const pickedCount = entries.filter((e) => e.action === "pick").length;

  return (
    <Dialog
      open={open}
      onClose={onCancelAction}
      maxWidth="sm"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          ...rounded(3),
        },
      }}
    >
      <DialogTitle sx={{ pb: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          チームを整理する
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          ログイン前後のチームをマージしてください。 ドラッグで並び替え、pick / drop
          で選択できます。
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            <Stack spacing={1}>
              {entries.map((entry) => (
                <MergeRow key={entry.id} entry={entry} onToggle={handleToggle} />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>

        {entries.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
            チームがありません
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onCancelAction}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onCommitAction}
          disabled={pickedCount === 0}
          sx={{ fontFamily: "monospace" }}
        >
          Commit ({pickedCount}) →
        </Button>
      </DialogActions>
    </Dialog>
  );
}
