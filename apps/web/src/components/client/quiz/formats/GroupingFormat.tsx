import React, { useState } from "react";
import { Box, Typography, Paper, Chip, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

interface GroupingFormatProps {
  groups: string[];
  groupedItems: Record<string, string[]>;
  onGroupChange: (newGroupedItems: Record<string, string[]>) => void;
  showExplanation: boolean;
  correctGroups?: Record<string, string[]>;
}

/**
 * Mobile-first grouping: tap an item to select it, then tap a group to assign it.
 * On desktop this is also usable. D&D was too clunky on mobile.
 */
export function GroupingFormat({
  groups,
  groupedItems,
  onGroupChange,
  showExplanation,
  correctGroups,
}: GroupingFormatProps) {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const allContainers = groups;
  const unassigned = groupedItems["unassigned"] || [];

  const handleItemTap = (item: string) => {
    if (showExplanation) return;
    setSelectedItem((prev) => (prev === item ? null : item));
  };

  const handleGroupTap = (targetGroup: string) => {
    if (showExplanation || !selectedItem) return;

    // Find the source container
    const sourceContainer = Object.keys(groupedItems).find((key) =>
      groupedItems[key].includes(selectedItem),
    );
    if (!sourceContainer || sourceContainer === targetGroup) {
      setSelectedItem(null);
      return;
    }

    onGroupChange({
      ...groupedItems,
      [sourceContainer]: groupedItems[sourceContainer].filter((i) => i !== selectedItem),
      [targetGroup]: [...(groupedItems[targetGroup] || []), selectedItem],
    });
    setSelectedItem(null);
  };

  const handleUnassignedTap = () => {
    if (showExplanation || !selectedItem) return;
    const sourceContainer = Object.keys(groupedItems).find((key) =>
      groupedItems[key].includes(selectedItem),
    );
    if (!sourceContainer || sourceContainer === "unassigned") {
      setSelectedItem(null);
      return;
    }
    onGroupChange({
      ...groupedItems,
      [sourceContainer]: groupedItems[sourceContainer].filter((i) => i !== selectedItem),
      unassigned: [...(groupedItems["unassigned"] || []), selectedItem],
    });
    setSelectedItem(null);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: "italic" }}>
        {selectedItem
          ? t("quiz.grouping.tapGroupToAssign", { defaultValue: "Now tap a group to assign it →" })
          : t("quiz.grouping.tapItemToSelect", {
              defaultValue: "Tap an item to select it, then tap a group",
            })}
      </Typography>

      {/* Unassigned pool */}
      {!showExplanation && (
        <Paper
          variant="outlined"
          onClick={handleUnassignedTap}
          sx={{
            p: 1.5,
            mb: 2,
            minHeight: 64,
            borderRadius: 2,
            cursor: selectedItem ? "pointer" : "default",
            borderColor: selectedItem ? "primary.main" : "divider",
            borderStyle: selectedItem ? "dashed" : "solid",
            bgcolor: selectedItem ? "action.hover" : "background.default",
            transition: "all 0.15s ease",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: "block", fontWeight: 600 }}
          >
            {t("quiz.unassigned", { defaultValue: "Unassigned" })}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
            {unassigned.map((item) => (
              <Chip
                key={item}
                label={item}
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemTap(item);
                }}
                color={selectedItem === item ? "primary" : "default"}
                variant={selectedItem === item ? "filled" : "outlined"}
                sx={{
                  height: { xs: 36, sm: 32 },
                  fontSize: { xs: "0.85rem", sm: "0.875rem" },
                  cursor: "pointer",
                  fontWeight: selectedItem === item ? 700 : 400,
                  transition: "all 0.15s ease",
                }}
              />
            ))}
            {unassigned.length === 0 && (
              <Typography variant="caption" color="text.disabled">
                {t("quiz.grouping.empty", { defaultValue: "— empty —" })}
              </Typography>
            )}
          </Box>
        </Paper>
      )}

      {/* Group buckets */}
      <Stack spacing={1.5}>
        {allContainers.map((containerId) => {
          const items = groupedItems[containerId] || [];
          const isTarget = selectedItem !== null;

          return (
            <Paper
              key={containerId}
              variant="outlined"
              onClick={() => handleGroupTap(containerId)}
              sx={{
                p: 1.5,
                minHeight: 80,
                borderRadius: 2,
                cursor: isTarget && !showExplanation ? "pointer" : "default",
                borderColor: isTarget && !showExplanation ? "primary.main" : "divider",
                borderStyle: isTarget && !showExplanation ? "dashed" : "solid",
                bgcolor: isTarget && !showExplanation ? "action.hover" : "background.default",
                transition: "all 0.15s ease",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, fontWeight: "bold", color: "primary.main" }}
              >
                {containerId}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
                {items.map((item) => {
                  const isItemCorrect =
                    showExplanation && correctGroups
                      ? (correctGroups[containerId]?.includes(item) ?? false)
                      : undefined;

                  return (
                    <Chip
                      key={item}
                      label={item}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemTap(item);
                      }}
                      color={
                        showExplanation
                          ? isItemCorrect
                            ? "success"
                            : "error"
                          : selectedItem === item
                            ? "primary"
                            : "default"
                      }
                      variant={selectedItem === item || showExplanation ? "filled" : "outlined"}
                      icon={
                        showExplanation ? (
                          isItemCorrect ? (
                            <CheckCircleIcon />
                          ) : (
                            <CancelIcon />
                          )
                        ) : undefined
                      }
                      sx={{
                        height: { xs: 36, sm: 32 },
                        fontSize: { xs: "0.85rem", sm: "0.875rem" },
                        cursor: showExplanation ? "default" : "pointer",
                        fontWeight: selectedItem === item ? 700 : 400,
                        transition: "all 0.15s ease",
                      }}
                    />
                  );
                })}
                {items.length === 0 && (
                  <Typography variant="caption" color="text.disabled">
                    {t("quiz.grouping.empty", { defaultValue: "— empty —" })}
                  </Typography>
                )}
              </Box>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
