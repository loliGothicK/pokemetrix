import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { boxPokemon } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { TrainedPokemon } from "@/store/team/team";

export async function GET(_request: Request) {
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = claims.claims.sub;

  const rows = await db
    .select()
    .from(boxPokemon)
    .where(eq(boxPokemon.userId, userId))
    .orderBy(boxPokemon.createdAt);

  const result: TrainedPokemon[] = rows.map((row) => {
    const data = row.data as Omit<TrainedPokemon, "boxId">;
    return { boxId: row.id, ...data };
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = claims.claims.sub;

  const pokemon = (await request.json()) as TrainedPokemon;
  const { boxId, identifier, slug, ...data } = pokemon;

  await db
    .insert(boxPokemon)
    .values({ id: boxId, userId, slug: identifier, data: { identifier, slug, ...data } })
    .onConflictDoUpdate({
      target: boxPokemon.id,
      set: { slug: identifier, data: { identifier, slug, ...data } },
    });

  return NextResponse.json({ success: true }, { status: 201 });
}
