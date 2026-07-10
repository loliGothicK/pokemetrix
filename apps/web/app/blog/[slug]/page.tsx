import { allPosts } from "content-collections";
import { MDXContent } from "@content-collections/mdx/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Box, Chip, Container, Stack, Typography } from "@mui/material";

type PageParams = {
  readonly slug: string;
};

export function generateStaticParams(): PageParams[] {
  return allPosts.filter((post) => !post.draft).map((post) => ({ slug: post.slug }));
}

function getPost(slug: string) {
  return allPosts.find((post) => post.slug === slug && !post.draft);
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) {
    return {};
  }
  return {
    title: `${post.title} | Pokemetrix Blog`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: { readonly params: Promise<PageParams> }) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={4}>
        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>
            {post.title}
          </Typography>
          {post.tags.length > 0 ? (
            <Stack direction="row" spacing={1}>
              {post.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Stack>
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
          <MDXContent code={post.mdx} />
        </Box>
      </Stack>
    </Container>
  );
}
