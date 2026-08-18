import React, { useState } from "react";
import { Stack, Button, Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface OneWayFormatProps {
  options: string[];
  selectedOption: string | null;
  onOptionSelect: (option: string) => void;
  onSubmit: () => void;
  showExplanation: boolean;
  correctAnswerIndex?: number;
}

export function OneWayFormat({
  options,
  selectedOption,
  onOptionSelect,
  onSubmit,
  showExplanation,
  correctAnswerIndex,
}: OneWayFormatProps) {
  const { t } = useTranslation();
  const [userCurrentIndex, setUserCurrentIndex] = useState(0);
  const [prevOptions, setPrevOptions] = useState(options);

  if (prevOptions !== options) {
    setPrevOptions(options);
    setUserCurrentIndex(0);
  }

  const currentIndex = prevOptions !== options ? 0 : userCurrentIndex;
  const setCurrentIndex = setUserCurrentIndex;

  const handlePass = () => {
    if (currentIndex < options.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSelect = () => {
    onOptionSelect(options[currentIndex]);
    // Allow state to update then submit
    setTimeout(() => onSubmit(), 0);
  };

  // If explanation is shown, reveal all options and highlight them as in ChoicesFormat
  if (showExplanation) {
    return (
      <Stack spacing={2} sx={{ mt: 4 }}>
        {options.map((opt, idx) => (
          <Button
            key={idx}
            variant={selectedOption === opt ? "contained" : "outlined"}
            color={
              idx === correctAnswerIndex ? "success" : selectedOption === opt ? "error" : "inherit"
            }
            disabled
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

  // Active play state
  const isLastOption = currentIndex === options.length - 1;
  const currentOption = options[currentIndex];

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {t("quiz.oneWay.optionIndicator", {
          current: currentIndex + 1,
          total: options.length,
        })}
      </Typography>

      <Box
        sx={{
          p: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          mb: 3,
          bgcolor: "background.paper",
          minHeight: "100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h6" align="center">
          {currentOption}
        </Typography>
      </Box>

      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={handlePass}
          disabled={isLastOption}
          fullWidth
          sx={{ py: 1.5, fontSize: "1.1rem" }}
        >
          {isLastOption ? t("quiz.oneWay.cannotPass") : t("quiz.oneWay.pass")}
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSelect}
          fullWidth
          sx={{ py: 1.5, fontSize: "1.1rem" }}
        >
          {t("quiz.oneWay.select")}
        </Button>
      </Stack>
    </Box>
  );
}
