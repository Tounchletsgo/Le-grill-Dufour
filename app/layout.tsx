import type { Metadata } from "next";
import "@/styles/main.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://legrilldufour.be"),
  title: "Grill Dufour | Restaurant & Grill à Mouscron",
  description:
    "Grill Dufour, restaurant de cuisine au grill à Mouscron. Côte à l'os, steaks, burgers premium, poissons et planches dans un cadre soigné. Réservez au +32 56 34 28 70.",
  keywords:
    "restaurant Mouscron, grillades Mouscron, grill Belgique, côte à l'os, restaurant viande, Grill Dufour",
  robots: "index, follow",
  icons: {
    icon: "/logo-grill-dufour.webp",
    apple: "/logo-grill-dufour.webp",
  },
  openGraph: {
    type: "website",
    title: "Grill Dufour | Restaurant & Grill à Mouscron",
    description:
      "Viandes, grillades au feu de bois et planches généreuses dans un cadre soigné à Mouscron.",
    images: "/logo-grill-dufour.webp",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Grill Dufour",
  image: "https://legrilldufour.be/logo-grill-dufour.webp",
  "@id": "https://legrilldufour.be",
  url: "https://legrilldufour.be",
  telephone: "+32 56 34 28 70",
  email: "chriswillen@me.com",
  servesCuisine: ["Grillades", "Viandes", "Cuisine au grill", "Cuisine belge"],
  priceRange: "€€€",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Rue des Courtils - Hovenstraat 1B",
    addressLocality: "Mouscron",
    postalCode: "7700",
    addressRegion: "Hainaut",
    addressCountry: "BE",
  },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Friday", "Saturday"], opens: "11:45", closes: "15:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Friday", "Saturday"], opens: "18:45", closes: "22:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Sunday"], opens: "11:45", closes: "15:00" },
  ],
};

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
