import React from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";
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
  DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

interface GroupingItemProps {
  id: string;
  item: string;
  disabled: boolean;
  isCorrect?: boolean;
  showExplanation: boolean;
}

function SortableGroupItem({ id, item, disabled, isCorrect, showExplanation }: GroupingItemProps) {
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

  if (showExplanation && isCorrect !== undefined) {
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
        p: 1.5,
        mb: 1,
        display: "flex",
        alignItems: "center",
        borderColor,
        bgcolor: showExplanation ? bgcolor : "background.paper",
        cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
      {...attributes}
      {...listeners}
    >
      <DragIndicatorIcon sx={{ color: "text.secondary", mr: 1, fontSize: 20 }} />
      <Typography sx={{ flexGrow: 1, fontSize: "0.95rem" }}>{item}</Typography>
    </Paper>
  );
}

function DroppableContainer({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <Box ref={setNodeRef} sx={{ flexGrow: 1, minHeight: 100 }}>
      {children}
    </Box>
  );
}

interface GroupingFormatProps {
  groups: string[];
  groupedItems: Record<string, string[]>;
  onGroupChange: (newGroupedItems: Record<string, string[]>) => void;
  showExplanation: boolean;
  correctGroups?: Record<string, string[]>;
}

export function GroupingFormat({
  groups,
  groupedItems,
  onGroupChange,
  showExplanation,
  correctGroups,
}: GroupingFormatProps) {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Important for mobile to allow scrolling without dragging
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the containers
    const activeContainer = Object.keys(groupedItems).find((key) =>
      groupedItems[key].includes(activeId),
    );
    const overContainer = Object.keys(groupedItems).includes(overId)
      ? overId
      : Object.keys(groupedItems).find((key) => groupedItems[key].includes(overId));

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    onGroupChange({
      ...groupedItems,
      [activeContainer]: groupedItems[activeContainer].filter((item) => item !== activeId),
      [overContainer]: [...groupedItems[overContainer], activeId],
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = Object.keys(groupedItems).find((key) =>
      groupedItems[key].includes(activeId),
    );
    const overContainer = Object.keys(groupedItems).includes(overId)
      ? overId
      : Object.keys(groupedItems).find((key) => groupedItems[key].includes(overId));

    if (!activeContainer || !overContainer || activeContainer !== overContainer) {
      return;
    }

    const items = [...groupedItems[overContainer]];
    const oldIndex = items.indexOf(activeId);
    const newIndex = items.indexOf(overId);

    if (oldIndex !== newIndex) {
      items.splice(oldIndex, 1);
      items.splice(newIndex, 0, activeId);

      onGroupChange({
        ...groupedItems,
        [overContainer]: items,
      });
    }
  };

  const safeGroups = Array.isArray(groups) ? groups : [];
  const allContainers = [...safeGroups];

  if (!isMounted) return null;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t("quiz.dragToReorder", { defaultValue: "Drag to reorder" })}
      </Typography>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Grid container spacing={2}>
          {allContainers.map((containerId) => {
            // Ensure we pass a valid integer (1-12) to Grid size to avoid TS errors or runtime crashes
            const gridCols = Math.max(1, Math.floor(12 / Math.max(1, safeGroups.length)));
            return (
              <Grid size={{ xs: 12, md: gridCols as any }} key={containerId}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    minHeight: 150,
                    bgcolor: "background.default",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: "bold" }}>
                    {containerId}
                  </Typography>

                  <SortableContext
                    id={containerId}
                    items={groupedItems[containerId] || []}
                    strategy={verticalListSortingStrategy}
                  >
                    <DroppableContainer id={containerId}>
                      {(groupedItems[containerId] || []).map((item) => {
                        let isCorrect: boolean | undefined = undefined;
                        if (showExplanation && correctGroups) {
                          isCorrect = correctGroups[containerId]?.includes(item) ?? false;
                        }
                        return (
                          <SortableGroupItem
                            key={item}
                            id={item}
                            item={item}
                            disabled={showExplanation}
                            showExplanation={showExplanation}
                            isCorrect={isCorrect}
                          />
                        );
                      })}
                    </DroppableContainer>
                  </SortableContext>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </DndContext>
    </Box>
  );
}
