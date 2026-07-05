import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = claims.claims.sub;

  // TODO: DBから該当チームを削除
  // await supabase.from("teams").delete().eq("id", id).eq("user_id", userId);
  console.log(`Delete team: ${id} for user: ${userId}`);

  return NextResponse.json({ success: true });
}
