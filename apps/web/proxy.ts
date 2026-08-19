import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const locales = ["en", "ja"];
const defaultLocale = "en";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // トークンを検証・更新する（getSession()ではなくgetClaims()を使うこと）
  await supabase.auth.getClaims();

  const { pathname } = request.nextUrl;

  // Exclude static files, API routes, and known nextjs internals from locale redirect
  if (
    pathname.startsWith("/api/") ||
    pathname === "/manifest.json" ||
    pathname === "/icon.svg" ||
    pathname === "/apple-icon.png" ||
    pathname.includes("/opengraph-image")
  ) {
    return supabaseResponse;
  }

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) {
    return supabaseResponse;
  }

  // Fallback to cookie, then Accept-Language, then default
  let locale = defaultLocale;
  const cookieLocale = request.cookies.get("pokemetrix-language")?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const acceptLanguage = request.headers.get("accept-language");
    if (acceptLanguage) {
      if (acceptLanguage.includes("ja")) {
        locale = "ja";
      }
    }
  }

  request.nextUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const redirectResponse = NextResponse.redirect(request.nextUrl);
  
  // supabase.auth.getClaims() によって更新されたCookieを引き継ぐ
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });

  return redirectResponse;
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのパスにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
