# Rapport final — Vérification totale du système Le Grill Dufour

**Date** : 8 octobre 2026
**Mission** : Audit complet, réparation, tests et préparation à la mise en ligne

---

## A. Résumé exécutif

Le système Le Grill Dufour a été audité ligne par ligne contre les 277 lignes du cahier des charges (16 sections). Sur l'ensemble des exigences :

- **CONFORME** : la grande majorité des fonctionnalités étaient déjà correctement implémentées
- **CORRIGÉ** : 7 corrections appliquées dans 4 lots successifs (PRs #70, #71, #72, #73)
- **DIFFÉRENT** : 2 points fonctionnels mais légèrement différents du cahier (détails en section D)
- **EN ATTENTE** : 5 points dépendant de décisions ou d'actions du patron (section 16 du cahier)

**Bug critique trouvé et réparé** : le mode test contaminait TOUTES les commandes clients quand un seul appareil admin avait le mode test actif. Ce bug aurait causé des pertes de revenus en production. Corrigé dans le Lot 3 (PR #70).

---

## B. Lots livrés

| Lot | PR | Statut | Contenu |
|-----|-----|--------|---------|
| Lot 3 | #70 | Fusionné ✓ | Mode test isolé par appareil (critique), phrase hero, footer sous-pages, redirect /menu, feedback test, cleanup safety net |
| Lot 4 | #71 | Fusionné ✓ | Rapprochement Stripe avec alertes admin, recherche commandes dans le back-office |
| Lot 5 | #72 | Fusionné ✓ | 66 tests unitaires, pipeline CI GitHub Actions, template de PR, audit de conformité |
| Lot 6 | #73 | Fusionné ✓ | Guide de mise en ligne complet, correction checklist mode test |

Tous les lots ont été poussés, fusionnés et déployés automatiquement via Vercel.

---

## C. Corrections appliquées (détail)

### C.1 — Mode test isolé par appareil (CRITIQUE)

**Problème** : `hasAnyActiveTestMode()` était appelée en fallback dans `orders/route.ts` et `test-mode/check/route.ts`. Si un seul appareil admin avait le mode test actif, TOUTES les commandes de tous les clients étaient marquées comme test — bypass des horaires et du paiement Stripe.

**Correction** : Suppression complète du fallback `hasAnyActiveTestMode()`. Seul `isTestModeActive(deviceId)` est utilisé. Un appareil qui n'a pas activé le mode test ne passe jamais en bypass.

**Fichiers** : `app/api/orders/route.ts`, `app/api/test-mode/check/route.ts`

### C.2 — Phrase hero manquante

**Problème** : Le cahier exige la phrase exacte « Amateur de bonne viande ou fin gourmet, il y en aura pour tous les goûts. » sous le logo hero. Elle était absente.

**Correction** : Ajout dans `fr.ts`, `nl.ts` et `HomePage.tsx`.

### C.3 — Footer sous-pages incomplet

**Problème** : Le footer de la homepage avait les liens Facebook/Instagram mais pas le `SubpageFooter` (utilisé sur /la-carte, /commander, etc.).

**Correction** : Ajout des icônes SVG Facebook/Instagram dans `SubpageFooter.tsx` avec les styles correspondants.

### C.4 — Redirect /menu manquant

**Problème** : Le cahier exige une redirection `/menu` → `/la-carte`. Elle n'existait pas dans le middleware.

**Correction** : Ajout dans le middleware Next.js.

### C.5 — Feedback envoyé aux commandes test

**Problème** : Les e-mails de feedback post-livraison étaient envoyés même pour les commandes test.

**Correction** : Exclusion des commandes `is_test: true` du cron de feedback.

### C.6 — Rapprochement Stripe absent

**Problème** : Le cahier (section 6) exige un rapprochement automatique Stripe ↔ commandes avec alertes admin. Il n'existait pas.

**Correction** : Nouvel endpoint `/api/admin/stripe-reconciliation` qui détecte les commandes bloquées en `pending_payment` et les commandes confirmées sans référence Stripe. Alertes affichées dans le tableau de bord admin.

### C.7 — Recherche commandes admin absente

**Problème** : Le cahier exige « liste des commandes avec filtres et recherche ». Le backend supportait la recherche mais le frontend n'avait pas de champ de saisie.

**Correction** : Ajout du formulaire de recherche dans l'onglet Commandes du back-office admin.

---

## D. Points DIFFÉRENT (fonctionnels mais pas identiques au cahier)

### D.1 — Photo de poisson dans le carousel

Le fichier `poisson-restaurant.jpg` apparaît dans le carousel et le trio photos de l'accueil. Le cahier dit « pas de poisson » dans la galerie viande. **Non modifié** car le cahier dit aussi « le site public ne se modifie que sur demande explicite ».

### D.2 — Bouton « En route » du livreur

Le cahier demande 3 boutons (récupéré / en route / livrée). Le code combine « récupéré » et « en route » en un seul statut `delivering`. Le livreur dispose du message rapide « Je suis en route » pour notifier la cuisine. L'ETA propose 5/10/15/20/30 min (le cahier dit 5/10/15/20, le 30 est un surplus). **Non modifié** pour ne pas casser le flux existant.

---

## E. Points en attente du patron

1. **Espèces** — Paiement en espèces désactivé (EN ATTENTE dans le cahier)
2. **Compte Stripe réel** — Passage en mode live (prérequis : BE 0726.458.932, IBAN pro, identité du gérant)
3. **Photo poisson** — Remplacement possible sur demande
4. **Bouton « En route »** — Ajout possible si demandé
5. **Liens Facebook/Instagram** — URLs en place mais marqués EN ATTENTE (liens officiels à confirmer)
6. **Nom de domaine** — `legrilldufour.be` à pointer vers Vercel
7. **E-mails** — SPF, DKIM, DMARC à configurer pour `chriswillen@me.com`
8. **Codes de connexion** — PINs de test à remplacer par les PINs production

---

## F. Tests automatiques

### F.1 — Tests unitaires (Vitest)

66 tests couvrant la logique métier critique :

| Fichier | Tests | Domaine |
|---------|-------|---------|
| `cart.test.ts` | 19 | Panier : ajout, suppression, quantité, hydratation |
| `delivery-discount.test.ts` | 19 | Remise livraison 10%, arrondi 5 cts, exclusions boissons/desserts |
| `routing.test.ts` | 12 | Routage bilingue FR/NL, resolveLocaleFromPath, localizedHref |
| `translation.test.ts` | 8 | Traductions, fallback, interpolation de variables |
| `auth-pin.test.ts` | 8 | Rate limiting PIN admin, blocage 15 min, timing-safe |

### F.2 — Pipeline CI (GitHub Actions)

- **Job `test`** : `npx vitest run` sur chaque PR et push main
- **Job `build`** : `npx next build` (avec variables d'environnement placeholder)
- Déclenché sur push `main` et pull requests vers `main`

### F.3 — Template de PR

Checklist automatique dans chaque PR : tests, build, clés Stripe, e-mail unique, imports dynamiques, cahier des charges.

---

## G. Sécurité

| Vérification | Résultat |
|--------------|----------|
| Headers CSP, HSTS, X-Frame-Options | ✓ Configurés |
| Webhook Stripe signé | ✓ Signature vérifiée |
| PIN admin : timing-safe + rate limiting | ✓ 5 tentatives, 15 min blocage |
| PIN livreur : timing-safe + rate limiting | ✓ Même protection |
| XSS : sanitization des entrées | ✓ Notes et messages nettoyés |
| Commande payée non supprimable | ✓ Protégée côté serveur |
| Prix recalculés côté serveur | ✓ Depuis la base de données |
| Mode test isolé par appareil | ✓ Corrigé (Lot 3) |
| robots.txt bloque /admin, /staff, /livreur | ✓ Configuré |
| noindex sur /staff et /commander/checkout | ✓ Configuré |

**Point noté** : Les PINs livreurs sont stockés en clair dans la base de données. La comparaison timing-safe et le rate limiting les protègent contre les attaques par force brute. Le hachage nécessiterait l'ajout de `bcrypt` (interdit par les règles du projet : pas de nouvelle dépendance sans accord).

---

## H. Architecture technique

```
Client (navigateur)
  ├── Site public (/, /la-carte, /commander, /nl/...)
  ├── Admin (/admin) — PIN ou Auth Supabase
  ├── Cuisine (/staff) — PIN
  └── Livreur (/livreur) — PIN individuel + PWA
       │
       ▼
Next.js 14 (App Router, Vercel)
  ├── API Routes (/api/*)
  ├── Middleware (i18n, redirects, headers)
  └── Cron Jobs (messages, feedback, stock, cleanup)
       │
       ▼
Services externes
  ├── Supabase (PostgreSQL + Realtime + Auth)
  ├── Stripe (Checkout + Webhook)
  ├── Resend (e-mails transactionnels)
  ├── Telegram (notifications cuisine)
  └── Web Push VAPID (notifications livreur)
```

---

## I. Documents livrés

| Document | Contenu |
|----------|---------|
| `AUDIT-CONFORMITE.md` | Audit ligne par ligne du cahier des charges (toutes les 16 sections) |
| `GUIDE-MISE-EN-LIGNE.md` | Procédure complète de mise en production + rollback + monitoring |
| `CHECKLIST.md` | Mis à jour (correction item 67 mode test) |
| `CLAUDE.md` | Mis à jour (documentation mode test corrigée) |
| `.github/workflows/ci.yml` | Pipeline CI : tests + build |
| `.github/pull_request_template.md` | Template de PR avec checklist projet |

---

## J. Recommandations pour la suite

1. **Priorité immédiate** : Réaliser les prérequis patron (section E) pour débloquer la mise en ligne.

2. **Avant l'ouverture** : Faire des tests réels avec de vrais appareils — sons en cuisine, notifications sur iPhone et Android, paiement Stripe en mode test.

3. **Première semaine de production** : Surveiller quotidiennement le tableau de bord admin (alertes Stripe), les logs Vercel, et les e-mails Resend.

4. **Améliorations possibles** (hors scope actuel) :
   - Hachage des PINs livreurs (nécessite `bcrypt`)
   - E2E tests Playwright pour les parcours critiques (commande, paiement, cuisine)
   - Monitoring externe (Uptime Robot, Better Stack)
   - Backup automatique Supabase hors site
