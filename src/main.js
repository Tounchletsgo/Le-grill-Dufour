/**
 * main.js
 * -----------------------------------------------------------------------
 * Point d'entrée de l'application Grill Dufour.
 * Gère : navigation mobile, header sticky, animations au scroll,
 * rendu dynamique de la carte à partir de menuData.js, onglets de menu,
 * système de panier et commande en ligne (livraison / à emporter).
 * -----------------------------------------------------------------------
 */

import { menuData, menuTabs, formatPrice } from "./data/menuData.js";
import {
  restaurant, hours, menus, groupFormula, potenceDufour, generalNotes, delivery
} from "./data/restaurantData.js";

/* ------------------------------------------------------------------ */
/* Utilities                                                          */
/* ------------------------------------------------------------------ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ------------------------------------------------------------------ */
/* 1. Header — sticky style on scroll                                 */
/* ------------------------------------------------------------------ */
function initHeaderScroll() {
  const header = $(".site-header");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ------------------------------------------------------------------ */
/* 2. Horizontal scroll nav — auto-scroll active link into view       */
/* ------------------------------------------------------------------ */
function initMobileNav() {
  const nav = $(".main-nav");
  if (!nav) return;
  const active = nav.querySelector(".is-active");
  if (active) {
    requestAnimationFrame(() => {
      active.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    });
  }
}

/* ------------------------------------------------------------------ */
/* 3. Smooth scroll + active nav link highlighting                    */
/* ------------------------------------------------------------------ */
function initSmoothScrollAndActiveLinks() {
  const navLinks = $$('.main-nav a[href^="#"]');
  const sections = navLinks
    .map((link) => document.getElementById(link.getAttribute("href").slice(1)))
    .filter(Boolean);

  if (!sections.length) return;

  const setActive = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ------------------------------------------------------------------ */
/* 4. Scroll-reveal animations (Intersection Observer)                */
/* ------------------------------------------------------------------ */
function initScrollReveal() {
  const revealEls = $$(".reveal");
  if (!revealEls.length) return;

  if (!("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/* ------------------------------------------------------------------ */
/* 5. Menu tabs — filter system                                       */
/* ------------------------------------------------------------------ */
function initMenuTabs() {
  const tabButtons = $$(".menu-tab");
  const panels = $$(".menu-panel");
  if (!tabButtons.length) return;

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;

      tabButtons.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", b === btn);
      });
      panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === target));

      const panelWrap = $(".menu-panels");
      if (panelWrap && window.innerWidth < 760) {
        panelWrap.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

/* ------------------------------------------------------------------ */
/* 6. Dynamic menu rendering from menuData.js                         */
/* ------------------------------------------------------------------ */
function makeAddBtn() {
  return "";
}

function renderSimplePriceItem(item, category) {
  const priceLabel = item.volume ? `${formatPrice(item.price)}` : formatPrice(item.price);
  const nameLabel = item.volume ? `${item.name} <span class="vol">(${item.volume})</span>` : item.name;
  return `
    <li>
      <span class="name">${nameLabel}${item.description ? ` — <span style="color:var(--text-muted)">${item.description}</span>` : ""}</span>
      <span class="price">${priceLabel}</span>
      ${makeAddBtn(item.name, item.price, category)}
    </li>`;
}

function renderStandardList(items, category) {
  return `
    <div class="menu-list">
      ${items
        .map(
          (item) => `
        <div class="menu-item reveal">
          <div class="menu-item-info">
            <div class="menu-item-name">${item.name}</div>
            ${item.description ? `<div class="menu-item-desc">${item.description}</div>` : ""}
            ${
              item.supplements
                ? item.supplements
                    .map((s) => `<div class="menu-item-sup">${s.label} : ${typeof s.price === "string" ? s.price : formatPrice(s.price)}</div>`)
                    .join("")
                : ""
            }
          </div>
          <div class="menu-item-price">${formatPrice(item.price)}</div>
          ${makeAddBtn(item.name, item.price, category)}
        </div>`
        )
        .join("")}
    </div>`;
}

function renderCroquettes(items, category) {
  return `
    <div class="specialties-grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));">
      ${items
        .map(
          (item) => `
        <div class="combo-card reveal">
          <h3>${item.name}</h3>
          <div class="weight">${item.weight}</div>
          <div class="combo-variants">
            ${item.variants
              .map((v) => `<div class="row"><span>${v.label}</span><strong>${formatPrice(v.price)}</strong>${makeAddBtn(item.name, v.price, category, v.label)}</div>`)
              .join("")}
          </div>
        </div>`
        )
        .join("")}
    </div>`;
}

function renderPlanches(items, category) {
  return `
    <div class="specialties-grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">
      ${items
        .map(
          (item) => `
        <div class="combo-card reveal">
          <h3>${item.name}</h3>
          ${item.description ? `<p class="desc">${item.description}</p>` : ""}
          <div class="combo-variants">
            ${item.variants
              .map((v) => `<div class="row"><span>${v.label}</span><strong>${formatPrice(v.price)}</strong>${makeAddBtn(item.name, v.price, category, v.label)}</div>`)
              .join("")}
          </div>
        </div>`
        )
        .join("")}
    </div>`;
}

function renderSimpleList(items, category) {
  return `<ul class="menu-simple-list">${items.map((item) => renderSimplePriceItem(item, category)).join("")}</ul>`;
}

function renderLunchPanel(lunch) {
  return `
    <p class="menu-panel-note">${lunch.intro}<br>${lunch.note}</p>
    <div class="lunch-base-row">
      ${lunch.base.map((b) => `<span><strong>${b.name}</strong> seul : ${formatPrice(b.price)}</span>`).join("")}
    </div>
    <div class="lunch-grid">
      ${lunch.formules
        .map(
          (f, i) => `
        <div class="combo-card reveal reveal-delay-${(i % 4) + 1}" style="text-align:center;">
          <div class="weight" style="text-transform:uppercase;letter-spacing:.08em;color:var(--color-gold);">${f.name}</div>
          <h3 style="font-size:1.1rem;margin:.5rem 0;">${f.description}</h3>
          <div class="menu-item-price" style="font-size:1.6rem;">${formatPrice(f.price)}</div>
          ${makeAddBtn(f.name + " — " + f.description, f.price, "Lunch")}
        </div>`
        )
        .join("")}
    </div>
    <p class="menu-panel-note">${lunch.allergyNote}</p>`;
}

function renderMenuPanels() {
  const wrap = $(".menu-panels");
  if (!wrap) return;

  const panelsHtml = menuTabs
    .map((tab) => {
      const data = menuData[tab.key];
      let inner = "";
      let note = "";

      switch (tab.key) {
        case "lunch":
          inner = renderLunchPanel(data);
          break;
        case "entrees":
          inner = renderStandardList(data, tab.label);
          note = menuData.entreesNote;
          break;
        case "croquettes":
          inner = renderCroquettes(data, tab.label);
          break;
        case "planches":
          inner = renderPlanches(data, tab.label);
          note = menuData.planchesNote;
          break;
        case "viandes":
          inner = renderStandardList(data, tab.label);
          note = menuData.suggestionBoucher;
          break;
        case "grillades":
          inner = renderStandardList(data, tab.label);
          break;
        case "poissons":
          inner = renderStandardList(data, tab.label);
          note = menuData.poissonsNote;
          break;
        case "salades":
          inner = renderStandardList(data, tab.label);
          note = menuData.saladesNote;
          break;
        case "desserts":
          inner = renderStandardList(data, tab.label);
          break;
        case "boissons":
        case "digestifs":
        case "whisky":
        case "rhum":
          inner = renderSimpleList(data, tab.label);
          break;
        case "jacoulot":
          inner = renderSimpleList(data, tab.label);
          break;
        case "cocktails":
          inner = renderStandardList(data, tab.label);
          break;
        default:
          inner = "";
      }

      return `
        <div class="menu-panel${tab.key === "lunch" ? " is-active" : ""}" data-panel="${tab.key}">
          ${note ? `<p class="menu-panel-note">${note}</p>` : ""}
          ${inner}
        </div>`;
    })
    .join("");

  wrap.innerHTML = panelsHtml;
}

function renderMenuTabsNav() {
  const wrap = $(".menu-tabs");
  if (!wrap) return;

  wrap.setAttribute("role", "tablist");
  wrap.innerHTML = menuTabs
    .map(
      (tab, i) =>
        `<button class="menu-tab${i === 0 ? " is-active" : ""}" data-tab="${tab.key}" type="button" role="tab" aria-selected="${i === 0}">${tab.label}</button>`
    )
    .join("");
}

function renderAccompagnements() {
  const wrap = $("#accompagnements-content");
  if (!wrap) return;
  const acc = menuData.accompagnements;

  wrap.innerHTML = `
    <p>${acc.intro}</p>
    <p>${acc.choix}</p>
    <h3 class="menu-footnote-heading">Sauces</h3>
    ${acc.sauceTiers.map((tier) => `
      <div style="margin-bottom:.5rem;">
        <strong>Sauce ${tier.price} :</strong>
        <span class="sauce-tags">${tier.items.map((s) => `<span>${s}</span>`).join("")}</span>
      </div>
    `).join("")}
    <h3 class="menu-footnote-heading" style="margin-top:1.5rem;">Suppléments</h3>
    <div class="sauce-tags">
      ${acc.supplements.map((s) => `<span>${s.name} — ${formatPrice(s.price)}</span>`).join("")}
    </div>
  `;
}

/* ------------------------------------------------------------------ */
/* 7. Render Menus fixes (cards) + Group formula + Potence + Hours     */
/* ------------------------------------------------------------------ */
function renderFixedMenus() {
  const wrap = $("#menus-grid");
  if (!wrap) return;

  wrap.innerHTML = menus
    .map(
      (m, i) => `
    <div class="menu-fixed-card reveal reveal-delay-${(i % 4) + 1}${m.highlight ? " is-highlight" : ""}">
      ${m.highlight ? `<span class="badge">Signature</span>` : ""}
      <h3>${m.name}</h3>
      <p>${m.description}</p>
      <div class="price">${formatPrice(m.price)}</div>
    </div>`
    )
    .join("");
}

function renderGroupFormula() {
  const wrap = $("#group-content");
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="group-price-block reveal">
      <div class="price">${formatPrice(groupFormula.price)}</div>
      <div class="per">par personne — minimum ${groupFormula.minPersons} personnes</div>
    </div>
    <div class="group-details reveal reveal-delay-1">
      <h3>${groupFormula.aperitif}</h3>
      <h3 style="margin-top:1rem;">${groupFormula.planche}</h3>
      <h3 style="margin-top:1rem;">Plats au choix</h3>
      <ul>${groupFormula.plats.map((p) => `<li>${p}</li>`).join("")}</ul>
      <h3>Dessert</h3>
      <ul><li>${groupFormula.dessert}</li></ul>
      <h3>Boissons</h3>
      <ul><li>${groupFormula.boissons}</li></ul>
    </div>
  `;
}

function renderPotence() {
  const wrap = $("#potence-content");
  if (!wrap) return;

  wrap.innerHTML = `
    <span class="eyebrow">Spécialité de la maison</span>
    <h2>${potenceDufour.name}</h2>
    <p class="lead">${potenceDufour.description}</p>
    <div class="potence-meta">
      ${potenceDufour.variants.map((v) => `
        <div class="item">${v.weight}<strong>${formatPrice(v.price)} / pers.</strong></div>
      `).join("")}
      <div class="item">Minimum<strong>${potenceDufour.variants[0].minPersons} personnes</strong></div>
    </div>
    <p class="lead" style="font-size:.95rem;margin-top:.5rem;">Suggestion du boucher</p>
    <a href="#contact" class="btn btn-primary">Réserver cette expérience</a>
  `;
}

function renderHours() {
  const wrap = $("#hours-table");
  if (!wrap) return;

  const jsDay = new Date().getDay();
  const dayIndexMap = [6, 0, 1, 2, 3, 4, 5];

  wrap.innerHTML = hours
    .map((h, i) => {
      const isToday = dayIndexMap[jsDay] === i;
      return `
      <div class="hours-row${isToday ? " is-today" : ""}">
        <span class="day">${h.day}${isToday ? " · Aujourd'hui" : ""}</span>
        <span class="ranges${h.closed ? " closed" : ""}">
          ${h.closed ? "Fermé" : h.ranges.map((r) => `<span>${r}</span>`).join("")}
        </span>
      </div>`;
    })
    .join("");
}

function renderGeneralNotes() {
  const wrap = $("#general-notes");
  if (!wrap) return;
  wrap.innerHTML = generalNotes.map((n) => `<li>${n}</li>`).join("");
}

/* ------------------------------------------------------------------ */
/* 8. Contact / restaurant info binding                                */
/* ------------------------------------------------------------------ */
function bindRestaurantInfo() {
  $$("[data-restaurant-phone]").forEach((el) => {
    el.textContent = restaurant.phone;
    if (el.tagName === "A") el.href = restaurant.phoneHref;
  });
  $$("[data-restaurant-email]").forEach((el) => {
    el.textContent = restaurant.email;
    if (el.tagName === "A") el.href = restaurant.emailHref;
  });
  $$("[data-restaurant-address]").forEach((el) => {
    el.textContent = restaurant.address.full;
  });
  $$("[data-restaurant-maps-link]").forEach((el) => {
    if (el.tagName === "A") el.href = restaurant.mapsLink;
  });
  $$("[data-restaurant-maps-embed]").forEach((el) => {
    if (el.tagName === "IFRAME") el.src = restaurant.mapsEmbedSrc;
  });
  $$("[data-restaurant-tva]").forEach((el) => {
    el.textContent = restaurant.tva;
  });
  $$("[data-restaurant-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

/* ------------------------------------------------------------------ */
/* 9. Lazy loading fallback for images without native support          */
/* ------------------------------------------------------------------ */
function initLazyLoad() {
  const lazyImages = $$("img[loading='lazy']");
  if (!("loading" in HTMLImageElement.prototype) && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) img.src = img.dataset.src;
          obs.unobserve(img);
        }
      });
    });
    lazyImages.forEach((img) => observer.observe(img));
  }
}

/* ------------------------------------------------------------------ */
/* 10. Delivery banner                                                 */
/* ------------------------------------------------------------------ */
function renderDeliveryBanner() {
  const wrap = $("#delivery-banner");
  if (!wrap || !delivery.enabled) return;

  wrap.innerHTML = `
    <div class="delivery-banner-inner">
      <div class="delivery-banner-icon">
        <svg viewBox="0 0 24 24"><path d="M18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1.5-9H17V12h4.46L19.5 9.5zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM20 8l3 4v5h-2a3 3 0 0 1-6 0H9a3 3 0 0 1-6 0H1V6c0-1.1.9-2 2-2h14v4h3z"/></svg>
      </div>
      <div class="delivery-banner-text">
        <strong>Commandez en ligne</strong>
        <span>Livraison ${delivery.zone} · Min. ${formatPrice(delivery.minOrder)} · Frais : ${formatPrice(delivery.fee)}</span>
      </div>
      <div class="delivery-banner-meta">
        <span>${delivery.estimatedTime}</span>
      </div>
    </div>
  `;
}


/* ------------------------------------------------------------------ */
/* 16. Init                                                            */
/* ------------------------------------------------------------------ */
function init() {
  renderMenuTabsNav();
  renderMenuPanels();
  renderAccompagnements();
  renderFixedMenus();
  renderGroupFormula();
  renderPotence();
  renderHours();
  renderGeneralNotes();
  renderDeliveryBanner();
  bindRestaurantInfo();

  initHeaderScroll();
  initMobileNav();
  initSmoothScrollAndActiveLinks();
  initMenuTabs();
  initScrollReveal();
  initLazyLoad();
}

export { init };

if (typeof window !== "undefined" && !window.__NEXT_DATA__) {
  document.addEventListener("DOMContentLoaded", init);
}
