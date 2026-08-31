import type { Metadata } from "next";
import { getMenuData } from "@/lib/menu";
import CheckoutPage from "@/components/commander/CheckoutPage";

export const metadata: Metadata = {
  title: "Finaliser la commande | Grill Dufour",
  description: "Finalisez votre commande en ligne — livraison ou à emporter.",
};

export default async function LivraisonCheckout() {
  const { deliveryConfig } = await getMenuData();
  return <CheckoutPage deliveryConfig={deliveryConfig} />;
}
