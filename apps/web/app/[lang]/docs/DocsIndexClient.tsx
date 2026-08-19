"use client";
import { useParams } from "next/navigation";

import { Container, Stack, Typography } from "@mui/material";
import { useContentLayout } from "@/components/client/content/ContentLayoutContext";
import { ContentShell } from "@/components/client/content/ContentShell";
import {
  ContentSidebarDesktop,
  ContentSidebarMobile,
  type ContentSidebarItem,
} from "@/components/client/content/ContentSidebar";
import { DocsList } from "@/components/client/content/DocsList";
import { DocsSearchBar } from "@/components/client/content/DocsSearchBar";
import type { Doc } from "content-collections";

type LocalizedSidebar = {
  readonly en: readonly ContentSidebarItem[];
  readonly ja: readonly ContentSidebarItem[];
};

type LocalizedDocs = {
  readonly en: readonly Doc[];
  readonly ja: readonly Doc[];
};

type Props = {
  readonly localizedSidebar: LocalizedSidebar;
  readonly localizedDocs: LocalizedDocs;
};

export function DocsIndexClient({ localizedSidebar, localizedDocs }: Props) {
  const { isSidebarOpen, setIsSidebarOpen } = useContentLayout();

  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const activeLang = lang === "ja" ? "ja" : "en";

  const sidebarItems = localizedSidebar[activeLang];
  const docs = localizedDocs[activeLang];

  return (
    <ContentShell
      breadcrumbs={[{ label: "Docs", href: "/docs" }]}
      sidebar={
        <ContentSidebarDesktop
          items={sidebarItems}
          basePath="/docs"
          label="Docs"
          searchBar={<DocsSearchBar />}
        />
      }
      sidebarDrawer={
        <ContentSidebarMobile
          items={sidebarItems}
          basePath="/docs"
          label="Docs"
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          searchBar={<DocsSearchBar />}
        />
      }
    >
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Stack spacing={4}>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>
            Docs
          </Typography>
          <DocsList docs={docs} />
        </Stack>
      </Container>
    </ContentShell>
  );
}
