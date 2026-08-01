import { allPosts } from "content-collections";
import type { Metadata } from "next";
import { BlogIndexClient } from "./BlogIndexClient";

export const metadata: Metadata = {
  title: "Blog",
  description: "Feature updates and development notes from the Pokemetrix team.",
};

export default function BlogIndexPage() {
  const uniqueSlugs = Array.from(new Set(allPosts.filter((post) => !post.draft).map((p) => p.slug)));
  
  const postsEn = uniqueSlugs.map((s) => allPosts.find((p) => p.slug === s && p.locale === "en" && !p.draft)).filter((p) => p !== undefined).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const postsJa = uniqueSlugs.map((s) => allPosts.find((p) => p.slug === s && p.locale === "ja" && !p.draft)).filter((p) => p !== undefined).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const localizedSidebar = {
    en: postsEn.map((p) => ({ slug: p.slug, title: p.title, description: p.description })),
    ja: postsJa.map((p) => ({ slug: p.slug, title: p.title, description: p.description })),
  };

  const localizedPosts = {
    en: postsEn.map((p) => ({ slug: p.slug, title: p.title, description: p.description, date: p.date.toISOString(), tags: p.tags })),
    ja: postsJa.map((p) => ({ slug: p.slug, title: p.title, description: p.description, date: p.date.toISOString(), tags: p.tags })),
  };

  return (
    <BlogIndexClient localizedSidebar={localizedSidebar} localizedPosts={localizedPosts} />
  );
}
