import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page introuvable | Le Grill du Four",
  robots: "noindex",
};

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <a href="/" className="not-found-brand">
          <img
            src="/logo-grill-du-four.webp"
            alt="Le Grill du Four"
            width={64}
            height={64}
          />
        </a>
        <h1>404</h1>
        <p className="not-found-title">Page introuvable</p>
        <p className="not-found-text">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="not-found-actions">
          <a href="/" className="btn btn-primary">
            Retour à l&apos;accueil
          </a>
          <a href="/carte" className="btn btn-outline">
            Voir la carte
          </a>
          <a href="/livraison" className="btn btn-outline">
            Commander
          </a>
        </div>
      </div>
    </div>
  );
}
