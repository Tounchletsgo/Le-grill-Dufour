import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import { restaurant } from "@/data/restaurantData";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "Contact & Accès | Grill Dufour — Mouscron",
  description:
    "Contactez le Grill Dufour : adresse, téléphone, horaires d'ouverture et itinéraire. Rue des Courtils 1B, 7700 Mouscron.",
  alternates: { canonical: "https://legrilldufour.be/contact" },
};

export default function ContactPage() {
  return (
    <div className="carte-page">
      <header className="carte-header">
        <div className="container carte-header-inner">
          <a href="/" className="brand">
            <img
              src="/images/logo/grill-dufour-logo-noir.svg"
              alt="Le Grill Dufour — Restaurant"
              className="brand-logo"
              width={100}
              height={48}
            />
          </a>
          <nav className="carte-nav" aria-label="Navigation">
            <a href="/">Accueil</a>
            <a href="/la-carte">La Carte</a>
            <a href="/commander">Commander</a>
            <a href="/reserver">Réserver</a>
            <a href="/cheques-cadeaux">Chèques cadeaux</a>
            <a href="/contact" className="is-active">Contact</a>
          </nav>
          <a href="/reserver" className="btn btn-outline btn-sm header-resa-btn">
            Réserver
          </a>
          <a href="/commander" className="btn btn-primary btn-sm header-cmd-btn">
            Commander
          </a>
          <a href="/commander" className="btn btn-primary btn-sm mobile-cmd-btn">Commander</a>
          <MobileNav currentPath="/contact" />
        </div>
      </header>

      <Breadcrumb items={[{ label: "Contact" }]} />

      <main className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Nous contacter</span>
            <h1 className="section-title">Contact &amp; Accès</h1>
            <div className="divider-mark"></div>
          </div>

          <div className="contact-grid">
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">
                  <svg viewBox="0 0 24 24"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" /></svg>
                </div>
                <div>
                  <h2 className="contact-label">Adresse</h2>
                  <p>Rue des Courtils - Hovenstraat 1B, 7700 Mouscron, Hainaut, Belgique</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1L6.6 10.8z" /></svg>
                </div>
                <div>
                  <h2 className="contact-label">Téléphone</h2>
                  <a href={restaurant.phoneHref}>{restaurant.phoneDisplay}</a>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <svg viewBox="0 0 24 24"><path d="M2 5.5C2 4.7 2.7 4 3.5 4h17c.8 0 1.5.7 1.5 1.5v13c0 .8-.7 1.5-1.5 1.5h-17c-.8 0-1.5-.7-1.5-1.5v-13zm2.2.5 7.8 6 7.8-6H4.2zM20 7.8l-8 6.2-8-6.2v9.7h16V7.8z" /></svg>
                </div>
                <div>
                  <h2 className="contact-label">Email</h2>
                  <a href="mailto:chriswillen@me.com">chriswillen@me.com</a>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v5.4l4 2.4-.8 1.3-4.7-2.8V7h1.5z" /></svg>
                </div>
                <div>
                  <h2 className="contact-label">Horaires</h2>
                  <p>Lun, Mar, Ven, Sam : 11h45–15h &amp; 18h45–22h<br />Dim : 11h45–15h<br />Mer &amp; Jeu : Fermé</p>
                </div>
              </div>

              <div className="contact-ctas">
                <a href={restaurant.phoneHref} className="btn btn-primary">Appeler</a>
                <a href={restaurant.emailHref} className="btn btn-outline">Envoyer un email</a>
                <a href="https://www.google.com/maps/search/?api=1&query=Rue+des+Courtils+1B+7700+Mouscron+Belgium" target="_blank" rel="noopener" className="btn btn-outline">Itinéraire</a>
              </div>
            </div>

            <div className="map-wrap">
              <iframe
                title="Grill Dufour sur Google Maps"
                src="https://www.google.com/maps?q=Rue+des+Courtils+1B,+7700+Mouscron,+Belgium&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </main>

      <footer className="carte-footer">
        <div className="container">
          <span>
            &copy; {new Date().getFullYear()} Restaurant Le Grill Dufour — Tous droits réservés.
          </span>
          <span>
            <a href="/politique-de-confidentialite">Confidentialité</a>
            {" · "}
            <a href="/mentions-legales">Mentions légales</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
