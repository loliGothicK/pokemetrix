import React from "react";
import { Stack, ButtonBase, Box, Typography } from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useTranslation } from "react-i18next";

interface MultiSelectFormatProps {
  options: string[];
  selectedOptions: string[];
  onOptionToggle: (option: string) => void;
  showExplanation: boolean;
  correctAnswerIndices?: number[];
}

export function MultiSelectFormat({
  options,
  selectedOptions,
  onOptionToggle,
  showExplanation,
  correctAnswerIndices,
}: MultiSelectFormatProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: "italic" }}>
        {t("quiz.selectMultiple")}
      </Typography>
      <Stack spacing={1.5}>
        {options.map((opt, idx) => {
          const isSelected = selectedOptions.includes(opt);
          const isCorrect = correctAnswerIndices?.includes(idx);

          let borderColor = "divider";
          let bgcolor = "background.paper";
          let textColor = "text.primary";

          if (showExplanation) {
            if (isCorrect) {
              borderColor = "success.main";
              bgcolor = "success.light";
              textColor = "success.dark";
            } else if (isSelected && !isCorrect) {
              borderColor = "error.main";
              bgcolor = "error.light";
              textColor = "error.dark";
            }
          } else if (isSelected) {
            borderColor = "primary.main";
            bgcolor = "primary.light";
          }

          let CheckIcon;
          if (showExplanation) {
            if (isCorrect)
              CheckIcon = <CheckCircleIcon color="success" sx={{ fontSize: 22, flexShrink: 0 }} />;
            else if (isSelected)
              CheckIcon = <CancelIcon color="error" sx={{ fontSize: 22, flexShrink: 0 }} />;
            else
              CheckIcon = (
                <CheckBoxOutlineBlankIcon sx={{ fontSize: 22, flexShrink: 0, opacity: 0.3 }} />
              );
          } else if (isSelected) {
            CheckIcon = <CheckBoxIcon color="primary" sx={{ fontSize: 22, flexShrink: 0 }} />;
          } else {
            CheckIcon = (
              <CheckBoxOutlineBlankIcon sx={{ fontSize: 22, flexShrink: 0, opacity: 0.4 }} />
            );
          }

          return (
            <ButtonBase
              key={idx}
              onClick={() => !showExplanation && onOptionToggle(opt)}
              disabled={showExplanation}
              sx={{
                width: "100%",
                textAlign: "left",
                borderRadius: 2,
                border: "1.5px solid",
                borderColor,
                bgcolor,
                transition: "all 0.15s ease",
                "&:active": { opacity: 0.8 },
                "&:hover:not(:disabled)": {
                  borderColor: "primary.main",
                  bgcolor: "action.hover",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: { xs: 1.5, sm: 2 },
                  width: "100%",
                }}
              >
                {CheckIcon}
                <Typography
                  sx={{
                    fontSize: { xs: "0.95rem", sm: "1rem" },
                    fontWeight: isSelected || (showExplanation && isCorrect) ? 600 : 400,
                    color: textColor,
                    lineHeight: 1.5,
                    flexGrow: 1,
                  }}
                >
                  {opt}
                </Typography>
              </Box>
            </ButtonBase>
          );
        })}
      </Stack>
    </Box>
  );
}
