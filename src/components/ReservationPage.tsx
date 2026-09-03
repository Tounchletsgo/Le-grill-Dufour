"use client";

import { useState } from "react";
import { restaurant } from "@/data/restaurantData";

const BARESTHO_URL =
  process.env.NEXT_PUBLIC_BARESTHO_URL ||
  "https://legrilldufour.reservation.barestho.com/";

const WIDGET_URL = BARESTHO_URL.endsWith("/")
  ? `${BARESTHO_URL}?view=widget`
  : `${BARESTHO_URL}/?view=widget`;

export default function ReservationPage() {
  const [iframeError, setIframeError] = useState(false);

  return (
    <div className="resa-page">
      <header className="resa-header">
        <div className="container resa-header-inner">
          <a href="/" className="brand">
            <img
              src="/images/logo/grill-dufour-logo-noir.svg"
              alt="Le Grill Dufour — Restaurant"
              className="brand-logo"
              width={100}
              height={48}
            />
          </a>
          <nav className="resa-nav" aria-label="Navigation">
            <a href="/">Accueil</a>
            <a href="/carte">La Carte</a>
            <a href="/livraison">Commander</a>
            <a href="/reservation" className="is-active">Réserver</a>
          </nav>
          <a href="/" className="btn btn-outline btn-sm">
            Retour au site
          </a>
        </div>
      </header>

      <main className="resa-main">
        <div className="container">
          <div className="resa-intro">
            <h1>Réserver une table</h1>
            <p>
              Choisissez la date, l'heure et le nombre de convives.
              La réservation est confirmée instantanément.
            </p>
          </div>

          {!iframeError ? (
            <div className="resa-widget-wrap">
              <iframe
                src={WIDGET_URL}
                title="Réservation Barestho — Grill Dufour"
                className="resa-iframe resa-iframe-full"
                onError={() => setIframeError(true)}
                allow="payment"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="resa-fallback resa-fallback-page">
              <p>Le formulaire de réservation ne peut pas se charger.</p>
              <a
                href={BARESTHO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Réserver sur Barestho
              </a>
              <div className="resa-fallback-contact">
                <p>Ou réservez par téléphone :</p>
                <a href={restaurant.phoneHref} className="resa-phone-big">
                  {restaurant.phoneDisplay}
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="resa-footer">
        <div className="container">
          <p>
            &copy; {new Date().getFullYear()} Grill Dufour — Réservation gérée par{" "}
            <a
              href="https://www.barestho.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Barestho
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
