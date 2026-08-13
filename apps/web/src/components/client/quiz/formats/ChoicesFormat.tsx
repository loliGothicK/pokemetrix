import React from "react";
import { Stack, Button } from "@mui/material";

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
    <Stack spacing={2} sx={{ mt: 4 }}>
      {options.map((opt, idx) => (
        <Button
          key={idx}
          variant={selectedOption === opt ? "contained" : "outlined"}
          color={
            showExplanation
              ? idx === correctAnswerIndex
                ? "success"
                : selectedOption === opt
                  ? "error"
                  : "inherit"
              : "primary"
          }
          onClick={() => onOptionSelect(opt)}
          disabled={showExplanation}
          sx={{
            justifyContent: "flex-start",
            textAlign: "left",
            textTransform: "none",
            py: 1.5,
            px: 3,
            borderRadius: 2,
            fontSize: "1rem",
            borderWidth: selectedOption === opt ? 0 : 1,
          }}
        >
          {opt}
        </Button>
      ))}
    </Stack>
  );
}
