import type { Metadata } from "next";
import CheckoutPage from "@/components/commander/CheckoutPage";

export const metadata: Metadata = {
  title: "Finaliser la commande | Le Grill du Four",
  description: "Finalisez votre commande en ligne — livraison ou à emporter.",
};

export default function Checkout() {
  return <CheckoutPage />;
}
