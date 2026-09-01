import type {
  CategoryWithItems,
  DeliveryConfig,
  FixedMenu,
  MenuItemWithRelations,
} from "@/types/database";

export async function getMenuData(): Promise<{
  categories: CategoryWithItems[];
  deliveryConfig: DeliveryConfig;
  fixedMenus: FixedMenu[];
}> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      return await fetchFromSupabase();
    } catch {
      // fallback to local data
    }
  }
  return getLocalData();
}

function getDefaultOptionGroups(catSlug: string, item: any): string[] {
  const base = ["accompagnement_feculent", "accompagnement_legumes", "sauces"];

  switch (catSlug) {
    case "entrees":
      return ["entree_en_plat", ...base];
    case "croquettes":
      return [...base];
    case "viandes":
      if (item.supplements?.length > 0) {
        return [...base, "supplement_burger"];
      }
      return [...base, "supplement_legumes", "flambadou"];
    case "grillades":
      return [...base, "supplement_legumes", "flambadou"];
    case "poissons":
      return [...base, "supplement_legumes"];
    default:
      return [];
  }
}

async function fetchFromSupabase() {
  const { supabase } = await import("@/lib/supabase");

  const [catRes, configRes, menusRes] = await Promise.all([
    supabase
      .from("categories")
      .select("*, menu_items(*, item_variants:item_variants(*), item_supplements:item_supplements(*), cooking_group:cooking_groups(*))")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("delivery_config").select("*").single(),
    supabase
      .from("fixed_menus")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  if (catRes.error) throw catRes.error;
  if (configRes.error) throw configRes.error;
  if (menusRes.error) throw menusRes.error;

  const categories = (catRes.data as any[]).map((cat) => ({
    ...cat,
    menu_items: (cat.menu_items || [])
      .filter((item: any) => item.is_active)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((item: any) => {
        const mapped = {
          ...item,
          variants: (item.item_variants || item.variants || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
          supplements: (item.item_supplements || item.supplements || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
          cooking_group: item.cooking_group || null,
        };
        mapped.option_groups = item.option_groups || getDefaultOptionGroups(cat.slug, mapped);
        return mapped;
      }),
  })) as CategoryWithItems[];

  return {
    categories,
    deliveryConfig: configRes.data as DeliveryConfig,
    fixedMenus: menusRes.data as FixedMenu[],
  };
}

function getLocalData() {
  const { menuData, menuTabs } = require("@/data/menuData");
  const { delivery, menus } = require("@/data/restaurantData");

  const nonOrderableCategories = new Set([
    "boissons", "digestifs", "cocktails", "whisky", "rhum", "jacoulot",
  ]);

  const now = new Date().toISOString();
  let itemCounter = 0;

  const categories: CategoryWithItems[] = menuTabs.map(
    (tab: { key: string; label: string }, catIdx: number) => {
      const slug = tab.key;
      const catId = `local-cat-${slug}`;
      const rawData = menuData[slug];
      const isNonOrderable = nonOrderableCategories.has(slug);

      let items: MenuItemWithRelations[] = [];

      if (slug === "lunch") {
        const allLunch = [...(rawData.base || []), ...(rawData.formules || [])];
        items = allLunch.map((item: any, i: number) => {
          itemCounter++;
          return {
            id: `local-item-${itemCounter}`,
            category_id: catId,
            name: item.name,
            description: item.description || null,
            price: typeof item.price === "number" ? item.price : null,
            price_label: typeof item.price === "string" ? item.price : null,
            weight: null,
            volume: null,
            is_orderable: typeof item.price === "number",
            is_active: true,
            sort_order: i,
            is_deliverable: false,
            delivery_price: null,
            delivery_description: null,
            delivery_sort_order: null,
            is_delivery_only: false,
            image_url: null,
            is_out_of_stock: false,
            cooking_group_id: null,
            cooking_required: false,
            created_at: now,
            updated_at: now,
            variants: [],
            supplements: [],
            cooking_group: null,
            option_groups: [],
          };
        });
      } else if (Array.isArray(rawData)) {
        items = rawData.map((item: any, i: number) => {
          itemCounter++;
          const id = `local-item-${itemCounter}`;
          const hasVariants = !!(item.variants && item.variants.length > 0);
          const priceIsString = typeof item.price === "string";
          const priceIsNumber = typeof item.price === "number";

          const isOrderable =
            !isNonOrderable &&
            !priceIsString &&
            (priceIsNumber || hasVariants);

          const variants = hasVariants
            ? item.variants.map((v: any, vi: number) => ({
                id: `local-var-${id}-${vi}`,
                item_id: id,
                label: v.label,
                price: v.price,
                sort_order: vi,
              }))
            : [];

          const supplements =
            item.supplements
              ? item.supplements.map((s: any, si: number) => ({
                  id: `local-sup-${id}-${si}`,
                  item_id: id,
                  label: s.label,
                  price: parseFloat(String(s.price).replace(/[^0-9.,]/g, "").replace(",", ".")),
                  sort_order: si,
                }))
              : [];

          const cookingGroupKey = item.cooking_group || null;
          const cookingGroupObj = cookingGroupKey
            ? { id: `local-cg-${cookingGroupKey}`, key: cookingGroupKey, label: cookingGroupKey, delivery_offset: 0, sort_order: 0 }
            : null;

          return {
            id,
            category_id: catId,
            name: item.name,
            description: item.description || null,
            price: priceIsNumber ? item.price : null,
            price_label: priceIsString ? item.price : null,
            weight: item.weight || null,
            volume: item.volume || null,
            is_orderable: isOrderable,
            is_active: true,
            sort_order: i,
            is_deliverable: !!item.is_deliverable,
            delivery_price: null,
            delivery_description: null,
            delivery_sort_order: null,
            is_delivery_only: false,
            image_url: null,
            is_out_of_stock: false,
            cooking_group_id: cookingGroupKey,
            cooking_required: !!cookingGroupKey,
            created_at: now,
            updated_at: now,
            variants,
            supplements,
            cooking_group: cookingGroupObj,
            option_groups: item.option_groups || [],
          };
        });
      }

      return {
        id: catId,
        slug,
        label: tab.label,
        intro: rawData?.intro || null,
        note:
          menuData[`${slug}Note`] ||
          rawData?.note ||
          null,
        sort_order: catIdx,
        is_active: true,
        created_at: now,
        updated_at: now,
        menu_items: items,
      };
    }
  );

  const deliveryConfig: DeliveryConfig = {
    id: "local-delivery",
    is_enabled: delivery.enabled,
    min_order: delivery.minOrder,
    fee: delivery.fee,
    zone_description: delivery.zone,
    zone_radius_km: 15,
    zone_center_postal: "7700",
    estimated_time: delivery.estimatedTime,
    pickup_time: delivery.pickupTime,
    delivery_min_time: 20,
    delivery_max_time: 60,
    discount_percentage: 10,
    discount_active: true,
    updated_at: now,
  };

  const fixedMenus: FixedMenu[] = menus.map((m: any, i: number) => ({
    id: `local-menu-${i}`,
    name: m.name,
    price: m.price,
    description: m.description,
    is_highlight: m.highlight,
    is_active: true,
    sort_order: i,
    created_at: now,
    updated_at: now,
  }));

  return { categories, deliveryConfig, fixedMenus };
}
