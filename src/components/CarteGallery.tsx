"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface CarteImage {
  src: string;
  alt: string;
}

const CARTE_IMAGES: CarteImage[] = [
  { src: "/images/carte/carte-3.jpg", alt: "Carte du Grill Dufour : nos planches" },
  { src: "/images/carte/carte-5.jpg", alt: "Carte du Grill Dufour : formules lunch" },
  { src: "/images/carte/carte-4.jpg", alt: "Carte du Grill Dufour : nos menus" },
  { src: "/images/carte/carte-1.jpg", alt: "Carte du Grill Dufour : entrées, Potence Dufour, viandes, grillades et sauces" },
  { src: "/images/carte/carte-2.jpg", alt: "Carte du Grill Dufour : poissons, salades et plats veggies" },
  { src: "/images/carte/carte-6.jpg", alt: "Carte du Grill Dufour : desserts, digestifs, whisky, rhum et boissons chaudes" },
];

const IMG_W = 1055;
const IMG_H = 1495;

export default function CarteGallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const lastPinchDist = useRef(0);
  const lastTouch = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const swipeStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const open = useCallback((i: number) => {
    setLightboxIndex(i);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const close = useCallback(() => {
    setLightboxIndex(null);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const prev = useCallback(() => {
    setLightboxIndex((c) => {
      if (c === null || c === 0) return c;
      setScale(1);
      setTranslate({ x: 0, y: 0 });
      return c - 1;
    });
  }, []);

  const next = useCallback(() => {
    setLightboxIndex((c) => {
      if (c === null || c === CARTE_IMAGES.length - 1) return c;
      setScale(1);
      setTranslate({ x: 0, y: 0 });
      return c + 1;
    });
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
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
  }, [lightboxIndex, close, prev, next]);

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
      return;
    }
    if (e.touches.length === 1) {
      const t = e.touches[0];
      if (scale > 1) {
        isDragging.current = true;
        lastTouch.current = { x: t.clientX, y: t.clientY };
      } else {
        swipeStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
      }
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current > 0) {
        const newScale = Math.min(5, Math.max(1, scale * (dist / lastPinchDist.current)));
        setScale(newScale);
        if (newScale <= 1) setTranslate({ x: 0, y: 0 });
      }
      lastPinchDist.current = dist;
      return;
    }
    if (e.touches.length === 1 && isDragging.current && scale > 1) {
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - lastTouch.current.x;
      const dy = t.clientY - lastTouch.current.y;
      lastTouch.current = { x: t.clientX, y: t.clientY };
      setTranslate((p) => ({ x: p.x + dx, y: p.y + dy }));
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    lastPinchDist.current = 0;
    isDragging.current = false;
    if (swipeStart.current && scale <= 1 && e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      const dx = t.clientX - swipeStart.current.x;
      const elapsed = Date.now() - swipeStart.current.time;
      if (elapsed < 400 && Math.abs(dx) > 60) {
        if (dx < 0) next();
        else prev();
      }
      swipeStart.current = null;
    }
  }

  function handleDoubleClick() {
    if (scale > 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  }

  return (
    <>
      <div className="carte-gallery">
        {CARTE_IMAGES.map((img, i) => (
          <div key={img.src} className="carte-gallery-item">
            <button
              type="button"
              className="carte-gallery-btn"
              onClick={() => open(i)}
              aria-label={`Agrandir : ${img.alt}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                width={IMG_W}
                height={IMG_H}
                loading={i < 3 ? "eager" : "lazy"}
                decoding={i < 3 ? "sync" : "async"}
              />
            </button>
            <button
              type="button"
              className="carte-gallery-enlarge"
              onClick={() => open(i)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M11 8v6M8 11h6" />
              </svg>
              Agrandir
            </button>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="carte-lightbox"
          role="dialog"
          aria-label="Carte en plein écran"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <button type="button" className="carte-lb-close" onClick={close} aria-label="Fermer">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <span className="carte-lb-counter">
            {lightboxIndex + 1} / {CARTE_IMAGES.length}
          </span>

          {lightboxIndex > 0 && (
            <button
              type="button"
              className="carte-lb-arrow carte-lb-prev"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Photo précédente"
            >
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}

          {lightboxIndex < CARTE_IMAGES.length - 1 && (
            <button
              type="button"
              className="carte-lb-arrow carte-lb-next"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Photo suivante"
            >
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          )}

          <div
            className="carte-lb-img-wrap"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={handleDoubleClick}
          >
            <img
              src={CARTE_IMAGES[lightboxIndex].src}
              alt={CARTE_IMAGES[lightboxIndex].alt}
              className="carte-lb-img"
              draggable={false}
              style={{
                transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
