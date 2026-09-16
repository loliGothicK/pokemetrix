import type { Metadata } from "next";
import BattleAnalyticsPage from "@/components/client/battle-record/BattleAnalyticsPage";
import { createLocalizedMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isJa = lang === "ja";

  return createLocalizedMetadata({
    path: "/battle-analytics",
    lang,
    title: isJa
      ? "勝率インサイト (対戦データ分析) | Pokétistix"
      : "Winrate Insights & Analytics | Pokétistix",
    description: isJa
      ? "対戦ログからポケモンの選出率・勝率・苦手な並びを多角的に分析し、パーティの弱点克服と勝率アップを支援。"
      : "Analyze win rates, team pick rates, and matchup dynamics to identify weaknesses and refine your competitive strategy.",
    keywords: isJa
      ? ["ポケモン 勝率 分析", "選出率", "対戦 分析", "メタゲーム 分析", "Pokétistix"]
      : ["pokemon winrate analytics", "pokemon pick rate", "matchup analytics", "poketistix"],
  });
}

export default function Page() {
  return <BattleAnalyticsPage />;
}
