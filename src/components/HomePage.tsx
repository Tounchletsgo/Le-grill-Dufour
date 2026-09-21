"use client";

import { useEffect, useRef } from "react";
import ReservationModal from "./ReservationModal";
import GoogleReviews from "./GoogleReviews";
import { restaurant } from "@/data/restaurantData";
import { BARESTHO_CADEAUX_URL } from "@/lib/barestho";
import MobileNav from "./MobileNav";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "@/i18n/LocaleContext";
import { localizedHref } from "@/i18n/types";

export default function HomePage() {
  const initialized = useRef(false);
  const { locale, t } = useTranslation();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    import("@/main.js").then(({ init }) => init());
  }, []);

  const carouselPhotos = [
    { src: "/images/restaurant/chef-bbq-exterieur.jpg", alt: "Le chef au barbecue en terrasse", pos: "70% 30%" },
    { src: "/images/restaurant/wagyu-selection.jpg", alt: "Sélection de wagyu japonais", pos: "center 55%" },
    { src: "/images/restaurant/terrasse-fresque.jpg", alt: "La terrasse et sa fresque murale", pos: "center 25%" },
    { src: "/images/restaurant/cote-grillee.jpg", alt: "Côte de bœuf grillée au feu de bois", pos: "center center" },
    { src: "/images/restaurant/christopher-bar.jpg", alt: "Christopher Dufour présentant un tomahawk au bar", pos: "center 35%" },
    { src: "/images/restaurant/planche-charcuterie.jpg", alt: "Planche de charcuterie artisanale", pos: "center center" },
    { src: "/images/restaurant/decoupe-viande.jpg", alt: "Découpe de viande grillée sur planche", pos: "center center" },
    { src: "/images/restaurant/poisson-restaurant.jpg", alt: "Filet de poisson grillé et légumes", pos: "center center" },
    { src: "/images/restaurant/loic-cuisine-wagyu.jpg", alt: "Loïc Dufour en cuisine avec ses découpes de wagyu", pos: "center 35%" },
    { src: "/images/restaurant/tbone-frites.jpg", alt: "T-bone steak grillé et frites maison", pos: "center 45%" },
    { src: "/images/restaurant/filets-assaisonnement.jpg", alt: "Filets de bœuf grillés assaisonnés", pos: "center 65%" },
    { src: "/images/restaurant/tomahawks-crus.jpg", alt: "Tomahawks de wagyu australien premium", pos: "center center" },
    { src: "/images/restaurant/wagyu-truffes.jpg", alt: "Wagyu et truffes fraîches", pos: "center 55%" },
    { src: "/images/restaurant/loic-bar-wagyu.jpg", alt: "Loïc Dufour présentant une pièce de wagyu au bar", pos: "center 30%" },
  ];

  const h = localizedHref;

  return (
    <>
      <a className="skip-link" href="#main">{t("nav.skipToContent")}</a>

      {/* HEADER */}
      <header className="site-header" id="site-header">
        <div className="container header-inner">
          <a href="#hero" className="brand">
            <img src="/images/logo/grill-dufour-logo-blanc.svg" alt="Le Grill Dufour — Restaurant" className="brand-logo" width={100} height={48} />
          </a>

          <nav className="main-nav" aria-label={t("nav.mainNav")}>
            <a href={h("/", locale)}>{t("nav.home")}</a>
            <a href={h("/la-carte", locale)}>{t("nav.carte")}</a>
            <a href={h("/commander", locale)}>{t("nav.order")}</a>
            <a href={h("/reserver", locale)} data-reservation="">{t("nav.reserve")}</a>
            <a href={h("/cheques-cadeaux", locale)}>{t("nav.giftCards")}</a>
            <a href={h("/contact", locale)}>{t("nav.contact")}</a>
          </nav>

          <div className="header-actions">
            <LanguageSwitcher currentPath={locale === "nl" ? "/nl" : "/"} />
            <a className="header-phone" href={restaurant.phoneHref} data-restaurant-phone="">
              <svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1L6.6 10.8z" /></svg>
              {restaurant.phoneDisplay}
            </a>
            <a href={h("/reserver", locale)} data-reservation="" className="btn btn-outline btn-sm header-resa-btn">{t("nav.reserve")}</a>
            <a href={h("/commander", locale)} className="btn btn-primary btn-sm header-cmd-btn">{t("nav.order")}</a>
          </div>

          <a href={h("/commander", locale)} className="btn btn-primary btn-sm mobile-cmd-btn">{t("nav.order")}</a>
          <MobileNav currentPath={locale === "nl" ? "/nl" : "/"} variant="home" />
        </div>
      </header>

      <main id="main">
        {/* 1. HERO */}
        <section className="hero" id="hero">
          <div className="hero-content">
            <img
              src="/images/logo/grill-dufour-logo-blanc.svg"
              alt="Le Grill Dufour — Restaurant"
              className="hero-logo"
              width={500}
              height={241}
              fetchPriority="high"
            />
            <div className="hero-ctas">
              <a href={h("/commander", locale)} className="btn btn-primary">{t("nav.order")}</a>
              <a href={h("/reserver", locale)} data-reservation="" className="btn btn-outline">{t("nav.reserve")}</a>
            </div>
          </div>
          <div className="hero-scroll">
            <span>{t("home.discover")}</span>
            <span className="hero-scroll-line"></span>
          </div>
        </section>

        {/* 2. PRÉSENTATION */}
        <section className="section" id="presentation">
          <div className="container">
            <div className="section-head reveal">
              <h2 className="section-title">{t("home.sectionTitle")}</h2>
              <div className="divider-mark"></div>
            </div>
            <p className="presentation-intro reveal">
              {t("home.presentationIntro")}
            </p>
          </div>
        </section>

        {/* 3. TROIS PHOTOS */}
        <section className="photo-trio-section">
          <div className="container">
            <div className="photo-trio reveal">
              <img src="/images/restaurant/poisson-restaurant.jpg" alt="Filet de poisson grillé et légumes" loading="lazy" width={600} height={400} />
              <img src="/images/fondateurs-taureau.jpg" alt="Loïc et Christopher Dufour devant le taureau du restaurant" loading="lazy" width={600} height={600} />
              <img src="/images/restaurant/loic-bar-wagyu.jpg" alt="Loïc Dufour présentant une pièce de wagyu au bar" loading="lazy" width={600} height={400} />
            </div>
          </div>
        </section>

        {/* 4. BANDE CTA — Commander */}
        <section className="cta-band reveal">
          <div className="container cta-band-inner">
            <div className="cta-band-icon">
              <svg viewBox="0 0 24 24"><path d="M18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1.5-9H17V12h4.46L19.5 9.5zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM20 8l3 4v5h-2a3 3 0 0 1-6 0H9a3 3 0 0 1-6 0H1V6c0-1.1.9-2 2-2h14v4h3z" /></svg>
            </div>
            <div className="cta-band-text">
              <h3>{t("home.orderDelivery")}</h3>
              <p>{t("home.orderDeliveryDesc")}</p>
            </div>
            <a href={h("/commander", locale)} className="btn btn-primary">{t("nav.order")}</a>
          </div>
        </section>

        {/* 5. L'ÉQUIPE */}
        <section className="section equipe-section" id="equipe">
          <div className="equipe-layout">
            <div className="equipe-photo reveal">
              <img src="/images/fondateurs-nb.jpg" alt="Loïc et Christopher Dufour — Le Grill Dufour" loading="lazy" width={800} height={533} />
            </div>
            <div className="equipe-text reveal reveal-delay-1">
              <h2>{t("home.teamTitle")}</h2>
              <p>{t("home.teamText1")}</p>
              <p>{t("home.teamText2")}</p>
            </div>
          </div>
        </section>

        {/* 5bis. CHÈQUES CADEAUX */}
        <section className="gift-section reveal" id="cheques-cadeaux">
          <div className="gift-inner">
            <div className="gift-visual">
              <img
                src="/images/restaurant/christopher-bar.jpg"
                alt="Christopher Dufour au bar du restaurant"
                loading="lazy"
                width={800}
                height={600}
              />
              <div className="gift-card-overlay">
                <div className="gift-card-logo">
                  Le Grill Dufour
                  <span>{t("home.giftCardLabel")}</span>
                </div>
                <div className="gift-card-value">{t("home.giftCardAmount")}</div>
              </div>
            </div>
            <div className="gift-content">
              <div className="gift-eyebrow">{t("home.giftEyebrow")}</div>
              <h2 className="gift-title">{t("home.giftTitle")}</h2>
              <div className="gift-laiton-line"></div>
              <p className="gift-desc">{t("home.giftDesc")}</p>
              <a
                href={BARESTHO_CADEAUX_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="gift-btn"
                aria-label={t("home.giftBtn")}
              >
                {t("home.giftBtn")}
              </a>
              <p className="gift-secure">{t("home.giftSecure")}</p>
              <p className="gift-phone">{t("home.giftPhone")} <a href={restaurant.phoneHref}>{restaurant.phoneDisplay}</a></p>
            </div>
          </div>
        </section>

        {/* 6. BANDE CTA — Contact */}
        <section className="cta-band reveal">
          <div className="container cta-band-inner">
            <div className="cta-band-icon">
              <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
            </div>
            <div className="cta-band-text">
              <h3>{t("home.moreInfo")}</h3>
              <p>{t("home.moreInfoDesc")}</p>
            </div>
            <a href="#contact" className="btn btn-primary">{t("nav.contact")}</a>
          </div>
        </section>

        {/* 7. CAROUSEL */}
        <section className="carousel-section">
          <div className="carousel-wrapper">
            <div className="carousel-track">
              {[...carouselPhotos, ...carouselPhotos].map((p, i) => (
                <div className="carousel-item" key={i}>
                  <img
                    src={p.src}
                    alt={i < carouselPhotos.length ? p.alt : ""}
                    loading="lazy"
                    width={480}
                    height={320}
                    style={{ objectPosition: p.pos }}
                    aria-hidden={i >= carouselPhotos.length ? true : undefined}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. AVIS GOOGLE */}
        <GoogleReviews />

        {/* 9. HORAIRES */}
        <section className="section" id="horaires">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">{t("home.visitUs")}</span>
              <h2 className="section-title">{t("home.openingHours")}</h2>
              <div className="divider-mark"></div>
            </div>
            <div className="hours-table reveal" id="hours-table"></div>
          </div>
        </section>

        {/* 9. CONTACT + GOOGLE MAPS */}
        <section className="section section-alt" id="contact">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">{t("home.contactReservation")}</span>
              <h2 className="section-title">{t("home.comeVisit")}</h2>
              <div className="divider-mark"></div>
              <p className="section-subtitle">{t("home.contactSubtitle")}</p>
            </div>

            <div className="contact-grid">
              <div className="contact-info reveal">
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" /></svg>
                  </div>
                  <div>
                    <h3 className="contact-label">{t("home.address")}</h3>
                    <p data-restaurant-address="">Rue des Courtils - Hovenstraat 1B, 7700 Mouscron, Hainaut, Belgique</p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1L6.6 10.8z" /></svg>
                  </div>
                  <div>
                    <h3 className="contact-label">{t("home.phone")}</h3>
                    <a href={restaurant.phoneHref} data-restaurant-phone="">{restaurant.phoneDisplay}</a>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24"><path d="M2 5.5C2 4.7 2.7 4 3.5 4h17c.8 0 1.5.7 1.5 1.5v13c0 .8-.7 1.5-1.5 1.5h-17c-.8 0-1.5-.7-1.5-1.5v-13zm2.2.5 7.8 6 7.8-6H4.2zM20 7.8l-8 6.2-8-6.2v9.7h16V7.8z" /></svg>
                  </div>
                  <div>
                    <h3 className="contact-label">{t("home.email")}</h3>
                    <a href={restaurant.emailHref} data-restaurant-email="">{restaurant.email}</a>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v5.4l4 2.4-.8 1.3-4.7-2.8V7h1.5z" /></svg>
                  </div>
                  <div>
                    <h3 className="contact-label">{t("home.schedule")}</h3>
                    <p style={{ whiteSpace: "pre-line" }}>{t("home.scheduleText")}</p>
                  </div>
                </div>

                <div className="contact-ctas">
                  <a href={restaurant.phoneHref} className="btn btn-primary" data-restaurant-phone-btn="">{t("home.call")}</a>
                  <a href={restaurant.emailHref} className="btn btn-outline" data-restaurant-email-btn="">{t("home.contactUs")}</a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Rue+des+Courtils+1B+7700+Mouscron+Belgium" target="_blank" rel="noopener" className="btn btn-outline" data-restaurant-maps-link="">{t("home.directions")}</a>
                </div>
              </div>

              <div className="map-wrap reveal reveal-delay-1">
                <iframe
                  title={t("home.mapsTitle")}
                  src="https://www.google.com/maps?q=Rue+des+Courtils+1B,+7700+Mouscron,+Belgium&output=embed"
                  data-restaurant-maps-embed=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="footer-brand">
                <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour — Restaurant" width={120} height={58} />
              </div>
              <p>{t("home.footerDesc")}</p>
              <div className="footer-social">
                <a href="https://www.facebook.com/legrilldufour/" target="_blank" rel="noopener" aria-label="Le Grill Dufour sur Facebook"><svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" /></svg></a>
                <a href="https://www.instagram.com/legrilldufour/" target="_blank" rel="noopener" aria-label="Le Grill Dufour sur Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 2.1.3 2.9.6.8.3 1.4.7 2 1.3.6.6 1 1.2 1.3 2 .3.8.5 1.7.6 2.9.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 2.1-.6 2.9-.3.8-.7 1.4-1.3 2-.6.6-1.2 1-2 1.3-.8.3-1.7.5-2.9.6-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-2.1-.3-2.9-.6-.8-.3-1.4-.7-2-1.3-.6-.6-1-1.2-1.3-2-.3-.8-.5-1.7-.6-2.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-2.1.6-2.9.3-.8.7-1.4 1.3-2 .6-.6 1.2-1 2-1.3.8-.3 1.7-.5 2.9-.6C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1 .1-1.6.2-2 .4-.5.2-.9.4-1.2.8-.4.3-.6.7-.8 1.2-.2.4-.3 1-.4 2-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1 .2 1.6.4 2 .2.5.4.9.8 1.2.3.4.7.6 1.2.8.4.2 1 .3 2 .4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1-.1 1.6-.2 2-.4.5-.2.9-.4 1.2-.8.4-.3.6-.7.8-1.2.2-.4.3-1 .4-2 .1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1-.2-1.6-.4-2-.2-.5-.4-.9-.8-1.2-.3-.4-.7-.6-1.2-.8-.4-.2-1-.3-2-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 1.8a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4zm5.7-2a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0z" /></svg></a>
              </div>
            </div>

            <div className="footer-col">
              <h4>{t("home.footerNav")}</h4>
              <ul>
                <li><a href={h("/la-carte", locale)}>{t("nav.carte")}</a></li>
                <li><a href={h("/commander", locale)}>{t("nav.order")}</a></li>
                <li><a href={h("/reserver", locale)}>{t("nav.reserve")}</a></li>
                <li><a href={h("/cheques-cadeaux", locale)}>{t("nav.giftCards")}</a></li>
                <li><a href={h("/contact", locale)}>{t("nav.contact")}</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>{t("home.footerCoords")}</h4>
              <ul>
                <li><a data-restaurant-address="">Rue des Courtils - Hovenstraat 1B, 7700 Mouscron</a></li>
                <li><a href={restaurant.phoneHref} data-restaurant-phone="">{restaurant.phoneDisplay}</a></li>
                <li><a href={restaurant.emailHref} data-restaurant-email="">{restaurant.email}</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>&copy; <span data-restaurant-year="">2026</span> {t("home.copyright")}</span>
            <span>TVA : <span data-restaurant-tva="">BE0726458932</span></span>
            <LanguageSwitcher currentPath={locale === "nl" ? "/nl" : "/"} />
            <a href={h("/politique-de-confidentialite", locale)}>{t("home.privacy")}</a>
            <a href={h("/mentions-legales", locale)}>{t("home.legalNotice")}</a>
          </div>
        </div>
      </footer>

      {/* TOAST CONTAINER */}
      <div className="toast-container" id="toast-container"></div>

      {/* RESERVATION MODAL */}
      <ReservationModal />
    </>
  );
}
