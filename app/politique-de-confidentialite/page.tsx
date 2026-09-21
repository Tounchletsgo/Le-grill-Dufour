import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { getDictionary, t } from "@/i18n";
import { localizedHref } from "@/i18n/types";
import { restaurant } from "@/data/restaurantData";

export function generateMetadata(): Metadata {
  const locale = getLocale();
  const dict = getDictionary(locale);
  return {
    title: t(dict, "meta.privacyTitle"),
    robots: "noindex",
  };
}

export default function PrivacyPage() {
  const locale = getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="legal-page">
      <header className="cmd-header">
        <a href={localizedHref("/", locale)} className="cmd-back">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z" />
          </svg>
          {t(dict, "legal.back")}
        </a>
      </header>

      <article className="legal-content">
        <h1>{t(dict, "legal.privacyTitle")}</h1>
        <p className="legal-updated">{t(dict, "legal.privacyLastUpdated")}</p>

        <h2>1. {t(dict, "legal.controller")}</h2>
        <p>
          Grill Dufour<br />
          Rue des Courtils - Hovenstraat 1B, 7700 {locale === "nl" ? "Moeskroen" : "Mouscron"}, {t(dict, "restaurant.country")}<br />
          {locale === "nl" ? "Tel" : "Tél"} : <a href={restaurant.phoneHref}>{restaurant.phone}</a><br />
          {t(dict, "contactPage.email")} : <a href={restaurant.emailHref}>{restaurant.email}</a>
        </p>

        <h2>2. {t(dict, "legal.dataCollected")}</h2>
        <p>{t(dict, "legal.dataCollectedIntro")}</p>
        <ul>
          <li>{t(dict, "legal.dataName")}</li>
          <li>{t(dict, "legal.dataPhone")}</li>
          <li>{t(dict, "legal.dataEmail")}</li>
          <li>{t(dict, "legal.dataAddress")}</li>
        </ul>
        <p><strong>{t(dict, "legal.noPaymentData")}</strong></p>

        <h2>3. {t(dict, "legal.purposes")}</h2>
        <ul>
          <li>{t(dict, "legal.purpose1")}</li>
          <li>{t(dict, "legal.purpose2")}</li>
          <li>{t(dict, "legal.purpose3")}</li>
          <li>{t(dict, "legal.purpose4")}</li>
          <li>{t(dict, "legal.purpose5")}</li>
        </ul>
        <p>{t(dict, "legal.purposeNote")}</p>

        <h2>4. {t(dict, "legal.legalBasis")}</h2>
        <p>{t(dict, "legal.legalBasisText")}</p>

        <h2>5. {t(dict, "legal.retention")}</h2>
        <p>{t(dict, "legal.retentionText")}</p>

        <h2>6. {t(dict, "legal.processors")}</h2>
        <ul>
          <li><strong>{t(dict, "legal.processorSupabase")}</strong></li>
          <li><strong>{t(dict, "legal.processorResend")}</strong></li>
          <li><strong>{t(dict, "legal.processorVercel")}</strong></li>
        </ul>

        <h2>7. {t(dict, "legal.yourRights")}</h2>
        <p>{t(dict, "legal.yourRightsIntro")}</p>
        <ul>
          <li>{t(dict, "legal.rightAccess")}</li>
          <li>{t(dict, "legal.rightRectification")}</li>
          <li>{t(dict, "legal.rightErasure")}</li>
          <li>{t(dict, "legal.rightRestriction")}</li>
          <li>{t(dict, "legal.rightPortability")}</li>
          <li>{t(dict, "legal.rightObjection")}</li>
        </ul>
        <p>
          {t(dict, "legal.rightExercise")} <strong><a href={restaurant.emailHref}>{restaurant.email}</a></strong>.
        </p>

        <h2>8. {t(dict, "legal.cookies")}</h2>
        <p>{t(dict, "legal.cookiesText")}</p>

        <h2>9. {t(dict, "legal.complaints")}</h2>
        <p>
          {t(dict, "legal.complaintsText")}{" "}
          <a href={locale === "nl" ? "https://www.gegevensbeschermingsautoriteit.be" : "https://www.autoriteprotectiondonnees.be"} target="_blank" rel="noopener noreferrer">
            {locale === "nl" ? "www.gegevensbeschermingsautoriteit.be" : "www.autoriteprotectiondonnees.be"}
          </a>
        </p>
      </article>
    </div>
  );
}
