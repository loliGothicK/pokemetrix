import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextFromQuery = searchParams.get("next");

  console.log("[Auth Callback] GET request received:", {
    url: request.url,
    hasCode: !!code,
    nextFromQuery,
  });

  if (code) {
    const cookieStore = await cookies();
    const returnToCookie = cookieStore.get("auth-return-to")?.value;
    const next = nextFromQuery || returnToCookie || "/";

    const locale =
      cookieStore.get("poketistix-language")?.value ??
      cookieStore.get("pokemetrix-language")?.value ??
      "en";

    const redirectPath = next === "/" ? `/${locale}` : next;
    const redirectUrl = `${origin}${redirectPath}`;
    const response = NextResponse.redirect(redirectUrl);

    // 使用済みの auth-return-to クッキーを削除
    response.cookies.set("auth-return-to", "", { maxAge: 0, path: "/" });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            console.log(
              "[Auth Callback] setAll called with:",
              cookiesToSet.map((c) => ({
                name: c.name,
                options: c.options,
              })),
            );
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch (e) {
                console.error("[Auth Callback] cookieStore.set error:", e);
              }
              // options (path: '/', httpOnly, etc.) を完全に保持して response に設定
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("[Auth Callback] exchangeCodeForSession:", {
      success: !error,
      user: data?.user?.email,
      session: !!data?.session,
      error: error?.message,
    });

    if (!error) {
      // @supabase/supabase-js v2.91.0+ の SIGNED_IN 遅延（setTimeout 0）対策
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("[Auth Callback] Redirecting to:", redirectUrl);
      return response;
    }
    console.error("[Auth Callback] exchangeCodeForSession failed:", error);
  }

  console.error("[Auth Callback] Missing code or exchange failed, redirecting to /?error=auth");
  return NextResponse.redirect(`${origin}/?error=auth`);
}
