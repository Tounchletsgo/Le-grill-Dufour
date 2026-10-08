# Audit de conformité — Le Grill Dufour

**Date** : 8 octobre 2026
**Référence** : CAHIER-DES-CHARGES.md (16 sections, 277 lignes)
**Méthode** : Audit ligne par ligne du code source, 4 agents spécialisés en parallèle

---

## Légende

- **CONFORME** — Implémenté correctement selon le cahier des charges
- **CORRIGÉ** — Bug trouvé et réparé dans cette session
- **DIFFÉRENT** — Fonctionnel mais diffère du cahier (détail ci-dessous)
- **EN ATTENTE** — Marqué comme tel dans le cahier (dépend du patron)

---

## Section 2 — Identité

| # | Exigence | Verdict |
|---|----------|---------|
| 2.1 | Couleurs bordeaux, blanc, noir | CONFORME |
| 2.2 | Logo blanc sur sombre, noir sur clair | CONFORME |
| 2.3 | Pas de dark mode public, dark mode admin seul | CONFORME |
| 2.4 | Email unique chriswillen@me.com partout | CONFORME |

## Section 3 — Site public

| # | Exigence | Verdict |
|---|----------|---------|
| 3.1 | Navigation complète + téléphone + boutons | CONFORME |
| 3.2 | Menu hamburger mobile, un seul X | CONFORME |
| 3.3 | Hero : logo + CTAs + phrase exacte | CORRIGÉ (phrase ajoutée Lot 3) |
| 3.4 | Sections : présentation, équipe, chèques, carousel, avis, horaires, contact, footer | CONFORME |
| 3.5 | Google Reviews : masquage si vide, pas d'avis inventés | CONFORME |
| 3.6 | Footer : copyright + liens sociaux | CORRIGÉ (SubpageFooter complété Lot 3) |
| 3.7 | Blocs supprimés absents | CONFORME |
| 3.8 | La Carte : 6 photos, lightbox, swipe, zoom, bouton retour | CONFORME |
| 3.9 | Retour à l'accueil haut et bas | CONFORME |
| 3.10 | SEO complet : title, description, JSON-LD, sitemap, hreflang, redirects | CORRIGÉ (/menu redirect ajouté Lot 3) |
| 3.11 | Galerie viande/grill sans poisson | DIFFÉRENT (voir note) |
| 3.12 | Animations discrètes au défilement | CONFORME |
| 3.13 | Footer « Restaurant Le Grill Dufour » + Facebook/Instagram | CONFORME (homepage), CORRIGÉ (sous-pages) |
| 3.14 | Bilinguisme FR/NL | CONFORME |

> **Note 3.11** : `poisson-restaurant.jpg` apparaît dans le carousel et le trio photos de l'accueil. Le cahier dit "pas de poisson" dans la galerie viande. Modification visuelle non appliquée (règle : "le site public ne se modifie que sur demande explicite").

## Section 4 — Commander

| # | Exigence | Verdict |
|---|----------|---------|
| 4.1 | Modes livraison/emporter avec toggle | CONFORME |
| 4.2 | 10 % remise livraison, exclut boissons + desserts | CONFORME |
| 4.3 | Frais 5 €, minimum 25 € après remise | CONFORME |
| 4.4 | Adresse BeSt Address, n° séparé, code postal, commune | CONFORME |
| 4.5 | 7 cuissons, 7 groupes, cuisson imposée, décalage livraison | CONFORME |
| 4.6 | 2 accompagnements obligatoires sauf exceptions | CONFORME |
| 4.7 | Sauces avec prix corrects | CONFORME |
| 4.8 | Flambadou désactivé en livraison, 5 € | CONFORME |
| 4.9 | Plats du jour : 2 plats, 14 € ref, livraison uniquement | CONFORME |
| 4.10 | Plats non livrables exclus en livraison | CONFORME |
| 4.11 | Terrine Yves Stal supprimée | CONFORME |

## Section 5 — Emails

| # | Exigence | Verdict |
|---|----------|---------|
| 5.1 | Expéditeur et reply-to : chriswillen@me.com | CONFORME |
| 5.2 | Email de confirmation après paiement | CONFORME |
| 5.3 | Email de feedback après livraison | CORRIGÉ (exclusion des commandes test, Lot 3) |

## Section 6 — Paiement

| # | Exigence | Verdict |
|---|----------|---------|
| 6.1 | Paiement en ligne obligatoire (espèces désactivé) | CONFORME (EN ATTENTE espèces) |
| 6.2 | Commande confirmée uniquement après webhook Stripe | CONFORME |
| 6.3 | Fallback verify-payment si webhook en retard | CONFORME |
| 6.4 | Commande test marquée via livemode Stripe | CONFORME |
| 6.5 | Rapprochement Stripe ↔ commandes avec alertes admin | CORRIGÉ (ajouté Lot 4) |
| 6.6 | Compte Stripe réel | EN ATTENTE (patron) |
| 6.7 | Prix recalculés côté serveur | CONFORME |

