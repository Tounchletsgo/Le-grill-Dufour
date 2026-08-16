import type { Metadata } from "next";
import "@/styles/main.css";
import { restaurant, structuredData } from "@/data/restaurantData";

export const metadata: Metadata = {
  metadataBase: new URL("https://legrilldufour.be"),
  title: "Grill Dufour | Restaurant & Grill à Mouscron",
  description:
    `Grill Dufour, restaurant de cuisine au grill à Mouscron. Côte à l'os, steaks, burgers premium, poissons et planches dans un cadre soigné. Réservez au ${restaurant.phone}.`,
  keywords:
    "restaurant Mouscron, grillades Mouscron, grill Belgique, côte à l'os, restaurant viande, Grill Dufour",
  robots: "index, follow",
  icons: {
    icon: "/images/logo/grill-dufour-logo-noir.svg",
    apple: "/images/logo/grill-dufour-logo-noir-1000px.png",
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
  alternates: { canonical: "https://legrilldufour.be/" },
  other: { "theme-color": "#FBF8F4" },
};

const jsonLd = structuredData;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FBF8F4" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js"))`,
          }}
        />
      </body>
    </html>
  );
}
