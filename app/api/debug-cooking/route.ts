import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { getMenuData } = await import("@/lib/menu");
    const { categories } = await getMenuData();

    const viandes = categories.find((c) => c.slug === "viandes");
    const grillades = categories.find((c) => c.slug === "grillades");

    const mapItems = (items: any[]) =>
      items.map((item: any) => ({
        name: item.name,
        cooking_group_id: item.cooking_group_id,
        cooking_required: item.cooking_required,
        cooking_group: item.cooking_group,
        cooking_group_truthy: !!item.cooking_group,
        option_groups: item.option_groups,
        is_deliverable: item.is_deliverable,
        is_orderable: item.is_orderable,
      }));

    return NextResponse.json({
      source: "getMenuData()",
      viandes: viandes ? mapItems(viandes.menu_items) : "NOT FOUND",
      grillades: grillades ? mapItems(grillades.menu_items.slice(0, 3)) : "NOT FOUND",
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) });
  }
}
