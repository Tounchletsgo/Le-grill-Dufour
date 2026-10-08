# CLAUDE.md — Mémoire du projet Le Grill Dufour

## Avant toute modification

1. Lis `CAHIER-DES-CHARGES.md` — c'est le contrat du projet. Chaque ligne a été demandée par le patron.
2. Lis `FONCTIONNALITES.md` — inventaire technique de tout ce qui est construit.
3. Lis `CHECKLIST.md` — liste de vérification après chaque déploiement.
4. Ne retire ni ne casse jamais une fonctionnalité listée dans le cahier des charges.

## Règles de développement

- Lance `npx vitest run` avant chaque fusion et ne fusionne pas si un test échoue.
- Lance `npx next build` pour vérifier qu'il n'y a pas d'erreurs de compilation.
- Après chaque déploiement, déroule `CHECKLIST.md`.
- Toute nouvelle demande du patron est ajoutée au cahier des charges.
- Les tests de paiement se font toujours en mode test Stripe.
- Le site public et son identité visuelle ne se modifient que sur demande explicite.
- UNE SEULE adresse e-mail dans tout le projet : **chriswillen@me.com**.
- Utiliser les imports dynamiques pour supabaseAdmin : `const { supabaseAdmin } = await import("@/lib/supabase-server")`.
- Une commande réelle payée ne peut JAMAIS être supprimée (obligation comptable).
- Ne jamais télécharger d'images depuis internet.
- Ne pas toucher à la page de réservation.
- Ne pas ajouter de dépendances sans demander.

## Stack technique

- Next.js 14 (App Router, TypeScript, React 18)
- Supabase (PostgreSQL, Realtime, Auth)
- Stripe (paiement en ligne, Bancontact)
- Vercel (hébergement, cron jobs, auto-deploy sur push main)
- Resend (e-mails transactionnels)
- Telegram (notifications cuisine)
- Fuseau horaire : Europe/Brussels

## Structure des espaces

- `/` — Site public (vitrine + commande)
- `/admin` — Back-office administration (PIN ou email/mdp)
- `/staff` — Tablette cuisine (PIN)
- `/livreur` — Interface livreur mobile (PIN individuel)

## Points critiques

- Le mode test bypass les horaires ET le paiement Stripe. Il repose sur `isTestModeActive(deviceId)` qui vérifie la table `test_mode_sessions` par appareil. Seul l'appareil ayant activé le mode test peut passer des commandes test.
- Les commandes n'arrivent en cuisine qu'après confirmation Stripe (webhook signé). Le fallback `verify-payment` confirme si le webhook est en retard.
- Les prix sont toujours recalculés côté serveur depuis la base de données.
- Le Wake Lock empêche l'écran de s'éteindre sur tablette cuisine et mobile livreur.
- Les notifications push livreur utilisent VAPID (Web Push).
