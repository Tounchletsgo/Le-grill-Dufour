import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import CarteGallery from "@/components/CarteGallery";

export const metadata: Metadata = {
  title: "La Carte | Grill Dufour",
  description:
    "Découvrez la carte complète du Grill Dufour : viandes, grillades, poissons, planches, burgers, desserts et boissons. Restaurant à Mouscron.",
};

export default function CartePage() {
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
            <a href="/carte" className="is-active">La Carte</a>
            <a href="/livraison">Commander</a>
            <a href="/reservation">Réserver</a>
            <a href="/#contact">Contact</a>
          </nav>
          <a href="/reservation" className="btn btn-outline btn-sm header-resa-btn">
            Réserver
          </a>
          <a href="/livraison" className="btn btn-primary btn-sm header-cmd-btn">
            Commander
          </a>
        </div>
      </header>

      <Breadcrumb items={[{ label: "La Carte" }]} />

      <main className="carte-content" id="carte-top">
        <div className="carte-photos-layout">
          <div className="carte-photos-head">
            <h1>La Carte</h1>
            <p>
              Cliquez sur une page pour l&#39;agrandir et zoomer sur les prix.
            </p>
          </div>

          <CarteGallery />

          <div className="carte-cta">
            <p>
              Certains plats sont disponibles en livraison —{" "}
              <a href="/livraison" className="carte-link">voir la carte livraison</a>.
            </p>
            <a href="/livraison" className="btn btn-primary">
              Commander en livraison
            </a>
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
