import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import CarteGallery from "@/components/CarteGallery";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "La Carte | Grill Dufour — Viandes, Grillades & Poissons",
  description:
    "Découvrez la carte complète du Grill Dufour : viandes grillées, côte à l'os, poissons, burgers, planches et desserts. Restaurant à Mouscron.",
  alternates: { canonical: "https://legrilldufour.be/la-carte" },
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
            <a href="/la-carte" className="is-active">La Carte</a>
            <a href="/commander">Commander</a>
            <a href="/reserver">Réserver</a>
            <a href="/cheques-cadeaux">Chèques cadeaux</a>
            <a href="/contact">Contact</a>
          </nav>
          <a href="/reserver" className="btn btn-outline btn-sm header-resa-btn">
            Réserver
          </a>
          <a href="/commander" className="btn btn-primary btn-sm header-cmd-btn">
            Commander
          </a>
          <a href="/commander" className="btn btn-primary btn-sm mobile-cmd-btn">Commander</a>
          <MobileNav currentPath="/la-carte" />
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
              <a href="/commander" className="carte-link">voir la carte livraison</a>.
            </p>
            <a href="/commander" className="btn btn-primary">
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
