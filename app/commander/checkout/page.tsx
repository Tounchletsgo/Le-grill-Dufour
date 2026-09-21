import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { getDictionary, t } from "@/i18n";
import { getMenuData } from "@/lib/menu";
import CheckoutPage from "@/components/commander/CheckoutPage";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const locale = getLocale();
  const dict = getDictionary(locale);
  return {
    title: t(dict, "meta.checkoutTitle"),
    description: t(dict, "meta.commanderDescription"),
  };
}

export default async function CommanderCheckout() {
  const { deliveryConfig } = await getMenuData();
  return <CheckoutPage deliveryConfig={deliveryConfig} />;
}
