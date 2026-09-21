import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { getDictionary, t } from "@/i18n";
import Breadcrumb from "@/components/Breadcrumb";
import { restaurant } from "@/data/restaurantData";
import SubpageHeader from "@/components/SubpageHeader";
import SubpageFooter from "@/components/SubpageFooter";

export function generateMetadata(): Metadata {
  const locale = getLocale();
  const dict = getDictionary(locale);
  return {
    title: t(dict, "meta.contactTitle"),
    description: t(dict, "meta.contactDescription"),
    alternates: {
      canonical: "https://legrilldufour.be/contact",
      languages: { "fr": "/contact", "nl": "/nl/contact" },
    },
  };
}

export default function ContactPage() {
  const locale = getLocale();
  const dict = getDictionary(locale);
  const scheduleLines = t(dict, "contactPage.scheduleLines").split("\n");

  return (
    <div className="carte-page">
      <SubpageHeader currentPath="/contact" />

      <Breadcrumb items={[{ label: t(dict, "contactPage.breadcrumb") }]} />

      <main className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t(dict, "contactPage.eyebrow")}</span>
            <h1 className="section-title">{t(dict, "contactPage.title")}</h1>
            <div className="divider-mark"></div>
          </div>

          <div className="contact-grid">
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">
                  <svg viewBox="0 0 24 24"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" /></svg>
                </div>
                <div>
                  <h2 className="contact-label">{t(dict, "contactPage.address")}</h2>
                  <p>Rue des Courtils - Hovenstraat 1B, 7700 {locale === "nl" ? "Moeskroen" : "Mouscron"}, {locale === "nl" ? "Henegouwen" : "Hainaut"}, {t(dict, "restaurant.country")}</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1L6.6 10.8z" /></svg>
                </div>
                <div>
                  <h2 className="contact-label">{t(dict, "contactPage.phone")}</h2>
                  <a href={restaurant.phoneHref}>{restaurant.phoneDisplay}</a>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <svg viewBox="0 0 24 24"><path d="M2 5.5C2 4.7 2.7 4 3.5 4h17c.8 0 1.5.7 1.5 1.5v13c0 .8-.7 1.5-1.5 1.5h-17c-.8 0-1.5-.7-1.5-1.5v-13zm2.2.5 7.8 6 7.8-6H4.2zM20 7.8l-8 6.2-8-6.2v9.7h16V7.8z" /></svg>
                </div>
                <div>
                  <h2 className="contact-label">{t(dict, "contactPage.email")}</h2>
                  <a href="mailto:chriswillen@me.com">chriswillen@me.com</a>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v5.4l4 2.4-.8 1.3-4.7-2.8V7h1.5z" /></svg>
                </div>
                <div>
                  <h2 className="contact-label">{t(dict, "contactPage.schedule")}</h2>
                  <p>{scheduleLines.map((line, i) => (
                    <span key={i}>{line}{i < scheduleLines.length - 1 && <br />}</span>
                  ))}</p>
                </div>
              </div>

              <div className="contact-ctas">
                <a href={restaurant.phoneHref} className="btn btn-primary">{t(dict, "contactPage.call")}</a>
                <a href={restaurant.emailHref} className="btn btn-outline">{t(dict, "contactPage.sendEmail")}</a>
                <a href="https://www.google.com/maps/search/?api=1&query=Rue+des+Courtils+1B+7700+Mouscron+Belgium" target="_blank" rel="noopener" className="btn btn-outline">{t(dict, "contactPage.directions")}</a>
              </div>
            </div>

            <div className="map-wrap">
              <iframe
                title={t(dict, "contactPage.mapsTitle")}
                src="https://www.google.com/maps?q=Rue+des+Courtils+1B,+7700+Mouscron,+Belgium&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </main>

      <SubpageFooter />
    </div>
  );
}
