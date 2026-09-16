import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import { restaurant } from "@/data/restaurantData";
import { BARESTHO_CADEAUX_URL } from "@/lib/barestho";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "Chèques-cadeaux | Grill Dufour",
  description:
    "Offrez un repas au Grill Dufour avec nos chèques-cadeaux. Montant au choix, valable sur toute la carte. Commande en ligne via Barestho.",
  alternates: { canonical: "https://legrilldufour.be/cheques-cadeaux" },
};

export default function ChequesCadeauxPage() {
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
            <a href="/cheques-cadeaux" className="is-active">Chèques cadeaux</a>
            <a href="/contact">Contact</a>
          </nav>
          <a href="/reserver" className="btn btn-outline btn-sm header-resa-btn">
            Réserver
          </a>
          <a href="/commander" className="btn btn-primary btn-sm header-cmd-btn">
            Commander
          </a>
          <a href="/commander" className="btn btn-primary btn-sm mobile-cmd-btn">Commander</a>
          <MobileNav currentPath="/cheques-cadeaux" />
        </div>
      </header>

      <Breadcrumb items={[{ label: "Chèques-cadeaux" }]} />

      <main className="section">
        <div className="container" style={{ maxWidth: 700 }}>
          <div className="section-head">
            <span className="eyebrow">Idée cadeau</span>
            <h1 className="section-title">Chèques-cadeaux</h1>
            <div className="divider-mark"></div>
            <p className="section-subtitle">
              Offrez un repas d&apos;exception au Grill Dufour.
              Montant au choix, valable sur toute la carte.
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
              Offrir un chèque cadeau
            </a>
            <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Achat sécurisé via Barestho, notre partenaire de réservation.
            </p>
            <p style={{ marginTop: "1.5rem", fontSize: "0.95rem" }}>
              Vous pouvez aussi commander par téléphone au{" "}
              <a href={restaurant.phoneHref} style={{ color: "var(--gold)" }}>
                {restaurant.phoneDisplay}
              </a>.
            </p>
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