## Section 7 — Cuisine

| # | Exigence | Verdict |
|---|----------|---------|
| 7.1 | Commandes temps réel + alerte sonore | CONFORME |
| 7.2 | Son répète jusqu'au toucher, volume max, badge clignotant | CONFORME |
| 7.3 | Bouton « Activer le son », bannière rouge, survit aux coupures | CONFORME |
| 7.4 | Wake Lock | CONFORME |
| 7.5 | Indicateur connexion + auto-reconnexion | CONFORME |
| 7.6 | Statuts en un geste, délai, stock, annulation | CONFORME |
| 7.7 | Messages : boutons 56px, badge non lu, croix fermeture | CONFORME |
| 7.8 | Message livreur : son distinct + notification visuelle | CONFORME |
| 7.9 | Bandeau TEST sur commandes test | CONFORME |
| 7.10 | Neutralisation XSS | CONFORME |

## Section 8 — Livreur

| # | Exigence | Verdict |
|---|----------|---------|
| 8.1 | Espace PIN séparé, session longue | CONFORME |
| 8.2 | PWA livreur uniquement | CONFORME |
| 8.3 | Détail : adresse, nav, tél, articles, espèces, notes | CONFORME |
| 8.4 | Statuts : récupéré, en route, livrée + ETA | DIFFÉRENT (voir note) |
| 8.5 | Notifications push (prête + messages) | CONFORME |
| 8.6 | Messages rapides, texte libre, croix fermeture | CONFORME |
| 8.7 | Historique du jour + écran allumé | CONFORME |
| 8.8 | Livreur ne voit que ses commandes après ramassage | CONFORME |

> **Note 8.4** : Le cahier demande 3 boutons (récupéré / en route / livrée). Le code combine "récupéré" et "en route" en un seul statut `delivering`. Le livreur dispose du message rapide "Je suis en route" pour notifier la cuisine. L'ETA 30 min est en surplus (le cahier dit 5/10/15/20). Pas de modification appliquée pour ne pas casser le flux existant.

## Section 9 — Messagerie

| # | Exigence | Verdict |
|---|----------|---------|
| 9.1 | Messagerie bidirectionnelle instantanée | CONFORME |
| 9.2 | Tri par jour, suppression, effacer tout (cuisine seule) | CONFORME |
| 9.3 | Nettoyage auto 5h Bruxelles + filet de sécurité + visible admin | CORRIGÉ (filet + affichage admin, Lot 3) |

## Section 10 — Suivi client

| # | Exigence | Verdict |
|---|----------|---------|
| 10.1 | Page de suivi temps réel, jamais "commande introuvable" | CONFORME |

## Section 11 — Administration

| # | Exigence | Verdict |
|---|----------|---------|
| 11.1 | Toutes les rubriques présentes | CONFORME |
| 11.2 | Tableau de bord : chiffres, graphiques, comparaison, export CSV | CONFORME |
| 11.3 | Liste commandes avec filtres et recherche | CORRIGÉ (recherche ajoutée Lot 4) |
| 11.4 | Exclusion test/annulées/impayées des chiffres | CONFORME |
| 11.5 | Mode test par appareil, 1h, auto-expire | CORRIGÉ (isolé par device, Lot 3) |

## Section 12 — Connexions / Accès

| # | Exigence | Verdict |
|---|----------|---------|
| 12.1 | 3 espaces internes protégés (admin, cuisine, livreur) | CONFORME |
| 12.2 | Rate limiting sur toutes les authentifications | CONFORME |

## Section 13 — Sécurité

| # | Exigence | Verdict |
|---|----------|---------|
| 13.1 | Headers sécurité (CSP, HSTS, X-Frame-Options) | CONFORME |
| 13.2 | Webhook Stripe signé | CONFORME |
| 13.3 | PIN livreur : comparaison timing-safe | CONFORME |
| 13.4 | Commande réelle payée non supprimable | CONFORME |

---

## Résumé des corrections appliquées

| Lot | PR | Corrections |
|-----|-----|-------------|
| Lot 3 | #70 | Mode test isolé par appareil (critique), phrase hero, footer sous-pages, /menu redirect, feedback test, cleanup safety net |
| Lot 4 | #71 | Rapprochement Stripe avec alertes admin, recherche commandes |

## Points en attente du patron

1. **Espèces** — Paiement en espèces désactivé (EN ATTENTE dans le cahier)
2. **Compte Stripe réel** — Passage en mode live (EN ATTENTE)
3. **Photo poisson** — `poisson-restaurant.jpg` dans le carousel (modification visuelle = demande explicite requise)
4. **Bouton « En route »** — Actuellement combiné avec « Récupéré » ; ajout possible si demandé
5. **Liens Facebook/Instagram** — URLs en place mais marqués EN ATTENTE dans le cahier (liens officiels à confirmer)
