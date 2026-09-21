import { restaurant } from "@/data/restaurantData";

const RESEND_URL = "https://api.resend.com/emails";
const BORDEAUX = "#8C2434";
const CREME = "#FBF8F4";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getFrom() {
  return process.env.EMAIL_FROM || "Le Grill Dufour <contact@legrilldufour.be>";
}

function getReplyTo() {
  return process.env.EMAIL_REPLY_TO || "contact@legrilldufour.be";
}

function getRestaurantNotifEmail() {
  return process.env.EMAIL_RESTAURANT_NOTIF || "contact@legrilldufour.be";
}

function emailShell(content: string) {
  return `<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#333;line-height:1.6">
  <div style="background:${BORDEAUX};padding:20px;text-align:center">
    <h1 style="color:${CREME};margin:0;font-size:20px;letter-spacing:0.5px">Le Grill Dufour</h1>
  </div>
  <div style="padding:24px;background:#fff">
    ${content}
  </div>
  <div style="background:#f5f5f5;padding:14px;text-align:center;font-size:11px;color:#999">
    Le Grill Dufour · Rue des Courtils 1B · 7700 Mouscron<br>
    <a href="${restaurant.phoneHref}" style="color:#999">${restaurant.phoneDisplay}</a>
  </div>
</div>`;
}

function buttonHtml(text: string, url: string, bg: string = BORDEAUX) {
  return `<div style="text-align:center;margin:20px 0">
  <a href="${url}" style="display:inline-block;background:${bg};color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px">${text}</a>
</div>`;
}

export interface EmailResult {
  ok: boolean;
  error?: string;
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Email skipped: RESEND_API_KEY not configured");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const body: Record<string, unknown> = {
      from: getFrom(),
      to: params.to,
      subject: params.subject,
      html: params.html,
    };
    if (params.text) body.text = params.text;
    if (params.replyTo) body.reply_to = params.replyTo;

    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(`Email to ${params.to} failed (${res.status}):`, errBody);
      return { ok: false, error: `HTTP ${res.status}: ${errBody.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Email send error:", msg);
    return { ok: false, error: msg };
  }
}

// ── Email A : confirmation de commande (Version A — chaleureuse) ──

export interface OrderItemEmail {
  name: string;
  quantity: number;
  variant_label?: string | null;
  total_price: number;
  doneness_label?: string | null;
  supplements?: { label: string; price: number }[];
  notes?: string | null;
}

export interface OrderEmailParams {
  to: string;
  orderNumber: string;
  customerName: string;
  mode: string;
  paymentMethod: string;
  items: OrderItemEmail[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  discountPercentage?: number;
  total: number;
  deliveryAddress?: string;
  houseNumber?: string;
  deliveryPostal?: string;
  deliveryCity?: string;
  deliveryMinTime?: number;
  deliveryMaxTime?: number;
  trackingUrl?: string;
  locale?: "fr" | "nl";
}

const EMAIL_STRINGS = {
  fr: {
    subject: (n: string) => `Commande ${n} bien reçue`,
    title: "Merci pour votre commande !",
    intro: (name: string) => `${name}, notre équipe s'active en cuisine pour vous préparer tout ça.`,
    orderLabel: "Commande",
    note: "Remarque",
    discountLabel: (pct: number) => `Remise livraison (${pct} %)`,
    deliveryFeeLabel: "Frais de livraison",
    totalLabel: "Total",
    paidOnline: "Paiement en ligne effectué.",
    payAtDelivery: (method: string) => `Paiement à la livraison (${method}).`,
    paymentOnline: "Payé en ligne",
    paymentCash: "Espèces",
    paymentCard: "Carte / Bancontact",
    addressLabel: "Adresse de livraison",
    deliveryDelay: (min: number, max: string) =>
      `Livraison entre <strong>${min} minutes</strong> et <strong>${max}</strong>, selon l'affluence et votre lieu de résidence.`,
    deliveryDelayText: (min: number, max: string) =>
      `Livraison entre ${min} minutes et ${max}, selon l'affluence.`,
    maxTimeLabel: (m: number) => m === 60 ? "1 heure" : `${m} minutes`,
    trackBtn: "Suivre ma commande",
    errorNote: "Une erreur dans votre commande ? Appelez-nous tout de suite au",
    closing: "À tout de suite,",
    errorText: "Une erreur ? Appelez-nous au",
  },
  nl: {
    subject: (n: string) => `Bestelling ${n} goed ontvangen`,
    title: "Bedankt voor uw bestelling!",
    intro: (name: string) => `${name}, ons team is druk bezig in de keuken om alles voor u klaar te maken.`,
    orderLabel: "Bestelling",
    note: "Opmerking",
    discountLabel: (pct: number) => `Leveringskorting (${pct} %)`,
    deliveryFeeLabel: "Leveringskosten",
    totalLabel: "Totaal",
    paidOnline: "Online betaling uitgevoerd.",
    payAtDelivery: (method: string) => `Betaling bij levering (${method}).`,
    paymentOnline: "Online betaald",
    paymentCash: "Contant",
    paymentCard: "Kaart / Bancontact",
    addressLabel: "Leveringsadres",
    deliveryDelay: (min: number, max: string) =>
      `Levering tussen <strong>${min} minuten</strong> en <strong>${max}</strong>, afhankelijk van de drukte en uw locatie.`,
    deliveryDelayText: (min: number, max: string) =>
      `Levering tussen ${min} minuten en ${max}, afhankelijk van de drukte.`,
    maxTimeLabel: (m: number) => m === 60 ? "1 uur" : `${m} minuten`,
    trackBtn: "Mijn bestelling volgen",
    errorNote: "Een fout in uw bestelling? Bel ons onmiddellijk op",
    closing: "Tot zo!",
    errorText: "Een fout? Bel ons op",
  },
} as const;

