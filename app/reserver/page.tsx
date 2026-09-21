import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { getDictionary, t } from "@/i18n";
import ReservationPage from "@/components/ReservationPage";

export function generateMetadata(): Metadata {
  const locale = getLocale();
  const dict = getDictionary(locale);
  return {
    title: t(dict, "meta.reserverTitle"),
    description: t(dict, "meta.reserverDescription"),
    alternates: {
      canonical: "https://legrilldufour.be/reserver",
      languages: { "fr": "/reserver", "nl": "/nl/reserveren" },
    },
  };
}

export default function Page() {
  return <ReservationPage />;
}
