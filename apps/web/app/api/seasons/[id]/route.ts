import { NextResponse } from "next/server";
import { match } from "ts-pattern";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { seasons } from "@/lib/db/schema";
import { seasonUpdateSchema, type Season } from "@/store/battle-record/battleRecord";
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

  const parsed = seasonUpdateSchema.safeParse(body);
  return match(parsed)
    .with({ success: false }, ({ error }) =>
      NextResponse.json({ error: error.flatten() }, { status: 422 }),
    )
    .with({ success: true }, async ({ data: input }) => {
      const updated = await withChildSpan(
        "db.seasons.update",
        async (span) => {
          span.setAttribute("db.season_id", id);
          return db
            .update(seasons)
            .set({
              ...(input.name !== undefined && { name: input.name }),
              ...(input.format !== undefined && { format: input.format }),
              ...(input.ruleMark !== undefined && { ruleMark: input.ruleMark ?? null }),
              ...(input.startedAt !== undefined && { startedAt: input.startedAt ?? null }),
              ...(input.endedAt !== undefined && { endedAt: input.endedAt ?? null }),
            })
            .where(and(eq(seasons.id, id), eq(seasons.userId, userId)))
            .returning();
        },
        { op: "db.query" },
      );

      if (updated.length === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(toDto(updated[0]));
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

  await withChildSpan(
    "db.seasons.delete",
    async (span) => {
      span.setAttribute("db.season_id", id);
      return db.delete(seasons).where(and(eq(seasons.id, id), eq(seasons.userId, userId)));
    },
    { op: "db.query" },
  );

  return NextResponse.json({ success: true });
}
