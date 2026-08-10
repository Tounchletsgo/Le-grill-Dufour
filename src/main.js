/**
 * main.js
 * -----------------------------------------------------------------------
 * Point d'entrée de l'application "Le Grill du Four".
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
/* 2. Mobile hamburger menu                                           */
/* ------------------------------------------------------------------ */
function initMobileNav() {
  const toggle = $(".hamburger");
  const drawer = $(".mobile-nav");
  if (!toggle || !drawer) return;

  const closeMenu = () => {
    toggle.classList.remove("is-open");
    drawer.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  };

  const openMenu = () => {
    toggle.classList.add("is-open");
    drawer.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("nav-open");
  };

  toggle.addEventListener("click", () => {
    const isOpen = drawer.classList.contains("is-open");
    isOpen ? closeMenu() : openMenu();
  });

  $$("a", drawer).forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
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

      tabButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
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
function makeAddBtn(name, price, category, variant) {
  if (typeof price !== "number") return "";
  const vAttr = variant ? ` data-variant="${variant}"` : "";
  return `<button class="add-cart-btn" type="button" data-name="${name.replace(/"/g, '&quot;')}" data-price="${price}" data-category="${category}"${vAttr} aria-label="Ajouter ${name} au panier">+</button>`;
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

  wrap.innerHTML = menuTabs
    .map(
      (tab, i) =>
        `<button class="menu-tab${i === 0 ? " is-active" : ""}" data-tab="${tab.key}" type="button">${tab.label}</button>`
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
    <h4>Sauces au choix</h4>
    <div class="sauce-tags">${acc.sauces.map((s) => `<span>${s}</span>`).join("")}</div>
    <h4 style="margin-top:1.5rem;">Suppléments</h4>
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
      <div class="item">Portion<strong>${potenceDufour.perPerson}</strong></div>
      <div class="item">Minimum<strong>${potenceDufour.minPersons} personnes</strong></div>
    </div>
    <div class="potence-price">${formatPrice(potenceDufour.price)} <span>/ personne</span></div>
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

  const freeLabel = delivery.freeFrom
    ? `Gratuite dès ${formatPrice(delivery.freeFrom)}`
    : "";

  wrap.innerHTML = `
    <div class="delivery-banner-inner">
      <div class="delivery-banner-icon">
        <svg viewBox="0 0 24 24"><path d="M18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1.5-9H17V12h4.46L19.5 9.5zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM20 8l3 4v5h-2a3 3 0 0 1-6 0H9a3 3 0 0 1-6 0H1V6c0-1.1.9-2 2-2h14v4h3z"/></svg>
      </div>
      <div class="delivery-banner-text">
        <strong>Commandez en ligne</strong>
        <span>Livraison ${delivery.zone} · Min. ${formatPrice(delivery.minOrder)} · ${freeLabel || "Frais : " + formatPrice(delivery.fee)}</span>
      </div>
      <div class="delivery-banner-meta">
        <span>${delivery.estimatedTime}</span>
      </div>
    </div>
  `;
}

/* ------------------------------------------------------------------ */
/* 11. Cart state management                                           */
/* ------------------------------------------------------------------ */
let cart = [];

function getCartKey(name, variant) {
  const base = name.toLowerCase().replace(/[^a-zà-ÿ0-9]/g, "-");
  return variant ? `${base}--${variant.toLowerCase().replace(/[^a-zà-ÿ0-9]/g, "-")}` : base;
}

function addToCart(name, price, category, variant) {
  const key = getCartKey(name, variant);
  const existing = cart.find((c) => c.key === key);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      key,
      name: variant ? `${name} (${variant})` : name,
      price: parseFloat(price),
      category,
      quantity: 1
    });
  }
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function removeFromCart(key) {
  cart = cart.filter((c) => c.key !== key);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function updateQuantity(key, delta) {
  const item = cart.find((c) => c.key === key);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(key);
    return;
  }
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function getCartSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartItemCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function clearCart() {
  cart = [];
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function saveCart() {
  try { localStorage.setItem("gdf-cart", JSON.stringify(cart)); } catch (e) { /* noop */ }
}

function loadCart() {
  try {
    const saved = localStorage.getItem("gdf-cart");
    if (saved) cart = JSON.parse(saved);
  } catch (e) { /* noop */ }
}

/* ------------------------------------------------------------------ */
/* 12. Cart UI                                                         */
/* ------------------------------------------------------------------ */
function updateCartBadge() {
  const badge = $("#cart-badge");
  const fab = $("#cart-fab");
  if (!badge || !fab) return;
  const count = getCartItemCount();
  badge.textContent = count;
  fab.classList.toggle("has-items", count > 0);
}

function toggleCartDrawer(forceOpen) {
  const drawer = $("#cart-drawer");
  const overlay = $("#cart-overlay");
  if (!drawer) return;

  const isOpen = drawer.classList.contains("is-open");
  const shouldOpen = forceOpen !== undefined ? forceOpen : !isOpen;

  drawer.classList.toggle("is-open", shouldOpen);
  if (overlay) overlay.classList.toggle("is-open", shouldOpen);
  document.body.classList.toggle("drawer-open", shouldOpen);
}

function renderCartDrawer() {
  const body = $("#cart-body");
  const footer = $("#cart-footer");
  if (!body || !footer) return;

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.6L5.2 14c-.1.3-.2.6-.2 1 0 1.1.9 2 2 2h12v-2H7.4c-.1 0-.2-.1-.2-.2v-.1l.9-1.6h7.4c.8 0 1.4-.4 1.7-1l3.6-6.5c.2-.3 0-.6-.3-.6H5.2L4.3 2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
        <p>Votre panier est vide</p>
        <span>Ajoutez des plats depuis la carte</span>
      </div>`;
    footer.innerHTML = "";
    return;
  }

  body.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <span class="cart-item-category">${item.category}</span>
        <span class="cart-item-name">${item.name}</span>
      </div>
      <div class="cart-item-controls">
        <button type="button" class="cart-qty-btn" data-key="${item.key}" data-delta="-1" aria-label="Retirer un">−</button>
        <span class="cart-qty">${item.quantity}</span>
        <button type="button" class="cart-qty-btn" data-key="${item.key}" data-delta="1" aria-label="Ajouter un">+</button>
      </div>
      <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
      <button type="button" class="cart-item-remove" data-key="${item.key}" aria-label="Supprimer ${item.name}">&times;</button>
    </div>`
    )
    .join("");

  const subtotal = getCartSubtotal();
  const meetsMin = subtotal >= delivery.minOrder;

  footer.innerHTML = `
    <div class="cart-subtotal">
      <span>Sous-total</span>
      <strong>${formatPrice(subtotal)}</strong>
    </div>
    ${!meetsMin ? `<p class="cart-min-warning">Minimum de commande : ${formatPrice(delivery.minOrder)}</p>` : ""}
    <button type="button" class="btn btn-primary cart-checkout-btn" ${!meetsMin ? "disabled" : ""} id="cart-checkout-btn">
      Passer commande
    </button>
    <button type="button" class="cart-clear-btn" id="cart-clear-btn">Vider le panier</button>
  `;
}

function initCartUI() {
  const fab = $("#cart-fab");
  const closeBtn = $("#cart-close");
  const overlay = $("#cart-overlay");

  if (fab) fab.addEventListener("click", () => toggleCartDrawer());
  if (closeBtn) closeBtn.addEventListener("click", () => toggleCartDrawer(false));
  if (overlay) overlay.addEventListener("click", () => toggleCartDrawer(false));

  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".add-cart-btn");
    if (addBtn) {
      e.preventDefault();
      const { name, price, category, variant } = addBtn.dataset;
      addToCart(name, price, category, variant || null);
      showToast(`${name} ajouté au panier`);

      addBtn.classList.add("is-added");
      setTimeout(() => addBtn.classList.remove("is-added"), 600);
    }

    const qtyBtn = e.target.closest(".cart-qty-btn");
    if (qtyBtn) {
      updateQuantity(qtyBtn.dataset.key, parseInt(qtyBtn.dataset.delta));
    }

    const removeBtn = e.target.closest(".cart-item-remove");
    if (removeBtn) {
      removeFromCart(removeBtn.dataset.key);
    }

    if (e.target.closest("#cart-clear-btn")) {
      clearCart();
    }

    if (e.target.closest("#cart-checkout-btn")) {
      toggleCartDrawer(false);
      openCheckout();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const drawer = $("#cart-drawer");
      if (drawer && drawer.classList.contains("is-open")) {
        toggleCartDrawer(false);
      }
      const checkout = $("#checkout-overlay");
      if (checkout && checkout.classList.contains("is-open")) {
        closeCheckout();
      }
    }
  });
}

