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
| Minimum commande livraison | OK | Configurable via Supabase (pas de minimum pour le retrait) |
| Frais livraison 5 EUR | OK | |
| Anti-spam (3 commandes/heure max) | OK | |
| Blacklist telephone | OK | |
| Verification prix cote serveur | OK | |
| Paiement en ligne (Stripe) | OK | Migration executee, Stripe Checkout fonctionnel |
| Paiement Bancontact | OK | Via Stripe Checkout (methode auto) |
| Webhook Stripe | OK | URL configuree + fallback verify-payment cote client |
| Confirmation commande | OK | Page `/commande/[id]` avec message chaleureux + mention email |
| Suivi commande temps reel | OK | Page `/commande/[id]` — polling 5s + Realtime, cache desactive |
| Fallback verification paiement | OK | Endpoint `/api/commande/[id]/verify-payment` si webhook en retard |
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
| Tableau de bord (stats, graphiques) | OK | CA, panier moyen, livraisons/emporter, articles populaires, heures de pointe — filtre unique « payée » (pas cancelled, pas pending_payment, payment_status paid) |
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
| Remboursement Stripe | OK | API `/api/admin/refund` |
| Confirmation manuelle paiement | OK | Action `confirm_payment` dans PATCH `/api/admin/orders` |
| Gestion emails | OK | |
| Gestion retours (feedback) | OK | |
| Mode test prive | OK | Activation 1h par appareil, admin-only |
| Gestion commandes test | OK | Marquer/supprimer test, protection commandes payees, is_test obligatoire avant suppression |

## D. Tablette cuisine (Staff)

| Fonctionnalite | Statut | Notes |
|---|---|---|
| Kitchen Board temps reel | OK | Supabase realtime |
| Gestion statuts commandes | OK | |
| Vue commandes par statut | OK | |
| Badge TEST sur commandes test | OK | Visible sur la carte de commande |
| Bandeau MODE TEST ACTIF | OK | Visible quand des commandes test existent |
| Wake Lock ecran | OK | Ecran ne s'eteint pas (API Wake Lock + re-acquisition auto) |
| Alarme sonore puissante | OK | Web Audio API synthetise (oscillateurs 900-1200 Hz), volume max, DynamicsCompressor |
| Auto-recovery AudioContext | OK | Recree automatiquement le contexte audio si suspendu (veille tablette) |
| Health check audio 15s | OK | Verification toutes les 15s + au retour de visibilite |
| Alarme repetee avec vibration | OK | Bip + vibration a chaque cycle de sonnerie |
| Suivi commandes confirmes uniquement | OK | Seules les commandes `confirmed` declenchent l'alarme (pas les `pending`) |
| Badge messages clignotant | OK | Badge 22px avec animation scale/pulse visible a distance |
| Bouton fermer messages 44px | OK | SVG 24x24 dans conteneur 44x44, bordure visible |
| Boutons rapides messages 56px | OK | Min-height 56px, font-size 0.95rem, touch targets elargis |
| Texte messages agrandi | OK | Font-size 1.05rem avec line-height 1.4 |
| Boutons statut agrandis | OK | Min-height 56px (base) a 60px (accepter), font-size 16-18px |
| Confirmation statuts critiques | OK | Dialog pour « Prêt » et « Livrée », anti-double-tap 400ms |
| Undo annulation commande | OK | Bandeau undo 10s pour annulations |

## E. Emails et notifications

| Fonctionnalite | Statut | Notes |
|---|---|---|
| Email confirmation commande | OK | Resend API — envoye par webhook OU fallback verify-payment |
| Email feedback post-commande | OK | Cron quotidien |
| Notification Telegram | OK | Bot Telegram — envoyee par webhook OU fallback verify-payment |
| Desinscription email | OK | `/api/unsubscribe` |

## F. Cron jobs (Vercel)

