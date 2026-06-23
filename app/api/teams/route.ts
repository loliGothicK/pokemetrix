import { NextResponse } from "next/server";

export async function GET(_request: Request) {
  // 1. セッションの確認（ログインユーザーか？）
  // 2. データベース（PrismaやSupabaseなど）からチーム一覧を取得
  // const teams = await db.team.findMany(...);

  return NextResponse.json({
    /* teams */
  });
}

export async function POST(_request: Request) {
  // 1. セッションの確認
  // 2. リクエストボディのパース
  // 3. データベースへの保存処理

  return NextResponse.json({ success: true });
}
