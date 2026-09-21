export type Locale = "fr" | "nl";

export const defaultLocale: Locale = "fr";
export const locales: Locale[] = ["fr", "nl"];

export const routeMap: Record<string, Record<Locale, string>> = {
  "/": { fr: "/", nl: "/nl" },
  "/la-carte": { fr: "/la-carte", nl: "/nl/de-kaart" },
  "/commander": { fr: "/commander", nl: "/nl/bestellen" },
  "/commander/checkout": { fr: "/commander/checkout", nl: "/nl/bestellen/afrekenen" },
  "/reserver": { fr: "/reserver", nl: "/nl/reserveren" },
  "/cheques-cadeaux": { fr: "/cheques-cadeaux", nl: "/nl/cadeaubonnen" },
  "/contact": { fr: "/contact", nl: "/nl/contact" },
  "/mentions-legales": { fr: "/mentions-legales", nl: "/nl/juridische-vermeldingen" },
  "/politique-de-confidentialite": { fr: "/politique-de-confidentialite", nl: "/nl/privacybeleid" },
};

const nlSlugToFrRoute: Record<string, string> = {};
for (const [frRoute, map] of Object.entries(routeMap)) {
  const nlPath = map.nl;
  nlSlugToFrRoute[nlPath] = frRoute;
}

export function resolveLocaleFromPath(pathname: string): { locale: Locale; canonicalRoute: string } {
  if (pathname.startsWith("/nl")) {
    const matched = nlSlugToFrRoute[pathname];
    if (matched) return { locale: "nl", canonicalRoute: matched };
    if (pathname.startsWith("/nl/commande/")) return { locale: "nl", canonicalRoute: pathname.replace("/nl/commande/", "/commande/") };
    if (pathname.startsWith("/nl/feedback/")) return { locale: "nl", canonicalRoute: pathname.replace("/nl/feedback/", "/feedback/") };
    return { locale: "nl", canonicalRoute: pathname.replace(/^\/nl/, "") || "/" };
  }
  return { locale: "fr", canonicalRoute: pathname };
}

export function localizedHref(frRoute: string, locale: Locale): string {
  if (locale === "fr") return frRoute;
  const map = routeMap[frRoute];
  if (map) return map.nl;
  if (frRoute.startsWith("/commande/")) return "/nl" + frRoute;
  if (frRoute.startsWith("/feedback/")) return "/nl" + frRoute;
  return "/nl" + frRoute;
}
