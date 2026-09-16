import { Suspense } from "react";
import type { Metadata } from "next";
import Index from "@/components/client/team-builder/index";
import { Box, CircularProgress } from "@mui/material";
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
    path: "/team-builder",
    lang,
    title: isJa
      ? "チームビルダー (パーティ構築・耐久調整・努力値最適化) | Pokétistix"
      : "Pokémon Team Builder & EV Optimizer | Pokétistix",
    description: isJa
      ? "ポケモンのパーティ構築、努力値配分の最適化、特定技の耐久調整（被ダメージ最小化）、素早さライン比較をサポートする高度なチームビルダー。"
      : "Comprehensive Pokémon team builder for competitive play. Optimize EV spreads, defensive bulk, survival thresholds, movesets, and speed tiers.",
    keywords: isJa
      ? [
          "ポケモン 構築",
          "ポケモン チームビルダー",
          "ポケモン パーティ構築",
          "努力値 調整",
          "耐久調整 計算",
          "素早さ比較 ポケモン",
          "Pokétistix",
        ]
      : [
          "pokemon team builder",
          "vgc team builder",
          "pokemon ev optimizer",
          "pokemon bulk optimizer",
          "pokemon speed tiers",
          "poketistix",
        ],
  });
}

function LoadingFallback() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
      <CircularProgress />
    </Box>
  );
}

export default async function TeamBuilderPage({
  params,
}: {
  readonly params: Promise<{ readonly lang: string }>;
}) {
  const { lang } = await params;

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: lang === "ja" ? "Pokétistix チームビルダー" : "Pokétistix Pokémon Team Builder",
    applicationCategory: "GameApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    url: `${BASE_URL}/${lang}/team-builder`,
    description:
      lang === "ja"
        ? "ポケモンのパーティ構築・努力値調整・耐久最適化ツール。"
        : "Pokémon team builder and EV spread optimizer for competitive battling.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <JsonLd data={webAppJsonLd} />
      <Suspense fallback={<LoadingFallback />}>
        <Index regulation={"M-B"} />
      </Suspense>
    </>
  );
}
