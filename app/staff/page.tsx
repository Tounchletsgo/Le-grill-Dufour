import type { Metadata } from "next";
import KitchenBoard from "@/components/staff/KitchenBoard";

export const metadata: Metadata = {
  title: "Cuisine | Grill Dufour",
  description: "Tableau de bord cuisine — gestion des commandes en temps réel.",
  robots: "noindex, nofollow",
};

export default function StaffPage() {
  return <KitchenBoard />;
}