| Job | Frequence | Statut |
|---|---|---|
| `/api/cron/send-feedback-emails` | Tous les jours a 10h UTC | OK |
| `/api/cron/reset-stock` | Tous les jours a 4h UTC | OK |
| `/api/cron/cleanup-orders` | Tous les jours a 3h UTC | OK |
| `/api/cron/cleanup-messages` | Tous les jours a 3h UTC | OK |

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
| Marquage automatique `is_test` | OK | Colonne `is_test` en base + auto-détection via Stripe `livemode` (webhook + verify-payment) |
| Exclusion des stats | OK | Commandes test exclues du tableau de bord |
| Bouton "Marquer comme test" | OK | Pour les commandes en `pending_payment` |
| Suppression commandes test | OK | Individuelle ou en masse |
| Protection commande payee | OK | Impossible de supprimer une commande reellement payee |
| API test-mode check | OK | `/api/test-mode/check` — endpoint public |
| API admin test-mode | OK | `/api/admin/test-mode` — admin-only |

## I-bis. Interface livreur (`/livreur`)

| Fonctionnalite | Statut | Notes |
|---|---|---|
| Page dediee `/livreur` | OK | Espace separe, noindex, robots.txt bloque |
| Authentification PIN individuel | OK | PIN unique par livreur en base `drivers` |
| Rate limiting login | OK | 5 tentatives max, blocage 15 min par IP |
| Comparaison PIN timing-safe | OK | `crypto.timingSafeEqual` |
| Session persistante localStorage | OK | Verification session a chaque chargement |
| Liste commandes en temps reel | OK | Polling 5s + Supabase Realtime |
| Detail commande complet | OK | Adresse, telephone, articles, total, paiement, notes client |
| Navigation Google Maps | OK | Bouton ouvre Maps avec adresse complete |
| Appel client | OK | Bouton `tel:` pour appel direct |
| Avancement statut | OK | "Recuperee" → "En route" → "Livree" |
| Signalement probleme | OK | Options predefinies + texte libre |
| Messagerie temps reel livreur → staff | OK | Messages rapides + texte libre |
| Messagerie temps reel staff → livreur | OK | Panel dans kitchen board (min. integration) |
| Séparateurs de jour (messages) | OK | « Aujourd'hui », « Hier », ou date formatée entre les groupes |
| Suppression message individuel | OK | Clic sur un message + ConfirmDialog, rôle vérifié côté serveur |
| Effacer conversation entière | OK | Bouton corbeille dans l'en-tête, ConfirmDialog danger |
| Nettoyage auto messages (cron) | OK | Suppression messages > 5h00 Bruxelles, cron quotidien 3h UTC |
| Notification sonore staff | OK | Web Audio API (800 Hz + 1000 Hz) |
| Badge messages non lus (staff) | OK | Compteur temps reel |
| Historique livraisons du jour | OK | Onglet avec liste + stats |
| Stats journalieres | OK | Total livraisons + montant total |
| Wake Lock ecran | OK | Re-acquisition auto au changement visibilite |
| Admin CRUD livreurs | OK | Via `/api/admin/drivers` (admin PIN requis) |
| Verification unicite PIN | OK | Cote serveur a la creation/modification |
| PWA installable (`/livreur`) | OK | Manifest separe, icone restaurant, standalone, portrait |
| Service Worker dedie livreur | OK | `sw-driver.js` avec scope `/livreur`, push events |
| Push notifications livreur | OK | Web Push (VAPID), permission demandee 2s apres login |
| Push — commande prete | OK | Notification envoyee a tous les livreurs actifs |
| Push — message staff | OK | Notification envoyee au livreur cible |
| Push — gestion refus | OK | Banniere re-activation si permission refusee |
| Push — nettoyage endpoints | OK | Suppression auto des subscriptions 404/410 |
| Notification sonore messages (livreur) | OK | Web Audio API (600 Hz + 900 Hz), DynamicsCompressor |
| Flash visuel message entrant | OK | Bandeau anime + pulsation bouton chat |
| Bouton fermer chat 44px (livreur) | OK | SVG 24x24, conteneur 44x44 min, bordure visible |
| Backdrop tap-to-close (livreur) | OK | Overlay semi-transparent, tap ferme le chat |
| Swipe-down-to-close (livreur) | OK | Glissement > 80px vers le bas ferme le chat |
| Bouton retour ferme chat (livreur) | OK | `popstate` listener, ferme le panel au back |
| Boutons action 60px (livreur) | OK | "Recuperee", "Livree" — min-height 60px |
| Confirmation « Livrée » (livreur) | OK | Dialog confirmation avant marquage livrée |
| Boutons rapides messages 48px (livreur) | OK | Min-height 48px, touch targets adaptes mobile |
| ETA livreur — boutons rapides | OK | 5/10/15/20/30 min, modifiable en route |
| ETA livreur — affichage detail | OK | Heure arrivee + minutes restantes |
| ETA — affichage tracking client | OK | Banniere ETA sur page suivi commande (FR/NL) |
| ETA — nettoyage | OK | Bouton "Retirer" pour effacer l'ETA |

