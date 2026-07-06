import { NextResponse } from "next/server";
import { match } from "ts-pattern";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { battleRecords, battleRecordOpponents } from "@/lib/db/schema";
import {
  battleRecordUpdateSchema,
  type BattleRecord,
  type BattleRecordOpponent,
} from "@/store/battle-record/battleRecord";
import type { InferSelectModel } from "drizzle-orm";
import type { TrainedPokemon } from "@/store/team/team";

type RecordRow = InferSelectModel<typeof battleRecords>;
type OpponentRow = InferSelectModel<typeof battleRecordOpponents>;

const toOpponentDto = (row: OpponentRow): BattleRecordOpponent => ({
  slotIndex: row.slotIndex,
  pokemonSlug: row.pokemonSlug,
  itemSlug: row.itemSlug,
  abilitySlug: row.abilitySlug,
  moves: row.moves,
  selectionRole: row.selectionRole,
  notes: row.notes,
});

const toDto = (row: RecordRow, opponents: readonly OpponentRow[]): BattleRecord => ({
  id: row.id,
  seasonId: row.seasonId,
  teamId: row.teamId,
  result: row.result,
  myTeam: row.myTeam,
  mySelection: row.mySelection,
  firstOrSecond: row.firstOrSecond,
  rating: row.rating,
  notes: row.notes,
  playedAt: row.playedAt.toISOString(),
  opponents: opponents
    .slice()
    .sort((a, b) => a.slotIndex - b.slotIndex)
    .map(toOpponentDto),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export async function GET(
  _request: Request,
  { params }: { readonly params: Promise<{ readonly id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = claims.claims.sub;

  const [row] = await db
    .select()
    .from(battleRecords)
    .where(and(eq(battleRecords.id, id), eq(battleRecords.userId, userId)));

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const opponents = await db
    .select()
    .from(battleRecordOpponents)
    .where(eq(battleRecordOpponents.battleRecordId, id));

  return NextResponse.json(toDto(row, opponents));
}

export async function PATCH(
  request: Request,
  { params }: { readonly params: Promise<{ readonly id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = claims.claims.sub;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = battleRecordUpdateSchema.safeParse(body);
  return match(parsed)
    .with({ success: false }, ({ error }) =>
      NextResponse.json({ error: error.flatten() }, { status: 422 }),
    )
    .with({ success: true }, async ({ data: input }) => {
      const result = await db.transaction(async (tx) => {
        const updated = await tx
          .update(battleRecords)
          .set({
            ...(input.teamId !== undefined && { teamId: input.teamId ?? null }),
            ...(input.result !== undefined && { result: input.result }),
            ...(input.myTeam !== undefined && {
              myTeam: input.myTeam as unknown as readonly TrainedPokemon[],
            }),
            ...(input.mySelection !== undefined && { mySelection: input.mySelection ?? null }),
            ...(input.firstOrSecond !== undefined && {
              firstOrSecond: input.firstOrSecond ?? null,
            }),
            ...(input.rating !== undefined && { rating: input.rating ?? null }),
            ...(input.notes !== undefined && { notes: input.notes ?? null }),
            ...(input.playedAt !== undefined &&
              input.playedAt !== null && { playedAt: new Date(input.playedAt) }),
          })
          .where(and(eq(battleRecords.id, id), eq(battleRecords.userId, userId)))
          .returning();

        if (updated.length === 0) {
          return { notFound: true as const };
        }

        // opponents が指定された場合は全置換
        if (input.opponents !== undefined) {
          await tx
            .delete(battleRecordOpponents)
            .where(eq(battleRecordOpponents.battleRecordId, id));

          if (input.opponents.length > 0) {
            await tx.insert(battleRecordOpponents).values(
              input.opponents.map((o) => ({
                battleRecordId: id,
                slotIndex: o.slotIndex,
                pokemonSlug: o.pokemonSlug,
                itemSlug: o.itemSlug ?? null,
                abilitySlug: o.abilitySlug ?? null,
                moves: o.moves ?? null,
                selectionRole: o.selectionRole ?? null,
                notes: o.notes ?? null,
              })),
            );
          }
        }

        const opponents = await tx
          .select()
          .from(battleRecordOpponents)
          .where(eq(battleRecordOpponents.battleRecordId, id));

        return { notFound: false as const, dto: toDto(updated[0], opponents) };
      });

      return result.notFound
        ? NextResponse.json({ error: "Not found" }, { status: 404 })
        : NextResponse.json(result.dto);
    })
    .exhaustive();
}

export async function DELETE(
  _request: Request,
  { params }: { readonly params: Promise<{ readonly id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = claims.claims.sub;

  await db
    .delete(battleRecords)
    .where(and(eq(battleRecords.id, id), eq(battleRecords.userId, userId)));

  return NextResponse.json({ success: true });
}
