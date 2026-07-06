import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { boxPokemon } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { TrainedPokemon } from "@/store/team/team";

export async function PATCH(request: Request, { params }: { readonly params: Promise<{ readonly id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = claims.claims.sub;

  const pokemon = (await request.json()) as TrainedPokemon;
  const { identifier, slug, ...data } = pokemon;

  const updated = await db
    .update(boxPokemon)
    .set({ slug: identifier, data: { identifier, slug, ...data } })
    .where(and(eq(boxPokemon.id, id), eq(boxPokemon.userId, userId)))
    .returning({ id: boxPokemon.id });

  if (updated.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { readonly params: Promise<{ readonly id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = claims.claims.sub;

  await db.delete(boxPokemon).where(and(eq(boxPokemon.id, id), eq(boxPokemon.userId, userId)));

  return NextResponse.json({ success: true });
}
