import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export const instant = false;
import { sharedTeams } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PartySharePage } from "@/components/client/share/PartySharePage";
import enTranslation from "@locales/en/translation.json";

// ── データフェッチ ────────────────────────────────────────────────────────────

async function fetchSharedTeam(id: string) {
  const rows = await db.select().from(sharedTeams).where(eq(sharedTeams.id, id)).limit(1);

  return rows[0] ?? null;
}

// ── metadata ─────────────────────────────────────────────────────────────────

import { BASE_URL } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly lang: string; readonly id: string }>;
}): Promise<Metadata> {
  const { lang, id } = await params;
  const row = await fetchSharedTeam(id);

  if (!row) {
    return { title: "Not Found – Pokétistix" };
  }

  const teamName = row.snapshot.teamName;
  const memberNames = row.snapshot.members
    .filter(Boolean)
    .map((m) => {
      const key = m!.identifier as keyof typeof enTranslation.pokemon;
      const entry = enTranslation.pokemon[key] as
        | { readonly name?: string; readonly formName?: string }
        | undefined;
      if (!entry) return m!.identifier;
      const name = entry.name ?? m!.identifier;
      // 表示順はアプリ内の慣習に合わせる: name 先頭 → formName（例: "Raichu Mega X"）
      return entry.formName ? `${name} ${entry.formName}` : name;
    })
    .join(", ");

  const title = `${teamName} – Pokétistix`;
  const description = memberNames ? `${teamName}: ${memberNames}` : teamName;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${lang}/share/${id}`,
      languages: {
        ja: `${BASE_URL}/ja/share/${id}`,
        en: `${BASE_URL}/en/share/${id}`,
        "x-default": `${BASE_URL}/en/share/${id}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${lang}/share/${id}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// ── ページ ────────────────────────────────────────────────────────────────────

export default async function SharePage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}) {
  const { id } = await params;
  const row = await fetchSharedTeam(id);

  if (!row) {
    notFound();
  }

  return (
    <PartySharePage shareId={id} snapshot={row.snapshot} createdAt={row.createdAt.toISOString()} />
  );
}
