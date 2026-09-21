import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { getDictionary, t } from "@/i18n";
import Breadcrumb from "@/components/Breadcrumb";
import CarteGallery from "@/components/CarteGallery";
import SubpageHeader from "@/components/SubpageHeader";
import SubpageFooter from "@/components/SubpageFooter";
import { localizedHref } from "@/i18n/types";

export function generateMetadata(): Metadata {
  const locale = getLocale();
  const dict = getDictionary(locale);
  return {
    title: t(dict, "meta.carteTitle"),
    description: t(dict, "meta.carteDescription"),
    alternates: {
      canonical: "https://legrilldufour.be/la-carte",
      languages: { "fr": "/la-carte", "nl": "/nl/de-kaart" },
    },
  };
}

export default function CartePage() {
  const locale = getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="carte-page">
      <SubpageHeader currentPath="/la-carte" />

      <Breadcrumb items={[{ label: t(dict, "carte.breadcrumb") }]} />

      <main className="carte-content" id="carte-top">
        <div className="carte-photos-layout">
          <div className="carte-photos-head">
            <h1>{t(dict, "carte.title")}</h1>
            <p>{t(dict, "carte.clickToEnlarge")}</p>
            {locale === "nl" && t(dict, "carte.photoNoteFr") && (
              <p className="carte-nl-note">{t(dict, "carte.photoNoteFr")}</p>
            )}
          </div>

          <CarteGallery />

          <div className="carte-cta">
            <p>
              {t(dict, "carte.deliveryNote")}{" "}
              <a href={localizedHref("/commander", locale)} className="carte-link">
                {t(dict, "carte.seeDeliveryMenu")}
              </a>.
            </p>
            <a href={localizedHref("/commander", locale)} className="btn btn-primary">
              {t(dict, "carte.orderDelivery")}
            </a>
          </div>
        </div>
      </main>

      <SubpageFooter />
    </div>
  );
}
