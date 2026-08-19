"use client";

import { Box, Drawer, List, ListItemButton, ListItemText, Typography, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LocalizedLink as Link } from "@/components/client/LocalizedLink";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

export type ContentSidebarItem = {
  readonly slug: string;
  readonly title: string;
  readonly description?: string;
  readonly group?: string;
};

type ContentSidebarProps = {
  readonly items: readonly ContentSidebarItem[];
  readonly basePath: string; // e.g. "/docs" or "/blog"
  readonly label: string;
  readonly searchBar?: React.ReactNode;
};

function SidebarList({ items, basePath, label, searchBar }: ContentSidebarProps) {
  const pathname = usePathname();
  const theme = useTheme();
  const { t } = useTranslation();

  const groupedItems = items.reduce<Record<string, ContentSidebarItem[]>>((acc, item) => {
    const groupName = item.group ?? "";
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(item);
    return acc;
  }, {});

  const groupNames = Object.keys(groupedItems).sort((a, b) => {
    if (a === "") return -1;
    if (b === "") return 1;
    // items配列における最初の要素のインデックスを使ってソートする
    const aIndex = items.findIndex((item) => item.group === a);
    const bIndex = items.findIndex((item) => item.group === b);
    return aIndex - bIndex;
  });

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
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
        {label}
      </Typography>

      {searchBar && <Box sx={{ px: 1.5, mb: 2 }}>{searchBar}</Box>}

      {groupNames.map((groupName) => (
        <Box key={groupName} sx={{ mb: 1.5 }}>
          {groupName && (
            <Typography
              variant="subtitle2"
              sx={{
                px: 2,
                pt: 1,
                pb: 0.5,
                fontWeight: 700,
                color: "text.secondary",
                fontSize: "0.75rem",
                textTransform: "uppercase",
              }}
            >
              {t(`docs.groups.${groupName}`, groupName)}
            </Typography>
          )}
          <List disablePadding sx={{ px: 1 }}>
            {groupedItems[groupName].map((item) => {
              const href = `${basePath}/${item.slug}`;
              const isActive = pathname === href;
              return (
                <ListItemButton
                  key={item.slug}
                  component={Link}
                  href={href}
                  selected={isActive}
                  sx={{
                    borderRadius: 2,
                    mb: 0.25,
                    minHeight: 40,
                    px: 1.5,
                    py: 0.75,
                    transition: "background 0.15s ease",
                    "&.Mui-selected": {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: "primary.main",
                      "& .MuiListItemText-primary": {
                        fontWeight: 700,
                        color: "primary.main",
                      },
                    },
                    "&:hover:not(.Mui-selected)": {
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                    },
                  }}
                >
                  <ListItemText
                    primary={item.title}
                    slotProps={{
                      primary: { style: { fontSize: 14, fontWeight: isActive ? 700 : 500 } },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      ))}
    </Box>
  );
}

// Desktop sticky sidebar (always visible on md+)
export function ContentSidebarDesktop(props: ContentSidebarProps) {
  return (
    <Box
      component="aside"
      sx={{
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        width: 220,
        flexShrink: 0,
        height: "calc(100dvh - 68px)",
        overflowY: "auto",
        borderRight: "1px solid",
        borderColor: "divider",
        pb: 4,
      }}
    >
      <SidebarList {...props} />
    </Box>
  );
}

// Mobile drawer sidebar
export function ContentSidebarMobile({
  open,
  onClose,
  ...props
}: ContentSidebarProps & { readonly open: boolean; readonly onClose: () => void }) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        display: { xs: "block", md: "none" },
        "& .MuiDrawer-paper": {
          width: "min(85vw, 300px)",
          boxSizing: "border-box",
          pb: 4,
        },
      }}
    >
      <SidebarList {...props} />
    </Drawer>
  );
}
