import type { Metadata } from "next";
import { getMenuData } from "@/lib/menu";
import OrderPage from "@/components/commander/OrderPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Commander en ligne | Grill Dufour — Livraison & À emporter",
  description:
    "Commandez en ligne vos grillades, burgers et plats du jour. Livraison à Mouscron et alentours ou retrait au restaurant.",
  alternates: { canonical: "https://legrilldufour.be/commander" },
};

export default async function CommanderPage() {
  const { categories, deliveryConfig, openingHours } = await getMenuData();

  return (
    <OrderPage categories={categories} deliveryConfig={deliveryConfig} openingHours={openingHours} />
  );
}
