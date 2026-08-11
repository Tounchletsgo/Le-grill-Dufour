import type { Metadata } from "next";
import OrderTracker from "@/components/OrderTracker";

export const metadata: Metadata = {
  title: "Suivi de commande | Grill Dufour",
  robots: "noindex",
};

export default function OrderPage({ params }: { params: { id: string } }) {
  return <OrderTracker orderId={params.id} />;
}
