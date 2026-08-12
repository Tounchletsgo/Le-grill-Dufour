export interface CookingLevel {
  key: string;
  label: string;
  description: string;
  temperature: string;
  color: string;
  sort_order: number;
}

export interface CookingGroup {
  key: string;
  label: string;
  delivery_offset: number;
  levels: {
    key: string;
    is_default: boolean;
    is_recommended: boolean;
    available_delivery: boolean;
  }[];
}

export const cookingLevels: CookingLevel[] = [
  { key: "bleu",         label: "Bleu",         description: "Saisi à l'extérieur, rouge et froid à cœur",   temperature: "45-50°C", color: "#4A90D9", sort_order: 1 },
  { key: "saignant",     label: "Saignant",     description: "Croûte dorée, cœur rouge et chaud",            temperature: "50-55°C", color: "#DC2626", sort_order: 2 },
  { key: "mi_saignant",  label: "Mi-saignant",  description: "Rosé soutenu au centre, juteux",               temperature: "55-60°C", color: "#E85D75", sort_order: 3 },
  { key: "a_point",      label: "À point",      description: "Rosé léger au centre, tendre",                 temperature: "60-65°C", color: "#F59E0B", sort_order: 4 },
  { key: "mi_cuit",      label: "Mi-cuit",      description: "Légèrement rosé, cuisson homogène",            temperature: "65-70°C", color: "#D97706", sort_order: 5 },
  { key: "bien_cuit",    label: "Bien cuit",    description: "Uniformément cuit, pas de rosé",               temperature: "70-75°C", color: "#92400E", sort_order: 6 },
  { key: "cuit_a_coeur", label: "Cuit à cœur",  description: "Cuisson complète obligatoire (viande hachée, volaille, porc)", temperature: "75°C+", color: "#6B7280", sort_order: 7 },
];

export const cookingGroups: CookingGroup[] = [
  {
    key: "boeuf", label: "Bœuf", delivery_offset: 1,
    levels: [
      { key: "bleu",        is_default: false, is_recommended: false, available_delivery: true },
      { key: "saignant",    is_default: false, is_recommended: true,  available_delivery: true },
      { key: "mi_saignant", is_default: false, is_recommended: true,  available_delivery: true },
      { key: "a_point",     is_default: true,  is_recommended: true,  available_delivery: true },
      { key: "mi_cuit",     is_default: false, is_recommended: false, available_delivery: true },
      { key: "bien_cuit",   is_default: false, is_recommended: false, available_delivery: true },
    ],
  },
  {
    key: "magret", label: "Magret", delivery_offset: 1,
    levels: [
      { key: "saignant",    is_default: true,  is_recommended: true,  available_delivery: true },
      { key: "mi_saignant", is_default: false, is_recommended: true,  available_delivery: true },
      { key: "a_point",     is_default: false, is_recommended: false, available_delivery: true },
    ],
  },
  {
    key: "agneau", label: "Agneau", delivery_offset: 1,
    levels: [
      { key: "saignant",    is_default: false, is_recommended: true,  available_delivery: true },
      { key: "mi_saignant", is_default: true,  is_recommended: true,  available_delivery: true },
      { key: "a_point",     is_default: false, is_recommended: true,  available_delivery: true },
      { key: "mi_cuit",     is_default: false, is_recommended: false, available_delivery: true },
      { key: "bien_cuit",   is_default: false, is_recommended: false, available_delivery: true },
    ],
  },
  {
    key: "veau", label: "Veau", delivery_offset: 1,
    levels: [
      { key: "a_point",   is_default: true,  is_recommended: true,  available_delivery: true },
      { key: "mi_cuit",   is_default: false, is_recommended: true,  available_delivery: true },
      { key: "bien_cuit", is_default: false, is_recommended: false, available_delivery: true },
    ],
  },
  {
    key: "gibier", label: "Gibier", delivery_offset: 1,
    levels: [
      { key: "saignant",    is_default: false, is_recommended: true,  available_delivery: true },
      { key: "mi_saignant", is_default: true,  is_recommended: true,  available_delivery: true },
      { key: "a_point",     is_default: false, is_recommended: false, available_delivery: true },
    ],
  },
  {
    key: "abats_rouges", label: "Abats rouges", delivery_offset: 1,
    levels: [
      { key: "saignant",    is_default: true,  is_recommended: true,  available_delivery: true },
      { key: "mi_saignant", is_default: false, is_recommended: true,  available_delivery: true },
      { key: "a_point",     is_default: false, is_recommended: false, available_delivery: true },
    ],
  },
  {
    key: "cuisson_imposee", label: "Cuisson imposée", delivery_offset: 0,
    levels: [
      { key: "cuit_a_coeur", is_default: true, is_recommended: false, available_delivery: true },
    ],
  },
];

export function getLevelByKey(key: string): CookingLevel | undefined {
  return cookingLevels.find((l) => l.key === key);
}

export function getGroupByKey(key: string): CookingGroup | undefined {
  return cookingGroups.find((g) => g.key === key);
}

export function getGroupLevels(groupKey: string): (CookingLevel & { is_default: boolean; is_recommended: boolean; available_delivery: boolean })[] {
  const group = getGroupByKey(groupKey);
  if (!group) return [];
  return group.levels
    .map((gl) => {
      const level = getLevelByKey(gl.key);
      if (!level) return null;
      return { ...level, is_default: gl.is_default, is_recommended: gl.is_recommended, available_delivery: gl.available_delivery };
    })
    .filter(Boolean) as (CookingLevel & { is_default: boolean; is_recommended: boolean; available_delivery: boolean })[];
}

export function isLockedGroup(groupKey: string): boolean {
  return groupKey === "cuisson_imposee";
}

export function getDeliveryOffset(groupKey: string): number {
  return getGroupByKey(groupKey)?.delivery_offset ?? 0;
}

export function getKitchenLevel(orderedKey: string, groupKey: string): CookingLevel | undefined {
  const offset = getDeliveryOffset(groupKey);
  if (offset === 0) return getLevelByKey(orderedKey);
  const orderedLevel = getLevelByKey(orderedKey);
  if (!orderedLevel) return undefined;
  const targetSortOrder = orderedLevel.sort_order - offset;
  const groupLevels = getGroupLevels(groupKey);
  const lower = groupLevels.filter((l) => l.sort_order <= targetSortOrder).sort((a, b) => b.sort_order - a.sort_order);
  return lower[0] || groupLevels[0];
}
