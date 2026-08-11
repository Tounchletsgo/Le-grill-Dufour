import type { Metadata } from "next";
import { getMenuData } from "@/lib/menu";
import OrderPage from "@/components/commander/OrderPage";

export const metadata: Metadata = {
  title: "Commander en ligne | Grill Dufour",
  description:
    "Commandez en ligne vos viandes, grillades et plats du Grill Dufour. Livraison ou à emporter à Mouscron et alentours.",
};

export default async function CommanderPage() {
  const { categories, deliveryConfig } = await getMenuData();

  return (
    <OrderPage categories={categories} deliveryConfig={deliveryConfig} />
  );
}
