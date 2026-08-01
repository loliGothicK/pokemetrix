import { allDocs } from "content-collections";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocPageClient } from "./DocPageClient";

type PageParams = {
  readonly slug: string;
};

export function generateStaticParams(): PageParams[] {
  const slugs = new Set(allDocs.map((doc) => doc.slug));
  return Array.from(slugs).map((slug) => ({ slug }));
}

function getDoc(slug: string, locale: string) {
  return (
    allDocs.find((doc) => doc.slug === slug && doc.locale === locale) ||
    allDocs.find((doc) => doc.slug === slug)
  );
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug, "ja");
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
  const docsForSlug = allDocs.filter((doc) => doc.slug === slug);

  if (docsForSlug.length === 0) {
    notFound();
  }

  const uniqueSlugs = Array.from(new Set(allDocs.map((d) => d.slug)));
  const sidebarItemsEn = uniqueSlugs
    .map((s) => getDoc(s, "en"))
    .filter((d) => d !== undefined)
    .sort((a, b) => a.order - b.order);
  const sidebarItemsJa = uniqueSlugs
    .map((s) => getDoc(s, "ja"))
    .filter((d) => d !== undefined)
    .sort((a, b) => a.order - b.order);

  // We map them so the client component can pick by active language
  const localizedContent = docsForSlug.map((d) => ({
    locale: d.locale,
    title: d.title,
    description: d.description,
    headings: d.headings,
    mdx: d.mdx,
  }));

  const localizedSidebar = {
    en: sidebarItemsEn.map((d) => ({
      slug: d.slug,
      title: d.title,
      description: d.description,
      group: d.group,
    })),
    ja: sidebarItemsJa.map((d) => ({
      slug: d.slug,
      title: d.title,
      description: d.description,
      group: d.group,
    })),
  };

  return <DocPageClient localizedSidebar={localizedSidebar} localizedContent={localizedContent} />;
}
