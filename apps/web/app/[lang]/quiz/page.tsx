import type { Metadata } from "next";
import { QuizApp } from "@/components/client/quiz/QuizApp";
import { Box } from "@mui/material";
import { allQuizzes } from "content-collections";
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
    path: "/quiz",
    lang,
    title: isJa
      ? "ポケモンバトル検定 (対戦知識・ダメージ計算・詰めポケ) | Pokétistix"
      : "Pokémon Battle Proficiency Test | Pokétistix",
    description: isJa
      ? "対戦仕様の理解度を測定する実践型ポケモンクイズ検定。特性・技の優先度・ダメージ計算・実戦の詰み筋まで、基礎から最上位エキスパートレベルまで網羅。"
      : "Test your competitive Pokémon mastery across game mechanics, damage calculations, and end-game puzzle solving.",
    keywords: isJa
      ? [
          "ポケモン 検定",
          "ポケモン バトル 検定",
          "ポケモン クイズ",
          "詰めポケ",
          "ポケモン ダメ計 クイズ",
          "ダブルバトル 検定",
          "Pokétistix",
        ]
      : [
          "pokemon battle test",
          "pokemon quiz",
          "competitive pokemon test",
          "vgc quiz",
          "poketistix",
        ],
  });
}

export default async function QuizPage({
  params,
}: {
  readonly params: Promise<{ readonly lang: string }>;
}) {
  const { lang } = await params;

  const quizJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name:
      lang === "ja"
        ? "Pokétistix ポケモンバトル検定"
        : "Pokétistix Pokémon Battle Proficiency Test",
    applicationCategory: "QuizApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    url: `${BASE_URL}/${lang}/quiz`,
    description:
      lang === "ja"
        ? "ポケモン対戦の仕様理解度・ダメージ計算・詰めポケを測定するクイズ検定。"
        : "Interactive test for competitive Pokémon mechanics and puzzle solving.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <Box style={{ minHeight: "100vh", padding: "2rem 0" }}>
      <JsonLd data={quizJsonLd} />
      <QuizApp initialQuestions={allQuizzes} />
    </Box>
  );
}