export async function sendOrderConfirmationEmail(params: OrderEmailParams): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not configured" };

  const s = EMAIL_STRINGS[params.locale || "fr"];
  const firstName = escapeHtml(params.customerName.split(" ")[0]);
  const paymentLabel = params.paymentMethod === "online" ? s.paymentOnline : params.paymentMethod === "cash" ? s.paymentCash : s.paymentCard;

  const itemsHtml = params.items
    .map((item) => {
      let row = `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px">
          ${item.quantity}x ${escapeHtml(item.name)}${item.variant_label ? ` <span style="color:#666">(${escapeHtml(item.variant_label)})</span>` : ""}${item.doneness_label ? ` — <em>${escapeHtml(item.doneness_label)}</em>` : ""}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-size:14px;white-space:nowrap">${item.total_price.toFixed(2)} €</td>
      </tr>`;

      if (item.supplements && item.supplements.length > 0) {
        for (const sup of item.supplements) {
          row += `<tr>
            <td style="padding:2px 0 2px 20px;font-size:13px;color:#666;border-bottom:none">· ${escapeHtml(sup.label)}</td>
            <td style="padding:2px 0;text-align:right;font-size:13px;color:#666;border-bottom:none">${sup.price > 0 ? `+${sup.price.toFixed(2)} €` : ""}</td>
          </tr>`;
        }
      }

      if (item.notes) {
        row += `<tr>
          <td colspan="2" style="padding:2px 0 6px 20px;font-size:12px;color:#888;font-style:italic;border-bottom:1px solid #eee">${s.note} : ${escapeHtml(item.notes)}</td>
        </tr>`;
      }

      return row;
    })
    .join("");

  const minTime = params.deliveryMinTime ?? 20;
  const maxTime = params.deliveryMaxTime ?? 60;
  const maxLabel = s.maxTimeLabel(maxTime);

  const fullAddress = escapeHtml([
    params.deliveryAddress,
    params.houseNumber,
    params.deliveryPostal,
    params.deliveryCity,
  ].filter(Boolean).join(", "));

  const discountPct = params.discountPercentage ?? 10;

  const content = `
    <h2 style="margin:0 0 4px;font-size:18px;color:${BORDEAUX}">${s.title}</h2>
    <p style="margin:0 0 16px;color:#555">
      ${s.intro(firstName)}
    </p>

    <div style="background:${CREME};padding:12px 14px;border-radius:6px;font-size:15px;color:#555;margin:0 0 16px;text-align:center">
      ${s.orderLabel} <strong style="color:${BORDEAUX};font-size:17px">${params.orderNumber}</strong>
    </div>

    <table style="width:100%;border-collapse:collapse;margin:0 0 8px">
      ${itemsHtml}
      ${params.discountAmount > 0 ? `<tr><td style="padding:8px 0;font-size:14px;color:#22863a">${s.discountLabel(discountPct)}</td><td style="padding:8px 0;text-align:right;font-size:14px;color:#22863a">−${params.discountAmount.toFixed(2)} €</td></tr>` : ""}
      ${params.deliveryFee > 0 ? `<tr><td style="padding:8px 0;font-size:14px;color:#888">${s.deliveryFeeLabel}</td><td style="padding:8px 0;text-align:right;font-size:14px;color:#888">${params.deliveryFee.toFixed(2)} €</td></tr>` : ""}
      <tr>
        <td style="padding:10px 0;font-weight:bold;font-size:16px;border-top:2px solid #eee">${s.totalLabel}</td>
        <td style="padding:10px 0;font-weight:bold;font-size:16px;text-align:right;color:${BORDEAUX};border-top:2px solid #eee">${params.total.toFixed(2)} €</td>
      </tr>
    </table>

    <p style="background:#FEF3C7;padding:10px 14px;border-radius:6px;font-size:13px;color:#92400E;margin:0 0 12px">
      ${params.paymentMethod === "online" ? s.paidOnline : s.payAtDelivery(paymentLabel)}
    </p>

    ${params.mode === "delivery" ? `
    <div style="background:#EFF6FF;padding:12px 14px;border-radius:6px;font-size:13px;color:#1E40AF;margin:0 0 12px">
      <strong>${s.addressLabel}</strong><br>
      ${fullAddress}
    </div>
    <div style="background:${CREME};padding:12px 14px;border-radius:6px;font-size:13px;color:#555;margin:0 0 12px">
      ${s.deliveryDelay(minTime, maxLabel)}
    </div>
    ` : ""}

    ${params.trackingUrl ? buttonHtml(s.trackBtn, params.trackingUrl) : ""}

    <p style="font-size:13px;color:#555;margin:16px 0 0">
      ${s.errorNote}
      <a href="${restaurant.phoneHref}" style="color:${BORDEAUX};font-weight:bold">${restaurant.phoneDisplay}</a>.
    </p>

    <p style="font-size:14px;color:#555;margin:20px 0 0">
      ${s.closing}<br>
      <strong>Le Grill Dufour</strong><br>
      <span style="color:#888">Loïc et Christopher</span>
    </p>
  `;

  const textVersion = `${s.title} ${firstName} !

${s.orderLabel} ${params.orderNumber}

${params.items.map((item) => {
  let line = `${item.quantity}x ${item.name}${item.variant_label ? ` (${item.variant_label})` : ""}${item.doneness_label ? ` — ${item.doneness_label}` : ""} : ${item.total_price.toFixed(2)} €`;
  if (item.supplements?.length) {
    line += "\n" + item.supplements.map((sup) => `  · ${sup.label}${sup.price > 0 ? ` (+${sup.price.toFixed(2)} €)` : ""}`).join("\n");
  }
  if (item.notes) line += `\n  ${s.note} : ${item.notes}`;
  return line;
}).join("\n")}

${params.discountAmount > 0 ? `${s.discountLabel(discountPct)} : -${params.discountAmount.toFixed(2)} €\n` : ""}${params.deliveryFee > 0 ? `${s.deliveryFeeLabel} : ${params.deliveryFee.toFixed(2)} €\n` : ""}${s.totalLabel} : ${params.total.toFixed(2)} €

${params.paymentMethod === "online" ? s.paidOnline : s.payAtDelivery(paymentLabel)}
${params.mode === "delivery" ? `\n${s.addressLabel} : ${fullAddress}\n${s.deliveryDelayText(minTime, maxLabel)}\n` : ""}
${params.trackingUrl ? `${s.trackBtn} : ${params.trackingUrl}\n` : ""}
${s.errorText} ${restaurant.phoneDisplay}.

${s.closing}
Le Grill Dufour — Loïc et Christopher`;

  return sendEmail({
    to: params.to,
    subject: s.subject(params.orderNumber),
    html: emailShell(content),
    text: textVersion,
    replyTo: getReplyTo(),
  });
}

