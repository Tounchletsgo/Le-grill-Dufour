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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8C2434" />
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
