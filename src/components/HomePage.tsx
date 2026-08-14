"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import ReservationModal from "./ReservationModal";
import { restaurant } from "@/data/restaurantData";

const ScrollChoreography = dynamic(() => import("./ScrollChoreography"), {
  ssr: false,
});

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
            <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour — Restaurant" className="brand-logo" width={100} height={48} />
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
            <button className="hamburger" aria-label="Ouvrir le menu" aria-expanded="false" type="button">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAV */}
      <nav className="mobile-nav" aria-label="Navigation mobile">
        <a href="/">Accueil</a>
        <a href="/carte">La Carte</a>
        <a href="/livraison">Commander &amp; Livraison</a>
        <a href="/reservation">Réserver une table</a>
        <a href="#presentation">Le Restaurant</a>
        <a href="#contact">Contact</a>
        <a href="/reservation" className="btn btn-outline">Réserver une table</a>
        <a href="/livraison" className="btn btn-primary">Commander en livraison</a>
      </nav>

      <main id="main">
        {/* HERO */}
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
            <p className="hero-tagline">Amateur de bonne viande ou fin gourmet, il y en aura pour tous les goûts.</p>
            <div className="hero-ctas">
              <a href="/livraison" className="btn btn-primary">Commander en livraison</a>
              <a href="/reservation" data-reservation="" className="btn btn-outline">Réserver une table</a>
            </div>
          </div>
          <div className="hero-scroll">
            <span>Découvrir</span>
            <span className="hero-scroll-line"></span>
          </div>
        </section>

        {/* SCROLL CHOREOGRAPHY */}
        <ScrollChoreography
          images={{
            topLeft: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
            topRight: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2000&auto=format&fit=crop",
            bottomLeft: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=900&auto=format&fit=crop",
            bottomRight: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=900&auto=format&fit=crop",
          }}
        />

        {/* PRÉSENTATION */}
        <section className="section" id="presentation">
          <div className="container">
            <div className="presentation">
              <div className="presentation-media reveal">
                <div className="presentation-frame"></div>
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop"
                  alt="Intérieur chaleureux du restaurant Grill Dufour"
                  loading="lazy"
                  width={800}
                  height={1000}
                />
              </div>
              <div className="presentation-text reveal reveal-delay-1">
                <span className="eyebrow">La Maison</span>
                <h2>Une passion du feu &amp; de la belle viande</h2>
                <p>
                  Chez Grill Dufour, la viande se grille dans les règles :
                  produits sélectionnés avec exigence, cuissons maîtrisées et générosité dans chaque assiette.
                  Ici, la cuisine se fait devant vous, avec le crépitement du grill comme signature sonore de la maison.
                </p>
                <p>
                  Dans un cadre chic et chaleureux, entre bois brut, cuir patiné et éclairages tamisés,
                  nous vous accueillons pour un moment convivial autour de grillades d&apos;exception,
                  de planches généreuses et d&apos;une carte pensée pour tous les appétits.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CARTE / MENU */}
        <section className="section menu-section" id="carte">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">La Carte</span>
              <h2 className="section-title">Notre Sélection</h2>
              <div className="divider-mark"></div>
              <p className="section-subtitle">Parcourez nos catégories — la carte est mise à jour directement par notre équipe.</p>
            </div>

            <div className="delivery-banner reveal" id="delivery-banner"></div>
            <div className="menu-tabs" aria-label="Catégories de la carte"></div>
            <div className="menu-panels"></div>

            <div className="menu-footnote reveal" id="accompagnements-content"></div>
            <div className="menu-footnote reveal">
              <h3>Mentions</h3>
              <ul id="general-notes" style={{ display: "inline-block", textAlign: "left", color: "var(--text-secondary)" }}></ul>
            </div>
          </div>
        </section>

        {/* MENUS FIXES */}
        <section className="section section-alt" id="menus">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">Formules</span>
              <h2 className="section-title">Nos Menus</h2>
              <div className="divider-mark"></div>
              <p className="section-subtitle">Des formules complètes pour tous les appétits, du plus jeune au plus gourmand.</p>
            </div>
            <div className="menus-grid" id="menus-grid"></div>
          </div>
        </section>

        {/* GROUPES */}
        <section className="section" id="groupes">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">Événements &amp; Groupes</span>
              <h2 className="section-title">Formule de Groupe</h2>
              <div className="divider-mark"></div>
              <p className="section-subtitle">L&apos;endroit idéal pour vos fêtes d&apos;entreprise, anniversaires ou banquets.</p>
            </div>
            <div className="group-block" id="group-content"></div>
          </div>
        </section>

        {/* POTENCE DUFOUR */}
        <section className="potence" id="potence">
          <div className="potence-bg" role="img" aria-label="Viande flambée au Grand Marnier"></div>
          <div className="container">
            <div className="potence-content reveal" id="potence-content"></div>
          </div>
        </section>

        {/* HORAIRES */}
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

        {/* CONTACT */}
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
                <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" /></svg></a>
                <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 2.1.3 2.9.6.8.3 1.4.7 2 1.3.6.6 1 1.2 1.3 2 .3.8.5 1.7.6 2.9.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 2.1-.6 2.9-.3.8-.7 1.4-1.3 2-.6.6-1.2 1-2 1.3-.8.3-1.7.5-2.9.6-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-2.1-.3-2.9-.6-.8-.3-1.4-.7-2-1.3-.6-.6-1-1.2-1.3-2-.3-.8-.5-1.7-.6-2.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-2.1.6-2.9.3-.8.7-1.4 1.3-2 .6-.6 1.2-1 2-1.3.8-.3 1.7-.5 2.9-.6C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1 .1-1.6.2-2 .4-.5.2-.9.4-1.2.8-.4.3-.6.7-.8 1.2-.2.4-.3 1-.4 2-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1 .2 1.6.4 2 .2.5.4.9.8 1.2.3.4.7.6 1.2.8.4.2 1 .3 2 .4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1-.1 1.6-.2 2-.4.5-.2.9-.4 1.2-.8.4-.3.6-.7.8-1.2.2-.4.3-1 .4-2 .1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1-.2-1.6-.4-2-.2-.5-.4-.9-.8-1.2-.3-.4-.7-.6-1.2-.8-.4-.2-1-.3-2-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 1.8a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4zm5.7-2a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0z" /></svg></a>
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
            <span>&copy; <span data-restaurant-year="">2026</span> Grill Dufour — Tous droits réservés.</span>
            <span>TVA : <span data-restaurant-tva="">BE0726458932</span></span>
            <a href="/politique-de-confidentialite">Confidentialité</a>
            <a href="/mentions-legales">Mentions légales</a>
          </div>
        </div>
      </footer>

      {/* CART FAB */}
      <button className="cart-fab" id="cart-fab" aria-label="Voir le panier" type="button">
        <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.6L5.2 14c-.1.3-.2.6-.2 1 0 1.1.9 2 2 2h12v-2H7.4c-.1 0-.2-.1-.2-.2v-.1l.9-1.6h7.4c.8 0 1.4-.4 1.7-1l3.6-6.5c.2-.3 0-.6-.3-.6H5.2L4.3 2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
        <span className="cart-fab-badge" id="cart-badge">0</span>
      </button>

      {/* CART DRAWER */}
      <aside className="cart-drawer" id="cart-drawer" aria-label="Panier">
        <div className="cart-drawer-header">
          <h3>Votre Panier</h3>
          <button className="cart-drawer-close" id="cart-close" aria-label="Fermer le panier" type="button">&times;</button>
        </div>
        <div className="cart-drawer-body" id="cart-body"></div>
        <div className="cart-drawer-footer" id="cart-footer"></div>
      </aside>
      <div className="cart-overlay" id="cart-overlay"></div>

      {/* CHECKOUT MODAL */}
      <div className="checkout-overlay" id="checkout-overlay">
        <div className="checkout-modal">
          <div className="checkout-header">
            <h3>Finaliser votre commande</h3>
            <button className="checkout-close" id="checkout-close" aria-label="Fermer" type="button">&times;</button>
          </div>
          <form className="checkout-form" id="checkout-form" noValidate>
            <div className="checkout-summary" id="checkout-summary"></div>

            <div className="form-group">
              <label htmlFor="order-mode">Mode de commande</label>
              <div className="radio-group">
                <label className="radio-card">
                  <input type="radio" name="order-mode" defaultValue="delivery" defaultChecked />
                  <span className="radio-card-inner">
                    <svg viewBox="0 0 24 24"><path d="M18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1.5-9H17V12h4.46L19.5 9.5zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM20 8l3 4v5h-2a3 3 0 0 1-6 0H9a3 3 0 0 1-6 0H1V6c0-1.1.9-2 2-2h14v4h3z" /></svg>
                    <strong>Livraison</strong>
                    <small id="delivery-fee-label"></small>
                  </span>
                </label>
                <label className="radio-card">
                  <input type="radio" name="order-mode" defaultValue="pickup" />
                  <span className="radio-card-inner">
                    <svg viewBox="0 0 24 24"><path d="M2 17h20v2H2v-2zm11.8-5.3-4 4-1.4-1.4 4-4-4-4 1.4-1.4 4 4 4-4 1.4 1.4-4 4 4 4-1.4 1.4-4-4z" /></svg>
                    <strong>À emporter</strong>
                    <small>Gratuit</small>
                  </span>
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="order-name">Nom complet *</label>
                <input type="text" id="order-name" name="name" required autoComplete="name" placeholder="Jean Dupont" />
              </div>
              <div className="form-group">
                <label htmlFor="order-phone">Téléphone *</label>
                <input type="tel" id="order-phone" name="phone" required autoComplete="tel" placeholder="+32 470 12 34 56" />
              </div>
            </div>

            <div id="delivery-fields">
              <div className="form-group">
                <label htmlFor="order-address">Adresse de livraison *</label>
                <input type="text" id="order-address" name="address" required autoComplete="street-address" placeholder="Rue de la Gare 15" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="order-postal">Code postal *</label>
                  <input type="text" id="order-postal" name="postal" required autoComplete="postal-code" placeholder="7700" />
                </div>
                <div className="form-group">
                  <label htmlFor="order-city">Ville *</label>
                  <input type="text" id="order-city" name="city" required autoComplete="address-level2" placeholder="Mouscron" defaultValue="Mouscron" />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="order-payment">Paiement à la livraison</label>
              <div className="radio-group radio-group-inline">
                <label className="radio-pill"><input type="radio" name="payment" defaultValue="cash" defaultChecked /><span>Espèces</span></label>
                <label className="radio-pill"><input type="radio" name="payment" defaultValue="card" /><span>Carte bancaire</span></label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="order-notes">Notes (optionnel)</label>
              <textarea id="order-notes" name="notes" rows={2} placeholder="Allergies, instructions de livraison, etc."></textarea>
            </div>

            <div className="checkout-total" id="checkout-total"></div>

            <div className="checkout-actions">
              <button type="submit" className="btn btn-primary btn-whatsapp" data-channel="whatsapp">
                <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "currentColor" }}><path d="M17.5 14.4l-2-1c-.3-.1-.5-.1-.7.1l-.9 1.1c-.2.2-.3.2-.6.1-1.7-.8-2.8-1.8-3.7-3-.3-.3-.2-.5 0-.7l.4-.5c.2-.2.2-.4.1-.6l-1-2.3c-.2-.6-.5-.5-.7-.5H8c-.2 0-.6.1-.9.5-.3.3-1.2 1.2-1.2 2.8 0 1.7 1.2 3.3 1.4 3.5.2.2 2.4 3.6 5.7 5.1.8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 2-0.8 2.2-1.6.3-.8.3-1.4.2-1.6-.1-.2-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3C8.6 21.5 10.3 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2z" /></svg>
                Envoyer via WhatsApp
              </button>
              <button type="button" className="btn btn-outline btn-email" id="btn-email">
                <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "currentColor" }}><path d="M2 5.5C2 4.7 2.7 4 3.5 4h17c.8 0 1.5.7 1.5 1.5v13c0 .8-.7 1.5-1.5 1.5h-17c-.8 0-1.5-.7-1.5-1.5v-13zm2.2.5 7.8 6 7.8-6H4.2zM20 7.8l-8 6.2-8-6.2v9.7h16V7.8z" /></svg>
                Envoyer par email
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <div className="toast-container" id="toast-container"></div>

      {/* RESERVATION MODAL (desktop only) */}
      <ReservationModal />
    </>
  );
}
