# Mise en ligne sous legrilldufour.be — Guide pas à pas

> Ce fichier contient tout ce qu'il faut pour basculer le site vers le domaine
> legrilldufour.be. Il est ecrit pour etre suivi ligne par ligne par quelqu'un
> qui n'est pas developpeur.

---

## Etat actuel (diagnostic du 9 septembre 2026)

| Element                | Constat                                                          |
|------------------------|------------------------------------------------------------------|
| Domaine                | legrilldufour.be                                                 |
| Hebergement actuel     | Proximus Business Booster (plateforme multiscreensite.com)       |
| Adresses IP actuelles  | 52.59.120.70, 18.197.248.23 (serveurs Amazon, Francfort)         |
| www                    | Redirige via s.eu-multiscreensite.com vers les memes serveurs    |
| Nouveau site           | Heberge sur Vercel (le-grill-dufour.vercel.app)                  |

---

## A. Enregistrements DNS a creer pour Vercel (le site)

Ces deux lignes font pointer le domaine vers le nouveau site.

| Type  | Nom   | Valeur                 | A quoi ca sert                                      |
|-------|-------|------------------------|-----------------------------------------------------|
| A     | @     | 76.76.21.21            | Envoie legrilldufour.be vers Vercel                  |
| CNAME | www   | cname.vercel-dns.com   | Envoie www.legrilldufour.be vers Vercel              |

> **"@"** veut dire "le domaine lui-meme" (legrilldufour.be sans rien devant).
> **"A"** est un type d'enregistrement qui pointe vers une adresse IP.
> **"CNAME"** est un type d'enregistrement qui pointe vers un autre nom.

### Dans Vercel (a faire le jour J)

1. Va sur https://vercel.com → ton projet "Le Grill Dufour"
2. Settings → Domains
3. Ajoute **legrilldufour.be**
4. Ajoute **www.legrilldufour.be**
5. Vercel va te montrer les enregistrements DNS a creer (ce sont les memes que ci-dessus)
6. Vercel genere automatiquement un certificat SSL (la connexion securisee avec le cadenas)

---

## B. Enregistrements DNS pour les e-mails automatiques (Resend)

Ces lignes permettent au site d'envoyer des e-mails (confirmations de commande, demandes
d'avis) depuis l'adresse contact@legrilldufour.be sans tomber en spam.

### Etape prealable : configurer Resend

1. Creer un compte sur https://resend.com
2. Aller dans "Domains" → "Add Domain" → taper **legrilldufour.be**
3. Resend affiche les enregistrements exacts a creer (notamment 3 CNAME pour DKIM)
4. **Noter ces valeurs** — elles sont uniques a ton compte

### Enregistrements a creer

| Type  | Nom                          | Valeur                                   | A quoi ca sert                                  |
|-------|------------------------------|------------------------------------------|------------------------------------------------|
| TXT   | @                            | v=spf1 include:amazonses.com ~all        | Autorise Resend a envoyer au nom du domaine     |
| CNAME | resend._domainkey            | (fourni par Resend)                      | Signature numerique DKIM (cle 1)                |
| CNAME | (2e nom fourni par Resend)   | (fourni par Resend)                      | Signature numerique DKIM (cle 2)                |
| CNAME | (3e nom fourni par Resend)   | (fourni par Resend)                      | Signature numerique DKIM (cle 3)                |
| TXT   | _dmarc                       | v=DMARC1; p=none;                        | Politique anti-usurpation (mode observation)    |

> **SPF** = liste des serveurs autorises a envoyer des mails pour ton domaine.
> **DKIM** = signature electronique qui prouve que le mail n'a pas ete modifie.
> **DMARC** = regle qui dit aux serveurs de reception quoi faire si SPF ou DKIM echouent.

---

## C. ATTENTION — Enregistrements a NE PAS supprimer

### Enregistrements MX (e-mails du restaurant)

Si le restaurant recoit des e-mails sur une adresse @legrilldufour.be (par exemple
contact@legrilldufour.be, info@legrilldufour.be), ces e-mails sont geres par des
**enregistrements MX**. Ce sont des lignes DNS de type "MX" qui disent "les e-mails
pour ce domaine doivent aller vers tel serveur".

**SI TU SUPPRIMES CES LIGNES MX, LE RESTAURANT NE RECOIT PLUS AUCUN E-MAIL.**

Avant de toucher a quoi que ce soit :

1. Note tous les enregistrements MX existants (type MX, priorite, valeur)
2. Note aussi les enregistrements TXT existants (il peut y avoir un SPF deja en place)
3. Quand tu crees les nouveaux enregistrements, ne supprime JAMAIS une ligne MX
4. Si tu dois modifier le SPF (enregistrement TXT commencant par v=spf1), fusionne
   l'ancien et le nouveau au lieu de remplacer

**Exemple de fusion SPF :**
- Ancien : `v=spf1 include:spf.proximus.be ~all`
- A ajouter : `include:amazonses.com`
- Resultat : `v=spf1 include:spf.proximus.be include:amazonses.com ~all`

### Si le restaurant n'utilise PAS d'adresse @legrilldufour.be

Si les e-mails du restaurant passent par Gmail, Outlook/Hotmail ou une autre adresse
qui ne finit pas par @legrilldufour.be, il n'y a pas d'enregistrement MX a proteger.
Dans ce cas, tu peux creer les enregistrements librement.

**Verifie ce point avec le frere avant de toucher a quoi que ce soit.**

---

## D. Procedure de basculement — Jour J

### Preparation (la veille)

