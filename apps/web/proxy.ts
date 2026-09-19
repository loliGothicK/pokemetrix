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

  // If request is like /en/auth/callback or /ja/auth/callback, redirect to /auth/...
  const authLocaleMatch = pathname.match(/^\/(?:en|ja)(\/auth(?:\/.*)?)$/);
  if (authLocaleMatch) {
    request.nextUrl.pathname = authLocaleMatch[1];
    const redirectAuthResponse = NextResponse.redirect(request.nextUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectAuthResponse.cookies.set(cookie);
    });
    return redirectAuthResponse;
  }

  // Exclude static files, API routes, auth routes, and known nextjs internals from locale redirect
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname === "/manifest.json" ||
    pathname === "/icon.svg" ||
    pathname === "/apple-icon.png" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname.includes("/opengraph-image") ||
    (pathname.startsWith("/google") && pathname.endsWith(".html"))
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
  const cookieLocale =
    request.cookies.get("poketistix-language")?.value ??
    request.cookies.get("pokemetrix-language")?.value;
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

  // supabaseResponse の全 Cookie とキャッシュヘッダーを引き継ぐ
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = supabaseResponse.headers.get(header);
    if (value) redirectResponse.headers.set(header, value);
  }

  return redirectResponse;
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのパスにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - monitoring (Sentry tunnelRoute)
     * - favicon.ico, sitemap.xml, robots.txt, google verification html
     */
    "/((?!_next/static|_next/image|monitoring|favicon.ico|sitemap.xml|robots.txt|google[a-z0-9]+\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
