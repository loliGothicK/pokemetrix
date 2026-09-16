import { allDocs } from "content-collections";
import type { Metadata } from "next";
import { DocsIndexClient } from "./DocsIndexClient";

import { createLocalizedMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isJa = lang === "ja";

  return createLocalizedMetadata({
    path: "/docs",
    lang,
    title: isJa ? "ドキュメント (使い方・機能ガイド) | Pokétistix" : "Documentation | Pokétistix",
    description: isJa
      ? "Pokétistix の使い方ガイド。ダメージ計算、チーム構築、努力値調整、対戦記録、データ分析の機能詳細。"
      : "Comprehensive documentation and user guides for Pokétistix tools, features, and competitive battle mechanics.",
    keywords: isJa
      ? ["Pokétistix 使い方", "ポケモン ツール ドキュメント", "ダメージ計算機 使い方"]
      : ["poketistix docs", "pokemon tool guide", "documentation"],
  });
}

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
