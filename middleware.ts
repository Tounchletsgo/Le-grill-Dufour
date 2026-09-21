import { NextRequest, NextResponse } from "next/server";

const NL_SLUG_MAP: Record<string, string> = {
  "/nl": "/",
  "/nl/de-kaart": "/la-carte",
  "/nl/bestellen": "/commander",
  "/nl/bestellen/afrekenen": "/commander/checkout",
  "/nl/reserveren": "/reserver",
  "/nl/cadeaubonnen": "/cheques-cadeaux",
  "/nl/contact": "/contact",
  "/nl/juridische-vermeldingen": "/mentions-legales",
  "/nl/privacybeleid": "/politique-de-confidentialite",
};

const LOCALE_COOKIE = "gdf-locale";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/nl")) {
    const matched = NL_SLUG_MAP[pathname];
    let frRoute: string;

    if (matched) {
      frRoute = matched;
    } else if (pathname.startsWith("/nl/commande/")) {
      frRoute = pathname.replace("/nl/commande/", "/commande/");
    } else if (pathname.startsWith("/nl/feedback/")) {
      frRoute = pathname.replace("/nl/feedback/", "/feedback/");
    } else {
      frRoute = pathname.replace(/^\/nl/, "") || "/";
    }

    const url = request.nextUrl.clone();
    url.pathname = frRoute;

    const response = NextResponse.rewrite(url);
    response.headers.set("x-locale", "nl");
    response.headers.set("x-pathname", pathname);
    response.cookies.set(LOCALE_COOKIE, "nl", { path: "/", maxAge: 365 * 24 * 60 * 60, sameSite: "lax" });
    return response;
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;

  if (cookieLocale === "nl" && pathname === "/") {
    const referer = request.headers.get("referer") || "";
    const isDirectVisit = !referer || !referer.includes(request.nextUrl.host);
    if (isDirectVisit) {
      const url = request.nextUrl.clone();
      url.pathname = "/nl";
      const response = NextResponse.redirect(url);
      return response;
    }
  }

  if (!cookieLocale && pathname === "/") {
    const acceptLang = request.headers.get("accept-language") || "";
    const isNlBrowser = /\bnl\b/i.test(acceptLang.split(",").slice(0, 3).join(","));
    if (isNlBrowser) {
      const url = request.nextUrl.clone();
      url.pathname = "/nl";
      const response = NextResponse.redirect(url);
      response.cookies.set(LOCALE_COOKIE, "nl", { path: "/", maxAge: 365 * 24 * 60 * 60, sameSite: "lax" });
      return response;
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-locale", "fr");
  response.headers.set("x-pathname", pathname);
  if (!cookieLocale) {
    response.cookies.set(LOCALE_COOKIE, "fr", { path: "/", maxAge: 365 * 24 * 60 * 60, sameSite: "lax" });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
