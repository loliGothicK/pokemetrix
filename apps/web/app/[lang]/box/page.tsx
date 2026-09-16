import type { Metadata } from "next";
import BoxPage from "@/components/client/box/BoxPage";
import { createLocalizedMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isJa = lang === "ja";

  return createLocalizedMetadata({
    path: "/box",
    lang,
    title: isJa ? "マイBOX (ポケモン管理) | Pokétistix" : "My Box (Pokémon Storage) | Pokétistix",
    description: isJa
      ? "育成したポケモンのステータス、技構成、努力値配分、持ち物をクラウドで一括管理・整理。"
      : "Manage and organize your trained Pokémon, EV spreads, movesets, and items with cloud synchronization.",
    keywords: isJa
      ? ["ポケモン BOX", "ポケモン 管理", "マイBOX", "育成論 管理", "Pokétistix"]
      : ["pokemon box", "pokemon storage", "pokemon manager", "poketistix"],
  });
}

export default function Page() {
  return <BoxPage />;
}