## I-quater. Interrupteur « Bientôt disponible »

| Fonctionnalite | Statut | Notes |
|---|---|---|
| Toggle admin (Paramètres) | OK | Bouton « Commandes ouvertes / Bientôt disponible » avec confirmation |
| Stockage DB `orders_paused` | OK | Colonne `delivery_config.orders_paused` (défaut: true) |
| Journal d'audit | OK | Table `orders_paused_log` (changed_by, old_value, new_value, changed_at) |
| API publique `/api/orders-status` | OK | Retourne `{paused: boolean}`, défaut true si erreur |
| Provider React `OrdersPausedProvider` | OK | Context + fetch /api/orders-status au montage |
| Modal « Bientôt disponible » | OK | Bilingue FR/NL, animations bordeaux, focus trap, aria-modal |
| Animation stries de grillade | OK | 3 traits bordeaux séquentiels, @keyframes ops-stripe-trace |
| Animation ember glow | OK | Lueur sur « Bientôt », @keyframes ops-ember |
| Respect prefers-reduced-motion | OK | Toutes animations désactivées |
| Bandeau discret | OK | `role="status"` pour lecteurs d'écran |
| Interception boutons commande | OK | `OrderLink` remplace `<a>` sur 17+ liens publics |
| Blocage serveur POST /api/orders | OK | Refuse si orders_paused && !isTestOrder |
| Blocage serveur POST /api/checkout | OK | Refuse si orders_paused && !order.is_test |
| Redirection /commander | OK | useEffect redirect vers /la-carte + modal |
| Redirection /commander/checkout | OK | useEffect redirect vers /la-carte + modal |
| Blocage panier (checkout) | OK | CartDrawer intercepte le clic checkout |
| Bypass mode test | OK | Les commandes test passent même en pause |
| Sécurité par défaut | OK | Null, undefined, erreur DB → paused = true |
| Tests automatiques | OK | `src/lib/__tests__/orders-paused.test.ts` (34 tests) |

## I-ter. Animations de scroll ("Les stries de grillade")

| Fonctionnalite | Statut | Notes |
|---|---|---|
| Barre de progression (progress bar) | OK | Ligne fine bordeaux en haut de page, remplissage au scroll |
| Stries de grillade sous les titres | OK | 3 traits diagonaux SVG, apparition sequentielle au scroll |
| Apparition photos avec zoom-back | OK | Photos du trio avec stagger + scale(1.06) → scale(1) |
| Apparition galerie carte | OK | Items de la galerie carte avec fade + stagger |
| Zoom-back equipe et cadeaux | OK | Effet subtil scale sur sections equipe et cheques-cadeaux |
| Kill switch | OK | Attribut `data-grill-anim` sur body, desactiver en une ligne |
| Respect prefers-reduced-motion | OK | Toutes animations desactivees, contenu visible immediatement |
| Responsive mobile | OK | Amplitudes reduites sur ecrans < 768px |
| Scope limite | OK | Homepage + page carte uniquement |
| Pas de layout shift | OK | Contenu visible sans JS, animations en complement |

