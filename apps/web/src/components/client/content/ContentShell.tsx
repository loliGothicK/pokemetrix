"use client";

import { Box, Breadcrumbs, IconButton, Link as MuiLink, Typography, alpha } from "@mui/material";

import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { LocalizedLink as Link } from "@/components/client/LocalizedLink";
import { type ReactNode } from "react";
import { useContentLayout } from "./ContentLayoutContext";
import type { TocHeading } from "./TableOfContents";
import type { BreadcrumbItem } from "./ContentLayoutContext";

type ContentShellProps = {
  /** Left sidebar (article list) — desktop only */
  readonly sidebar: ReactNode;
  /** Mobile sidebar drawer */
  readonly sidebarDrawer: ReactNode;
  /** Right column (ToC) — desktop only */
  readonly toc?: ReactNode;
  /** Mobile ToC bottom-sheet */
  readonly tocBottomSheet?: ReactNode;
  /** Whether this page has a ToC to show */
  readonly hasToc?: boolean;
  /** Headings (needed to show/hide ToC button) */
  readonly headings?: readonly TocHeading[];
  /** Breadcrumb items for this page */
  readonly breadcrumbs?: readonly BreadcrumbItem[];
  readonly children: ReactNode;
};

/** Thin bar that appears above the content on mobile, with sidebar + ToC toggles */
function MobileContentBar({
  hasToc,
  headings,
  breadcrumbs = [],
}: {
  readonly hasToc?: boolean;
  readonly headings?: readonly TocHeading[];
  readonly breadcrumbs?: readonly BreadcrumbItem[];
}) {
  const { setIsSidebarOpen, setIsTocOpen } = useContentLayout();
  const showTocBtn = hasToc && headings && headings.length > 0;

  return (
    <Box
      sx={{
        display: { xs: "flex", md: "none" },
        position: "sticky",
        top: 0,
        zIndex: 10,
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: (t) => alpha(t.palette.background.paper, 0.8),
        backdropFilter: "blur(8px)",
      }}
    >
      <IconButton
        size="small"
        aria-label="記事一覧を開く"
        onClick={() => setIsSidebarOpen(true)}
        sx={{ color: "text.secondary" }}
      >
        <MenuBookRoundedIcon fontSize="small" />
      </IconButton>

      {showTocBtn ? (
        <IconButton
          size="small"
          aria-label="目次を開く"
          onClick={() => setIsTocOpen(true)}
          sx={{ color: "text.secondary" }}
        >
          <FormatListBulletedRoundedIcon fontSize="small" />
        </IconButton>
      ) : null}

      <Box sx={{ flex: 1 }} />

      {/* Mobile breadcrumbs inside content bar */}
      <MobileBreadcrumbsDisplay breadcrumbs={breadcrumbs} />
    </Box>
  );
}

function MobileBreadcrumbsDisplay({
  breadcrumbs,
}: {
  readonly breadcrumbs: readonly BreadcrumbItem[];
}) {
  if (breadcrumbs.length === 0) return null;

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon sx={{ fontSize: 14 }} />}
      sx={{ "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" } }}
    >
      {breadcrumbs.map((crumb, i) => {
        const isLast = i === breadcrumbs.length - 1;
        return isLast || !crumb.href ? (
          <Typography
            key={crumb.label}
            variant="caption"
            color="text.primary"
            sx={{ fontWeight: 600 }}
            noWrap
          >
            {crumb.label}
          </Typography>
        ) : (
          <MuiLink
            key={crumb.label}
            component={Link}
            href={crumb.href}
            underline="hover"
            variant="caption"
            color="text.secondary"
            noWrap
          >
            {crumb.label}
          </MuiLink>
        );
      })}
    </Breadcrumbs>
  );
}

export function ContentShell({
  sidebar,
  sidebarDrawer,
  toc,
  tocBottomSheet,
  hasToc,
  headings,
  breadcrumbs,
  children,
}: ContentShellProps) {
  return (
    <>
      {sidebarDrawer}
      {tocBottomSheet}

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          minHeight: "100%",
        }}
      >
        {/* Left sidebar — desktop */}
        {sidebar}

        {/* Main content area */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            height: { xs: "auto", md: "calc(100dvh - 68px)" },
            overflowY: { xs: "visible", md: "auto" },
          }}
        >
          {/* Mobile bar (sidebar + ToC toggles + breadcrumbs) */}
          <MobileContentBar hasToc={hasToc} headings={headings} breadcrumbs={breadcrumbs} />

          <Box sx={{ flex: 1, overflowX: "hidden" }}>{children}</Box>
        </Box>

        {/* Right ToC — desktop */}
        {toc}
      </Box>
    </>
  );
}
