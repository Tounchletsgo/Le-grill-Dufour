import type { Metadata } from "next";
import { getMenuData } from "@/lib/menu";
import OrderPage from "@/components/commander/OrderPage";

export const metadata: Metadata = {
  title: "Commander & Livraison | Le Grill du Four",
  description:
    "Commandez en ligne vos viandes, grillades et plats du Grill du Four. Livraison à Mouscron et alentours.",
};

export default async function LivraisonPage() {
  const { categories, deliveryConfig } = await getMenuData();

  return (
    <OrderPage categories={categories} deliveryConfig={deliveryConfig} />
  );
}
