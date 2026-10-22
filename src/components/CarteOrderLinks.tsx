"use client";

import OrderLink from "./OrderLink";
import { OrdersPausedBanner } from "./OrdersPausedProvider";
import { useTranslation } from "@/i18n/LocaleContext";
import { localizedHref } from "@/i18n/types";

export function CarteTopbarOrderLink() {
  const { locale, t } = useTranslation();
  return (
    <OrderLink href={localizedHref("/commander", locale)} className="btn btn-outline btn-sm carte-topbar-order">
      {t("carte.orderDelivery")}
    </OrderLink>
  );
}

export function CarteCtaSection() {
  const { locale, t } = useTranslation();
  return (
    <div className="carte-cta">
      <p>
        {t("carte.deliveryNote")}{" "}
        <OrderLink href={localizedHref("/commander", locale)} className="carte-link">
          {t("carte.seeDeliveryMenu")}
        </OrderLink>.
      </p>
      <OrderLink href={localizedHref("/commander", locale)} className="btn btn-primary">
        {t("carte.orderDelivery")}
      </OrderLink>
      <a href={localizedHref("/", locale)} className="carte-back-home carte-back-home--bottom">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        {t("carte.backHome")}
      </a>
    </div>
  );
}

export { OrdersPausedBanner };
