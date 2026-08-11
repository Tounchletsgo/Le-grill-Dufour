import type { Metadata } from "next";
import ReservationPage from "@/components/ReservationPage";

export const metadata: Metadata = {
  title: "Réserver une table | Grill Dufour",
  description:
    "Réservez votre table au Grill Dufour à Mouscron. Choisissez la date, l'heure et le nombre de convives en quelques clics.",
};

export default function Page() {
  return <ReservationPage />;
}