- [ ] Verifier que le nouveau site fonctionne sur le-grill-dufour.vercel.app
- [ ] Avoir sous la main les identifiants du gestionnaire de domaine (Proximus, ou
      le nouveau si transfert fait)
- [ ] Avoir les valeurs exactes de Resend (voir section B)
- [ ] Noter les enregistrements MX existants (voir section C)
- [ ] Avoir acces a la console Vercel

### Basculement (15 minutes)

1. **Dans Vercel** : Settings → Domains → ajouter legrilldufour.be et www.legrilldufour.be
2. **Dans le gestionnaire DNS** :
   - Modifier l'enregistrement A de @ vers **76.76.21.21**
   - Modifier le CNAME de www vers **cname.vercel-dns.com**
   - Ajouter les enregistrements Resend (SPF, DKIM, DMARC)
   - **Ne pas toucher aux MX**
3. **Attendre** : la propagation prend entre 5 minutes et 48 heures (en general moins de 2h)
4. **Verifier** dans Vercel → Domains que le certificat SSL est actif (cadenas vert)

### Apres le basculement (verifications)

- [ ] legrilldufour.be affiche le nouveau site
- [ ] www.legrilldufour.be affiche le nouveau site
- [ ] Le cadenas est present (connexion securisee / HTTPS)
- [ ] Faire une commande test de bout en bout
- [ ] Envoyer un e-mail test a une adresse @legrilldufour.be (si elle existe) pour
      verifier que la reception fonctionne toujours
- [ ] Verifier que les e-mails de confirmation de commande arrivent (pas en spam)
- [ ] Aller sur la fiche Google du restaurant et mettre a jour l'adresse du site web
      si elle pointe encore vers l'ancien
- [ ] Verifier la page de reservation Barestho (doit continuer a fonctionner)

---

## E. Variables d'environnement a configurer dans Vercel

Dans Vercel → Settings → Environment Variables, verifier que ces valeurs sont presentes :

| Variable                   | Valeur a mettre                                |
|----------------------------|------------------------------------------------|
| NEXT_PUBLIC_APP_URL        | https://legrilldufour.be                       |
| NEXT_PUBLIC_SITE_URL       | https://legrilldufour.be                       |
| EMAIL_FROM                 | Le Grill Dufour <contact@legrilldufour.be>     |
| EMAIL_REPLY_TO             | contact@legrilldufour.be                       |
| EMAIL_RESTAURANT_NOTIF     | (adresse e-mail ou le restaurant recoit les notifications) |
| RESEND_API_KEY             | (cle API fournie par Resend)                   |

> Si ces variables sont deja definies avec l'adresse Vercel (le-grill-dufour.vercel.app),
> les mettre a jour avec le vrai domaine.

---

## F. Procedure de retour en arriere (urgence)

Si apres le basculement le site ne s'affiche plus ou les e-mails ne passent plus :

### Le site ne s'affiche pas

1. Aller dans le gestionnaire DNS
2. Remettre l'enregistrement A de @ vers les anciennes valeurs :
   - 52.59.120.70
   - 18.197.248.23
3. Remettre le CNAME de www vers : s.eu-multiscreensite.com
4. Attendre la propagation (quelques minutes a 2h)
5. L'ancien site reviendra

### Les e-mails ne passent plus

1. Verifier que les enregistrements MX n'ont pas ete supprimes
2. Si oui, les remettre immediatement (tu les auras notes avant le basculement)
3. Si non, le probleme est ailleurs — contacter le fournisseur e-mail

### En cas de doute

Ne rien supprimer. Ajouter plutot que modifier. Appeler le support du gestionnaire DNS.

---

## G. Meilleur moment pour basculer

**Mercredi ou jeudi matin (entre 9h et 11h)**

Raisons :
- Le restaurant est ferme ces deux jours → pas de commandes en cours
- Si quelque chose ne fonctionne pas, tu as toute la journee pour corriger avant
  la reouverture le vendredi
- Le support technique des gestionnaires de domaine est disponible en semaine
- La propagation DNS aura le temps de se faire avant vendredi

**Ne JAMAIS basculer :**
- Un vendredi apres-midi ou soir (pas de support le week-end si probleme)
- Pendant un service (11h45-15h ou 18h45-22h)

---

## H. Redirections de l'ancien site

L'ancien site Proximus avait probablement des pages indexees par Google (menu, contact,
etc.). Pour ne pas perdre ce referencement :

- Les anciennes URLs de Proximus (type multiscreensite) ne sont pas sous votre controle
  et ne peuvent pas etre redirigees
- Les URLs sous legrilldufour.be pointeront automatiquement vers le nouveau site
- Mettre a jour la fiche Google My Business du restaurant avec la bonne URL
- Si des annuaires (Pages Jaunes, TripAdvisor, etc.) pointent vers l'ancien site,
  les mettre a jour manuellement

---

## Recapitulatif des etapes dans l'ordre

1. [ ] Verifier les infos du domaine sur dnsbelgium.be (titulaire, agent, e-mail)
2. [ ] Appeler Proximus pour verifier l'adresse e-mail du titulaire
3. [ ] Decider : chemin A (rester chez Proximus) ou chemin B (transferer)
4. [ ] Si chemin B : demander le code de transfert a Proximus
5. [ ] Si chemin B : creer un compte chez le nouveau gestionnaire et lancer le transfert
6. [ ] Creer un compte Resend et configurer le domaine legrilldufour.be
7. [ ] Noter les enregistrements MX existants
8. [ ] Un mercredi ou jeudi matin : faire le basculement DNS (section D)
9. [ ] Verifier que tout fonctionne (section D, checklist)
10. [ ] Mettre a jour la fiche Google du restaurant
