"use client";

import { Box, Drawer, List, ListItemButton, ListItemText, Typography, alpha, Stepper, Step, StepLabel, StepContent } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";

export type TocHeading = {
  readonly id: string;
  readonly text: string;
  readonly level: 2 | 3;
};

type TableOfContentsProps = {
  readonly headings: readonly TocHeading[];
};

type GroupedHeading = TocHeading & { readonly children: TocHeading[] };

function groupHeadings(headings: readonly TocHeading[]): GroupedHeading[] {
  const result: GroupedHeading[] = [];
  for (const h of headings) {
    if (h.level === 2) {
      result.push({ ...h, children: [] });
    } else if (h.level >= 3) {
      if (result.length > 0) {
        result[result.length - 1].children.push(h);
      } else {
        result.push({ ...h, children: [] });
      }
    }
  }
  return result;
}

function TocList({
  headings,
  activeId,
  onItemClick,
}: TableOfContentsProps & { readonly activeId?: string; readonly onItemClick?: () => void }) {
  const theme = useTheme();

  if (headings.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 1.5 }}>
        —
      </Typography>
    );
  }

  const grouped = groupHeadings(headings);

  const handleClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (onItemClick) onItemClick();
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    window.history.pushState(null, "", `#${id}`);
  };

  return (
    <Box sx={{ px: 1.5, py: 1 }}>
      <Stepper
        orientation="vertical"
        nonLinear
        connector={null}
        sx={{
          "& .MuiStep-root": {
            mb: 0.5,
          },
        }}
      >
        {grouped.map((group) => {
          const isGroupActive = activeId === group.id;
          const isChildActive = group.children.some((c) => c.id === activeId);
          const isExpanded = isGroupActive || isChildActive;
          const isGroupOrChildActive = isGroupActive || isChildActive;

          return (
            <Step key={group.id} expanded={isExpanded} active={isGroupOrChildActive}>
              <StepLabel
                onClick={handleClick(group.id)}
                icon={
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: isGroupOrChildActive ? "primary.main" : "divider",
                      transition: "all 0.2s ease",
                      boxShadow: isGroupOrChildActive
                        ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`
                        : "none",
                    }}
                  />
                }
                sx={{
                  py: 0.5,
                  cursor: "pointer",
                  borderRadius: 1,
                  transition: "background-color 0.15s ease",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.text.primary, 0.04),
                    "& .MuiStepLabel-label": { color: "text.primary" },
                  },
                  "& .MuiStepLabel-label": {
                    fontSize: 13,
                    fontWeight: isGroupActive ? 700 : 500,
                    color: isGroupActive ? "primary.main" : "text.secondary",
                    transition: "color 0.2s ease",
                  },
                  "& .MuiStepLabel-iconContainer": {
                    pr: 1.5,
                  },
                }}
              >
                {group.text}
              </StepLabel>
              {group.children.length > 0 && (
                <StepContent
                  sx={{
                    borderLeft: `1px solid ${theme.palette.divider}`,
                    ml: 0.5,
                    pl: 2.25,
                    py: 0.25,
                  }}
                >
                  <List disablePadding>
                    {group.children.map((child) => {
                      const isChildCurrent = activeId === child.id;
                      return (
                        <ListItemButton
                          key={child.id}
                          onClick={handleClick(child.id)}
                          sx={{
                            borderRadius: 1,
                            py: 0.25,
                            px: 1,
                            mb: 0.25,
                            minHeight: 28,
                            color: isChildCurrent ? "primary.main" : "text.secondary",
                            bgcolor: isChildCurrent
                              ? alpha(theme.palette.primary.main, 0.08)
                              : "transparent",
                            "&:hover": {
                              bgcolor: isChildCurrent
                                ? alpha(theme.palette.primary.main, 0.12)
                                : alpha(theme.palette.text.primary, 0.04),
                              color: isChildCurrent ? "primary.main" : "text.primary",
                            },
                          }}
                        >
                          <ListItemText
                            primary={child.text}
                            slotProps={{
                              primary: {
                                sx: {
                                  fontSize: 12,
                                  fontWeight: isChildCurrent ? 600 : 400,
                                  lineHeight: 1.4,
                                },
                              },
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </StepContent>
              )}
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
}

function useActiveHeading(headings: readonly TocHeading[]) {
  const [activeId, setActiveId] = useState<string | undefined>(headings[0]?.id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const ids = headings.map((h) => h.id);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings]);

  return activeId;
}

// Desktop sticky ToC (md+)
export function TableOfContentsDesktop({ headings }: TableOfContentsProps) {
  const activeId = useActiveHeading(headings);

  return (
    <Box
      component="aside"
      sx={{
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        width: 200,
        flexShrink: 0,
        height: "calc(100dvh - 68px)",
        overflowY: "auto",
        borderLeft: "1px solid",
        borderColor: "divider",
        pb: 4,
      }}
    >
      <Typography
        variant="overline"
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: "text.secondary",
          px: 1.5,
          pt: 2,
          pb: 0.5,
          display: "block",
        }}
      >
        On this page
      </Typography>
      <TocList headings={headings} activeId={activeId} />
    </Box>
  );
}

// Mobile bottom-sheet ToC (xs only)
export function TableOfContentsBottomSheet({
  headings,
  open,
  onClose,
}: TableOfContentsProps & { readonly open: boolean; readonly onClose: () => void }) {
  const activeId = useActiveHeading(headings);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={{
        display: { xs: "block", md: "none" },
        "& .MuiDrawer-paper": {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: "60vh",
          pb: "env(safe-area-inset-bottom)",
        },
      }}
    >
      <Box sx={{ px: 1, pb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 4,
            bgcolor: "divider",
            borderRadius: 2,
            mx: "auto",
            my: 1.5,
          }}
        />
        <Typography
          variant="overline"
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "text.secondary",
            px: 1.5,
            pb: 0.5,
            display: "block",
          }}
        >
          On this page
        </Typography>
        <TocList headings={headings} activeId={activeId} onItemClick={onClose} />
      </Box>
    </Drawer>
  );
}
