import type { Metadata } from "next";
import BattleRecordPage from "@/components/client/battle-record/BattleRecordPage";
import { createLocalizedMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isJa = lang === "ja";

  return createLocalizedMetadata({
    path: "/battle-record",
    lang,
    title: isJa
      ? "対戦記録 (ランクバトル戦績ログ) | Pokétistix"
      : "Battle Record & Match Logger | Pokétistix",
    description: isJa
      ? "ポケモン対戦の勝敗ログ、相手パーティ、選出ポケモン、反省点を詳細に記録・振り返り。"
      : "Log and track your competitive Pokémon battles, team selections, opponent matchups, and win/loss records.",
    keywords: isJa
      ? ["ポケモン 対戦記録", "対戦ログ", "ポケモン 戦績", "ランクバトル 記録", "Pokétistix"]
      : ["pokemon battle record", "match log", "battle tracker", "poketistix"],
  });
}

export default function Page() {
  return <BattleRecordPage />;
}
