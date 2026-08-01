"use client";

import { Box, Drawer, List, ListItemButton, ListItemText, Typography, alpha } from "@mui/material";
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

  return (
    <List disablePadding sx={{ px: 1 }}>
      {headings.map((h) => (
        <ListItemButton
          key={h.id}
          component="a"
          href={`#${h.id}`}
          onClick={onItemClick}
          sx={{
            borderRadius: 2,
            mb: 0.25,
            minHeight: 36,
            pl: h.level === 3 ? 3 : 1.5,
            pr: 1.5,
            py: 0.5,
            transition: "background 0.15s ease",
            color: activeId === h.id ? "primary.main" : "text.secondary",
            borderLeft: activeId === h.id ? `2px solid ${theme.palette.primary.main}` : "2px solid transparent",
            "&:hover": {
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              color: "text.primary",
            },
          }}
        >
          <ListItemText
            primary={h.text}
            slotProps={{
              primary: {
                style: {
                  fontWeight: activeId === h.id ? 700 : 400,
                  fontSize: h.level === 3 ? 12 : 13,
                  lineHeight: 1.4,
                },
              },
            }}
          />
        </ListItemButton>
      ))}
    </List>
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
        position: "sticky",
        top: 0,
        maxHeight: "calc(100vh - 68px)",
        overflowY: "auto",
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
