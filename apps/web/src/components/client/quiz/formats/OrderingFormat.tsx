import React from "react";
import { Box, Typography, Paper, IconButton, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps {
  id: string;
  item: string;
  index: number;
  totalItems: number;
  disabled: boolean;
  isCorrect?: boolean;
  showExplanation: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SortableItem({
  id,
  item,
  index,
  totalItems,
  disabled,
  isCorrect,
  showExplanation,
  onMoveUp,
  onMoveDown,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  let borderColor = "divider";
  let bgcolor = "background.paper";

  if (showExplanation) {
    if (isCorrect) {
      borderColor = "success.main";
      bgcolor = "success.light";
    } else {
      borderColor = "error.main";
      bgcolor = "error.light";
    }
  }

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      variant="outlined"
      sx={{
        mb: 1,
        display: "flex",
        alignItems: "center",
        borderColor,
        bgcolor: showExplanation ? bgcolor : "background.paper",
        overflow: "hidden",
        borderRadius: 2,
        minHeight: { xs: 56, sm: 52 },
      }}
    >
      {/* Drag handle — hidden on mobile, shown on desktop */}
      <Box
        {...attributes}
        {...listeners}
        sx={{
          display: { xs: "none", sm: "flex" },
          alignItems: "center",
          px: 1.5,
          height: "100%",
          cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
          touchAction: "none",
          color: "text.secondary",
          "&:hover": { color: "text.primary" },
        }}
      >
        <DragIndicatorIcon fontSize="small" />
      </Box>

      {/* Up/Down buttons — shown on mobile only */}
      {!disabled && (
        <Stack sx={{ display: { xs: "flex", sm: "none" }, flexDirection: "column", px: 0.5 }}>
          <IconButton
            size="small"
            onClick={onMoveUp}
            disabled={index === 0}
            sx={{ p: 0.5 }}
            aria-label="move up"
          >
            <ArrowUpwardIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={onMoveDown}
            disabled={index === totalItems - 1}
            sx={{ p: 0.5 }}
            aria-label="move down"
          >
            <ArrowDownwardIcon fontSize="small" />
          </IconButton>
        </Stack>
      )}

      <Typography
        sx={{
          mr: 1.5,
          ml: { xs: 0.5, sm: 0 },
          color: "primary.main",
          fontWeight: "bold",
          width: 24,
          textAlign: "center",
          flexShrink: 0,
          fontSize: "0.95rem",
        }}
      >
        {index + 1}
      </Typography>
      <Typography
        sx={{
          flexGrow: 1,
          fontWeight: "medium",
          fontSize: { xs: "0.9rem", sm: "1rem" },
          py: 1.5,
          pr: 1,
        }}
      >
        {item}
      </Typography>
      {showExplanation && (
        <Box sx={{ pr: 1.5, flexShrink: 0 }}>
          {isCorrect ? (
            <CheckCircleIcon color="success" fontSize="small" />
          ) : (
            <CancelIcon color="error" fontSize="small" />
          )}
        </Box>
      )}
    </Paper>
  );
}

interface OrderingFormatProps {
  options: string[];
  orderedOptions: string[];
  onOrderChange: (newOrder: string[]) => void;
  showExplanation: boolean;
  correctOrderIndices?: number[];
}

export function OrderingFormat({
  options,
  orderedOptions,
  onOrderChange,
  showExplanation,
  correctOrderIndices,
}: OrderingFormatProps) {
  const { t } = useTranslation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedOptions.indexOf(active.id as string);
      const newIndex = orderedOptions.indexOf(over.id as string);
      onOrderChange(arrayMove(orderedOptions, oldIndex, newIndex));
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) onOrderChange(arrayMove(orderedOptions, index, index - 1));
  };

  const handleMoveDown = (index: number) => {
    if (index < orderedOptions.length - 1)
      onOrderChange(arrayMove(orderedOptions, index, index + 1));
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: "italic" }}>
        {t("quiz.dragToReorder")}
      </Typography>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedOptions} strategy={verticalListSortingStrategy}>
          {orderedOptions.map((opt, index) => {
            const isCorrectPosition = correctOrderIndices?.[index] === options.indexOf(opt);
            return (
              <SortableItem
                key={opt}
                id={opt}
                item={opt}
                index={index}
                totalItems={orderedOptions.length}
                disabled={showExplanation}
                showExplanation={showExplanation}
                isCorrect={showExplanation ? isCorrectPosition : undefined}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
              />
            );
          })}
        </SortableContext>
      </DndContext>
    </Box>
  );
}
