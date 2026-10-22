"use client";

import OrderLink from "./OrderLink";
import { useTranslation } from "@/i18n/LocaleContext";
import { localizedHref } from "@/i18n/types";

export default function NotFoundOrderLink() {
  const { locale, t } = useTranslation();
  return (
    <OrderLink href={localizedHref("/commander", locale)} className="btn btn-outline">
      {t("notFound.order")}
    </OrderLink>
  );
}
