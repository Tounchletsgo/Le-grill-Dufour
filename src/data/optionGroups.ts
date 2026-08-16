export interface OptionChoice {
  key: string;
  label: string;
  price: number;
  is_decline?: boolean;
}

export interface OptionGroup {
  key: string;
  label: string;
  subtitle?: string;
  type: "single" | "multiple";
  required: boolean;
  allow_quantity: boolean;
  sort_order: number;
  disabled_delivery: boolean;
  options: OptionChoice[];
}

export const optionGroups: Record<string, OptionGroup> = {
  entree_en_plat: {
    key: "entree_en_plat",
    label: "Format",
    type: "single",
    required: false,
    allow_quantity: false,
    sort_order: 0,
    disabled_delivery: false,
    options: [
      { key: "version_entree", label: "Version entrée", price: 0 },
      { key: "version_plat", label: "Version plat, accompagnement compris", price: 6.5 },
    ],
  },

  accompagnement_feculent: {
    key: "accompagnement_feculent",
    label: "Accompagnement",
    type: "single",
    required: true,
    allow_quantity: false,
    sort_order: 1,
    disabled_delivery: false,
    options: [
      { key: "frites", label: "Frites", price: 0 },
      { key: "croquettes", label: "Croquettes", price: 0 },
      { key: "gratin_dauphinois", label: "Gratin dauphinois", price: 0 },
      { key: "puree", label: "Purée", price: 0 },
      { key: "riz", label: "Riz", price: 0 },
      { key: "pates", label: "Pâtes", price: 0 },
      { key: "sans_feculent", label: "Sans féculent", price: 0, is_decline: true },
    ],
  },

  accompagnement_legumes: {
    key: "accompagnement_legumes",
    label: "Légumes ou salade",
    type: "single",
    required: true,
    allow_quantity: false,
    sort_order: 2,
    disabled_delivery: false,
    options: [
      { key: "legumes_chauds", label: "Légumes chauds", price: 0 },
      { key: "salade", label: "Salade", price: 0 },
      { key: "sans_legumes", label: "Sans légumes/salade", price: 0, is_decline: true },
    ],
  },

  sauces: {
    key: "sauces",
    label: "Sauces au choix",
    subtitle: "en supplément",
    type: "multiple",
    required: false,
    allow_quantity: true,
    sort_order: 3,
    disabled_delivery: false,
    options: [
      { key: "champignons", label: "Champignons", price: 3 },
      { key: "poivre", label: "Poivre", price: 3 },
      { key: "echalotes", label: "Échalotes", price: 3 },
      { key: "bearnaise", label: "Béarnaise", price: 3 },
      { key: "maroilles", label: "Maroilles", price: 3 },
      { key: "truffes", label: "Truffes", price: 3.5 },
      { key: "beurre_ail", label: "Beurre ail", price: 2 },
      { key: "mayonnaise", label: "Mayonnaise maison", price: 1 },
      { key: "ketchup", label: "Ketchup", price: 1 },
      { key: "bbq", label: "BBQ maison", price: 1 },
    ],
  },

  supplement_legumes: {
    key: "supplement_legumes",
    label: "Supplément",
    type: "single",
    required: false,
    allow_quantity: false,
    sort_order: 4,
    disabled_delivery: false,
    options: [
      { key: "legumes_saison", label: "Suppléments légumes de saison", price: 4 },
    ],
  },

  supplement_burger: {
    key: "supplement_burger",
    label: "Suppléments burger",
    type: "multiple",
    required: false,
    allow_quantity: false,
    sort_order: 4,
    disabled_delivery: false,
    options: [
      { key: "foie_gras", label: "Supplément foie gras", price: 5 },
      { key: "etage", label: "Supplément étage", price: 6 },
    ],
  },

  veggie_options: {
    key: "veggie_options",
    label: "Préférences",
    type: "multiple",
    required: false,
    allow_quantity: false,
    sort_order: 1,
    disabled_delivery: false,
    options: [
      { key: "sans_oeufs", label: "Sans œufs", price: 0, is_decline: true },
      { key: "sans_fromage", label: "Sans fromage", price: 0, is_decline: true },
    ],
  },

  flambadou: {
    key: "flambadou",
    label: "Flambadou",
    type: "single",
    required: false,
    allow_quantity: false,
    sort_order: 5,
    disabled_delivery: true,
    options: [
      { key: "flambadou", label: "Votre viande flambadou", price: 5 },
    ],
  },
};

export function getOptionGroup(key: string): OptionGroup | undefined {
  return optionGroups[key];
}

export function getVisibleGroups(
  keys: string[],
  isDelivery: boolean
): OptionGroup[] {
  return keys
    .map((k) => optionGroups[k])
    .filter((g): g is OptionGroup => !!g && !(isDelivery && g.disabled_delivery))
    .sort((a, b) => a.sort_order - b.sort_order);
}
