import { allPosts } from "content-collections";
import type { Metadata } from "next";
import { Container, Stack, Typography } from "@mui/material";
import { BlogList } from "@/components/client/content/BlogList";

export const metadata: Metadata = {
  title: "Blog | Pokemetrix",
  description: "Feature updates and development notes from the Pokemetrix team.",
};

export default function BlogIndexPage() {
  const posts = allPosts
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date.toISOString(),
      tags: post.tags,
    }));

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={4}>
        <Typography variant="h3" sx={{ fontWeight: 800 }}>
          Blog
        </Typography>
        <BlogList posts={posts} />
      </Stack>
    </Container>
  );
}
