import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sharedTeams } from "@/lib/db/schema";
import { genUlid } from "@/lib/db/ulid-type";
import { z } from "zod";
import { match } from "ts-pattern";
import type { SharedTeamSnapshot } from "@/lib/db/schema";

// members の中身は実行時に TrainedPokemon 形式であることをクライアントが保証するが、
// Zod 側では passthrough() で受け付け、DB 挿入時に型キャストする。
const snapshotSchema = z.object({
  teamName: z.string().min(1).max(100),
  members: z.array(z.union([z.object({}).passthrough(), z.null()])).length(6),
});

export async function POST(request: Request) {
  // 認証は任意（ゲストシェアも許可）
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const createdBy = claims?.claims.sub ?? null;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = snapshotSchema.safeParse(body);
  return match(parsed)
    .with({ success: false }, ({ error }) =>
      NextResponse.json({ error: error.flatten() }, { status: 422 }),
    )
    .with({ success: true }, async ({ data: snapshot }) => {
      const id = genUlid();
      await db.insert(sharedTeams).values({
        id,
        createdBy,
        snapshot: snapshot as unknown as SharedTeamSnapshot,
      });
      return NextResponse.json({ id }, { status: 201 });
    })
    .exhaustive();
}
