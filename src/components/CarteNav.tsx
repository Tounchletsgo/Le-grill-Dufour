"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/i18n/LocaleContext";
import { localizedHref } from "@/i18n/types";

interface CarteNavProps {
  items: { slug: string; label: string }[];
}

export default function CarteNav({ items }: CarteNavProps) {
  const { locale, t } = useTranslation();
  const [active, setActive] = useState("");
  const [showTop, setShowTop] = useState(false);

  const handleScroll = useCallback(() => {
    setShowTop(window.scrollY > 800);

    const offset = 120;
    let current = "";
    for (const item of items) {
      const el = document.getElementById(item.slug);
      if (el) {
        const top = el.getBoundingClientRect().top;
        if (top <= offset) current = item.slug;
      }
    }
    setActive(current);
  }, [items]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  function scrollTo(slug: string) {
    const el = document.getElementById(slug);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <>
      <nav className="carte-toc" aria-label={t("carte.title")}>
        <div className="carte-toc-inner">
          {items.map((item) => (
            <button
              key={item.slug}
              type="button"
              className={`carte-toc-item${active === item.slug ? " is-active" : ""}`}
              onClick={() => scrollTo(item.slug)}
            >
              {item.label}
            </button>
          ))}
          <a href={localizedHref("/commander", locale)} className="carte-toc-item carte-toc-livraison">
            {t("carte.deliveryMenu")} &rarr;
          </a>
        </div>
      </nav>

      {showTop && (
        <button
          type="button"
          className="carte-back-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={t("carte.backToTop")}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
          </svg>
        </button>
      )}
    </>
  );
}
