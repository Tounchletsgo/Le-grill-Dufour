/**
 * menuData.js
 * -----------------------------------------------------------------------
 * Toutes les données de la carte du restaurant Grill Dufour.
 * Ce fichier est la SOURCE UNIQUE de vérité pour les plats et les prix.
 *
 * Transcription MOT POUR MOT depuis les photos de la carte.
 *
 * Convention :
 *  - price: number  -> prix en euros (ex: 14.5)
 *  - price: null    -> prix non communiqué / à définir par le restaurateur
 *  - price: "text"  -> prix variable ou avec supplément (ex: "+3 €")
 *
 * Champs de commande (optionnels) :
 *  - is_deliverable: boolean  -> true si disponible en livraison
 *  - cooking_group: string    -> clé du groupe de cuisson (cookingData.ts)
 *  - option_groups: string[]  -> clés des groupes d'options (optionGroups.ts)
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
    { name: "Salade de scampis croustillants", description: null, price: 14, is_deliverable: true, option_groups: ["entree_en_plat", "accompagnement_feculent", "accompagnement_legumes", "sauces"] },
    { name: "Salade burratina, pesto, balsamique", description: null, price: 16, is_deliverable: true, option_groups: ["entree_en_plat", "accompagnement_feculent", "accompagnement_legumes", "sauces"] },
    { name: "Carpaccio de Holstein", description: null, price: 22, is_deliverable: true, option_groups: ["entree_en_plat", "accompagnement_feculent", "accompagnement_legumes", "sauces"] },
    { name: "Moëlle du chef", description: "Pain de campagne, moëlle, fines herbes", price: 14, is_deliverable: true, option_groups: ["entree_en_plat", "accompagnement_feculent", "accompagnement_legumes", "sauces"] },
    { name: "Scampis à l'ail ou à la diable", description: null, price: 15, is_deliverable: true, option_groups: ["entree_en_plat", "accompagnement_feculent", "accompagnement_legumes", "sauces"] },
    { name: "Terrine façon Yves Stal", description: null, price: 9, is_deliverable: true, option_groups: ["entree_en_plat", "accompagnement_feculent", "accompagnement_legumes", "sauces"] },
    { name: "Saumon fumé", description: "Toast, guacamole, shimeji, oignons", price: 16, is_deliverable: true, option_groups: ["entree_en_plat", "accompagnement_feculent", "accompagnement_legumes", "sauces"] },
    { name: "Tomates crevettes", description: null, price: 23, is_deliverable: true, option_groups: ["entree_en_plat", "accompagnement_feculent", "accompagnement_legumes", "sauces"] },
    { name: "Assiette anglaise", description: null, price: 14, is_deliverable: true, option_groups: ["entree_en_plat", "accompagnement_feculent", "accompagnement_legumes", "sauces"] }
  ],
  entreesNote: "Entrée disponible en plat, accompagnement compris +6,50 €",
  suggestionBoucher: "N'hésitez pas à consulter notre tableau de Viandes Prestiges ou suggestions.",

  /* ------------------------------------------------------------------ */
  /* CROQUETTES MAISON                                                   */
  /* ------------------------------------------------------------------ */
  croquettes: [
    {
      name: "Croquettes de fromage",
      weight: "± 60gr",
      variants: [
        { label: "Entrée (2 pièces)", price: 14 },
        { label: "Plat (3 pièces)", price: 19 }
      ],
      is_deliverable: true,
      option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces"]
    },
    {
      name: "Croquettes de crevette",
      weight: "± 60gr",
      variants: [
        { label: "Entrée (2 pièces)", price: 20 },
        { label: "Plat (3 pièces)", price: 27 }
      ],
      is_deliverable: true,
      option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces"]
    }
  ],

  /* ------------------------------------------------------------------ */
  /* VIANDES                                                             */
  /* ------------------------------------------------------------------ */
  viandes: [
    { name: "Pavé de bœuf argentin", description: null, price: 22.5, is_deliverable: true, cooking_group: "boeuf", option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_legumes", "flambadou"] },
    { name: "Filet pur", description: null, price: 34, is_deliverable: true, cooking_group: "boeuf", option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_legumes", "flambadou"] },
    { name: "Filet pur Rossini", description: null, price: 39, is_deliverable: true, cooking_group: "boeuf", option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_legumes", "flambadou"] },
    { name: "Côte à l'os +/- 450gr", description: null, price: 31, is_deliverable: true, cooking_group: "boeuf", option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_legumes", "flambadou"] },
    { name: "Tartare de bœuf non préparé", description: null, price: 19.5, is_deliverable: true, option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_legumes"] },
    { name: "Tartare préparé sur chariot", description: "Supplément", price: "+3 €", is_deliverable: false },
    {
      name: "Burger Dufour (Porc et bœuf)",
      description: "Pain au sésame, Steak Haché, Cheddar vieilli, sauce BBQ Maison, salade, tomates",
      price: 21,
      supplements: [
        { label: "Supplément foie gras", price: "+5 €" },
        { label: "Supplément étage", price: "+6 €" }
      ],
      is_deliverable: true,
      cooking_group: "cuisson_imposee",
      option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_burger"]
    },
    {
      name: "Ch'ti Burger (Porc et bœuf)",
      description: "Burger Dufour + œuf poché et crème de maroilles",
      price: 25,
      is_deliverable: true,
      cooking_group: "cuisson_imposee",
      option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_burger"]
    }
  ],

  /* ------------------------------------------------------------------ */
  /* GRILLADES                                                           */
  /* ------------------------------------------------------------------ */
  grillades: [
    { name: "Côtes piano", description: null, price: 19, is_deliverable: true, cooking_group: "boeuf", option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_legumes", "flambadou"] },
    { name: "Côtes piano XXL", description: null, price: 28, is_deliverable: true, cooking_group: "boeuf", option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_legumes", "flambadou"] },
    { name: "Filet de volaille épicée", description: null, price: 18, is_deliverable: true, cooking_group: "cuisson_imposee", option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_legumes"] },
    { name: "Filet de volaille au maroilles", description: null, price: 20, is_deliverable: true, cooking_group: "cuisson_imposee", option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_legumes"] },
    { name: "Scampis grillés épicés", description: null, price: 18, is_deliverable: true, cooking_group: "cuisson_imposee", option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_legumes"] },
    { name: "Votre viande flambadou", description: null, price: "+5 €" }
  ],

  /* ------------------------------------------------------------------ */
  /* ACCOMPAGNEMENTS & SAUCES                                            */
  /* ------------------------------------------------------------------ */
  accompagnements: {
    intro: "Tous nos plats sont accompagnés de frites, croquettes, gratin dauphinois, purée, riz ou pâtes.",
    choix: "Choix de légumes chauds ou salade.",
    sauceTiers: [
      { price: "3 €", items: ["Champignons", "Poivre", "Échalotes", "Béarnaise", "Maroilles"] },
      { price: "3,50 €", items: ["Truffes"] },
      { price: "1 €", items: ["Mayonnaise maison", "Ketchup", "BBQ maison"] }
    ],
    supplements: [
      { name: "Beurre ail", price: 2 },
      { name: "Suppléments légumes de saison", price: 4 }
    ]
  },

  /* ------------------------------------------------------------------ */
  /* POISSONS                                                            */
  /* ------------------------------------------------------------------ */
  poissons: [
    { name: "Trilogie de poisson", description: null, price: 22, is_deliverable: true, cooking_group: "cuisson_imposee", option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_legumes"] },
    { name: "Cabillaud", description: null, price: 27, is_deliverable: true, cooking_group: "cuisson_imposee", option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_legumes"] },
    { name: "Feuilleté de saumon, purée, béarnaise", description: null, price: 25, is_deliverable: true, cooking_group: "cuisson_imposee", option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_legumes"] },
    { name: "Nouilles sautées aux scampis façon Thaï", description: null, price: 24, is_deliverable: true, cooking_group: "cuisson_imposee", option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_legumes"] },
    { name: "Poisson du jour", description: "Selon arrivage", price: 20, is_deliverable: true, cooking_group: "cuisson_imposee", option_groups: ["accompagnement_feculent", "accompagnement_legumes", "sauces", "supplement_legumes"] }
  ],

  /* ------------------------------------------------------------------ */
  /* SALADES & VEGGIES                                                   */
  /* ------------------------------------------------------------------ */
  salades: [
    { name: "Salade de briques de chèvre chaud", description: "Miel, lardons, noix", price: 20, is_deliverable: true, option_groups: ["accompagnement_feculent", "sauces"] },
    { name: "Salade César", description: "Poulet, vinaigrette César, copeaux de Parmesan", price: 21, is_deliverable: true, option_groups: ["accompagnement_feculent", "sauces"] },
    { name: "Salade Dufour", description: "Mix Terre & Mer et foie gras", price: 26, is_deliverable: true, option_groups: ["accompagnement_feculent", "sauces"] },
    { name: "Salade de la Mer", description: null, price: 24, is_deliverable: true, option_groups: ["accompagnement_feculent", "sauces"] },
    {
      name: "Inspiration du chef chaud",
      description: "7 sortes de légumes sautés au beurre d'ail, œufs parfait, buratina, coupelle de feuille de brique",
      price: 21,
      is_deliverable: true,
      option_groups: ["accompagnement_feculent", "sauces"]
    },
    {
      name: "Inspiration du chef froid",
      description: "Coupelle de feuille de brique, salade, légumes crus et marinés, œuf poché, buratina",
      price: 19,
      is_deliverable: true,
      option_groups: ["accompagnement_feculent", "sauces"]
    }
  ],
  saladesNote: "À base de légumes. Avec ou sans œufs et fromage.",
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
      ],
      is_deliverable: true
    },
    {
      name: "Planche du Boucher",
      description: "Boudin, Saucisse, Merguez, Piano, 4 sauces",
      variants: [
        { label: "2 personnes", price: 18 },
        { label: "4 personnes", price: 32 }
      ],
      is_deliverable: true
    },
    {
      name: "Big Planche La Dufour",
      description: null,
      variants: [
        { label: "6 personnes", price: 44 }
      ],
      is_deliverable: true
    },
    {
      name: "Planche Prestige",
      description: "Bellota, Jambon de Parme, Carpaccio Holstein fumé maturé, Croquettes Maison, Fromages",
      variants: [
        { label: "2 personnes", price: 20 },
        { label: "4 personnes", price: 36 }
      ],
      is_deliverable: true
    }
  ],

  /* ------------------------------------------------------------------ */
  /* DESSERTS                                                            */
  /* ------------------------------------------------------------------ */
  desserts: [
    { name: "Dessert signature by Dufour", description: null, price: 12, is_deliverable: true },
    { name: "Crème brûlée", description: null, price: 9, is_deliverable: true },
    { name: "Salade de fruits frais", description: null, price: 10, is_deliverable: true },
    { name: "Trilogie de sorbets", description: "Citron, fruits passion, fruits rouges", price: 9, is_deliverable: false },
    { name: "Dame blanche", description: "Glace vanille, chocolat chaud", price: 8, is_deliverable: false },
    { name: "Dame noire", description: "Glace chocolat, chocolat chaud", price: 8, is_deliverable: false },
    { name: "Demi-ananas flambé au Cointreau", description: null, price: 9, is_deliverable: false },
    { name: "Fondant au chocolat maison", description: "15 min. de cuisson", price: 9, is_deliverable: true },
    { name: "Café ou Thé gourmand", description: null, price: 9.5, is_deliverable: false },
    { name: "Colonel citron vodka blanche", description: null, price: 9, is_deliverable: false },
    { name: "Colonel Framboise Ma Belle", description: null, price: 9, is_deliverable: false },
    { name: "Poire Colonel", description: null, price: 9, is_deliverable: false },
    { name: "Mousse au chocolat trompe-l'œil", description: null, price: 10, is_deliverable: true },
    { name: "Tiramisu Oreo", description: null, price: 8.5, is_deliverable: true },
    { name: "Suggestion de la pâtissière", description: null, price: "Voir tableau" },
    { name: "La planche fromagère", description: "Par personnes", price: 10.5, is_deliverable: true }
  ],

  /* ------------------------------------------------------------------ */
  /* BOISSONS CHAUDES                                                    */
  /* ------------------------------------------------------------------ */
  boissons: [
    { name: "Café Storme Vittorio", price: 3 },
    { name: "Café aromatisé", description: "Spéculoos, cookie, noisette, vanille", price: 3.5 },
    { name: "Cappuccino", price: 3.5 },
    { name: "Thé", price: 3.5 },
    { name: "Chocolat chaud", price: 2.8 },
    { name: "Chocolat chaud viennois", price: 3.3 },
    { name: "Irish / Italian Coffee", price: 8.8 },
    { name: "French / Caribbean Coffee", price: 8.8 },
    { name: "Russian / Baileys Coffee", price: 8.8 },
    { name: "Irish Coffee Glacé", price: 8.8 },
    { name: "Irish Coffee XXL", price: 16.5 }
  ],

  /* ------------------------------------------------------------------ */
  /* DIGESTIFS                                                           */
  /* ------------------------------------------------------------------ */
  digestifs: [
    { name: "Get 27", volume: "6cl", price: 8.3 },
    { name: "Baileys", volume: "6cl", price: 8.3 },
    { name: "Limoncello Ma Belle", volume: "6cl", price: 8.3 },
    { name: "Frangelico", volume: "6cl", price: 7.5 },
    { name: "Amaretto Ma Belle", volume: "4cl", price: 8 },
    { name: "Cointreau", volume: "4cl", price: 8.5 },
    { name: "Grand Marnier", volume: "4cl", price: 8.5 },
    { name: "Cognac Drouet", volume: "4cl", price: 12 },
    { name: "Armagnac", volume: "4cl", price: 8 },
    { name: "Calvados", volume: "4cl", price: 7.5 },
    { name: "Poire Williams", volume: "4cl", price: 7.5 },
    { name: "Poire Cognac «Ma Belle»", volume: "6cl", price: 7.5 },
    { name: "Framboise «Ma Belle»", volume: "6cl", price: 7.5 },
    { name: "Chartreuse", volume: "4cl", price: 9.5 },
    { name: "Disaronno Velvet", volume: "4cl", price: 8 },
    { name: "Armagnac VSOP", volume: "4cl", price: 10 }
  ],

  /* ------------------------------------------------------------------ */
  /* COCKTAILS DIGESTIFS                                                 */
  /* ------------------------------------------------------------------ */
  cocktails: [
    { name: "Espresso Martini", description: null, price: 10 },
    { name: "Madeleine", description: "Cointreau, Amaretto, ananas", price: 11 },
    { name: "Orgasme", description: "Jet 27, Baileys", price: 11 }
  ],

  /* ------------------------------------------------------------------ */
  /* WHISKY                                                              */
  /* ------------------------------------------------------------------ */
  whisky: [
    { name: "Aberfeldy 12 ans", volume: "4cl", price: 9 },
    { name: "Chivas 12 ans", volume: "4cl", price: 9 },
    { name: "Talisker 10 ans", volume: "4cl", price: 9 },
    { name: "Oban 14 ans", volume: "4cl", price: 11 }
  ],

  /* ------------------------------------------------------------------ */
  /* RHUM                                                                */
  /* ------------------------------------------------------------------ */
  rhum: [
    { name: "Diplomatico", volume: "4cl", price: 9 },
    { name: "Santa Teresa 1796", volume: "4cl", price: 10 },
    { name: "Don Papa", volume: "4cl", price: 8 },
    { name: "El Dorado Demerara 1996", volume: "4cl", price: 22 }
  ],

  /* ------------------------------------------------------------------ */
  /* COLLECTION JACOULOT                                                 */
  /* ------------------------------------------------------------------ */
  jacoulot: [
    { name: "Jacoulot - Menthe poivrée", volume: "4cl", price: 8.5 },
    { name: "Jacoulot - Abricot", volume: "4cl", price: 8.5 },
    { name: "Jacoulot - Mandarine", volume: "4cl", price: 8.5 }
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
