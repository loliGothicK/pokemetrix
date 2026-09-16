import type { Metadata } from "next";
import DamageCalcPage from "@/components/client/damage-calc/DamageCalcPage";
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
    path: "/damage-calc",
    lang,
    title: isJa
      ? "ダメージ計算機 (Wasm超高速・ダブルバトル対応) | Pokétistix"
      : "Pokémon Damage Calculator (Ultra-Fast Wasm & VGC) | Pokétistix",
    description: isJa
      ? "Rust/WebAssemblyによる超高速ポケモン対戦ダメージ計算ツール。Pokémon Champions・ダブルバトル（VGC）環境対応。努力値調整、テラスタル、メガシンカ、場の効果・天候をリアルタイム計算。"
      : "High-performance Pokémon damage calculator powered by Rust/Wasm. Built for Pokémon Champions and VGC double battles with EV spread tuning, Mega Evolution, weather, and field effects.",
    keywords: isJa
      ? [
          "ポケモン ダメージ計算",
          "ポケモン ダメ計",
          "ポケモン ダメージ計算機",
          "ダブルバトル ダメ計",
          "VGC ダメージ計算",
          "Champions ダメ計",
          "努力値 調整 計算",
          "ポケモン 対戦 ツール",
          "Pokétistix",
        ]
      : [
          "pokemon damage calculator",
          "pokemon damage calc",
          "vgc damage calculator",
          "pokemon champions damage calc",
          "pokemon showdown damage calc",
          "ev spread damage calc",
          "poketistix",
        ],
  });
}

export default async function Page({
  params,
}: {
  readonly params: Promise<{ readonly lang: string }>;
}) {
  const { lang } = await params;

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: lang === "ja" ? "Pokétistix ダメージ計算機" : "Pokétistix Pokémon Damage Calculator",
    applicationCategory: "GameApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    url: `${BASE_URL}/${lang}/damage-calc`,
    description:
      lang === "ja"
        ? "Rust/Wasmによる超高速ポケモン対戦ダメージ計算機。ダブルバトル・Champions環境対応。"
        : "Ultra-fast Pokémon damage calculator powered by Rust/Wasm for VGC and Champions format.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <JsonLd data={webAppJsonLd} />
      <DamageCalcPage />
    </>
  );
}
