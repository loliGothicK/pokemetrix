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

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const row = await fetchSharedTeam(id);

  if (!row) {
    return { title: "Not Found – Pokemetrix" };
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

  const title = `${teamName} – Pokemetrix`;
  const description = memberNames ? `${teamName}: ${memberNames}` : teamName;

  const ogImageUrl = `/share/${id}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
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
