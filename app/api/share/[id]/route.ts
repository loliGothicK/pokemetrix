import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sharedTeams } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withChildSpan } from "@/lib/otel";

export async function GET(
  _request: Request,
  { params }: { readonly params: Promise<{ readonly id: string }> },
) {
  const { id } = await params;

  const rows = await withChildSpan(
    "db.share.get",
    async (span) => {
      span.setAttribute("db.share_id", id);
      return db.select().from(sharedTeams).where(eq(sharedTeams.id, id)).limit(1);
    },
    { op: "db.query" },
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = rows[0];
  return NextResponse.json({
    id: row.id,
    snapshot: row.snapshot,
    createdAt: row.createdAt,
  });
}