// ── Email B : demande de retour après livraison (Version B — sobre) ──

export interface FeedbackEmailParams {
  to: string;
  customerName: string;
  orderNumber: string;
  feedbackUrl: string;
  googleReviewUrl: string;
  unsubscribeUrl: string;
  locale?: "fr" | "nl";
}

const FEEDBACK_STRINGS = {
  fr: {
    subject: (n: string) => `Votre avis sur la commande ${n}`,
    title: "Comment s'est passée votre commande ?",
    intro: (name: string) => `${name}, nous débutons la livraison et chaque retour compte. Cela prend moins d'une minute, et votre réponse n'est lue que par le restaurant.`,
    feedbackBtn: "Donnez-nous votre avis en privé",
    preferCall: "Vous préférez en parler de vive voix ?",
    callUs: "Appelez-nous au",
    googleNote: "Vous pouvez également laisser un avis sur Google.",
    googleBtn: "Laisser un avis Google",
    closing: "Bonne soirée,",
    orderRef: "Commande",
    dataNote: "Données conservées 12 mois · Jamais transmises à des tiers.",
    unsubscribe: "Se désinscrire",
    textIntro: (name: string) => `${name}, nous débutons la livraison et chaque retour compte. Cela prend moins d'une minute, et votre réponse n'est lue que par le restaurant.`,
    textCallUs: "Ou appelez-nous au",
    textDataNote: "Données conservées 12 mois.",
  },
  nl: {
    subject: (n: string) => `Uw mening over bestelling ${n}`,
    title: "Hoe was uw bestelling?",
    intro: (name: string) => `${name}, wij zijn net begonnen met de levering en elke reactie telt. Het duurt minder dan een minuut en uw antwoord wordt alleen door het restaurant gelezen.`,
    feedbackBtn: "Geef ons uw mening (privé)",
    preferCall: "Liever persoonlijk vertellen?",
    callUs: "Bel ons op",
    googleNote: "U kunt ook een beoordeling achterlaten op Google.",
    googleBtn: "Google-beoordeling achterlaten",
    closing: "Prettige avond,",
    orderRef: "Bestelling",
    dataNote: "Gegevens bewaard gedurende 12 maanden · Nooit gedeeld met derden.",
    unsubscribe: "Uitschrijven",
    textIntro: (name: string) => `${name}, wij zijn net begonnen met de levering en elke reactie telt. Het duurt minder dan een minuut en uw antwoord wordt alleen door het restaurant gelezen.`,
    textCallUs: "Of bel ons op",
    textDataNote: "Gegevens bewaard gedurende 12 maanden.",
  },
} as const;

