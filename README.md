# Grill Dufour — Site web du restaurant

Site vitrine et système de commande en ligne du restaurant **Grill Dufour**, situé à Mouscron (Belgique).

## Stack technique

- **Framework** : Next.js 14 (App Router, TypeScript)
- **Base de données** : Supabase (PostgreSQL + RLS)
- **Hébergement** : Vercel (auto-deploy)
- **Réservation** : Barestho (iframe widget, SaaS externe)

## Pages

| Route | Description |
|---|---|
| `/` | Page d'accueil (présentation, carte, menus, contact) |
| `/carte` | Carte complète du restaurant |
| `/livraison` | Commande en livraison |
| `/livraison/checkout` | Formulaire de commande |
| `/reservation` | Réservation de table (Barestho) |
| `/admin` | Back-office (commandes, menu, contenu, paramètres) |
| `/staff` | Interface simplifiée pour le personnel |
| `/mentions-legales` | Mentions légales |
| `/politique-de-confidentialite` | Politique de confidentialité |

## Installation locale

```bash
npm install
cp .env.example .env.local   # puis remplir les variables
npm run dev                   # http://localhost:3000
```

## Variables d'environnement

Voir `.env.example` pour la liste complète. Les principales :

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Connexion Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Clé serveur (API routes uniquement)
- `ADMIN_PIN` — Code PIN d'accès rapide au back-office
- `NEXT_PUBLIC_BARESTHO_URL` — URL du widget de réservation Barestho

## Base de données

Le schéma complet est dans `supabase/schema.sql`. Les migrations incrémentales sont dans `supabase/migrations/` :

1. `001_delivery_settings.sql` — Paramètres de livraison
2. `002_opening_hours.sql` — Horaires d'ouverture
3. `003_remove_mollie_add_blacklist.sql` — Suppression Mollie, ajout blacklist
4. `004_delivery_enhancements.sql` — Améliorations livraison
5. `005_cms_auth.sql` — CMS, authentification, rôles

## Build & tests

```bash
npm run build    # Build de production
npx vitest run   # Tests unitaires (13 tests)
```

## Back-office

Accessible via `/admin`. Deux modes de connexion :

- **E-mail/mot de passe** (Supabase Auth) — rôle admin ou staff
- **PIN** (accès rapide) — rôle admin uniquement

Guide d'utilisation complet : voir `GUIDE-UTILISATION.md`.
