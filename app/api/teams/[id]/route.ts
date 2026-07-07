import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { teams } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { withChildSpan } from "@/lib/otel";

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
    "db.teams.delete",
    async (span) => {
      span.setAttribute("db.team_id", id);
      return db.delete(teams).where(and(eq(teams.id, id), eq(teams.userId, userId)));
    },
    { op: "db.query" },
  );

  return NextResponse.json({ success: true });
}
