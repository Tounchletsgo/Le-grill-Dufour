# Inventaire des Fonctionnalites — Le Grill Dufour

## A. Site vitrine (Homepage)

| Fonctionnalite | Statut | Source de donnees |
|---|---|---|
| Hero + navigation | OK | Statique |
| Section menu (carte) | OK | Supabase (fallback local) |
| Galerie photos | OK | Statique (images locales) |
| Horaires d'ouverture | OK | Supabase |
| Contact + Google Maps | OK | Statique |
| Mentions legales | OK | Statique |
| Politique de confidentialite | OK | Statique |
| Avis Google | A VERIFIER | Supabase (`google_reviews`, `google_reviews_config`) |
| Breadcrumb | OK | Statique |

## B. Systeme de commande en ligne

| Fonctionnalite | Statut | Notes |
|---|---|---|
| Menu / catalogue | A VERIFIER | Supabase avec fallback local. Si fallback → IDs `local-*` → commande bloquee |
| Panier (localStorage) | OK | Cle `gdf-cart` |
| Choix livraison / emporter | OK | |
| Saisie adresse (autocomplete rues) | OK | API `/api/streets/search` |
| Validation telephone belge | OK | |
| Validation zone livraison (7700, 7711, 7712) | OK | |
| Validation horaires ouverture | OK | Cote serveur |
| Calcul remise livraison 10% | OK | Exclut boissons/desserts |
| Minimum commande 25 EUR | OK | |
| Frais livraison 5 EUR | OK | |
| Anti-spam (3 commandes/heure max) | OK | |
| Blacklist telephone | OK | |
| Verification prix cote serveur | OK | |
| Paiement en ligne (Stripe) | A VERIFIER | Migration `004_stripe_payment.sql` pas encore executee |
| Paiement Bancontact | A VERIFIER | Via Stripe Checkout |
| Webhook Stripe | A VERIFIER | URL webhook a mettre a jour |
| Confirmation commande | OK | Page `/commande/[id]` |
| Suivi commande | OK | Page `/commande/[id]` |
| Plats du jour | A VERIFIER | Supabase `daily_specials` |
| Options (accompagnements, sauces, cuissons) | OK | |
| Supplements | OK | |
| Variantes | OK | |
| Notes par article | OK | |
| Nettoyage commandes abandonnees | OK | Cron `/api/cron/cleanup-orders` (quotidien) |

## C. Back-office (Admin)

| Fonctionnalite | Statut | Notes |
|---|---|---|
| Authentification admin | OK | Supabase Auth + roles (`user_roles`) |
| Tableau de bord (stats, graphiques) | OK | CA, panier moyen, livraisons/emporter, articles populaires, heures de pointe |
| Selecteur de periode | OK | Aujourd'hui, hier, semaine, mois, mois dernier, personnalise |
| Comparaison mensuelle | OK | Evolution en % vs mois precedent |
| Graphique CA journalier | OK | Barres CSS sans librairie externe |
| Export CSV/Excel | OK | BOM + separateur `;` pour compatibilite Excel |
| Gestion menu (CRUD articles) | OK | |
| Gestion categories | OK | |
| Gestion variantes | OK | |
| Gestion supplements | OK | |
| Gestion commandes | OK | |
| Gestion plats du jour | OK | |
| Gestion avis Google | OK | |
| Gestion contenu (editeur riche) | OK | |
| Upload images | OK | |
| Gestion rues (import/CRUD) | OK | |
| Parametres livraison | OK | |
| Cuissons (cooking groups) | OK | |
| Remboursement Stripe | A VERIFIER | API `/api/admin/refund` |
| Gestion emails | OK | |
| Gestion retours (feedback) | OK | |
| Mode test prive | OK | Activation 1h par appareil, admin-only |
| Gestion commandes test | OK | Marquer/supprimer test, protection commandes payees |

## D. Tablette cuisine (Staff)

| Fonctionnalite | Statut | Notes |
|---|---|---|
| Kitchen Board temps reel | OK | Supabase realtime |
| Gestion statuts commandes | OK | |
| Vue commandes par statut | OK | |
| Badge TEST sur commandes test | OK | Visible sur la carte de commande |
| Bandeau MODE TEST ACTIF | OK | Visible quand des commandes test existent |

## E. Emails et notifications

| Fonctionnalite | Statut | Notes |
|---|---|---|
| Email confirmation commande | A VERIFIER | Resend API |
| Email feedback post-commande | OK | Cron quotidien |
| Notification Telegram | A VERIFIER | Bot Telegram |
| Desinscription email | OK | `/api/unsubscribe` |

## F. Cron jobs (Vercel)

| Job | Frequence | Statut |
|---|---|---|
| `/api/cron/send-feedback-emails` | Tous les jours a 10h UTC | OK |
| `/api/cron/reset-stock` | Tous les jours a 4h UTC | OK |
| `/api/cron/cleanup-orders` | Tous les jours a 3h UTC | OK |

## G. Pages supplementaires