/* ------------------------------------------------------------------ */
/* 13. Toast notifications                                             */
/* ------------------------------------------------------------------ */
function showToast(message) {
  const container = $("#toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("is-visible"));

  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

/* ------------------------------------------------------------------ */
/* 14. Checkout modal                                                  */
/* ------------------------------------------------------------------ */
function openCheckout() {
  const overlay = $("#checkout-overlay");
  if (!overlay) return;

  renderCheckoutSummary();
  updateCheckoutTotal();
  updateDeliveryFields();

  overlay.classList.add("is-open");
  document.body.classList.add("checkout-open");

  const feeLabel = $("#delivery-fee-label");
  if (feeLabel) {
    const subtotal = getCartSubtotal();
    const isFree = subtotal >= delivery.freeFrom;
    feeLabel.textContent = isFree ? "Gratuite" : formatPrice(delivery.fee);
  }
}

function closeCheckout() {
  const overlay = $("#checkout-overlay");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  document.body.classList.remove("checkout-open");
}

function renderCheckoutSummary() {
  const wrap = $("#checkout-summary");
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="checkout-items">
      ${cart.map((item) => `
        <div class="checkout-item-row">
          <span>${item.quantity}x ${item.name}</span>
          <span>${formatPrice(item.price * item.quantity)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function updateDeliveryFields() {
  const deliveryFields = $("#delivery-fields");
  const modeInputs = $$('input[name="order-mode"]');
  if (!deliveryFields) return;

  const mode = ($$('input[name="order-mode"]:checked')[0] || {}).value || "delivery";
  deliveryFields.style.display = mode === "delivery" ? "block" : "none";

  const addressInput = $("#order-address");
  const postalInput = $("#order-postal");
  const cityInput = $("#order-city");
  if (mode === "pickup") {
    if (addressInput) addressInput.removeAttribute("required");
    if (postalInput) postalInput.removeAttribute("required");
    if (cityInput) cityInput.removeAttribute("required");
  } else {
    if (addressInput) addressInput.setAttribute("required", "");
    if (postalInput) postalInput.setAttribute("required", "");
    if (cityInput) cityInput.setAttribute("required", "");
  }

  updateCheckoutTotal();
}

function updateCheckoutTotal() {
  const wrap = $("#checkout-total");
  if (!wrap) return;

  const subtotal = getCartSubtotal();
  const mode = ($$('input[name="order-mode"]:checked')[0] || {}).value || "delivery";
  const isFree = subtotal >= delivery.freeFrom;
  const fee = mode === "delivery" && !isFree ? delivery.fee : 0;
  const total = subtotal + fee;

  wrap.innerHTML = `
    <div class="total-row"><span>Sous-total</span><span>${formatPrice(subtotal)}</span></div>
    ${mode === "delivery" ? `
      <div class="total-row ${isFree ? "is-free" : ""}">
        <span>Livraison</span>
        <span>${isFree ? "Gratuite" : formatPrice(fee)}</span>
      </div>
    ` : `
      <div class="total-row is-free"><span>À emporter</span><span>Gratuit</span></div>
    `}
    <div class="total-row total-final"><span>Total</span><span>${formatPrice(total)}</span></div>
  `;
}

function initCheckout() {
  const closeBtn = $("#checkout-close");
  const form = $("#checkout-form");
  const overlay = $("#checkout-overlay");
  const emailBtn = $("#btn-email");

  if (closeBtn) closeBtn.addEventListener("click", closeCheckout);

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeCheckout();
    });
  }

  $$('input[name="order-mode"]').forEach((input) => {
    input.addEventListener("change", updateDeliveryFields);
  });

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      submitOrder("whatsapp");
    });
  }

  if (emailBtn) {
    emailBtn.addEventListener("click", () => {
      if (!form || !form.checkValidity()) {
        if (form) form.reportValidity();
        return;
      }
      submitOrder("email");
    });
  }
}

/* ------------------------------------------------------------------ */
/* 15. Order submission                                                */
/* ------------------------------------------------------------------ */
function getFormData() {
  const mode = ($$('input[name="order-mode"]:checked')[0] || {}).value || "delivery";
  const payment = ($$('input[name="payment"]:checked')[0] || {}).value || "cash";

  return {
    name: ($("#order-name") || {}).value || "",
    phone: ($("#order-phone") || {}).value || "",
    address: ($("#order-address") || {}).value || "",
    postal: ($("#order-postal") || {}).value || "",
    city: ($("#order-city") || {}).value || "",
    notes: ($("#order-notes") || {}).value || "",
    mode,
    payment: payment === "cash" ? "Espèces" : "Carte bancaire"
  };
}

function formatOrderText(data) {
  const subtotal = getCartSubtotal();
  const isFree = subtotal >= delivery.freeFrom;
  const fee = data.mode === "delivery" && !isFree ? delivery.fee : 0;
  const total = subtotal + fee;

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-BE", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });
  const timeStr = now.toLocaleTimeString("fr-BE", {
    hour: "2-digit", minute: "2-digit"
  });

  const itemsText = cart
    .map((item) => `  ${item.quantity}x ${item.name} — ${formatPrice(item.price * item.quantity)}`)
    .join("\n");

  const addressBlock = data.mode === "delivery"
    ? `Adresse : ${data.address}, ${data.postal} ${data.city}`
    : "Mode : À emporter (retrait sur place)";

  return [
    `NOUVELLE COMMANDE — Le Grill du Four`,
    ``,
    `Articles :`,
    itemsText,
    ``,
    `Sous-total : ${formatPrice(subtotal)}`,
    data.mode === "delivery" ? `Livraison : ${isFree ? "Gratuite" : formatPrice(fee)}` : `À emporter : Gratuit`,
    `TOTAL : ${formatPrice(total)}`,
    ``,
    `Client : ${data.name}`,
    `Téléphone : ${data.phone}`,
    addressBlock,
    `Paiement : ${data.payment}`,
    data.notes ? `Notes : ${data.notes}` : "",
    ``,
    `Commande reçue le ${dateStr} à ${timeStr}`
  ].filter(Boolean).join("\n");
}

function submitOrder(channel) {
  const data = getFormData();
  const text = formatOrderText(data);

  if (channel === "whatsapp") {
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${delivery.whatsappNumber}?text=${encoded}`;
    window.open(url, "_blank");
  } else {
    const subject = encodeURIComponent(`Commande en ligne — ${data.name}`);
    const body = encodeURIComponent(text);
    window.location.href = `mailto:${restaurant.email}?subject=${subject}&body=${body}`;
  }

  showToast("Commande envoyée !");
  closeCheckout();
  clearCart();
}

/* ------------------------------------------------------------------ */
/* 16. Init                                                            */
/* ------------------------------------------------------------------ */
function init() {
  loadCart();

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

  updateCartBadge();
  renderCartDrawer();
  initCartUI();
  initCheckout();
}

export { init };

if (typeof window !== "undefined" && !window.__NEXT_DATA__) {
  document.addEventListener("DOMContentLoaded", init);
}