export async function sendFeedbackRequestEmail(params: FeedbackEmailParams): Promise<EmailResult> {
  const f = FEEDBACK_STRINGS[params.locale || "fr"];
  const firstName = escapeHtml(params.customerName.split(" ")[0]);

  const content = `
    <h2 style="margin:0 0 4px;font-size:18px;color:${BORDEAUX}">${f.title}</h2>
    <p style="margin:0 0 16px;color:#555">
      ${f.intro(firstName)}
    </p>

    ${buttonHtml(f.feedbackBtn, params.feedbackUrl)}

    <p style="font-size:13px;color:#555;text-align:center;margin:0 0 24px">
      ${f.preferCall}<br>
      ${f.callUs} <a href="${restaurant.phoneHref}" style="color:${BORDEAUX};font-weight:bold">${restaurant.phoneDisplay}</a>.
    </p>

    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">

    <p style="font-size:13px;color:#888;text-align:center;margin:0 0 4px">
      ${f.googleNote}
    </p>

    ${buttonHtml(f.googleBtn, params.googleReviewUrl, "#4285F4")}

    <p style="font-size:14px;color:#555;margin:24px 0 0">
      ${f.closing}<br>
      <strong>Le Grill Dufour</strong><br>
      <span style="color:#888">Loïc et Christopher</span>
    </p>

    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">

    <p style="font-size:11px;color:#aaa;text-align:center">
      ${f.orderRef} ${params.orderNumber} · ${f.dataNote}<br>
      <a href="${params.unsubscribeUrl}" style="color:#aaa">${f.unsubscribe}</a>
    </p>
  `;

  const textVersion = `${f.title}

${f.textIntro(firstName)}

${f.feedbackBtn} : ${params.feedbackUrl}

${f.textCallUs} ${restaurant.phoneDisplay}.

---

${f.googleNote} ${params.googleReviewUrl}

${f.closing}
Le Grill Dufour — Loïc et Christopher

${f.orderRef} ${params.orderNumber} · ${f.textDataNote}
${f.unsubscribe} : ${params.unsubscribeUrl}`;

  return sendEmail({
    to: params.to,
    subject: f.subject(params.orderNumber),
    html: emailShell(content),
    text: textVersion,
    replyTo: getReplyTo(),
  });
}

