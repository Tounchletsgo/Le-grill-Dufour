/**
 * menuData.js
 * -----------------------------------------------------------------------
 * Toutes les données de la carte du restaurant Grill Dufour.
 * Ce fichier est la SOURCE UNIQUE de vérité pour les plats et les prix.
 *
 * Pour modifier un prix ou un plat : il suffit d'éditer ce fichier,
 * le site se met à jour automatiquement (aucune modification HTML requise).
 *
 * Convention :
 *  - price: number  -> prix en euros (ex: 14.5)
 *  - price: null    -> prix non communiqué / à définir par le restaurateur
 *  - price: "text"  -> prix variable ou avec supplément (ex: "18€/2pers, 32€/4pers")
 * -----------------------------------------------------------------------
 */

export const menuData = {
  /* ------------------------------------------------------------------ */
  /* LUNCH (formules du midi, en semaine)                                */
  /* ------------------------------------------------------------------ */
  lunch: {
    intro: "En semaine, sur le temps du midi, notre Chef vous propose ses différentes formules « lunch ».",
    note: "Possibilité de suppléments selon les produits.",
    allergyNote: "En cas d'allergies, n'hésitez pas à en parler aux serveurs.",
    base: [
      { name: "Entrée", price: 6 },
      { name: "Plat", price: 14 },
      { name: "Dessert", price: 6 }
    ],
    formules: [
      { name: "Formule 1", description: "Plat du jour", price: 14 },
      { name: "Formule 2", description: "Entrée + Plat du jour", price: 20 },
      { name: "Formule 3", description: "Plat du jour + Dessert", price: 20 },
      { name: "Formule 4", description: "Entrée + Plat du jour + Dessert", price: 26 }
    ]
  },

  /* ------------------------------------------------------------------ */
  /* ENTRÉES                                                             */
  /* ------------------------------------------------------------------ */
  entrees: [
    { name: "Salade de scampis croustillants", description: null, price: 14.5 },
    { name: "Salade burratina, pesto, balsamique", description: null, price: 16 },
    { name: "Carpaccio de Holstein", description: null, price: 22 },
    { name: "Moëlle du chef", description: "Pain de campagne, moëlle, fines herbes", price: 14 },
    { name: "Scampis à l'ail ou à la diable", description: null, price: 15 },
    { name: "Terrine façon Yves Stal", description: null, price: null },
    { name: "Saumon fumé", description: "Toast, guacamole, shimeji, oignons", price: 16 },
    { name: "Tomates crevettes", description: null, price: 23 },
    { name: "Assiette anglaise", description: null, price: 14 }
  ],
  entreesNote: "Entrée disponible en plat, accompagnement compris.",
  suggestionBoucher: "N'hésitez pas à consulter notre tableau de Viandes Prestiges ou suggestions.",

  /* ------------------------------------------------------------------ */
  /* CROQUETTES MAISON                                                   */
  /* ------------------------------------------------------------------ */
  croquettes: [
    {
      name: "Croquettes de fromage",
      weight: "60g",
      variants: [
        { label: "Entrée (2 pièces)", price: 14.5 },
        { label: "Plat (3 pièces)", price: 19.5 }
      ]
    },
    {
      name: "Croquettes de crevette",
      weight: "60g",
      variants: [
        { label: "Entrée (2 pièces)", price: 20 },
        { label: "Plat (3 pièces)", price: 27 }
      ]
    }
  ],

  /* ------------------------------------------------------------------ */
  /* VIANDES                                                             */
  /* ------------------------------------------------------------------ */
  viandes: [
    { name: "Pavé de bœuf argentin", description: null, price: 22.5 },
    { name: "Filet pur", description: null, price: 34 },
    { name: "Filet pur Rossini", description: null, price: 39 },
    { name: "Côte à l'os", description: "±450g", price: 31 },
    { name: "Tartare de bœuf non préparé", description: null, price: 19.5 },
    { name: "Tartare préparé sur chariot", description: "Supplément", price: "+3 €" }
  ],

  /* ------------------------------------------------------------------ */
  /* GRILLADES                                                           */
  /* ------------------------------------------------------------------ */
  grillades: [
    { name: "Côtes Piano", description: null, price: 28 },
    { name: "Côtes Piano XXL", description: null, price: 18 },
    { name: "Filet de volaille épicée", description: null, price: 20 },
    { name: "Filet de volaille au maroilles", description: null, price: 18 },
    { name: "Scampis grillés épicés", description: null, price: null },
    {
      name: "Burger Dufour",
      description: "Porc & bœuf — Pain au sésame, steak haché, cheddar vieilli, sauce BBQ maison, salade, tomates.",
      price: 21,
      supplements: [
        { label: "Supplément foie gras", price: "+5 €" },
        { label: "Supplément étage", price: "+6 €" }
      ]
    },
    { name: "Votre viande flambadou", description: null, price: "+5 €" },
    {
      name: "Chti Burger",
      description: "Porc & bœuf — Burger Dufour + œuf poché et crème de maroilles",
      price: 25
    }
  ],

  /* ------------------------------------------------------------------ */
  /* ACCOMPAGNEMENTS & SAUCES                                            */
  /* ------------------------------------------------------------------ */
  accompagnements: {
    intro: "Tous nos plats sont accompagnés de frites, croquettes, gratin dauphinois, purée, riz ou pâtes.",
    choix: "Choix de légumes chauds ou salade.",
    sauces: [
      "Champignons", "Poivre", "Échalotes", "Béarnaise", "Maroilles",
      "Truffes", "Mayonnaise maison", "Ketchup", "BBQ maison"
    ],
    supplements: [
      { name: "Beurre ail", price: 2 },
      { name: "Supplément légumes de saison", price: 4 }
    ]
  },

  /* ------------------------------------------------------------------ */
  /* POISSONS                                                            */
  /* ------------------------------------------------------------------ */
  poissons: [
    { name: "Trilogie de poisson", description: null, price: 22 },
    { name: "Cabillaud", description: null, price: 27 },
    { name: "Feuilleté de saumon", description: "Purée, béarnaise", price: 25 },
    { name: "Nouilles sautées aux scampis façon Thaï", description: null, price: 24 },
    { name: "Poisson du jour", description: "Selon arrivage", price: 20 }
  ],

  /* ------------------------------------------------------------------ */
  /* SALADES & VEGGIES                                                   */
  /* ------------------------------------------------------------------ */
  salades: [
    { name: "Salade de briques de chèvre chaud", description: "Miel, lardons, noix", price: 20 },
    { name: "Salade César", description: "Poulet, vinaigrette César, copeaux de Parmesan", price: 21 },
    { name: "Salade Dufour", description: "Mix Terre & Mer et foie gras", price: 26 },
    { name: "Salade de la Mer", description: null, price: 24 },
    {
      name: "Inspiration du chef chaud",
      description: "7 sortes de légumes sautés au beurre d'ail, œufs parfait, burratina, coupelle de feuille de brique",
      price: 21
    },
    {
      name: "Inspiration du chef froid",
      description: "Coupelle de feuille de brique, salade, légumes crus et marinés, œuf poché, burratina",
      price: 19
    }
  ],
  saladesNote: "À base de légumes, avec ou sans œufs et fromage.",
  planchesNote: "Nos planches sont servies soit en apéritif à partager soit en entrée.",
  poissonsNote: "N'hésitez pas à consulter nos suggestions.",

  /* ------------------------------------------------------------------ */
  /* PLANCHES                                                            */
  /* ------------------------------------------------------------------ */
  planches: [
    {
      name: "La Dufour",
      description: "Foie gras et sa confiture, Burratina, Gressins et tapenade d'olives, Terrine du grand-père, 3 sortes de charcuteries fines, Saumon fumé, Croquettes maison, Fromages",
      variants: [
        { label: "2 personnes", price: 18 },
        { label: "4 personnes", price: 32 }
      ]
    },
    {
      name: "Planche du Boucher",
      description: "Boudin, Saucisse, Merguez, Piano, 4 sauces",
      variants: [
        { label: "2 personnes", price: 18 },
        { label: "4 personnes", price: 32 }
      ]
    },
    {
      name: "Big Planche La Dufour",
      description: null,
      variants: [
        { label: "6 personnes", price: 44 }
      ]
    },
    {
      name: "Planche Prestige",
      description: "Bellota, Jambon de Parme, Carpaccio Holstein fumé maturé, Croquettes Maison, Fromages",
      variants: [
        { label: "2 personnes", price: 20 },
        { label: "4 personnes", price: 36 }
      ]
    }
  ],

  /* ------------------------------------------------------------------ */
  /* DESSERTS                                                            */
  /* ------------------------------------------------------------------ */
  desserts: [
    { name: "Dessert signature by Dufour", description: null, price: 12 },
    { name: "Crème brûlée", description: null, price: 10 },
    { name: "Salade de fruits frais", description: null, price: null },
    { name: "Trilogie de sorbets", description: "Citron, fruits passion, fruits rouges", price: 9 },
    { name: "Dame blanche", description: "Glace vanille, chocolat chaud", price: 8 },
    { name: "Dame noire", description: "Glace chocolat, chocolat chaud", price: 8 },
    { name: "Demi-ananas flambé au Cointreau", description: null, price: null },
    { name: "Fondant au chocolat maison", description: "15 min de cuisson", price: null },
    { name: "Café ou thé gourmand", description: null, price: null },
    { name: "Colonel citron vodka blanche", description: null, price: null },
    { name: "Colonel Framboise Ma Belle", description: null, price: null },
    { name: "Poire Colonel", description: null, price: null },
    { name: "Mousse au chocolat trompe-l'œil", description: null, price: null },
    { name: "Tiramisu Oreo", description: null, price: null },
    { name: "Suggestion de la pâtissière", description: "Voir tableau", price: null },
    { name: "La planche fromagère", description: "Par personne", price: 10.5 }
  ],

  /* ------------------------------------------------------------------ */
  /* BOISSONS CHAUDES                                                    */
  /* ------------------------------------------------------------------ */
  boissons: [
    { name: "Café", price: null },
    { name: "Café aromatisé", price: null },
    { name: "Spéculoos", price: null },
    { name: "Cookie", price: null },
    { name: "Noisette", price: null },
    { name: "Vanille", price: null },
    { name: "Cappuccino", price: null },
    { name: "Thé", price: null },
    { name: "Chocolat chaud", price: null },
    { name: "Chocolat chaud viennois", price: null },
    { name: "Irish Coffee", price: null },
    { name: "Italian Coffee", price: null },
    { name: "French Coffee", price: null },
    { name: "Caribbean Coffee", price: null },
    { name: "Russian Coffee", price: null }
  ],

  /* ------------------------------------------------------------------ */
  /* DIGESTIFS                                                           */
  /* ------------------------------------------------------------------ */
  digestifs: [
    { name: "Get 27", volume: "6cl", price: null },
    { name: "Baileys", volume: "6cl", price: null },
    { name: "Limoncello Ma Belle", volume: "6cl", price: null },
    { name: "Frangelico", volume: "6cl", price: null },
    { name: "Amaretto Ma Belle", volume: "4cl", price: null },
    { name: "Cointreau", volume: "4cl", price: null },
    { name: "Grand Marnier", volume: "4cl", price: null },
    { name: "Cognac Drouet", volume: "4cl", price: null },
    { name: "Armagnac", volume: "4cl", price: null },
    { name: "Calvados", volume: "4cl", price: null },
    { name: "Poire Williams", volume: "4cl", price: null },
    { name: "Poire Cognac Ma Belle", volume: "6cl", price: null },
    { name: "Framboise Ma Belle", volume: "6cl", price: null },
    { name: "Chartreuse", volume: "4cl", price: null },
    { name: "Disaronno Velvet", volume: "4cl", price: null },
    { name: "Armagnac VSOP", volume: "4cl", price: null }
  ],

  /* ------------------------------------------------------------------ */
  /* COCKTAILS DIGESTIFS                                                 */
  /* ------------------------------------------------------------------ */
  cocktails: [
    { name: "Espresso Martini", description: null, price: null },
    { name: "Madeleine", description: "Cointreau, Amaretto, ananas", price: null },
    { name: "Orgasme", description: "Jet 27, Baileys", price: null },
    { name: "Café Storme Vittorio", description: null, price: null },
    { name: "Irish / Italian Coffee", description: null, price: null },
    { name: "French / Caribbean Coffee", description: null, price: null },
    { name: "Russian / Baileys Coffee", description: null, price: null },
    { name: "Irish Coffee Glacé", description: null, price: null },
    { name: "Irish Coffee XXL", description: null, price: 16.3 }
  ],

  /* ------------------------------------------------------------------ */
  /* WHISKY                                                              */
  /* ------------------------------------------------------------------ */
  whisky: [
    { name: "Aberfeldy 12 ans", volume: "4cl", price: null },
    { name: "Chivas 12 ans", volume: "4cl", price: null },
    { name: "Talisker 10 ans", volume: "4cl", price: null },
    { name: "Oban 14 ans", volume: "4cl", price: null }
  ],

  /* ------------------------------------------------------------------ */
  /* RHUM                                                                */
  /* ------------------------------------------------------------------ */
  rhum: [
    { name: "Diplomatico", volume: "4cl", price: null },
    { name: "Santa Teresa 1796", volume: "4cl", price: null },
    { name: "Don Papa", volume: "4cl", price: null },
    { name: "El Dorado Demerara 1996", volume: "4cl", price: null }
  ],

  /* ------------------------------------------------------------------ */
  /* COLLECTION JACOULOT                                                 */
  /* ------------------------------------------------------------------ */
  jacoulot: [
    { name: "Jacoulot Menthe poivrée", volume: "4cl", price: null },
    { name: "Jacoulot Abricot", volume: "4cl", price: null },
    { name: "Jacoulot Mandarine", volume: "4cl", price: null }
  ]
};

/**
 * Ordre & labels des onglets pour la navigation de la carte.
 * "key" doit correspondre à une clé de menuData.
 */
export const menuTabs = [
  { key: "lunch", label: "Lunch" },
  { key: "entrees", label: "Entrées" },
  { key: "croquettes", label: "Croquettes" },
  { key: "planches", label: "Planches" },
  { key: "viandes", label: "Viandes" },
  { key: "grillades", label: "Grillades" },
  { key: "poissons", label: "Poissons" },
  { key: "salades", label: "Salades & Veggies" },
  { key: "desserts", label: "Desserts" },
  { key: "boissons", label: "Boissons" },
  { key: "digestifs", label: "Digestifs" },
  { key: "cocktails", label: "Cocktails" },
  { key: "whisky", label: "Whisky" },
  { key: "rhum", label: "Rhum" },
  { key: "jacoulot", label: "Jacoulot" }
];

/**
 * Formate un prix pour l'affichage.
 * @param {number|string|null} price
 * @returns {string}
 */
export function formatPrice(price) {
  if (price === null || price === undefined) return "Prix sur demande";
  if (typeof price === "string") return price;
  return price.toFixed(2).replace(".", ",").replace(",00", "") + " €";
}
