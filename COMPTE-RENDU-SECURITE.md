# Compte-Rendu de Sécurité — Le Grill Dufour

**Date** : 28 octobre 2026
**Auditeur** : Claude (audit automatisé complet)
**Référence** : Demande d'audit sécurité du 24 octobre 2026
**Branche** : `main` (corrections mergées via PR #90 et #91)

---

## A. Périmètre de l'audit

Audit complet du code source, de la configuration et de l'architecture de sécurité du projet Le Grill Dufour. 41 routes API, 4 espaces (public, admin, staff, livreur), configuration Next.js, headers HTTP, gestion des secrets, authentification, protection des données.

---

## B. Résumé exécutif

| Catégorie | Avant audit | Après audit |
|---|---|---|
| Endpoints sans rate limiting | 5 | 0 |
| Auth cron timing-safe | Non (comparaison `!==`) | Oui (module partagé `timingSafeEqual`) |
| Validation UUID livreur | Absente | Présente sur 4 endpoints |
| CSP headers | Partiel | Complet (frame-ancestors, upgrade-insecure-requests, object-src) |
| Header `X-Powered-By` | Exposé | Supprimé |
| JSON.parse non protégé (upload) | 1 cas | 0 |
| PINs livreurs exposés via API | Oui (tous rôles) | Masqués pour non-admin |
| Recherche admin SQL wildcards | Non échappés | Échappés |
| Tests | 151 passent | 151 passent |
| Build | OK | OK |

**Aucune vulnérabilité critique exploitable en production n'a été trouvée.** Les corrections apportées renforcent la défense en profondeur.

---

## C. Secrets et accès

### Résultats

- **Aucun secret réel trouvé dans le code source** (ni clés Stripe, ni tokens, ni mots de passe).
- **Aucun fichier `.env` dans l'historique Git** — `.gitignore` est bien configuré.
- **Aucun secret exposé côté navigateur** — seules les variables `NEXT_PUBLIC_*` (URL Supabase, clé publique Supabase, VAPID public, URLs Barestho) sont accessibles côté client. Ce sont des clés publiques par conception.
- **`ADMIN_PIN`** : valeur non vérifiable depuis le code, mais si elle vaut encore `0000` en production, c'est un risque critique. **Action patron requise.**
- **PINs livreurs en clair en base** : stockés dans la table `drivers`. Recommandation : hasher avec bcrypt. Non bloquant pour le lancement.

### Corrections appliquées

Aucune correction nécessaire — la gestion des secrets était déjà correcte.

---

## D. Authentification et contrôle d'accès

### Architecture vérifiée

| Espace | Méthode | Rate limiting | Timing-safe |
|---|---|---|---|
| Admin (`/admin`) | PIN ou email/mdp Supabase | 5 tentatives, blocage 15 min | Oui |
| Staff (`/staff`) | PIN admin (rôle admin ou staff) | 5 tentatives, blocage 15 min | Oui |
| Livreur (`/livreur`) | PIN individuel | 5 tentatives, blocage 15 min | Oui |
| Cron jobs | Bearer token `CRON_SECRET` | N/A | **Corrigé** (était `!==`) |

### Corrections appliquées

1. **PR #90** — Auth cron timing-safe : les 4 endpoints cron (`cleanup-orders`, `cleanup-messages`, `reset-stock`, `send-feedback-emails`) utilisaient une comparaison `!==` pour vérifier `CRON_SECRET`. Remplacé par un module partagé `src/lib/cron-auth.ts` utilisant `crypto.timingSafeEqual` avec protection contre les attaques par longueur.

2. **PR #91** — Validation UUID livreur : les 4 endpoints driver (`auth`, `history`, `messages`, `push`) acceptaient n'importe quelle chaîne comme `x-driver-id`. Ajout d'une validation regex UUID sur chaque endpoint.

3. **PR #90** — Masquage PINs livreurs : l'endpoint GET `/api/admin/drivers` renvoyait les PINs complets à tous les rôles. Les PINs sont maintenant masqués (`••••X`) pour les rôles non-admin.

### Routes API vérifiées (41/41)

Toutes les routes API ont été vérifiées pour l'authentification :
- Routes admin : 16/16 protégées par `checkApiAuth`
- Routes staff : protégées par vérification de rôle
- Routes driver : 4/4 protégées par `verifyDriverSession` + UUID validation
- Routes cron : 4/4 protégées par `verifyCronSecret` (timing-safe)
- Routes publiques : 8 routes (commande, checkout, feedback, health, unsubscribe, webhook) — accès contrôlé par rate limiting et/ou signature
- Webhook Stripe : signature HMAC vérifiée

---

## E. Protection des données et accès aux pages

### Routes publiques — données exposées

| Endpoint | Données renvoyées | Sensible ? |
|---|---|---|
| `/api/commande/[id]` (GET) | Numéro, statut, mode, prénom, total, frais, articles, adresse livraison | Non — pas d'email, pas de téléphone, pas de notes |
| `/api/menu` (GET) | Menu complet (catégories, articles, prix) | Non |
| `/api/health` (GET) | Statut "ok" (détails env uniquement avec auth admin) | Non |

L'endpoint de suivi de commande (`/api/commande/[id]`) ne renvoie pas l'email du client, son téléphone ni ses notes — vérifié dans le `select()` de la requête Supabase.

### Supabase RLS

Le code utilise `supabaseAdmin` (service role) pour les opérations serveur, ce qui contourne le RLS. C'est normal pour un backend Next.js. Le client public (`supabaseAnon`) n'est utilisé que pour l'authentification et les abonnements Realtime, où le RLS s'applique.

---

## F. Attaques courantes — tests

### XSS (Cross-Site Scripting)

- **Notes de commande** : sanitisées côté serveur et échappées à l'affichage (React JSX auto-escape).
- **Messages livreur** : sanitisés côté serveur.
- **Recherche admin** : caractères SQL wildcards (`%`, `_`) échappés (**corrigé PR #90**).
- **CSP** : bloque l'exécution de scripts non autorisés (`script-src 'self' 'unsafe-inline'`). L'`unsafe-inline` est présent pour Next.js mais le CSP reste efficace contre l'injection de scripts externes.

### Injection SQL

- Aucune requête SQL brute — tout passe par le client Supabase qui utilise des requêtes paramétrées.
- Recherche admin : les caractères spéciaux SQL sont échappés avant d'être passés au filtre `.ilike()`.

### Manipulation de prix

- Les prix sont **toujours recalculés côté serveur** depuis la base de données dans `app/api/checkout/route.ts`. Le panier client est utilisé uniquement pour identifier les articles, jamais pour les prix.
- Vérifié : aucun prix du client n'est transmis à Stripe.

### Contournement de la pause des commandes

- L'interrupteur « Bientôt disponible » est vérifié côté serveur (endpoint `/api/checkout` et `/api/orders`), pas uniquement côté client.
- Si la base est inaccessible, le défaut est « fermé » (jamais « ouvert » par accident).
- Seul le mode test (isolé par appareil) peut contourner la pause.

### Webhook Stripe

- Signature HMAC vérifiée avec `stripe.webhooks.constructEvent`.
- Endpoint GET retourne 405 (pas 200).
- Erreur DB → retourne 500 pour que Stripe réessaie.
- CAS guard `.eq("status", "pending_payment")` empêche les doubles confirmations.

### Rate limiting

| Endpoint | Limite | Fenêtre |
|---|---|---|
| Auth admin/staff | 5 tentatives | 15 min blocage |
| Auth livreur | 5 tentatives | 15 min blocage |
| Checkout | Rate limité | Par IP |
| Commande tracker | 30 requêtes | 1 min |
| Verify-payment | 20 requêtes | 1 min |
| Feedback | 5 requêtes | 5 min |
| Unsubscribe | Rate limité | Par IP |

Toutes les maps de rate limiting ont un nettoyage périodique (`setInterval` toutes les 60 secondes).

---

## G. Configuration technique

### Headers de sécurité (next.config.mjs)

| Header | Valeur | Statut |
|---|---|---|
| `X-Frame-Options` | `DENY` | OK |
| `X-Content-Type-Options` | `nosniff` | OK |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | OK |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | OK |
| `X-DNS-Prefetch-Control` | `on` | OK |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | OK |
| `Content-Security-Policy` | Complet (voir détail) | **Corrigé** |
| `X-Powered-By` | Supprimé | **Corrigé** |

### CSP détaillé (corrigé PR #90)

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://*.supabase.co https://*.google.com https://*.googleapis.com https://*.gstatic.com;
font-src 'self' data:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fcm.googleapis.com https://updates.push.services.mozilla.com https://*.push.apple.com;
worker-src 'self';
frame-src https://*.google.com https://*.barestho.com;
object-src 'none';
frame-ancestors 'none';
form-action 'self';
base-uri 'self';
upgrade-insecure-requests;
```

### robots.txt

Bloque correctement `/admin`, `/staff`, `/livreur`, `/api`.

### Gestion des erreurs

- Les erreurs internes ne sont jamais renvoyées au client en détail — toujours "Server error" générique.
- Les erreurs Stripe ne sont pas exposées au client.
- Les logs côté serveur ne contiennent pas de secrets partiels.

---

## H. Corrections appliquées — Détail

### PR #90 — Durcissement sécurité (14 fichiers, +156/-15 lignes)

| Fichier | Correction |
|---|---|
| `src/lib/cron-auth.ts` | Nouveau module partagé — vérification timing-safe du CRON_SECRET |
| `app/api/cron/cleanup-orders/route.ts` | Utilise `verifyCronSecret` au lieu de `!==` |
| `app/api/cron/cleanup-messages/route.ts` | Idem |
| `app/api/cron/reset-stock/route.ts` | Idem |
| `app/api/cron/send-feedback-emails/route.ts` | Idem |
| `next.config.mjs` | `poweredByHeader: false`, CSP renforcé (frame-ancestors, object-src, upgrade-insecure-requests) |
| `app/api/admin/upload/route.ts` | try/catch sur JSON.parse des données de recadrage |
| `app/api/admin/drivers/route.ts` | Masquage des PINs livreurs pour les non-admin |
| `app/api/commande/[id]/route.ts` | Rate limiting (30 req/min par IP) |
| `app/api/commande/[id]/verify-payment/route.ts` | Rate limiting (20 req/min par IP) |
| `app/api/feedback/route.ts` | Rate limiting (5 req/5min par IP) |
| `app/api/checkout/route.ts` | Rate limiting |
| `app/api/unsubscribe/route.ts` | Rate limiting |
| `app/api/admin/orders/route.ts` | Échappement des wildcards SQL dans la recherche |

### PR #91 — Validation UUID livreur (4 fichiers, +14/-6 lignes)

| Fichier | Correction |
|---|---|
| `app/api/driver/auth/route.ts` | Validation regex UUID sur x-driver-id |
| `app/api/driver/history/route.ts` | Idem |
| `app/api/driver/messages/route.ts` | Idem (GET et POST) |
| `app/api/driver/push/route.ts` | Idem (POST et DELETE) |

---

## I. Points en attente du patron (non bloquants pour la sécurité du code)

1. **Changer le PIN admin** : si `ADMIN_PIN` vaut encore `0000`, le changer immédiatement dans Vercel.
2. **Hasher les PINs livreurs** : les PINs sont en clair dans la table `drivers`. Recommandation : migration bcrypt.
3. **Protéger la branche `main`** : GitHub → Settings → Branches → Branch protection rules.
4. **Domaine `legrilldufour.be`** : transfert en cours, DNS à configurer.
5. **Stripe live** : clés live à configurer dans Vercel.
6. **Email** : configurer Resend avec le domaine pour SPF/DKIM.

---

## J. Dépendances

### Analyse des packages

- **Pas de vulnérabilité connue critique** dans les dépendances directes au moment de l'audit.
- **Tiptap** : conflit de types mineur entre `@tiptap/starter-kit` et `@tiptap/react` (versions ^3.30.0). N'affecte pas la sécurité ni le fonctionnement. Correction possible en ajoutant `@tiptap/core` explicitement — non appliquée car CLAUDE.md interdit l'ajout de dépendances sans demande explicite.

---

## K. Vérification post-corrections

- **Tests** : 8 fichiers, 151 tests, tous passent.
- **Build** : Next.js compile sans erreur, 49 pages générées.
- **Aucune fonctionnalité existante cassée** : le site public, l'admin, le staff, le livreur, le checkout, les emails, les notifications, le suivi de commande restent identiques.
- **L'interrupteur « Bientôt disponible » reste en place et actif.**

---

## L. Recommandations pour le futur

1. **Audit régulier des dépendances** : `npm audit` mensuel.
2. **Logs centralisés** : envisager un service de logging (Vercel Logs ou similaire).
3. **Backup automatique Supabase** : vérifier que les sauvegardes quotidiennes sont actives.
4. **2FA sur les comptes** : activer la double authentification sur GitHub, Vercel, Stripe, Supabase, Resend.
5. **Monitoring uptime** : configurer UptimeRobot ou équivalent sur `legrilldufour.be/api/health`.