// ── Email C : notification retour client au restaurant ──

export interface FeedbackNotifParams {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  rating: number;
  isComplete: boolean | null;
  isHot: boolean | null;
  isOnTime: boolean | null;
  comment: string;
  deliveryAddress?: string;
  orderId: string;
}

export async function sendFeedbackNotifToRestaurant(params: FeedbackNotifParams): Promise<EmailResult> {
  const to = getRestaurantNotifEmail();
  const stars = "★".repeat(params.rating) + "☆".repeat(5 - params.rating);
  const isPriority = params.rating <= 2;

  const yesNo = (v: boolean | null) => v === true ? "Oui" : v === false ? "Non" : "—";

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  const orderLink = `${baseUrl}/admin`;

  const content = `
    ${isPriority ? `<div style="background:#FEE2E2;border:2px solid #EF4444;padding:12px 14px;border-radius:6px;margin:0 0 16px;text-align:center">
      <strong style="color:#DC2626;font-size:15px">Retour prioritaire — client à rappeler</strong>
    </div>` : ""}

    <h2 style="margin:0 0 4px;font-size:18px;color:${BORDEAUX}">Nouveau retour client</h2>
    <p style="margin:0 0 16px;color:#555">
      <strong>${escapeHtml(params.customerName)}</strong> · <a href="tel:${escapeHtml(params.customerPhone)}" style="color:${BORDEAUX}">${escapeHtml(params.customerPhone)}</a>
    </p>

    <div style="background:${CREME};padding:14px;border-radius:6px;margin:0 0 16px">
      <div style="font-size:22px;text-align:center;margin:0 0 8px">${stars} <span style="color:#555;font-size:14px">(${params.rating}/5)</span></div>

      <table style="width:100%;font-size:14px;color:#555">
        <tr><td style="padding:4px 0">Commande complète ?</td><td style="padding:4px 0;text-align:right;font-weight:bold">${yesNo(params.isComplete)}</td></tr>
        <tr><td style="padding:4px 0">Plats encore chauds ?</td><td style="padding:4px 0;text-align:right;font-weight:bold">${yesNo(params.isHot)}</td></tr>
        <tr><td style="padding:4px 0">Délai correct ?</td><td style="padding:4px 0;text-align:right;font-weight:bold">${yesNo(params.isOnTime)}</td></tr>
      </table>
    </div>

    ${params.comment ? `<div style="background:#fff;border:1px solid #eee;padding:12px 14px;border-radius:6px;margin:0 0 16px;font-size:14px;color:#333;white-space:pre-wrap">${escapeHtml(params.comment)}</div>` : `<p style="color:#888;font-size:13px;font-style:italic">Pas de commentaire.</p>`}

    <p style="font-size:13px;color:#888">
      Commande ${escapeHtml(params.orderNumber)}${params.deliveryAddress ? ` · ${escapeHtml(params.deliveryAddress)}` : ""}
    </p>

    ${buttonHtml("Voir dans le back-office", orderLink)}
  `;

  const textVersion = `${isPriority ? "⚠️ RETOUR PRIORITAIRE — CLIENT À RAPPELER\n\n" : ""}Nouveau retour client

${params.customerName} · ${params.customerPhone}
${stars} (${params.rating}/5)

Commande complète ? ${yesNo(params.isComplete)}
Plats encore chauds ? ${yesNo(params.isHot)}
Délai correct ? ${yesNo(params.isOnTime)}

${params.comment || "(pas de commentaire)"}

Commande ${params.orderNumber}${params.deliveryAddress ? ` · ${params.deliveryAddress}` : ""}`;

  const subject = isPriority
    ? `⚠️ Retour prioritaire (${params.rating}/5) — ${params.orderNumber}`
    : `Retour client (${params.rating}/5) — ${params.orderNumber}`;

  return sendEmail({
    to,
    subject,
    html: emailShell(content),
    text: textVersion,
  });
}
