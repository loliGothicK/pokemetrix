import { allDocs } from "content-collections";
import type { Metadata } from "next";
import { DocsIndexClient } from "./DocsIndexClient";

export const metadata: Metadata = {
  title: "Docs",
  description: "Documentation for the Pokemetrix toolset.",
};

export default function DocsIndexPage() {
  const uniqueSlugs = Array.from(new Set(allDocs.map((d) => d.slug)));
  const docsEn = uniqueSlugs
    .map((s) => allDocs.find((d) => d.slug === s && d.locale === "en"))
    .filter((d) => d !== undefined)
    .sort((a, b) => a.order - b.order);
  const docsJa = uniqueSlugs
    .map((s) => allDocs.find((d) => d.slug === s && d.locale === "ja"))
    .filter((d) => d !== undefined)
    .sort((a, b) => a.order - b.order);

  const localizedSidebar = {
    en: docsEn.map((d) => ({
      slug: d.slug,
      title: d.title,
      description: d.description,
      group: d.group,
    })),
    ja: docsJa.map((d) => ({
      slug: d.slug,
      title: d.title,
      description: d.description,
      group: d.group,
    })),
  };

  const localizedDocs = {
    en: docsEn,
    ja: docsJa,
  };

  return <DocsIndexClient localizedSidebar={localizedSidebar} localizedDocs={localizedDocs} />;
}
