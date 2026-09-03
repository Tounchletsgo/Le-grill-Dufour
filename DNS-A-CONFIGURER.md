# Configuration DNS pour les e-mails — legrilldufour.be

Pour que les e-mails envoyés depuis `contact@legrilldufour.be` arrivent bien en boîte de réception
(et pas en spam), il faut ajouter ces enregistrements DNS chez votre hébergeur de domaine.

## 1. SPF (Sender Policy Framework)

Ajouter ou mettre à jour l'enregistrement TXT sur `legrilldufour.be` :

```
Type : TXT
Nom  : @ (ou legrilldufour.be)
Valeur : v=spf1 include:amazonses.com ~all
```

> Resend utilise Amazon SES. Si vous avez déjà un enregistrement SPF, ajoutez `include:amazonses.com`
> avant le `~all` existant.

## 2. DKIM (DomainKeys Identified Mail)

Resend fournit 3 enregistrements CNAME à ajouter. Ils apparaissent dans votre dashboard Resend
(https://resend.com/domains) après avoir ajouté le domaine `legrilldufour.be`.

Exemple (les valeurs exactes sont dans Resend) :

```
Type : CNAME
Nom  : resend._domainkey.legrilldufour.be
Valeur : (fourni par Resend)
```

## 3. DMARC

```
Type : TXT
Nom  : _dmarc (ou _dmarc.legrilldufour.be)
Valeur : v=DMARC1; p=none; rua=mailto:chriswillen@me.com
```

> `p=none` pour commencer (mode observation). Une fois que tout fonctionne bien,
> passer à `p=quarantine` puis `p=reject`.

## 4. Vérification du domaine sur Resend

1. Aller sur https://resend.com/domains
2. Ajouter `legrilldufour.be`
3. Copier les enregistrements CNAME fournis et les ajouter dans votre DNS
4. Cliquer sur « Verify » dans Resend
5. Attendre la propagation DNS (quelques minutes à 48h)

## Résumé des enregistrements à ajouter

| Type  | Nom                              | Valeur                           |
|-------|----------------------------------|----------------------------------|
| TXT   | @                                | v=spf1 include:amazonses.com ~all |
| CNAME | resend._domainkey                | (fourni par Resend)              |
| CNAME | (2e clé DKIM)                    | (fourni par Resend)              |
| CNAME | (3e clé DKIM)                    | (fourni par Resend)              |
| TXT   | _dmarc                           | v=DMARC1; p=none; rua=mailto:chriswillen@me.com |
