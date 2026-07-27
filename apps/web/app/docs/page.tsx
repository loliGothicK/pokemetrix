import { allDocs } from "content-collections";
import type { Metadata } from "next";
import { Container, Stack, Typography } from "@mui/material";
import { DocsList } from "@/components/client/content/DocsList";

export const metadata: Metadata = {
  title: "Docs",
  description: "Documentation for the Pokemetrix toolset.",
};

export default function DocsIndexPage() {
  const docs = [...allDocs].sort((a, b) => a.order - b.order);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={4}>
        <Typography variant="h3" sx={{ fontWeight: 800 }}>
          Docs
        </Typography>
        <DocsList docs={docs} />
      </Stack>
    </Container>
  );
}
