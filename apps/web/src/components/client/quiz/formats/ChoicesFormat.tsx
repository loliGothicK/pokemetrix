import React from "react";
import { Stack, ButtonBase, Box, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

interface ChoicesFormatProps {
  options: string[];
  selectedOption: string | null;
  onOptionSelect: (option: string) => void;
  showExplanation: boolean;
  correctAnswerIndex?: number;
}

export function ChoicesFormat({
  options,
  selectedOption,
  onOptionSelect,
  showExplanation,
  correctAnswerIndex,
}: ChoicesFormatProps) {
  return (
    <Stack spacing={1.5} sx={{ mt: 3 }}>
      {options.map((opt, idx) => {
        const isSelected = selectedOption === opt;
        const isCorrect = idx === correctAnswerIndex;

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

        let Icon = <RadioButtonUncheckedIcon sx={{ fontSize: 22, flexShrink: 0, opacity: 0.4 }} />;
        if (showExplanation) {
          if (isCorrect)
            Icon = <CheckCircleIcon color="success" sx={{ fontSize: 22, flexShrink: 0 }} />;
          else if (isSelected)
            Icon = <CancelIcon color="error" sx={{ fontSize: 22, flexShrink: 0 }} />;
        } else if (isSelected) {
          Icon = <CheckCircleIcon color="primary" sx={{ fontSize: 22, flexShrink: 0 }} />;
        }

        return (
          <ButtonBase
            key={idx}
            onClick={() => !showExplanation && onOptionSelect(opt)}
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
              {Icon}
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
  );
}
