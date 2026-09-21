import type { Metadata } from "next";
import "@/styles/main.css";
import { restaurant, structuredData } from "@/data/restaurantData";
import { LocaleProvider } from "@/i18n/LocaleContext";
import { getLocale } from "@/i18n/server";
import { getDictionary, t } from "@/i18n";
import { routeMap } from "@/i18n/types";
import { headers } from "next/headers";

export const metadata: Metadata = {
  metadataBase: new URL("https://legrilldufour.be"),
  title: "Grill Dufour | Restaurant & Grill à Mouscron",
  description:
    `Grill Dufour, restaurant de cuisine au grill à Mouscron. Côte à l'os, steaks, burgers premium, poissons et planches dans un cadre soigné. Réservez au ${restaurant.phone}.`,
  keywords:
    "restaurant Mouscron, grillades Mouscron, grill Belgique, côte à l'os, restaurant viande, Grill Dufour",
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    title: "Grill Dufour | Restaurant & Grill à Mouscron",
    description:
      "Viandes, grillades au feu de bois et planches généreuses dans un cadre soigné à Mouscron.",
    images: "/images/logo/grill-dufour-logo-noir-2000px.png",
    locale: "fr_BE",
    url: "https://legrilldufour.be/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grill Dufour | Restaurant & Grill à Mouscron",
    description:
      "Viandes, grillades au feu de bois et planches généreuses dans un cadre soigné à Mouscron.",
  },
  alternates: { canonical: "https://legrilldufour.be" },
  other: { "theme-color": "#8C2434" },
};

const jsonLd = structuredData;

function getHreflangLinks(pathname: string): { fr: string; nl: string } | null {
  const base = "https://legrilldufour.be";
  const cleanPath = pathname.startsWith("/nl") ? pathname : pathname;

  for (const [frRoute, map] of Object.entries(routeMap)) {
    if (cleanPath === map.fr || cleanPath === map.nl) {
      return { fr: `${base}${map.fr}`, nl: `${base}${map.nl}` };
    }
  }
  return null;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const dict = getDictionary(locale);
  const hdrs = headers();
  const pathname = hdrs.get("x-pathname") || "/";
  const hreflang = getHreflangLinks(pathname);

  return (
    <html lang={locale === "nl" ? "nl-BE" : "fr"}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8C2434" />
        {hreflang && (
          <>
            <link rel="alternate" hrefLang="fr" href={hreflang.fr} />
            <link rel="alternate" hrefLang="nl-BE" href={hreflang.nl} />
            <link rel="alternate" hrefLang="x-default" href={hreflang.fr} />
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <LocaleProvider locale={locale}>
          {children}
        </LocaleProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js"))`,
          }}
        />
      </body>
    </html>
  );
}
