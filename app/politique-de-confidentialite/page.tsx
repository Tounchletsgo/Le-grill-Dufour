import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Le Grill du Four",
  robots: "noindex",
};

export default function PrivacyPage() {
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
        <h1>Politique de confidentialité</h1>
        <p className="legal-updated">Dernière mise à jour : août 2026</p>

        <h2>1. Responsable du traitement</h2>
        <p>
          Le Grill du Four<br />
          Rue des Courtils 1B, 7700 Mouscron, Belgique<br />
          Tél : +32 56 34 28 70<br />
          Email : chriswillen@me.com
        </p>

        <h2>2. Données collectées</h2>
        <p>Lors de la commande en ligne, nous collectons :</p>
        <ul>
          <li>Nom et prénom</li>
          <li>Numéro de téléphone</li>
          <li>Adresse email (optionnel)</li>
          <li>Adresse de livraison (si livraison)</li>
        </ul>
        <p>
          <strong>Aucune donnée de paiement</strong> n'est stockée par nos systèmes. Les paiements
          en ligne sont traités exclusivement par notre prestataire Mollie B.V.
        </p>

        <h2>3. Finalités du traitement</h2>
        <ul>
          <li>Traitement et suivi de votre commande</li>
          <li>Communication relative à votre commande (confirmation, statut)</li>
          <li>Envoi d'un email de confirmation (si adresse fournie)</li>
        </ul>

        <h2>4. Base légale</h2>
        <p>
          Le traitement repose sur l'exécution du contrat (votre commande) conformément à
          l'article 6.1.b du RGPD.
        </p>

        <h2>5. Durée de conservation</h2>
        <p>
          Les données de commande sont conservées 12 mois à des fins comptables et de suivi qualité,
          puis automatiquement anonymisées.
        </p>

        <h2>6. Sous-traitants</h2>
        <ul>
          <li><strong>Supabase</strong> (hébergement base de données) — serveurs UE</li>
          <li><strong>Mollie B.V.</strong> (paiements en ligne) — Pays-Bas</li>
          <li><strong>Resend</strong> (envoi d'emails transactionnels)</li>
          <li><strong>Vercel</strong> (hébergement du site)</li>
        </ul>

        <h2>7. Vos droits</h2>
        <p>Conformément au RGPD, vous disposez d'un droit :</p>
        <ul>
          <li>D'accès à vos données personnelles</li>
          <li>De rectification des données inexactes</li>
          <li>D'effacement (« droit à l'oubli »)</li>
          <li>De limitation du traitement</li>
          <li>De portabilité de vos données</li>
          <li>D'opposition au traitement</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous à <strong>chriswillen@me.com</strong>.
        </p>

        <h2>8. Cookies</h2>
        <p>
          Ce site utilise uniquement des cookies techniques strictement nécessaires au bon
          fonctionnement (panier, session). Aucun cookie publicitaire ou de traçage n'est utilisé.
          Aucun consentement n'est requis pour ces cookies essentiels (art. 5.3 directive ePrivacy).
        </p>

        <h2>9. Réclamations</h2>
        <p>
          Vous pouvez introduire une réclamation auprès de l'Autorité de Protection des Données
          (APD) : <a href="https://www.autoriteprotectiondonnees.be" target="_blank" rel="noopener noreferrer">www.autoriteprotectiondonnees.be</a>
        </p>
      </article>
    </div>
  );
}
