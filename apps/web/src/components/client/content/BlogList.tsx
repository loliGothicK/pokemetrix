"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";

export type BlogListItem = {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly date: string;
  readonly tags: readonly string[];
};

export function BlogList({ posts }: { readonly posts: readonly BlogListItem[] }) {
  return (
    <Stack spacing={3}>
      {posts.map((post) => (
        <Box
          key={post.slug}
          component={Link}
          href={`/blog/${post.slug}`}
          sx={{
            display: "block",
            textDecoration: "none",
            color: "inherit",
            p: 3,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            transition: "border-color 0.2s ease",
            "&:hover": { borderColor: "primary.main" },
          }}
        >
          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary">
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {post.title}
            </Typography>
            <Typography color="text.secondary">{post.description}</Typography>
            {post.tags.length > 0 ? (
              <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                {post.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Stack>
            ) : null}
          </Stack>
        </Box>
      ))}
      {posts.length === 0 ? <Typography color="text.secondary">No posts yet.</Typography> : null}
    </Stack>
  );
}
