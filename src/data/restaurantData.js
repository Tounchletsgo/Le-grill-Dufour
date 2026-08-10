/**
 * restaurantData.js
 * -----------------------------------------------------------------------
 * Informations générales du restaurant : coordonnées, horaires, menus
 * fixes, formule de groupe, spécialité de la maison.
 * -----------------------------------------------------------------------
 */

export const restaurant = {
  name: "Le Grill du Four",
  tagline: "Viandes d'exception & grillades au feu de bois",
  city: "Mouscron",
  logo: "/logo-grill-du-four.webp",
  address: {
    street: "Rue des Courtils - Hovenstraat 1B",
    postalCode: "7700",
    city: "Mouscron",
    region: "Hainaut",
    country: "Belgique",
    full: "Rue des Courtils - Hovenstraat 1B, 7700 Mouscron, Hainaut, Belgique"
  },
  phone: "+32 56 34 28 70",
  phoneHref: "tel:+3256342870",
  email: "chriswillen@me.com",
  emailHref: "mailto:chriswillen@me.com",
  tva: "BE0726458932",
  mapsEmbedSrc:
    "https://www.google.com/maps?q=Rue+des+Courtils+1B,+7700+Mouscron,+Belgium&output=embed",
  mapsLink:
    "https://www.google.com/maps/search/?api=1&query=Rue+des+Courtils+1B+7700+Mouscron+Belgium",
  social: {
    facebook: "#",
    instagram: "#"
  }
};

/**
 * Horaires d'ouverture. "closed: true" => fermé ce jour-là.
 */
export const hours = [
  { day: "Lundi", closed: false, ranges: ["11h45 – 15h00", "18h45 – 22h00"] },
  { day: "Mardi", closed: false, ranges: ["11h45 – 15h00", "18h45 – 22h00"] },
  { day: "Mercredi", closed: true, ranges: [] },
  { day: "Jeudi", closed: true, ranges: [] },
  { day: "Vendredi", closed: false, ranges: ["11h45 – 15h00", "18h45 – 22h00"] },
  { day: "Samedi", closed: false, ranges: ["11h45 – 15h00", "18h45 – 22h00"] },
  { day: "Dimanche", closed: false, ranges: ["11h45 – 15h00"] }
];

/**
 * Menus fixes / formules à prix unique.
 */
export const menus = [
  {
    name: "Menu Enfant",
    price: 15,
    description: "Une formule pensée pour les plus jeunes gourmets.",
    highlight: false
  },
  {
    name: "Menu Grill",
    price: 38,
    description: "Le classique du Grill du Four, viande grillée et accompagnements au choix.",
    highlight: false
  },
  {
    name: "Menu Bistrot",
    price: 39,
    description: "Une sélection bistrot généreuse, entre tradition et gourmandise.",
    highlight: false
  },
  {
    name: "Menu Côte à l'Os",
    price: 47,
    description: "La pièce emblématique de la maison, cuisson maîtrisée à la perfection.",
    highlight: true
  },
  {
    name: "Menu Prestige",
    price: 56,
    description: "Notre offre la plus raffinée pour une expérience grill d'exception.",
    highlight: true
  }
];

/**
 * Formule de groupe (min. 20 personnes).
 */
export const groupFormula = {
  name: "Formule de groupe",
  price: 68,
  minPersons: 20,
  aperitif: "Apéritif au choix",
  plats: [
    "Côte à l'os ±450g",
    "Pavé de bœuf argentin",
    "Irish",
    "Piano",
    "Burger Dufour",
    "Risotto langoustines, légumes de saison",
    "Salade de chèvre ou César",
    "Trilogie de poisson"
  ],
  dessert: "Irish, Dame blanche ou café gourmand (gâteau sur commande)",
  boissons: "All in : vin, bière pression, cava & soft"
};

/**
 * Spécialité signature de la maison, mise en avant visuellement.
 */
export const potenceDufour = {
  name: "Potence Dufour",
  price: 38,
  perPerson: "250g / personne",
  minPersons: 2,
  description:
    "Filet et onglet de bœuf flambé au Grand Marnier devant vous et ses légumes de saison."
};

/**
 * Suggestion du boucher (mention libre, sans prix fixe).
 */
export const suggestionBoucher = {
  text: "N'hésitez pas à consulter notre tableau de Viandes Prestiges ou suggestions."
};

/**
 * Notes générales affichées sur le site (mentions légales / pratiques).
 */
export const generalNotes = [
  "Tous nos plats sont accompagnés de frites, croquettes, gratin dauphinois, purée, riz ou pâtes.",
  "Choix de légumes chauds ou salade.",
  "Une seule addition par table.",
  "En cas d'allergies, n'hésitez pas à en parler aux serveurs."
];

/**
 * Données structurées SEO (JSON-LD) — voir usage dans index.html.
 */
export const structuredData = {
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
    addressCountry: "BE"
  },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Friday", "Saturday"], opens: "11:45", closes: "15:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Friday", "Saturday"], opens: "18:45", closes: "22:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Sunday"], opens: "11:45", closes: "15:00" }
  ]
};
