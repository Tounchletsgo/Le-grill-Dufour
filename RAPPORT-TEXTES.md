# Rapport de corrections textuelles — Le Grill Dufour

**Date** : 12 octobre 2026
**PR** : #80 (mergée, squash)
**Branche** : `claude/grill-du-four-website-0aqs2i` → `main`

---

## A. Résumé

Audit textuel complet du site Le Grill Dufour : site public, page de commande, e-mails, interfaces admin/cuisine/livreur, traductions FR et NL, données statiques et seed SQL. **17 corrections appliquées** dans 7 fichiers. Aucune mise en page, couleur, prix, règle de commande ou fonctionnalité n'a été modifiée.

## B. Bug critique corrigé — Délai de livraison (Partie 2)

**Problème** : Le texte du délai de livraison affichait « entre 20 min **de** 1h » au lieu de « entre 20 min **et** 1h ». En NL : « Tussen 20 min **van** 1u » au lieu de « Tussen 20 min **en** 1u ».

**Cause racine** : Dans `OrderPage.tsx` ligne 232, le code utilisait `t("commander.from")` (= "de" en FR, "van" en NL) au lieu de `t("common.and")` (= "et" en FR, "en" en NL).

**Correction** : Remplacement de `t("commander.from")` par `t("common.and")`. La clé `common.and` existait déjà et était correctement utilisée dans `CheckoutPage.tsx` (ligne 532) et la bannière d'ouverture (ligne 94). Le bug n'existait que dans la section « détails livraison » de la page de commande.

**Fichier** : `src/components/commander/OrderPage.tsx`

## C. Corrections orthographe et grammaire — FR (Partie 1)

### Fichier `src/i18n/fr.ts` (12 corrections)

| Avant | Après | Règle | Occurrences |
|-------|-------|-------|-------------|
| chèque cadeau | chèque-cadeau | Nom composé : trait d'union obligatoire | 10 |
| des produits de saisons | des produits de saison | « De saison » est invariable (locution adverbiale) | 1 |
| Le grill Dufour | Le Grill Dufour | Nom propre du restaurant : majuscule | 2 |

Les 10 occurrences de « chèque cadeau » corrigées : `chequesTitle`, `giftCards` (nav), `giftDesc`, `giftBtn`, `giftCardLabel`, `altChequeCadeau`, `breadcrumb`, `desc`, `btn` (page chèques-cadeaux). Le titre `"Chèques-cadeaux"` (ligne 389) était déjà correct.

### Fichier `src/data/menuData.js` (3 corrections)

| Avant | Après | Règle |
|-------|-------|-------|
| ± 60gr | ± 60 g | Notation SI : espace avant le symbole, « g » sans abréviation |
| Par personnes | Par personne | Accord au singulier (prix par personne) |

### Fichier `supabase/seed.sql` (2 corrections)

| Avant | Après | Règle |
|-------|-------|-------|
| 60g | ± 60 g | Cohérence avec menuData.js |

### Interfaces admin (3 corrections)

| Fichier | Avant | Après | Règle |
|---------|-------|-------|-------|
| `ContentEditor.tsx` | Apercu | Aperçu | Cédille manquante |
| `DailySpecialsManager.tsx` | Boeuf | Bœuf | Ligature œ obligatoire en français |
| `AdminDashboard.tsx` | Email : | E-mail : | Cohérence avec les 7 autres occurrences du même fichier |

## D. Tartare — « non préparé » vs « préparé » (Partie 3)

**Constat** : Le tartare de bœuf (`"Tartare de bœuf non préparé"`) est explicitement marqué `is_deliverable: false` dans `menuData.js` (ligne 92). Le cahier des charges confirme (ligne 95) : « NON LIVRABLES : La Potence Dufour, tartare de bœuf, carpaccio de Holstein, option flambadou ».

**Décision** : Le tartare n'apparaît jamais dans le mode livraison. Changer le texte « non préparé » en « préparé » impliquerait de modifier le nom du plat dans la carte (qui est un choix du chef, pas une erreur). Changer `is_deliverable` de `false` à `true` violerait la contrainte « tu ne changes QUE des textes — aucune règle de commande ne change ».

**Aucune modification appliquée.** Si le patron souhaite rendre le tartare livrable ou renommer le plat, cela nécessite une demande explicite.

## E. Croquettes — affichage quantité (Partie 4)

**Constat** : Les croquettes affichent déjà la quantité dans les libellés de variantes :
- « Entrée (2 pièces) » — 14 € (fromage) / 20 € (crevette)
- « Plat (3 pièces) » — 19 € (fromage) / 27 € (crevette)

Le poids « ± 60 g » s'affiche en badge à côté du nom. La correction typographique « ± 60gr » → « ± 60 g » a été appliquée (notation SI).

**Ambiguïté notée** : Le poids « ± 60 g » pourrait signifier « ± 60 g par pièce » ou « ± 60 g au total ». Le code ne précise pas. Cette information est à confirmer avec le chef.

**Aucun ajout de texte « 2 croquettes ».** La quantité est déjà visible via les variantes. Ajouter « 2 croquettes (60 g) » dans le badge de poids serait redondant avec le libellé de variante sélectionné et risquerait de confondre entrée (2 pièces) et plat (3 pièces).

## F. Textes vérifiés sans erreur

Les fichiers suivants ont été audités ligne par ligne et ne contiennent aucune erreur :

- `src/i18n/nl.ts` — Traduction néerlandaise (700 lignes)
- `src/lib/email.ts` — Templates e-mails FR/NL (527 lignes)
- `src/data/restaurantData.js` — Données restaurant (194 lignes)
- `src/data/optionGroups.ts` — Groupes d'options (160 lignes)
- `src/data/cookingData.ts` — Niveaux de cuisson (132 lignes)
- `src/lib/telegram.ts` — Notifications Telegram (79 lignes)
- `src/components/staff/KitchenBoard.tsx` — Interface cuisine (2650 lignes)
- `src/components/staff/DriverMessagesPanel.tsx` — Messages livreur (626 lignes)
- `src/components/driver/DriverBoard.tsx` — Interface livreur (1318 lignes)
- `src/components/admin/ImageUploader.tsx` — Upload images (203 lignes)
- `src/components/admin/RichTextEditor.tsx` — Éditeur texte (117 lignes)
- `src/components/admin/StreetsManager.tsx` — Gestion rues (370 lignes)
- `app/commander/error.tsx` — Page d'erreur commande
- `app/livreur/error.tsx` — Page d'erreur livreur
- `app/api/unsubscribe/route.ts` — Désinscription e-mail

## G. Tests

| Métrique | Valeur |
|----------|--------|
| Tests unitaires | 78/78 passent |
| Build Next.js | Compile sans erreur |
| Fichiers modifiés | 7 |
| Corrections appliquées | 17 |
| Fichiers audités sans erreur | 15 |

## H. Points à confirmer avec le patron

1. **Tartare** : Le tartare de bœuf « non préparé » est non livrable. Faut-il le renommer « préparé » pour la livraison ? Cela nécessiterait aussi de le rendre livrable (`is_deliverable: true`).
2. **Poids croquettes** : « ± 60 g » — est-ce par pièce ou au total ?
3. **Quantité croquettes** : La quantité est déjà visible dans les variantes (« Entrée (2 pièces) », « Plat (3 pièces) »). Faut-il quand même l'ajouter dans le badge de poids ?
