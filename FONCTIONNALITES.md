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

## D. Tablette cuisine (Staff)

| Fonctionnalite | Statut | Notes |
|---|---|---|
| Kitchen Board temps reel | OK | Supabase realtime |
| Gestion statuts commandes | OK | |
| Vue commandes par statut | OK | |

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

## H. Points critiques identifies

1. **Connexion Supabase sur Vercel** : si la connexion echoue, le menu tombe en fallback local avec des IDs `local-*`, ce qui bloque les commandes et masque les avis/plats du jour.
2. **Migration Stripe** : `004_stripe_payment.sql` doit etre executee manuellement sur Supabase pour autoriser `payment_method = 'online'`.
3. **Webhook Stripe** : l'URL doit pointer vers `https://le-grill-dufour.vercel.app/api/webhooks/stripe`.
4. **Panier obsolete** : un panier avec des IDs `local-*` en localStorage persiste meme apres que Supabase fonctionne.
