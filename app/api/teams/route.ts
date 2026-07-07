import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { teams, teamMembers, boxPokemon } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { withChildSpan } from "@/lib/otel";
import type { Team, TrainedPokemon } from "@/store/team/team";

export async function GET(_request: Request) {
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = claims.claims.sub;

  const result = await withChildSpan(
    "db.teams.list",
    async (_span) => {
      const userTeams = await db.select().from(teams).where(eq(teams.userId, userId));

      if (userTeams.length === 0) return [];

      const teamIds = userTeams.map((t) => t.id);

      const members = await db
        .select({
          teamId: teamMembers.teamId,
          slotIndex: teamMembers.slotIndex,
          boxId: boxPokemon.id,
          slug: boxPokemon.slug,
          data: boxPokemon.data,
        })
        .from(teamMembers)
        .innerJoin(boxPokemon, eq(teamMembers.boxPokemonId, boxPokemon.id))
        .where(inArray(teamMembers.teamId, teamIds));

      return userTeams.map((team) => {
        const slots = Array<TrainedPokemon | null>(6).fill(null);
        members
          .filter((m) => m.teamId === team.id)
          .forEach((m) => {
            const data = m.data as Omit<TrainedPokemon, "boxId">;
            slots[m.slotIndex] = { boxId: m.boxId, ...data };
          });
        return {
          id: team.id,
          name: team.name,
          members: slots,
        } satisfies Team;
      });
    },
    { op: "db.query" },
  );

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = claims.claims.sub;

  const incomingTeams = (await request.json()) as readonly Team[];

  await withChildSpan(
    "db.teams.save",
    async (span) => {
      span.setAttribute("db.team_count", incomingTeams.length);
      for (const team of incomingTeams) {
        await db.transaction(async (tx) => {
          await tx
            .insert(teams)
            .values({ id: team.id, userId, name: team.name })
            .onConflictDoUpdate({
              target: teams.id,
              set: { name: team.name },
            });

          const nonNullMembers = team.members
            .map((m, i) => ({ member: m, slot: i }))
            .filter(
              (x): x is { readonly member: TrainedPokemon; readonly slot: number } =>
                x.member !== null,
            );

          for (const { member } of nonNullMembers) {
            const { boxId, identifier, slug, ...data } = member;
            await tx
              .insert(boxPokemon)
              .values({
                id: boxId,
                userId,
                slug: identifier,
                inBox: false,
                data: { identifier, slug, ...data },
              })
              .onConflictDoUpdate({
                target: boxPokemon.id,
                // inBox は変更しない（BOXに明示的に保存済みのものは inBox: true のまま保持）
                set: { slug: identifier, data: { identifier, slug, ...data } },
              });
          }

          await tx.delete(teamMembers).where(eq(teamMembers.teamId, team.id));

          if (nonNullMembers.length > 0) {
            await tx.insert(teamMembers).values(
              nonNullMembers.map(({ member, slot }) => ({
                teamId: team.id,
                slotIndex: slot,
                boxPokemonId: member.boxId,
              })),
            );
          }
        });
      }
    },
    { op: "db.query" },
  );

  return NextResponse.json({ success: true });
}
