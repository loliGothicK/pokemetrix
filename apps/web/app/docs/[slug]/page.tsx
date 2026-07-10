import { allDocs } from "content-collections";
import { MDXContent } from "@content-collections/mdx/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Box, Container, Stack, Typography } from "@mui/material";

type PageParams = {
  readonly slug: string;
};

export function generateStaticParams(): PageParams[] {
  return allDocs.map((doc) => ({ slug: doc.slug }));
}

function getDoc(slug: string) {
  return allDocs.find((doc) => doc.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) {
    return {};
  }
  return {
    title: `${doc.title} | Pokemetrix Docs`,
    description: doc.description,
  };
}

export default async function DocPage({ params }: { readonly params: Promise<PageParams> }) {
  const { slug } = await params;
  const doc = getDoc(slug);

  if (!doc) {
    notFound();
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={4}>
        <Stack spacing={1}>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>
            {doc.title}
          </Typography>
          {doc.description ? (
            <Typography color="text.secondary">{doc.description}</Typography>
          ) : null}
        </Stack>
        <Box
          sx={{
            "& h2": { mt: 4, mb: 2, fontWeight: 700 },
            "& h3": { mt: 3, mb: 1.5, fontWeight: 700 },
            "& p": { mb: 2, lineHeight: 1.8 },
            "& ul, & ol": { mb: 2, pl: 3 },
          }}
        >
          <MDXContent code={doc.mdx} />
        </Box>
      </Stack>
    </Container>
  );
}
