"use client";

import { useEffect, useRef } from "react";
import ReservationModal from "./ReservationModal";
import { restaurant } from "@/data/restaurantData";

export default function HomePage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    import("@/main.js").then(({ init }) => init());
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">Aller au contenu principal</a>

      {/* HEADER */}
      <header className="site-header" id="site-header">
        <div className="container header-inner">
          <a href="#hero" className="brand">
            <img src="/images/logo/grill-dufour-logo-blanc.svg" alt="Le Grill Dufour — Restaurant" className="brand-logo" width={100} height={48} />
          </a>

          <nav className="main-nav" aria-label="Navigation principale">
            <a href="/">Accueil</a>
            <a href="/carte">La Carte</a>
            <a href="/livraison">Commander &amp; Livraison</a>
            <a href="/reservation" data-reservation="">Réserver une table</a>
            <a href="#presentation">Le Restaurant</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="header-actions">
            <a className="header-phone" href={restaurant.phoneHref} data-restaurant-phone="">
              <svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1L6.6 10.8z" /></svg>
              {restaurant.phoneDisplay}
            </a>
            <a href="/reservation" data-reservation="" className="btn btn-outline btn-sm header-resa-btn">Réserver</a>
            <a href="/livraison" className="btn btn-primary btn-sm header-cmd-btn">Commander</a>
          </div>
        </div>
      </header>

      <main id="main">
        {/* 1. HERO — bandeau plein cadre */}
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
              <a href="/carte" className="btn btn-primary">Notre carte</a>
              <a href="/reservation" data-reservation="" className="btn btn-outline">Réserver</a>
            </div>
          </div>
          <div className="hero-scroll">
            <span>Découvrir</span>
            <span className="hero-scroll-line"></span>
          </div>
        </section>

        {/* 2. PRÉSENTATION */}
        <section className="section" id="presentation">
          <div className="container">
            <div className="section-head reveal">
              <h2 className="section-title">Le Grill Dufour</h2>
              <div className="divider-mark"></div>
            </div>
            <p className="presentation-intro reveal">
              Après des années à rêver d&apos;ouvrir un restaurant en famille, nous accomplissons notre rêve.
              « Le grill Dufour » un restaurant familial avec Loïc en cuisine et Christopher en salle.
            </p>
          </div>
        </section>

        {/* 3. TROIS PHOTOS côte à côte */}
        <section className="photo-trio-section">
          <div className="container">
            <div className="photo-trio reveal">
              <img src="/images/hero-grill.jpg" alt="Grillades au feu de bois" loading="lazy" width={600} height={400} />
              <img src="/images/fondateurs-taureau.jpg" alt="Ambiance du restaurant" loading="lazy" width={600} height={400} />
              <img src="/images/plat-truffe.jpg" alt="Plat signature" loading="lazy" width={600} height={400} />
            </div>
          </div>
        </section>

        {/* 4. BANDE CTA — Commander en livraison */}
        <section className="cta-band reveal">
          <div className="container cta-band-inner">
            <div className="cta-band-icon">
              <svg viewBox="0 0 24 24"><path d="M18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1.5-9H17V12h4.46L19.5 9.5zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM20 8l3 4v5h-2a3 3 0 0 1-6 0H9a3 3 0 0 1-6 0H1V6c0-1.1.9-2 2-2h14v4h3z" /></svg>
            </div>
            <div className="cta-band-text">
              <h3>Commander en livraison</h3>
              <p>Faites-vous livrer nos grillades directement chez vous.</p>
            </div>
            <a href="/livraison" className="btn btn-primary">Commander</a>
          </div>
        </section>

        {/* 5. L'ÉQUIPE — photo + texte */}
        <section className="section equipe-section" id="equipe">
          <div className="equipe-layout">
            <div className="equipe-photo reveal">
              <img src="/images/fondateurs-nb.jpg" alt="Loïc et Christopher, fondateurs du Grill Dufour" loading="lazy" width={800} height={533} />
            </div>
            <div className="equipe-text reveal reveal-delay-1">
              <h2>Deux hommes et deux professionnels dans leur domaine</h2>
              <p>
                D&apos;un côté un grand cuisinier ayant évolué au sein des meilleurs restaurants étoilés
                de Belgique, cherchant sans cesse à se renouveler et à se perfectionner. Et de l&apos;autre,
                un grand professionnel de salle aux diverses expériences, dans des enseignes bien connues
                du centre mouscronnois et aimant le service impeccable et le sourire du client.
                « Le grill Dufour » un restaurant qui se veut familial, cosy, perfectionniste, …
              </p>
              <p>
                Un lieu proposant une carte variée et travaillée avec des produits frais. Les suggestions
                se veulent changeantes en fonction des produits de saisons et des idées du chef.
              </p>
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
              <h3>Plus d&apos;informations ?</h3>
              <p>Contactez-nous par téléphone, e-mail ou via notre formulaire de contact.</p>
            </div>
            <a href="#contact" className="btn btn-primary">Contact</a>
          </div>
        </section>

        {/* 7. QUATRE PHOTOS — galerie d'ambiance */}
        <section className="photo-quad-section">
          <div className="photo-quad reveal">
            <img src="/images/hero-grill.jpg" alt="Cuisine au grill" loading="lazy" width={600} height={400} />
            <img src="/images/fondateurs-nb.jpg" alt="Les fondateurs" loading="lazy" width={600} height={400} />
            <img src="/images/hero-terrasse.jpg" alt="La terrasse" loading="lazy" width={600} height={400} />
            <img src="/images/fondateurs-taureau.jpg" alt="Ambiance du restaurant" loading="lazy" width={600} height={400} />
          </div>
        </section>

        {/* 8. HORAIRES */}
        <section className="section" id="horaires">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">Nous Rendre Visite</span>
              <h2 className="section-title">Horaires d&apos;Ouverture</h2>
              <div className="divider-mark"></div>
            </div>
            <div className="hours-table reveal" id="hours-table"></div>
          </div>
        </section>

        {/* 9. CONTACT + GOOGLE MAPS */}
        <section className="section section-alt" id="contact">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">Contact &amp; Réservation</span>
              <h2 className="section-title">Venez Nous Rencontrer</h2>
              <div className="divider-mark"></div>
              <p className="section-subtitle">Une question, une réservation ? Contactez-nous directement.</p>
            </div>

            <div className="contact-grid">
              <div className="contact-info reveal">
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" /></svg>
                  </div>
                  <div>
                    <h3 className="contact-label">Adresse</h3>
                    <p data-restaurant-address="">Rue des Courtils - Hovenstraat 1B, 7700 Mouscron, Hainaut, Belgique</p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1L6.6 10.8z" /></svg>
                  </div>
                  <div>
                    <h3 className="contact-label">Téléphone</h3>
                    <a href={restaurant.phoneHref} data-restaurant-phone="">{restaurant.phoneDisplay}</a>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24"><path d="M2 5.5C2 4.7 2.7 4 3.5 4h17c.8 0 1.5.7 1.5 1.5v13c0 .8-.7 1.5-1.5 1.5h-17c-.8 0-1.5-.7-1.5-1.5v-13zm2.2.5 7.8 6 7.8-6H4.2zM20 7.8l-8 6.2-8-6.2v9.7h16V7.8z" /></svg>
                  </div>
                  <div>
                    <h3 className="contact-label">Email</h3>
                    <a href="mailto:chriswillen@me.com" data-restaurant-email="">chriswillen@me.com</a>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v5.4l4 2.4-.8 1.3-4.7-2.8V7h1.5z" /></svg>
                  </div>
                  <div>
                    <h3 className="contact-label">Horaires</h3>
                    <p>Lun, Mar, Ven, Sam : 11h45–15h &amp; 18h45–22h<br />Dim : 11h45–15h · Mer &amp; Jeu : Fermé</p>
                  </div>
                </div>

                <div className="contact-ctas">
                  <a href={restaurant.phoneHref} className="btn btn-primary" data-restaurant-phone-btn="">Appeler</a>
                  <a href="mailto:chriswillen@me.com" className="btn btn-outline" data-restaurant-email-btn="">Nous contacter</a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Rue+des+Courtils+1B+7700+Mouscron+Belgium" target="_blank" rel="noopener" className="btn btn-outline" data-restaurant-maps-link="">Itinéraire</a>
                </div>
              </div>

              <div className="map-wrap reveal reveal-delay-1">
                <iframe
                  title="Grill Dufour sur Google Maps"
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
              <p>Restaurant & grill au cœur de Mouscron. Produits frais, cuisson au feu de bois.</p>
              <div className="footer-social">
                <a href="https://www.facebook.com/legrilldufour/" target="_blank" rel="noopener" aria-label="Le Grill Dufour sur Facebook"><svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" /></svg></a>
                <a href="https://www.instagram.com/legrilldufour/" target="_blank" rel="noopener" aria-label="Le Grill Dufour sur Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 2.1.3 2.9.6.8.3 1.4.7 2 1.3.6.6 1 1.2 1.3 2 .3.8.5 1.7.6 2.9.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 2.1-.6 2.9-.3.8-.7 1.4-1.3 2-.6.6-1.2 1-2 1.3-.8.3-1.7.5-2.9.6-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-2.1-.3-2.9-.6-.8-.3-1.4-.7-2-1.3-.6-.6-1-1.2-1.3-2-.3-.8-.5-1.7-.6-2.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-2.1.6-2.9.3-.8.7-1.4 1.3-2 .6-.6 1.2-1 2-1.3.8-.3 1.7-.5 2.9-.6C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1 .1-1.6.2-2 .4-.5.2-.9.4-1.2.8-.4.3-.6.7-.8 1.2-.2.4-.3 1-.4 2-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1 .2 1.6.4 2 .2.5.4.9.8 1.2.3.4.7.6 1.2.8.4.2 1 .3 2 .4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1-.1 1.6-.2 2-.4.5-.2.9-.4 1.2-.8.4-.3.6-.7.8-1.2.2-.4.3-1 .4-2 .1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1-.2-1.6-.4-2-.2-.5-.4-.9-.8-1.2-.3-.4-.7-.6-1.2-.8-.4-.2-1-.3-2-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 1.8a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4zm5.7-2a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0z" /></svg></a>
              </div>
            </div>

            <div className="footer-col">
              <h4>Navigation</h4>
              <ul>
                <li><a href="/carte">La Carte</a></li>
                <li><a href="/livraison">Commander &amp; Livraison</a></li>
                <li><a href="/reservation">Réserver une table</a></li>
                <li><a href="#presentation">Le Restaurant</a></li>
                <li><a href="#horaires">Horaires</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Coordonnées</h4>
              <ul>
                <li><a data-restaurant-address="">Rue des Courtils - Hovenstraat 1B, 7700 Mouscron</a></li>
                <li><a href={restaurant.phoneHref} data-restaurant-phone="">{restaurant.phoneDisplay}</a></li>
                <li><a href="mailto:chriswillen@me.com" data-restaurant-email="">chriswillen@me.com</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>&copy; <span data-restaurant-year="">2026</span> Restaurant Le Grill Dufour — Tous droits réservés.</span>
            <span>TVA : <span data-restaurant-tva="">BE0726458932</span></span>
            <a href="/politique-de-confidentialite">Confidentialité</a>
            <a href="/mentions-legales">Mentions légales</a>
          </div>
        </div>
      </footer>

      {/* TOAST CONTAINER */}
      <div className="toast-container" id="toast-container"></div>

      {/* RESERVATION MODAL (desktop only) */}
      <ReservationModal />
    </>
  );
}
