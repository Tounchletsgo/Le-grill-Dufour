import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { getDictionary, t } from "@/i18n";
import { localizedHref } from "@/i18n/types";
import { restaurant } from "@/data/restaurantData";

export function generateMetadata(): Metadata {
  const locale = getLocale();
  const dict = getDictionary(locale);
  return {
    title: t(dict, "meta.mentionsTitle"),
    robots: "noindex",
  };
}

export default function LegalPage() {
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
        <h1>{t(dict, "legal.mentionsTitle")}</h1>

        <h2>{t(dict, "legal.editor")}</h2>
        <p>
          Grill Dufour<br />
          Rue des Courtils - Hovenstraat 1B<br />
          7700 {locale === "nl" ? "Moeskroen" : "Mouscron"}, {t(dict, "restaurant.country")}<br />
          {locale === "nl" ? "Tel" : "Tél"} : <a href={restaurant.phoneHref}>{restaurant.phone}</a><br />
          {t(dict, "contactPage.email")} : <a href={restaurant.emailHref}>{restaurant.email}</a><br />
          {locale === "nl" ? "Btw-nr" : "N° TVA"} : {restaurant.tva}
        </p>

        <h2>{t(dict, "legal.hosting")}</h2>
        <p>
          Vercel Inc.<br />
          440 N Barranca Ave #4133<br />
          Covina, CA 91723, USA<br />
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
        </p>

        <h2>{t(dict, "legal.ip")}</h2>
        <p>{t(dict, "legal.ipText")}</p>

        <h2>{t(dict, "legal.liability")}</h2>
        <p>{t(dict, "legal.liabilityText")}</p>

        <h2>{t(dict, "legal.onlinePayment")}</h2>
        <p>
          {t(dict, "legal.paymentText1").split("Stripe").map((part, i, arr) =>
            i < arr.length - 1 ? (
              <span key={i}>{part}<a href="https://stripe.com" target="_blank" rel="noopener noreferrer">Stripe</a></span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>
        <p>{t(dict, "legal.paymentText2")}</p>
        <p>{t(dict, "legal.paymentText3")}</p>

        <h2>{t(dict, "legal.dataProtection")}</h2>
        <p>
          {t(dict, "legal.dataProtectionText").split(locale === "nl" ? "privacybeleid" : "politique de confidentialité").map((part, i, arr) =>
            i < arr.length - 1 ? (
              <span key={i}>{part}<a href={localizedHref("/politique-de-confidentialite", locale)}>{locale === "nl" ? "privacybeleid" : "politique de confidentialité"}</a></span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>

        <h2>{t(dict, "legal.applicableLaw")}</h2>
        <p>{t(dict, "legal.applicableLawText")}</p>
      </article>
    </div>
  );
}
