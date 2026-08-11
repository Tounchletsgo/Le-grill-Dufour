import type { Metadata } from "next";
import { getMenuData } from "@/lib/menu";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "La Carte | Le Grill du Four",
  description:
    "Découvrez la carte complète du Grill du Four : viandes, grillades, poissons, planches, burgers, desserts et boissons. Restaurant à Mouscron.",
};

function formatPrice(price: number): string {
  return price.toFixed(2).replace(".", ",").replace(",00", "") + " €";
}

export default async function CartePage() {
  const { categories, fixedMenus } = await getMenuData();

  return (
    <div className="carte-page">
      <header className="carte-header">
        <div className="container carte-header-inner">
          <a href="/" className="brand">
            <img
              src="/logo-grill-du-four.webp"
              alt="Le Grill du Four"
              width={40}
              height={40}
            />
            <span className="brand-text">
              Le Grill du Four<small>Mouscron</small>
            </span>
          </a>
          <nav className="carte-nav" aria-label="Navigation">
            <a href="/">Accueil</a>
            <a href="/carte" className="is-active">La Carte</a>
            <a href="/livraison">Commander</a>
            <a href="/#contact">Contact</a>
          </nav>
          <a href="/livraison" className="btn btn-primary btn-sm header-cmd-btn">
            Commander
          </a>
        </div>
      </header>

      <Breadcrumb items={[{ label: "La Carte" }]} />

      <main className="carte-content">
        <div className="container">
          <div className="carte-hero">
            <span className="eyebrow">La Carte</span>
            <h1>Notre Sélection</h1>
            <p>
              Toute la carte du restaurant — viandes, grillades, poissons,
              planches et desserts. Pour commander en livraison, rendez-vous sur{" "}
              <a href="/livraison" className="carte-link">
                notre page Commander &amp; Livraison
              </a>
              .
            </p>
          </div>

          <nav className="carte-toc" aria-label="Sommaire de la carte">
            {categories.map((cat) => (
              <a key={cat.slug} href={`#${cat.slug}`} className="carte-toc-item">
                {cat.label}
              </a>
            ))}
            {fixedMenus.length > 0 && (
              <a href="#menus-fixes" className="carte-toc-item">
                Menus
              </a>
            )}
          </nav>

          {categories.map((cat) => (
            <section
              key={cat.slug}
              id={cat.slug}
              className="carte-category"
            >
              <h2 className="carte-category-title">{cat.label}</h2>
              {cat.intro && (
                <p className="carte-category-intro">{cat.intro}</p>
              )}
              <div className="carte-items">
                {cat.menu_items.map((item) => (
                  <div key={item.id} className="carte-item">
                    <div className="carte-item-info">
                      <span className="carte-item-name">
                        {item.name}
                        {item.weight && (
                          <span className="carte-item-badge">{item.weight}</span>
                        )}
                        {item.volume && (
                          <span className="carte-item-badge">{item.volume}</span>
                        )}
                      </span>
                      {item.description && (
                        <span className="carte-item-desc">
                          {item.description}
                        </span>
                      )}
                    </div>
                    <div className="carte-item-prices">
                      {item.variants.length > 0 ? (
                        item.variants.map((v) => (
                          <span key={v.id} className="carte-variant">
                            <span className="carte-variant-label">
                              {v.label}
                            </span>
                            <span className="carte-variant-price">
                              {formatPrice(v.price)}
                            </span>
                          </span>
                        ))
                      ) : item.price !== null ? (
                        <span className="carte-price">
                          {formatPrice(item.price)}
                        </span>
                      ) : (
                        <span className="carte-price-label">
                          {item.price_label || ""}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {cat.note && (
                <p className="carte-category-note">{cat.note}</p>
              )}
            </section>
          ))}

          {fixedMenus.length > 0 && (
            <section id="menus-fixes" className="carte-category">
              <h2 className="carte-category-title">Nos Menus</h2>
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
                    <span className="carte-menu-price">
                      {formatPrice(menu.price)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="carte-cta">
            <p>Envie de commander ?</p>
            <a href="/livraison" className="btn btn-primary">
              Commander en livraison
            </a>
          </div>
        </div>
      </main>

      <footer className="carte-footer">
        <div className="container">
          <span>
            &copy; {new Date().getFullYear()} Le Grill du Four — Tous droits
            réservés.
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
