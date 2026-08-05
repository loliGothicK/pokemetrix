import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";
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
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

interface SortableItemProps {
  id: string;
  item: string;
  disabled: boolean;
  isCorrect?: boolean;
  showExplanation: boolean;
}

function SortableItem({ id, item, disabled, isCorrect, showExplanation }: SortableItemProps) {
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
        p: 2,
        mb: 1,
        display: "flex",
        alignItems: "center",
        borderColor,
        bgcolor: showExplanation ? bgcolor : "background.paper",
        cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
        touchAction: "none", // Prevent scrolling on mobile while dragging
      }}
      {...attributes}
      {...listeners}
    >
      <DragIndicatorIcon sx={{ color: "text.secondary", mr: 2 }} />
      <Typography sx={{ flexGrow: 1, fontWeight: "medium" }}>{item}</Typography>
    </Paper>
  );
}

interface OrderingFormatProps {
  orderedOptions: string[];
  onOrderChange: (newOrder: string[]) => void;
  showExplanation: boolean;
  correctOrder?: string[];
}

export function OrderingFormat({
  orderedOptions,
  onOrderChange,
  showExplanation,
  correctOrder,
}: OrderingFormatProps) {
  const { t } = useTranslation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
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

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("quiz.dragToReorder")}
      </Typography>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedOptions} strategy={verticalListSortingStrategy}>
          {orderedOptions.map((opt, index) => {
            const isCorrect = correctOrder ? correctOrder[index] === opt : false;
            return (
              <SortableItem
                key={opt}
                id={opt}
                item={opt}
                disabled={showExplanation}
                showExplanation={showExplanation}
                isCorrect={isCorrect}
              />
            );
          })}
        </SortableContext>
      </DndContext>
    </Box>
  );
}
