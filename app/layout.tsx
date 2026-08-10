import type { Metadata } from "next";
import "@/styles/main.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://legrilldufour.be"),
  title: "Le Grill du Four | Restaurant Viande & Grillades à Mouscron",
  description:
    "Le Grill du Four, restaurant de viande et grillades à Mouscron. Côte à l'os, steaks, burgers premium, poissons et planches dans un cadre chic et chaleureux. Réservez au +32 56 34 28 70.",
  keywords:
    "restaurant Mouscron, grillades Mouscron, steakhouse Belgique, côte à l'os, restaurant viande, Le Grill du Four",
  robots: "index, follow",
  icons: {
    icon: "/logo-grill-du-four.webp",
    apple: "/logo-grill-du-four.webp",
  },
  openGraph: {
    type: "website",
    title: "Le Grill du Four | Restaurant Viande & Grillades à Mouscron",
    description:
      "Viandes d'exception, grillades au feu de bois et planches gourmandes dans un cadre chic et chaleureux à Mouscron.",
    images: "/logo-grill-du-four.webp",
    locale: "fr_BE",
    url: "https://legrilldufour.be/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Le Grill du Four | Restaurant Viande & Grillades à Mouscron",
    description:
      "Viandes d'exception, grillades au feu de bois et planches gourmandes dans un cadre chic et chaleureux à Mouscron.",
  },
  alternates: { canonical: "https://legrilldufour.be/" },
  other: { "theme-color": "#0a0a0a" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Le Grill du Four",
  image: "https://legrilldufour.be/logo-grill-du-four.webp",
  "@id": "https://legrilldufour.be",
  url: "https://legrilldufour.be",
  telephone: "+32 56 34 28 70",
  email: "chriswillen@me.com",
  servesCuisine: ["Grillades", "Viandes", "Steakhouse", "Cuisine belge"],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
