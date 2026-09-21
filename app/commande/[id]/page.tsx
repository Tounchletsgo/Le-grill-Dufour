import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { getDictionary, t } from "@/i18n";
import OrderTracker from "@/components/OrderTracker";

export function generateMetadata(): Metadata {
  const locale = getLocale();
  const dict = getDictionary(locale);
  return {
    title: t(dict, "meta.orderTrackingTitle"),
    robots: "noindex",
  };
}

export default function OrderPage({ params }: { params: { id: string } }) {
  return <OrderTracker orderId={params.id} />;
}
