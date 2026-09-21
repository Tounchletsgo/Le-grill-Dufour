# Traductions NL (Belge) a relire

Ce fichier liste toutes les traductions neerlandaises (flamand belge, forme "u") ajoutees au site.
Chaque section correspond a un fichier ou groupe de cles.

**Convention** : Les noms de plats francais sont gardes tels quels ; seules les descriptions et le texte d'interface sont traduits.

---

## 1. Fichier principal : `src/i18n/nl.ts`

### Meta / SEO
| Cle | Texte NL |
|-----|----------|
| meta.siteTitle | Grill Dufour \| Restaurant & Grill in Moeskroen |
| meta.siteDescription | Grill Dufour, grillrestaurant in Moeskroen. Cote a l'os, steaks, premium burgers, vis en planken in een verzorgd kader. |
| meta.ogDescription | Vlees, houtskoolgrillades en royale planken in een verzorgd kader in Moeskroen. |
| meta.carteTitle | De Kaart \| Grill Dufour |
| meta.commanderTitle | Online bestellen \| Grill Dufour |
| meta.reserverTitle | Een tafel reserveren \| Grill Dufour |
| meta.chequesTitle | Cadeaubonnen \| Grill Dufour |
| meta.contactTitle | Contact & Bereikbaarheid \| Grill Dufour |

### Navigation (nav.*)
- Kaart, Bestellen, Reserveren, Cadeaubonnen, Contact, Bellen, Bestellen (bouton)
- Sluiten, Navigatie openen

### Page d'accueil (home.*)
- hero.badge : Grill & Smaak
- hero.title : Elk stuk vlees vertelt een verhaal
- hero.subtitle : Houtskoolgrillades, genereuze planken en warmte...
- boutons : De kaart ontdekken / Bestellen
- Sections : Nos grillades, Carte en livraison, Commande en ligne, etc.
- Tous les textes alt des images (20+ cles)
- Footer complet : horaires, contact, plan, newsletter, mentions legales, confidentialite

### Carte (carte.*)
- Chargement, erreur, panier vide, ajouter au panier, supplements, cuisson, quantite, etc.

### Commander (commander.*)
- Livraison, emporter, panier, sous-total, frais de livraison, total, note, etc.

### Checkout (checkout.*)
- Formulaire complet : nom, prenom, telephone, email, adresse, paiement, etc.
- Messages d'erreur (champs requis, email invalide, etc.)
- Stripe, especes, carte/Bancontact

### Reservation (reservation.*)
- Formulaire de reservation : date, heure, nombre de personnes, etc.

### Cheques-cadeaux (cheques.*)
- Titre, descriptions, formulaire de commande

### Contact (contact.*)
- Informations, formulaire, Google Maps

### Suivi de commande (tracking.*)
- Statuts : en attente, confirme, en preparation, pret, en livraison, livre
- Paiement en ligne, paiement a la livraison, especes, carte/Bancontact

### Mentions legales et confidentialite (legal.*, privacy.*)
- Textes juridiques complets traduits

### Elements communs (common.*)
- et, fermer, erreur, chargement, retour, etc.

---

## 2. Emails : `src/lib/email.ts`

### Email de confirmation (EMAIL_STRINGS.nl)
| Cle | Texte NL |
|-----|----------|
| subject | Bestelling {n} goed ontvangen |
| title | Bedankt voor uw bestelling! |
| intro | {name}, ons team is druk bezig in de keuken om alles voor u klaar te maken. |
| orderLabel | Bestelling |
| note | Opmerking |
| discountLabel | Leveringskorting ({pct} %) |
| deliveryFeeLabel | Leveringskosten |
| totalLabel | Totaal |
| paidOnline | Online betaling uitgevoerd. |
| payAtDelivery | Betaling bij levering ({method}). |
| paymentOnline | Online betaald |
| paymentCash | Contant |
| paymentCard | Kaart / Bancontact |
| addressLabel | Leveringsadres |
| trackBtn | Mijn bestelling volgen |
| errorNote | Een fout in uw bestelling? Bel ons onmiddellijk op |
| closing | Tot zo! |

### Email de feedback (FEEDBACK_STRINGS.nl)
| Cle | Texte NL |
|-----|----------|
| subject | Uw mening over bestelling {n} |
| title | Hoe was uw bestelling? |
| feedbackBtn | Geef ons uw mening (prive) |
| preferCall | Liever persoonlijk vertellen? |
| callUs | Bel ons op |
| googleNote | U kunt ook een beoordeling achterlaten op Google. |
| googleBtn | Google-beoordeling achterlaten |
| closing | Prettige avond, |
| unsubscribe | Uitschrijven |

---

## 3. Stripe Checkout : `app/api/checkout/route.ts`
- Frais de livraison traduit : "Leveringskosten" pour les commandes NL
- Locale Stripe : "nl" pour les commandes neerlandophones

---

## Points d'attention pour la relecture

1. **Forme de politesse** : tout le site utilise "u" (formel), jamais "je" (informel). Verifier la coherence.
2. **Vocabulaire belge** : "Moeskroen" (pas Mouscron en NL), "gsm" (pas mobiel), etc.
3. **Noms de plats** : restes en francais (Cote a l'os, Entrecote, etc.) — seules les descriptions sont traduites.
4. **Textes juridiques** : mentions legales et politique de confidentialite a verifier par un juriste.
5. **Horaires** : utilisation du format 24h (standard NL).
