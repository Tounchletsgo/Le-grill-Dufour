"use client";

import { useState, useCallback, useEffect } from "react";

const CARTE_PAGES = [
  { src: "/images/carte/planches.jpg", alt: "Carte du Grill Dufour — Nos planches" },
  { src: "/images/carte/lunch.jpg", alt: "Carte du Grill Dufour — Lunch & formules" },
  { src: "/images/carte/menus.jpg", alt: "Carte du Grill Dufour — Nos menus & formule de groupe" },
  { src: "/images/carte/entrees-viandes.jpg", alt: "Carte du Grill Dufour — Entrées, viandes & grillades" },
  { src: "/images/carte/poissons-salades.jpg", alt: "Carte du Grill Dufour — Poissons, salades & plats veggies" },
  { src: "/images/carte/desserts-boissons.jpg", alt: "Carte du Grill Dufour — Desserts, digestifs & boissons" },
];

export default function CarteGallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const open = useCallback((i: number) => setLightbox(i), []);
  const close = useCallback(() => setLightbox(null), []);
  const prev = useCallback(() => setLightbox((c) => (c !== null ? (c - 1 + CARTE_PAGES.length) % CARTE_PAGES.length : null)), []);
  const next = useCallback(() => setLightbox((c) => (c !== null ? (c + 1) % CARTE_PAGES.length : null)), []);

  useEffect(() => {
    if (lightbox === null) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, close, prev, next]);

  return (
    <>
      <div className="carte-gallery">
        {CARTE_PAGES.map((page, i) => (
          <button
            key={page.src}
            className="carte-gallery-item reveal"
            onClick={() => open(i)}
            type="button"
            aria-label={`Agrandir : ${page.alt}`}
          >
            <img
              src={page.src}
              alt={page.alt}
              loading={i === 0 ? "eager" : "lazy"}
              width={600}
              height={850}
            />
            <span className="carte-gallery-zoom">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 13 15.2l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14zM12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z" fill="currentColor"/></svg>
              Agrandir
            </span>
          </button>
        ))}
      </div>

      {lightbox !== null && (
        <div className="carte-lightbox" onClick={close} role="dialog" aria-label="Carte en plein écran">
          <button className="carte-lb-close" onClick={close} aria-label="Fermer" type="button">&times;</button>
          <button className="carte-lb-prev" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Page précédente" type="button">&#8249;</button>
          <div className="carte-lb-img" onClick={(e) => e.stopPropagation()}>
            <img
              src={CARTE_PAGES[lightbox].src}
              alt={CARTE_PAGES[lightbox].alt}
              draggable={false}
            />
            <span className="carte-lb-counter">{lightbox + 1} / {CARTE_PAGES.length}</span>
          </div>
          <button className="carte-lb-next" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Page suivante" type="button">&#8250;</button>
        </div>
      )}
    </>
  );
}