## J. Securite et SEO

| Fonctionnalite | Statut | Notes |
|---|---|---|
| Endpoint /api/health securise | OK | Details env uniquement pour admin authentifie |
| Sanitisation recherche admin (anti-injection) | OK | Caracteres PostgREST speciaux filtres |
| Erreurs Supabase non exposees | OK | Messages generiques cote client, details en logs serveur |
| robots.txt restrictif | OK | /admin, /staff, /livreur, /api, /checkout, /feedback bloques |
| noindex pages internes | OK | Staff, livreur, checkout, feedback, commande tracking |
| Meta OG complete | OK | siteName, twitter image, canonical coherent |
| Hreflang tags bilingues | OK | fr, nl-BE, x-default |
| Structured data Restaurant | OK | JSON-LD complet |
| Sitemap bilingue | OK | Pages publiques FR et NL |
| Accessibilite SVG decoratifs | OK | aria-hidden sur icones contact |
| .gitignore complet | OK | .env.production, .env.development, .env*.local |
| Webhook Stripe signe | OK | Verification signature + idempotence |
| Verification prix serveur | OK | Prix DB ecrasent prix client |
| Protection double-clic commande | OK | submittedRef + isSubmitting |
| Error boundaries pages critiques | OK | /commander, /livreur, global-error — pas d'ecran blanc |
| Abonnements Realtime protégés | OK | cancelled flag empêche les fuites sur démontage rapide |
| Horaires minuit (edge case) | OK | isWithinServiceHours gère close_time <= open_time |
| Validation ETA (NaN guard) | OK | Date invalide ignorée au lieu d'afficher NaN |
| Type locale dans Order | OK | Suppression des `as any` sur 4 routes |
| Imports dynamiques supabaseAdmin | OK | Aucun import statique dans les routes API |
| Cookies secure flag | OK | Toutes les opérations cookies ont secure: true |
| CSP form-action + base-uri | OK | Protection contre injection de formulaire/base |
| Rate limiting commandes | OK | 10 commandes / 5 min par IP |
| Webhook GET = 405 | OK | Empêche les scanners de déclencher le handler |
| Webhook Stripe erreur DB | OK | Retourne 500 (pas 200) sur erreur DB pour que Stripe réessaie |
| Refund DB vérifié | OK | Vérifie la mise à jour DB après remboursement Stripe |
| Items insert abort | OK | Supprime l'ordre orphelin si l'insert order_items échoue |
| Notes articles dans emails | OK | Sélection + passage des notes dans les 3 points d'envoi |
| SW exclut /api/ du cache | OK | Les réponses API authentifiées ne persistent pas |
| SW précache corrigé | OK | Précache /commander au lieu du redirect /livraison |
| Content version backup vérifié | OK | Vérifie la sauvegarde avant écrasement du contenu |
| Unsubscribe vérifié | OK | Vérifie l'upsert avant confirmation désinscription |
| Feedback cron email_queue vérifié | OK | Vérifie l'insert pour éviter les doublons |
| CarteGallery nettoyage mémoire | OK | Scroll listener, progress bar DOM, IntersectionObserver nettoyés |
| Checkout idempotent | OK | Réutilise la session Stripe existante si encore valide (pas de doublon) |
| verify-payment retry | OK | 3 tentatives avec backoff (2s, 4s) côté client |
| UX paiement annulé | OK | Bannière claire + bouton « Réessayer le paiement » |
| Alerte webhook en échec | OK | Email à chriswillen@me.com sur erreur DB ou erreur de traitement |
| Détection paiement orphelin | OK | Cron cleanup-orders vérifie Stripe avant suppression, confirme si payé |
| Alerte paiement orphelin | OK | Email automatique si un paiement orphelin est récupéré |
| Auth cron timing-safe | OK | Module partagé `verifyCronSecret` (crypto.timingSafeEqual) sur 4 crons |
| Rate limiting endpoints publics | OK | Tracker (30/min), verify-payment (20/min), feedback (5/5min), checkout, unsubscribe |
| CSP complet | OK | frame-ancestors 'none', object-src 'none', upgrade-insecure-requests |
| X-Powered-By supprimé | OK | poweredByHeader: false dans next.config.mjs |
| Validation UUID livreur | OK | Regex UUID sur x-driver-id dans les 4 endpoints driver |
| Masquage PINs livreurs | OK | API GET drivers masque les PINs pour les rôles non-admin |
| JSON.parse protégé (upload) | OK | try/catch sur les données de recadrage dans upload |
| Échappement wildcards SQL | OK | Caractères % et _ échappés dans la recherche admin |

