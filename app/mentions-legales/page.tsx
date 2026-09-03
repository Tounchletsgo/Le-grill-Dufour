import type { Metadata } from "next";
import { restaurant } from "@/data/restaurantData";

export const metadata: Metadata = {
  title: "Mentions légales | Grill Dufour",
  robots: "noindex",
};

export default function LegalPage() {
  return (
    <div className="legal-page">
      <header className="cmd-header">
        <a href="/" className="cmd-back">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z" />
          </svg>
          Retour
        </a>
      </header>

      <article className="legal-content">
        <h1>Mentions légales</h1>

        <h2>Éditeur du site</h2>
        <p>
          Grill Dufour<br />
          Rue des Courtils - Hovenstraat 1B<br />
          7700 Mouscron, Belgique<br />
          Tél : <a href={restaurant.phoneHref}>{restaurant.phone}</a><br />
          Email : <a href={restaurant.emailHref}>{restaurant.email}</a><br />
          N° TVA : {restaurant.tva}
        </p>

        <h2>Hébergement</h2>
        <p>
          Vercel Inc.<br />
          440 N Barranca Ave #4133<br />
          Covina, CA 91723, USA<br />
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble du contenu de ce site (textes, images, logo, mise en page) est la propriété
          exclusive de Grill Dufour, sauf mention contraire. Toute reproduction, même partielle,
          est interdite sans autorisation préalable.
        </p>

        <h2>Limitation de responsabilité</h2>
        <p>
          Les informations fournies sur ce site (menu, prix, horaires) sont données à titre indicatif
          et peuvent être modifiées sans préavis. Grill Dufour ne saurait être tenu responsable
          des erreurs ou omissions.
        </p>

        <h2>Protection des données</h2>
        <p>
          Consultez notre <a href="/politique-de-confidentialite">politique de confidentialité</a> pour
          en savoir plus sur le traitement de vos données personnelles.
        </p>

        <h2>Droit applicable</h2>
        <p>
          Le présent site est soumis au droit belge. Tout litige sera de la compétence exclusive
          des tribunaux de l'arrondissement judiciaire de Tournai.
        </p>
      </article>
    </div>
  );
}
