import type { Metadata } from "next";
import { getMenuData } from "@/lib/menu";
import Breadcrumb from "@/components/Breadcrumb";
import CarteNav from "@/components/CarteNav";

export const metadata: Metadata = {
  title: "La Carte | Grill Dufour",
  description:
    "Découvrez la carte complète du Grill Dufour : viandes, grillades, poissons, planches, burgers, desserts et boissons. Restaurant à Mouscron.",
};

function formatPrice(price: number): string {
  return price.toFixed(2).replace(".", ",").replace(",00", "") + " €";
}

const AMBIANCE_IMAGES: Record<string, { src: string; alt: string }> = {};

export default async function CartePage() {
  const { categories, fixedMenus } = await getMenuData();

  const visibleCategories = categories.filter(
    (cat) => cat.menu_items.some((i) => !i.is_delivery_only)
  );

  const tocItems = visibleCategories.map((cat) => ({
    slug: cat.slug,
    label: cat.label,
  }));
  if (fixedMenus.length > 0) {
    tocItems.push({ slug: "menus-fixes", label: "Menus" });
  }

  const jsonLdMenu = {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "Carte du Grill Dufour",
    description: "Carte complète du restaurant Grill Dufour à Mouscron",
    hasMenuSection: visibleCategories.map((cat) => ({
      "@type": "MenuSection",
      name: cat.label,
      hasMenuItem: cat.menu_items
        .filter((i) => !i.is_delivery_only)
        .map((item) => ({
          "@type": "MenuItem",
          name: item.name,
          ...(item.description ? { description: item.description } : {}),
          ...(item.price !== null
            ? {
                offers: {
                  "@type": "Offer",
                  price: item.price,
                  priceCurrency: "EUR",
                },
              }
            : item.variants.length > 0
              ? {
                  offers: item.variants.map((v) => ({
                    "@type": "Offer",
                    name: v.label,
                    price: v.price,
                    priceCurrency: "EUR",
                  })),
                }
              : {}),
        })),
    })),
  };

  let imageIndex = 0;
  const ambianceKeys = Object.keys(AMBIANCE_IMAGES);

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
        <div className="carte-layout">
          <CarteNav items={tocItems} />

          <div className="carte-main">
            <div className="carte-hero">
              <h1>La Carte</h1>
              <p>
                Parcourez notre carte complète, comme au restaurant.
                Tous les plats sont affichés — il suffit de défiler.
              </p>
            </div>

            {visibleCategories.map((cat, catIndex) => {
              const visibleItems = cat.menu_items.filter((item) => !item.is_delivery_only);
              if (visibleItems.length === 0) return null;

              const ambianceKey = ambianceKeys[imageIndex];
              const ambianceImg = cat.slug === ambianceKey || (ambianceKey && catIndex > 0 && catIndex % 3 === 0)
                ? AMBIANCE_IMAGES[ambianceKeys[imageIndex++]]
                : null;

              return (
                <div key={cat.slug}>
                  {ambianceImg && (
                    <div className="carte-ambiance">
                      <img
                        src={ambianceImg.src}
                        alt={ambianceImg.alt}
                        loading="lazy"
                        width={1600}
                        height={500}
                      />
                    </div>
                  )}
                  <section
                    id={cat.slug}
                    className="carte-category"
                  >
                    <div className="carte-category-head">
                      <h2 className="carte-category-title">{cat.label}</h2>
                    </div>
                    {cat.intro && (
                      <p className="carte-category-intro">{cat.intro}</p>
                    )}
                    <div className="carte-items">
                      {visibleItems.map((item) => (
                        <div key={item.id} className="carte-item">
                          <div className="carte-item-left">
                            <span className="carte-item-name">
                              {item.name}
                              {item.weight && (
                                <span className="carte-item-badge">{item.weight}</span>
                              )}
                              {item.volume && (
                                <span className="carte-item-badge">{item.volume}</span>
                              )}
                              {item.is_deliverable && (
                                <span className="carte-item-tag" title="Disponible en livraison">livraison</span>
                              )}
                            </span>
                            {item.description && (
                              <span className="carte-item-desc">
                                {item.description}
                              </span>
                            )}
                          </div>
                          <span className="carte-item-dots" aria-hidden="true"></span>
                          <div className="carte-item-prices">
                            {item.variants.length > 0 ? (
                              item.variants.map((v) => (
                                <span key={v.id} className="carte-variant">
                                  <span className="carte-variant-label">{v.label}</span>
                                  <span className="carte-variant-price">{formatPrice(v.price)}</span>
                                </span>
                              ))
                            ) : item.price !== null ? (
                              <span className="carte-price">{formatPrice(item.price)}</span>
                            ) : (
                              <span className="carte-price-label">{item.price_label || ""}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {cat.note && (
                      <p className="carte-category-note">{cat.note}</p>
                    )}
                  </section>
                </div>
              );
            })}

            {fixedMenus.length > 0 && (
              <section id="menus-fixes" className="carte-category">
                <div className="carte-category-head">
                  <h2 className="carte-category-title">Nos Menus</h2>
                </div>
                <div className="carte-menus-grid">
                  {fixedMenus.map((menu) => (
                    <div
                      key={menu.id}
                      className={`carte-menu-card ${menu.is_highlight ? "is-highlight" : ""}`}
                    >
                      {menu.is_highlight && (
                        <span className="carte-menu-badge">Signature</span>
                      )}
                      <h3>{menu.name}</h3>
                      <p>{menu.description}</p>
                      <span className="carte-menu-price">{formatPrice(menu.price)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

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
        </div>
      </main>

      <footer className="carte-footer">
        <div className="container">
          <span>
            &copy; {new Date().getFullYear()} Grill Dufour — Tous droits réservés.
          </span>
          <span>
            <a href="/politique-de-confidentialite">Confidentialité</a>
            {" · "}
            <a href="/mentions-legales">Mentions légales</a>
          </span>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdMenu) }}
      />
    </div>
  );
}
