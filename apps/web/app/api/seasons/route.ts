import { NextResponse } from "next/server";
import { match } from "ts-pattern";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { seasons } from "@/lib/db/schema";
import { genUlid } from "@/lib/db/ulid-type";
import { seasonInputSchema, type Season } from "@/store/battle-record/battleRecord";
import { withChildSpan } from "@/lib/otel";
import type { InferSelectModel } from "drizzle-orm";

const toDto = (row: InferSelectModel<typeof seasons>): Season => ({
  id: row.id,
  name: row.name,
  format: row.format,
  ruleMark: row.ruleMark,
  startedAt: row.startedAt,
  endedAt: row.endedAt,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export async function GET(_request: Request) {
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = claims.claims.sub;

  const rows = await withChildSpan(
    "db.seasons.list",
    async (_span) =>
      db.select().from(seasons).where(eq(seasons.userId, userId)).orderBy(seasons.createdAt),
    { op: "db.query" },
  );

  return NextResponse.json(rows.map(toDto));
}

export async function POST(request: Request) {
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

  const parsed = seasonInputSchema.safeParse(body);
  return match(parsed)
    .with({ success: false }, ({ error }) =>
      NextResponse.json({ error: error.flatten() }, { status: 422 }),
    )
    .with({ success: true }, async ({ data: input }) => {
      const id = input.id ?? genUlid();
      const row = await withChildSpan(
        "db.seasons.create",
        async (_span) => {
          const [inserted] = await db
            .insert(seasons)
            .values({
              id,
              userId,
              name: input.name,
              format: input.format,
              ruleMark: input.ruleMark ?? null,
              startedAt: input.startedAt ?? null,
              endedAt: input.endedAt ?? null,
            })
            .returning();
          return inserted;
        },
        { op: "db.query" },
      );
      return NextResponse.json(toDto(row), { status: 201 });
    })
    .exhaustive();
}
