"use client";

import { Box, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { rounded } from "@/utils/styles";

export type DocsListItem = {
  readonly slug: string;
  readonly title: string;
  readonly description?: string;
};

export function DocsList({ docs }: { readonly docs: readonly DocsListItem[] }) {
  return (
    <Stack spacing={3}>
      {docs.map((doc) => (
        <Box
          key={doc.slug}
          component={Link}
          href={`/docs/${doc.slug}`}
          sx={{
              display: "block",
            textDecoration: "none",
            color: "inherit",
            border: "1px solid",
            borderColor: "divider",
            transition: "border-color 0.2s ease",
            "&:hover": { borderColor: "primary.main" },
              ...rounded(3)
        }}
        >
          <Stack spacing={1}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {doc.title}
            </Typography>
            {doc.description ? (
              <Typography color="text.secondary">{doc.description}</Typography>
            ) : null}
          </Stack>
        </Box>
      ))}
      {docs.length === 0 ? <Typography color="text.secondary">No docs yet.</Typography> : null}
    </Stack>
  );
}
