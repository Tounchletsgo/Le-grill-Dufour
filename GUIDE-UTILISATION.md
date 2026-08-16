# Guide d'utilisation — Back-office Grill Dufour

Ce guide explique comment utiliser le back-office pour gérer le site du restaurant.

---

## Se connecter

1. Allez sur **votre-site.com/admin**
2. Choisissez le mode de connexion :
   - **E-mail** : entrez votre adresse e-mail et votre mot de passe
   - **PIN** : entrez le code PIN à 4 chiffres (accès rapide)
3. Cliquez sur **Se connecter**

Deux rôles existent :
- **Admin** : accès complet (commandes, menu, contenu, paramètres)
- **Staff** : commandes uniquement

Pour vous déconnecter, cliquez sur **Déconnexion** en haut à droite.

---

## Gérer les commandes

L'onglet **Commandes** affiche toutes les commandes du jour avec les statistiques (nombre, chiffre d'affaires, mode de paiement).

### Filtrer les commandes

Utilisez le menu déroulant pour afficher uniquement les commandes d'un certain statut (en attente, confirmée, en préparation, etc.).

### Traiter une commande

1. Cliquez sur une commande pour voir les détails (articles, adresse, notes)
2. Utilisez les boutons pour faire avancer le statut :
   - **En attente** → Confirmer ou Annuler
   - **Confirmée** → En préparation
   - **En préparation** → Prête
   - **Prête** → En livraison (livraison) ou Livrée (retrait)

---

## Modifier le menu

L'onglet **Menu** permet de gérer tous les articles de la carte.

### Modifier un article

1. Cliquez sur une catégorie pour la déplier
2. Cliquez sur **Modifier** à côté de l'article
3. Changez le nom, la description ou le prix
4. Cliquez sur **Enregistrer**

### Changer un prix

1. Cliquez sur **Modifier** à côté de l'article
2. Modifiez le champ **Prix**
3. Cliquez sur **Enregistrer**

### Marquer un plat en rupture

1. Dans la liste des articles, cliquez sur le bouton **Rupture** à côté du plat
2. Le plat sera affiché comme indisponible sur le site
3. Pour le remettre en stock, cliquez sur **Remettre**

### Masquer ou afficher un article

Utilisez l'interrupteur (toggle) à droite de chaque article pour le masquer ou l'afficher sur la carte.

### Masquer une catégorie entière

Utilisez l'interrupteur à côté du nom de la catégorie.

---

## Gérer la carte livraison

L'onglet **Carte livraison** permet de choisir quels articles sont disponibles en livraison.

- Activez ou désactivez la livraison pour chaque article avec l'interrupteur
- Activez tout une catégorie d'un coup avec l'interrupteur de la catégorie
- Modifiez un prix ou une description spécifique à la livraison via **Modifier**
- Réordonnez les articles par glisser-déposer (maintenez le bouton de gauche et déplacez)
- Cochez **Exclusif** pour les articles uniquement disponibles en livraison

---

## Modifier le contenu du site

L'onglet **Contenu** permet de modifier les textes et images du site sans toucher au code.

### Organisation

Le contenu est organisé par page :
- **Accueil** : bandeau principal, présentation, spécialités, section contact
- **Le Restaurant** : histoire, équipe
- **Contact** : adresse, téléphone, horaires
- **Pied de page** : liens, réseaux sociaux
- **Mentions légales** et **Confidentialité**

### Modifier un bloc

1. Cliquez sur le nom de la page dans la barre du haut
2. Trouvez le bloc que vous voulez modifier
3. Cliquez sur **Modifier**
4. Modifiez les champs :
   - **Titre** : tapez directement le nouveau titre
   - **Texte** : utilisez la barre d'outils pour le gras, l'italique, les listes et les liens
   - **Image** : voir la section « Changer une image » ci-dessous
   - **Bouton** : changez le libellé et le lien
5. L'aperçu à droite montre le résultat en temps réel

### Sauvegarder sans publier

Cliquez sur **Sauvegarder le brouillon** pour enregistrer vos modifications sans les rendre visibles sur le site. Un bandeau « Brouillon non publié » apparaît pour vous le rappeler.

### Publier

Quand vous êtes satisfait du résultat dans l'aperçu, cliquez sur **Publier**. Les modifications deviennent immédiatement visibles sur le site.

### Revenir à une version précédente

1. Cliquez sur **Historique** à côté du bloc
2. Une fenêtre affiche les 10 dernières versions avec leur date
3. Cliquez sur **Restaurer** à côté de la version souhaitée
4. Le contenu restauré apparaît dans le brouillon — vérifiez et publiez si OK

---

## Changer une image

### Téléverser une nouvelle image

1. Dans un bloc en cours de modification, trouvez le champ **Image**
2. Glissez-déposez votre photo sur la zone prévue, ou cliquez pour choisir un fichier
   - Fonctionne aussi depuis un téléphone
   - Formats acceptés : JPG, PNG, WebP, GIF
   - Poids maximum : 10 Mo
3. L'image s'affiche avec un outil de recadrage :
   - Déplacez et redimensionnez le cadre pour choisir la zone visible
4. Remplissez le **Texte alternatif** (obligatoire) :
   - Décrivez ce que montre l'image en une phrase
   - Exemple : « Vue de la salle du restaurant avec les tables dressées »
   - Cela aide les personnes malvoyantes et le référencement Google
5. Cliquez sur **Téléverser**

L'image est automatiquement :
- Convertie au format WebP (plus léger)
- Redimensionnée en plusieurs tailles (pour s'adapter aux écrans)
- Recadrée selon vos indications

---

## Paramètres

L'onglet **Paramètres** permet de gérer :

### Livraison

- Activer ou désactiver la livraison
- Commande minimum, frais de livraison, seuil de gratuité
- Rayon de livraison et temps estimé

### Horaires d'ouverture

- Pour chaque jour : ouvert/fermé + heures d'ouverture et de fermeture
- Cliquez sur **Enregistrer les modifications** en bas pour sauvegarder

---

## Réservations

Les réservations sont gérées par **Barestho**, un service externe. Le formulaire de réservation est intégré directement dans le site.

### Comment les clients réservent

- Sur **ordinateur** : un clic sur « Réserver » ouvre le formulaire dans une fenêtre modale
- Sur **téléphone** : le client est redirigé vers la page `/reservation`
- Le formulaire Barestho gère tout : choix de la date, de l'heure, du nombre de convives, et la confirmation

### Gérer les réservations

Les réservations se gèrent **directement sur Barestho** (pas dans le back-office du site) :
- Connectez-vous sur [legrilldufour.reservation.barestho.com](https://legrilldufour.reservation.barestho.com/)
- Vous y retrouvez les réservations, les confirmations et les annulations

### Modifier l'URL Barestho

Si l'URL du widget Barestho change, modifiez la variable `NEXT_PUBLIC_BARESTHO_URL` dans les paramètres d'environnement sur Vercel. Aucun changement de code n'est nécessaire.

---

## En cas de problème

- **Le site ne se met pas à jour** : vérifiez que vous avez bien cliqué « Publier » et non juste « Sauvegarder le brouillon ».
- **L'image ne s'affiche pas** : vérifiez que le format est JPG, PNG, WebP ou GIF et que le fichier fait moins de 10 Mo.
- **Erreur de connexion** : vérifiez votre adresse e-mail et votre mot de passe. Contactez l'administrateur si vous avez oublié vos identifiants.
- **Je ne vois pas l'onglet Contenu** : cet onglet n'est accessible qu'aux administrateurs, pas au personnel (staff).
