import type { Metadata } from "next";
import Index from "@/components/client/team-builder/index";
import { BASE_URL } from "@/lib/seo/metadata";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly lang: string; readonly slot: string }>;
}): Promise<Metadata> {
  const { lang, slot } = await params;
  return {
    metadataBase: new URL(BASE_URL),
    title: `Team Builder - Slot ${slot} | Pokétistix`,
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      canonical: `${BASE_URL}/${lang}/team-builder`,
    },
  };
}

export default async function TeamBuilderSlotPage({
  params,
}: {
  readonly params: Promise<{ readonly slot: string }>;
}) {
  const { slot } = await params;
  return <Index regulation={"M-B"} activeSlot={Number(slot)} />;
}
