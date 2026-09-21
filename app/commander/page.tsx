import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { getDictionary, t } from "@/i18n";
import { getMenuData } from "@/lib/menu";
import OrderPage from "@/components/commander/OrderPage";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const locale = getLocale();
  const dict = getDictionary(locale);
  return {
    title: t(dict, "meta.commanderTitle"),
    description: t(dict, "meta.commanderDescription"),
    alternates: {
      canonical: "https://legrilldufour.be/commander",
      languages: { "fr": "/commander", "nl": "/nl/bestellen" },
    },
  };
}

export default async function CommanderPage() {
  const { categories, deliveryConfig, openingHours } = await getMenuData();

  return (
    <OrderPage categories={categories} deliveryConfig={deliveryConfig} openingHours={openingHours} />
  );
}