## J-bis. Circuit de commande — Cartographie complète

### Flux principal : commande payée en ligne (livraison)

```
Client: checkout → POST /api/orders → insert DB (status: pending_payment)
                 → POST /api/checkout → crée Stripe session → sauve stripe_session_id
                 → redirect vers Stripe Checkout

[Client paie sur Stripe]

   CAS A — Webhook arrive en premier :
     Stripe → POST /api/webhooks/stripe (signature vérifiée)
           → vérifie status = pending_payment
           → UPDATE orders SET status=confirmed WHERE status=pending_payment (CAS guard)
           → envoie Telegram + email
           → retourne 200

     Client revient → /commande/{id}?payment=success
           → OrderTracker charge la commande (déjà confirmed)
           → affiche « Merci, c'est tout bon ! »

   CAS B — Client revient avant le webhook :
     Client → /commande/{id}?payment=success
           → OrderTracker voit status=pending_payment
           → affiche « Paiement reçu, nous confirmons votre commande… »
           → POST /api/commande/{id}/verify-payment
           → vérifie session Stripe = paid
           → UPDATE orders SET status=confirmed WHERE status=pending_payment (CAS guard)
           → envoie Telegram + email
           → retourne { status: confirmed }

     Webhook arrive après → CAS guard (0 rows updated) → skip notifications

   CAS C — Paiement annulé :
     Client annule sur Stripe → /commande/{id}?payment=cancelled
           → OrderTracker affiche « Paiement annulé » + bouton « Réessayer »
           → bouton → POST /api/checkout → réutilise ou crée session Stripe
           → redirect vers Stripe
```

### Garanties d'idempotence

1. **CAS guard** : `UPDATE ... WHERE status = 'pending_payment'` — seul le premier handler à confirmer réussit (retourne des lignes). Le second voit 0 lignes et skip les notifications.
2. **Checkout idempotent** : si la commande a déjà un `stripe_session_id` et que la session est encore `open`, le checkout réutilise l'URL existante.
3. **Webhook signature** : `stripe.webhooks.constructEvent()` vérifie le HMAC avant tout traitement.
4. **DB error → 500** : sur erreur DB, le webhook retourne 500 (pas 200) pour que Stripe réessaie.

### Monitoring

- **Erreur webhook** : email automatique à chriswillen@me.com si la mise à jour DB échoue ou si le traitement crash.
- **Paiement orphelin** : le cron `cleanup-orders` (3h du matin) vérifie chaque commande `pending_payment` > 1h auprès de Stripe. Si payée, la confirme et envoie une alerte email.

### Fichiers clés du circuit

