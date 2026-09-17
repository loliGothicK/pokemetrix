import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { BASE_URL, createLocalizedMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isJa = lang === "ja";

  return createLocalizedMetadata({
    path: "",
    lang,
    title: isJa
      ? "Pokétistix - ポケモン対戦 構築・ダメージ計算・戦績管理プラットフォーム"
      : "Pokétistix - Analytics Workspace for Pokémon Battle",
    description: isJa
      ? "ポケモン対戦のチーム構築、Wasmによる超高速ダメージ計算、対戦ログ記録、勝率インサイトを統合したオールインワン対戦支援プラットフォーム。"
      : "The comprehensive analytics workspace for competitive Pokémon battles. Team builder, ultra-fast Wasm damage calculator, battle logging, and winrate insights.",
    keywords: isJa
      ? ["Pokétistix", "poketistix", "ダメージ計算", "チームビルダー", "ダブルバトル", "対戦記録"]
      : [
          "Pokétistix",
          "poketistix",
          "Pokemon damage calculator",
          "Pokemon team builder",
          "Pokemon battle records",
          "Double battle",
        ],
  });
}

export default async function HomePage({
  params,
}: {
  readonly params: Promise<{ readonly lang: string }>;
}) {
  const { lang } = await params;

  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Pokétistix",
    alternateName: ["Pokeiistix"],
    url: `${BASE_URL}/${lang}`,
    description:
      lang === "ja"
        ? "ポケモン対戦 構築・ダメージ計算・戦績管理プラットフォーム"
        : "Analytics Workspace for Pokémon Battle",
    inLanguage: lang === "ja" ? "ja-JP" : "en-US",
  };

  return (
    <>
      <JsonLd data={webSiteJsonLd} />
      <HomeClient />
    </>
  );
}
