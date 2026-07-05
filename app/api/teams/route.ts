import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request) {
  const supabase = await createClient();

  // セッション確認（getClaims()で検証）
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = claims.claims.sub;

  // TODO: DBからユーザーのチーム一覧を取得
  // const { data: teams } = await supabase.from("teams").select("*").eq("user_id", userId);
  console.log(`Fetch teams for user: ${userId}`);

  return NextResponse.json([]);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = claims.claims.sub;
  const teams = await request.json();

  // TODO: DBへチームを保存
  // await supabase.from("teams").upsert(teams.map(t => ({ ...t, user_id: userId })));
  console.log(`Save teams for user: ${userId}`, teams);

  return NextResponse.json({ success: true });
}