| Fichier | Rôle |
|---|---|
| `app/api/orders/route.ts` | Création de commande |
| `app/api/checkout/route.ts` | Création session Stripe |
| `app/api/webhooks/stripe/route.ts` | Réception webhook Stripe |
| `app/api/commande/[id]/verify-payment/route.ts` | Fallback vérification paiement |
| `src/components/OrderTracker.tsx` | Page de suivi client |
| `src/components/commander/CheckoutPage.tsx` | Formulaire de paiement |
| `src/lib/stripe.ts` | Client Stripe |
| `src/lib/email.ts` | Emails transactionnels + alertes |
| `src/lib/telegram.ts` | Notifications cuisine |

## K. EN ATTENTE — À FAIRE PAR LE PATRON

| Action | Détails | Pourquoi |
|---|---|---|
| Nom de domaine `legrilldufour.be` | Connecter le domaine au projet Vercel (Settings > Domains). Mettre à jour `NEXT_PUBLIC_SITE_URL` dans les variables d'environnement Vercel. | Le domaine personnalisé est nécessaire pour le référencement, les emails et l'image professionnelle. |
| Activer Stripe en mode live | Dans le dashboard Stripe : désactiver le mode test, copier les clés live (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) dans Vercel. Recréer le webhook vers `https://legrilldufour.be/api/webhooks/stripe` avec l'événement `checkout.session.completed`. | En mode test, aucun paiement réel n'est encaissé. Sans cette étape, les clients ne peuvent pas payer en ligne. |
| Changer le PIN admin | Remplacer `ADMIN_PIN` dans les variables Vercel par un code fort (6+ chiffres), différent de `0000`. | Le PIN par défaut est trivial. |
| Hasher les PINs livreurs | Les PINs livreurs sont stockés en clair dans la table `drivers`. Idéalement, les hasher (bcrypt) et ne plus les retourner dans l'API GET. | Sécurité renforcée en cas de fuite de la base de données. |

## L. Adresse e-mail officielle

**Adresse unique du projet : chriswillen@me.com**

Toute adresse e-mail affichée sur le site, utilisée comme adresse de réponse (reply-to) dans les e-mails automatiques, ou configurée pour recevoir les notifications du restaurant, doit être `chriswillen@me.com`. Aucune autre adresse e-mail ne doit apparaître nulle part dans le code ou la configuration.

> Note technique : Resend (le service d'envoi) peut nécessiter une adresse d'expédition technique différente (liée au domaine vérifié dans Resend). Dans ce cas, la variable `EMAIL_FROM` sur Vercel doit utiliser l'adresse technique, mais `EMAIL_REPLY_TO` et `EMAIL_RESTAURANT_NOTIF` doivent rester `chriswillen@me.com`.

## M. Points critiques identifies

1. **Connexion Supabase sur Vercel** : si la connexion echoue, le menu tombe en fallback local avec des IDs `local-*`, ce qui bloque les commandes et masque les avis/plats du jour.
2. **Migration Stripe** : `004_stripe_payment.sql` doit etre executee manuellement sur Supabase pour autoriser `payment_method = 'online'`.
3. **Migration test** : `023_test_orders.sql` doit etre executee pour ajouter la colonne `is_test` a la table `orders`.
4. **Migration livreurs** : `026_delivery_drivers.sql` doit etre executee pour creer les tables `drivers` et `driver_messages`, et ajouter les colonnes livreur a `orders`.
5. **Migration push subscriptions** : `027_push_subscriptions.sql` doit etre executee pour creer la table `driver_push_subscriptions`.
6. **Variables push** : `NEXT_PUBLIC_VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY` doivent etre definies dans Vercel.
5. **Webhook Stripe** : l'URL doit pointer vers `https://legrilldufour.be/api/webhooks/stripe`. Un endpoint GET de sante est disponible pour verifier.
5. **Panier obsolete** : un panier avec des IDs `local-*` en localStorage persiste meme apres que Supabase fonctionne.
6. **Commandes en `pending_payment`** : meme si le webhook Stripe echoue, le fallback `/api/commande/[id]/verify-payment` confirme la commande quand le client revient de Stripe. Confirmer manuellement via admin si besoin.
