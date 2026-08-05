import React from "react";
import { Stack, Button, Checkbox, Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface MultiSelectFormatProps {
  options: string[];
  selectedOptions: string[];
  onOptionToggle: (option: string) => void;
  showExplanation: boolean;
  correctAnswers?: string[];
}

export function MultiSelectFormat({
  options,
  selectedOptions,
  onOptionToggle,
  showExplanation,
  correctAnswers,
}: MultiSelectFormatProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("quiz.selectMultiple")}
      </Typography>
      <Stack spacing={2}>
        {options.map((opt, idx) => {
          const isSelected = selectedOptions.includes(opt);
          const isCorrect = correctAnswers?.includes(opt);

          let color: "primary" | "success" | "error" | "inherit" = "primary";
          if (showExplanation) {
            if (isCorrect) color = "success";
            else if (isSelected && !isCorrect) color = "error";
            else color = "inherit";
          }

          return (
            <Button
              key={idx}
              variant={isSelected ? "contained" : "outlined"}
              color={color}
              onClick={() => onOptionToggle(opt)}
              disabled={showExplanation}
              sx={{
                justifyContent: "flex-start",
                textAlign: "left",
                textTransform: "none",
                py: 1,
                px: 2,
                borderRadius: 2,
                fontSize: "1rem",
                borderWidth: isSelected ? 0 : 1,
              }}
              startIcon={
                <Checkbox
                  checked={isSelected}
                  onChange={() => onOptionToggle(opt)}
                  disabled={showExplanation}
                  color="default"
                  sx={{
                    color: showExplanation && isCorrect && !isSelected ? "success.main" : "inherit",
                    "&.Mui-checked": {
                      color: "inherit",
                    },
                  }}
                  disableRipple
                />
              }
            >
              {opt}
            </Button>
          );
        })}
      </Stack>
    </Box>
  );
}
