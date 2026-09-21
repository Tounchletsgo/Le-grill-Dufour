import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { getDictionary, t } from "@/i18n";
import Breadcrumb from "@/components/Breadcrumb";
import { restaurant } from "@/data/restaurantData";
import { BARESTHO_CADEAUX_URL } from "@/lib/barestho";
import SubpageHeader from "@/components/SubpageHeader";
import SubpageFooter from "@/components/SubpageFooter";

export function generateMetadata(): Metadata {
  const locale = getLocale();
  const dict = getDictionary(locale);
  return {
    title: t(dict, "meta.chequesTitle"),
    description: t(dict, "giftCards.subtitle"),
    alternates: {
      canonical: "https://legrilldufour.be/cheques-cadeaux",
      languages: { "fr": "/cheques-cadeaux", "nl": "/nl/cadeaubonnen" },
    },
  };
}

export default function ChequesCadeauxPage() {
  const locale = getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="carte-page">
      <SubpageHeader currentPath="/cheques-cadeaux" />

      <Breadcrumb items={[{ label: t(dict, "giftCards.breadcrumb") }]} />

      <main className="section">
        <div className="container" style={{ maxWidth: 700 }}>
          <div className="section-head">
            <span className="eyebrow">{t(dict, "giftCards.eyebrow")}</span>
            <h1 className="section-title">{t(dict, "giftCards.title")}</h1>
            <div className="divider-mark"></div>
            <p className="section-subtitle">
              {t(dict, "giftCards.subtitle")}
            </p>
          </div>

          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <a
              href={BARESTHO_CADEAUX_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ fontSize: "1.1rem", padding: "0.9rem 2.5rem" }}
            >
              {t(dict, "giftCards.btn")}
            </a>
            <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {t(dict, "giftCards.secure")}
            </p>
            <p style={{ marginTop: "1.5rem", fontSize: "0.95rem" }}>
              {t(dict, "giftCards.byPhone")}{" "}
              <a href={restaurant.phoneHref} style={{ color: "var(--gold)" }}>
                {restaurant.phoneDisplay}
              </a>.
            </p>
          </div>
        </div>
      </main>

      <SubpageFooter />
    </div>
  );
}