| Page | Route | Statut |
|---|---|---|
| Carte / Menu | `/carte` ou `/la-carte` | OK |
| Livraison | `/livraison` | OK |
| Reservation | `/reserver` ou `/reservation` | OK (NE PAS TOUCHER) |
| Cheques cadeaux | `/cheques-cadeaux` | OK |
| Contact | `/contact` | OK |

## H. Systeme bilingue FR/NL

| Fonctionnalite | Statut | Notes |
|---|---|---|
| Infrastructure i18n (types, dictionnaires, hooks) | OK | `src/i18n/` — sans dependance externe |
| Dictionnaire FR complet | OK | `src/i18n/fr.ts` |
| Dictionnaire NL complet | OK | `src/i18n/nl.ts` — flamand belge, forme "u" |
| Middleware routage NL (`/nl/...`) | OK | Rewrite vers routes FR internes |
| Detection langue navigateur (1re visite) | OK | Redirige vers `/nl` si navigateur NL |
| Cookie de persistance (`gdf-locale`) | OK | 1 an, sameSite lax |
| Selecteur FR \| NL (navbar + footer + mobile) | OK | |
| URLs NL traduites | OK | `/nl/de-kaart`, `/nl/bestellen`, etc. |
| Panier preserve au changement de langue | OK | localStorage partage |
| Hreflang tags (fr, nl-BE, x-default) | OK | Layout dynamique |
| Sitemap bilingue avec alternates | OK | `app/sitemap.ts` |
| Emails en langue du client | OK | Confirmation + feedback |
| Stripe checkout en langue du client | OK | `locale` dans session Stripe |
| Locale stockee en base (colonne `orders.locale`) | OK | |
| Badge NL sur kitchen board | OK | Carte + ticket imprime |
| Note client marquee "(NL)" si commande NL | OK | Kitchen board |
| Fallback FR si traduction manquante | OK | Console warning en dev |
| Admin et kitchen board restent en FR | OK | |
| Noms de plats en francais (descriptions traduites) | OK | |

## I. Systeme de test

| Fonctionnalite | Statut | Notes |
|---|---|---|
| Mode test prive (admin) | OK | Activation 1h, par appareil (cookie `gdf-test-device`) |
| Bypass horaires d'ouverture | OK | Commandes test passent meme restaurant ferme |
| Bypass Stripe | OK | Pas de paiement reel, redirection directe vers confirmation |
| Marquage automatique `is_test` | OK | Colonne `is_test` en base |
| Exclusion des stats | OK | Commandes test exclues du tableau de bord |
| Bouton "Marquer comme test" | OK | Pour les commandes en `pending_payment` |
| Suppression commandes test | OK | Individuelle ou en masse |
| Protection commande payee | OK | Impossible de supprimer une commande reellement payee |
| API test-mode check | OK | `/api/test-mode/check` — endpoint public |
| API admin test-mode | OK | `/api/admin/test-mode` — admin-only |

## J. Securite et SEO

| Fonctionnalite | Statut | Notes |
|---|---|---|
| Endpoint /api/health securise | OK | Details env uniquement pour admin authentifie |
| Sanitisation recherche admin (anti-injection) | OK | Caracteres PostgREST speciaux filtres |
| Erreurs Supabase non exposees | OK | Messages generiques cote client, details en logs serveur |
| robots.txt restrictif | OK | /admin, /staff, /api, /checkout, /feedback bloques |
| noindex pages internes | OK | Staff, checkout, feedback, commande tracking |
| Meta OG complete | OK | siteName, twitter image, canonical coherent |
| Hreflang tags bilingues | OK | fr, nl-BE, x-default |
| Structured data Restaurant | OK | JSON-LD complet |
| Sitemap bilingue | OK | Pages publiques FR et NL |
| Accessibilite SVG decoratifs | OK | aria-hidden sur icones contact |
| .gitignore complet | OK | .env.production, .env.development, .env*.local |
| Webhook Stripe signe | OK | Verification signature + idempotence |
| Verification prix serveur | OK | Prix DB ecrasent prix client |
| Protection double-clic commande | OK | submittedRef + isSubmitting |

## K. Points critiques identifies

1. **Connexion Supabase sur Vercel** : si la connexion echoue, le menu tombe en fallback local avec des IDs `local-*`, ce qui bloque les commandes et masque les avis/plats du jour.
2. **Migration Stripe** : `004_stripe_payment.sql` doit etre executee manuellement sur Supabase pour autoriser `payment_method = 'online'`.
3. **Migration test** : `023_test_orders.sql` doit etre executee pour ajouter la colonne `is_test` a la table `orders`.
4. **Webhook Stripe** : l'URL doit pointer vers `https://le-grill-dufour.vercel.app/api/webhooks/stripe`.
5. **Panier obsolete** : un panier avec des IDs `local-*` en localStorage persiste meme apres que Supabase fonctionne.
6. **Commandes en `pending_payment`** : si le webhook Stripe ne fonctionne pas, les commandes restent bloquees en `pending_payment` et n'apparaissent pas dans les stats. Verifier la configuration du webhook.
