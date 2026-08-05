"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Dialog,
  Button,
  InputBase,
  alpha,
  List,
  ListItemButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import { useTranslation } from "react-i18next";
import { searchDocs } from "@services/docsSearch";
import { useRouter } from "next/navigation";
import parse from "html-react-parser";
import { useQuery } from "@tanstack/react-query";
import { useHotkeys } from "react-hotkeys-hook";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function DocsSearchBar() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(
      navigator.platform.toUpperCase().indexOf("MAC") >= 0 ||
        navigator.userAgent.toUpperCase().indexOf("MAC") >= 0,
    );
  }, []);

  useHotkeys("mod+k", (e) => {
    e.preventDefault();
    setDialogOpen((prev) => !prev);
  });

  const searchThreshold = 3;
  const debouncedInput = useDebounce(inputValue, 300);
  const locale = i18n.resolvedLanguage === "en" ? "en" : "ja";

  const { data: options = [], isFetching } = useQuery({
    queryKey: ["docsSearch", debouncedInput, locale],
    queryFn: () => searchDocs(debouncedInput, locale),
    enabled: debouncedInput.length >= searchThreshold,
  });

  // Reset selection when options change
  useEffect(() => {
    setSelectedIndex(0);
  }, [options]);

  const handleClose = () => {
    setDialogOpen(false);
    setInputValue("");
    setSelectedIndex(0);
  };

  const handleSelect = (slug: string) => {
    router.push(`/docs/${slug}`);
    handleClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && options.length > 0) {
      e.preventDefault();
      handleSelect(options[selectedIndex].slug);
    }
  };

  return (
    <>
      <Button
        fullWidth
        variant="outlined"
        color="inherit"
        onClick={() => setDialogOpen(true)}
        sx={{
          justifyContent: "flex-start",
          color: "text.secondary",
          borderColor: (theme) => alpha(theme.palette.divider, 0.5),
          textTransform: "none",
          gap: 1.5,
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.4),
          backdropFilter: "blur(8px)",
          borderRadius: 1,
          py: 1,
          px: 2,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.8),
            borderColor: "primary.main",
            transform: "translateY(-1px)",
            boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
          },
        }}
      >
        <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
        <Typography variant="body2" sx={{ flexGrow: 1, textAlign: "left", fontWeight: 500 }}>
          {t("docs.search.placeholder")}
        </Typography>
        <Box
          component="span"
          sx={{
            display: { xs: "none", sm: "flex" },
            alignItems: "center",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            px: 1,
            py: 0.25,
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "text.disabled",
            bgcolor: (theme) => alpha(theme.palette.action.hover, 0.5),
          }}
        >
          {isMac ? "⌘K" : "Ctrl+K"}
        </Box>
      </Button>

      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        transitionDuration={200}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(4px)",
            },
          },
          paper: {
            sx: {
              mt: { xs: 2, sm: "12vh" },
              mb: "auto",
              borderRadius: 1,
              backgroundImage: "none",
              bgcolor: "background.paper",
              boxShadow: (theme) => `0 24px 48px ${alpha(theme.palette.common.black, 0.4)}`,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <SearchIcon sx={{ color: "primary.main", mr: 1.5 }} />
          <InputBase
            autoFocus
            fullWidth
            placeholder={t("docs.search.placeholder")}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            sx={{
              fontSize: "1.1rem",
              fontWeight: 500,
              "& input": {
                py: 1,
                "&::placeholder": {
                  color: "text.disabled",
                  opacity: 1,
                },
              },
            }}
          />
          {isFetching && <CircularProgress size={20} sx={{ color: "primary.main", ml: 1 }} />}
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              ml: 2,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: "action.hover",
              color: "text.secondary",
              fontSize: "0.7rem",
              fontWeight: "bold",
            }}
          >
            ESC
          </Box>
        </Box>

        <Box sx={{ maxHeight: "60vh", overflowY: "auto", py: 1 }}>
          {inputValue.length < searchThreshold ? (
            <Box sx={{ p: 4, textAlign: "center", color: "text.disabled" }}>
              <Typography variant="body2">{t("docs.search.minChars")}</Typography>
            </Box>
          ) : options.length === 0 && !isFetching ? (
            <Box sx={{ p: 4, textAlign: "center", color: "text.disabled" }}>
              <Typography variant="body2">{t("docs.search.noResults")}</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {options.map((option, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <ListItemButton
                    key={option.slug}
                    onClick={() => handleSelect(option.slug)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    selected={isSelected}
                    sx={{
                      px: 2,
                      py: 1.5,
                      mx: 1,
                      mb: 0.5,
                      borderRadius: 1,
                      alignItems: "flex-start",
                      "&.Mui-selected": {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        "&:hover": {
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                        },
                      },
                    }}
                  >
                    <Box
                      sx={{ mr: 2, mt: 0.5, color: isSelected ? "primary.main" : "text.secondary" }}
                    >
                      <ArticleOutlinedIcon fontSize="small" />
                    </Box>
                    <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? "primary.main" : "text.primary",
                          mb: 0.5,
                        }}
                      >
                        {option.title}
                      </Typography>
                      {option.snippet && (
                        <Typography
                          variant="body2"
                          color={isSelected ? "text.primary" : "text.secondary"}
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            lineHeight: 1.5,
                            "& mark": {
                              backgroundColor: "transparent",
                              color: "primary.main",
                              fontWeight: "bold",
                              textDecoration: "underline",
                              textDecorationColor: (theme) =>
                                alpha(theme.palette.primary.main, 0.4),
                              textDecorationThickness: "2px",
                              textUnderlineOffset: "2px",
                            },
                          }}
                        >
                          {parse(option.snippet)}
                        </Typography>
                      )}
                    </Box>
                    {isSelected && (
                      <Box
                        sx={{
                          display: { xs: "none", sm: "flex" },
                          alignItems: "center",
                          ml: 2,
                          color: "primary.main",
                        }}
                      >
                        <KeyboardReturnIcon fontSize="small" />
                      </Box>
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>
      </Dialog>
    </>
  );
}
