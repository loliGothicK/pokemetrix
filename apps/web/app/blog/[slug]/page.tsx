import { allPosts } from "content-collections";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostClient } from "./BlogPostClient";

type PageParams = {
  readonly slug: string;
};

export function generateStaticParams(): PageParams[] {
  const slugs = new Set(allPosts.filter((post) => !post.draft).map((post) => post.slug));
  return Array.from(slugs).map((slug) => ({ slug }));
}

function getPost(slug: string, locale: string) {
  return allPosts.find((post) => post.slug === slug && post.locale === locale && !post.draft) || allPosts.find((post) => post.slug === slug && !post.draft);
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug, "ja");
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
  const postsForSlug = allPosts.filter((post) => post.slug === slug && !post.draft);

  if (postsForSlug.length === 0) {
    notFound();
  }

  const uniqueSlugs = Array.from(new Set(allPosts.filter(p => !p.draft).map(p => p.slug)));
  const sidebarItemsEn = uniqueSlugs.map(s => getPost(s, "en")).filter((p) => p !== undefined).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const sidebarItemsJa = uniqueSlugs.map(s => getPost(s, "ja")).filter((p) => p !== undefined).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // We map them so the client component can pick by active language
  const localizedContent = postsForSlug.map(p => ({
    locale: p.locale,
    title: p.title,
    description: p.description,
    date: p.date.toISOString(),
    tags: p.tags,
    headings: p.headings,
    mdx: p.mdx,
  }));

  const localizedSidebar = {
    en: sidebarItemsEn.map((p) => ({ slug: p.slug, title: p.title, description: p.description })),
    ja: sidebarItemsJa.map((p) => ({ slug: p.slug, title: p.title, description: p.description })),
  };

  return (
    <BlogPostClient
      localizedSidebar={localizedSidebar}
      localizedContent={localizedContent}
    />
  );
}
