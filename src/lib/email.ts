import { restaurant } from "@/data/restaurantData";

const RESEND_URL = "https://api.resend.com/emails";
const BORDEAUX = "#8C2434";
const CREME = "#FBF8F4";

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

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

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
    return res.ok;
  } catch (err) {
    console.error("Email send error:", err);
    return false;
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
}

export async function sendOrderConfirmationEmail(params: OrderEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const firstName = params.customerName.split(" ")[0];
  const paymentLabel = params.paymentMethod === "cash" ? "Espèces" : "Carte / Bancontact";

  const itemsHtml = params.items
    .map((item) => {
      let row = `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px">
          ${item.quantity}x ${item.name}${item.variant_label ? ` <span style="color:#666">(${item.variant_label})</span>` : ""}${item.doneness_label ? ` — <em>${item.doneness_label}</em>` : ""}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-size:14px;white-space:nowrap">${item.total_price.toFixed(2)} €</td>
      </tr>`;

      if (item.supplements && item.supplements.length > 0) {
        for (const sup of item.supplements) {
          row += `<tr>
            <td style="padding:2px 0 2px 20px;font-size:13px;color:#666;border-bottom:none">· ${sup.label}</td>
            <td style="padding:2px 0;text-align:right;font-size:13px;color:#666;border-bottom:none">${sup.price > 0 ? `+${sup.price.toFixed(2)} €` : ""}</td>
          </tr>`;
        }
      }

      if (item.notes) {
        row += `<tr>
          <td colspan="2" style="padding:2px 0 6px 20px;font-size:12px;color:#888;font-style:italic;border-bottom:1px solid #eee">Remarque : ${item.notes}</td>
        </tr>`;
      }

      return row;
    })
    .join("");

  const minTime = params.deliveryMinTime ?? 20;
  const maxTime = params.deliveryMaxTime ?? 60;
  const maxLabel = maxTime === 60 ? "1 heure" : `${maxTime} minutes`;

  const fullAddress = [
    params.deliveryAddress,
    params.houseNumber,
    params.deliveryPostal,
    params.deliveryCity,
  ].filter(Boolean).join(", ");

  const discountPct = params.discountPercentage ?? 10;

  const content = `
    <h2 style="margin:0 0 4px;font-size:18px;color:${BORDEAUX}">Merci pour votre commande !</h2>
    <p style="margin:0 0 16px;color:#555">
      ${firstName}, notre équipe s'active en cuisine pour vous préparer tout ça.
    </p>

    <div style="background:${CREME};padding:12px 14px;border-radius:6px;font-size:15px;color:#555;margin:0 0 16px;text-align:center">
      Commande <strong style="color:${BORDEAUX};font-size:17px">${params.orderNumber}</strong>
    </div>

    <table style="width:100%;border-collapse:collapse;margin:0 0 8px">
      ${itemsHtml}
      ${params.discountAmount > 0 ? `<tr><td style="padding:8px 0;font-size:14px;color:#22863a">Remise livraison (${discountPct} %)</td><td style="padding:8px 0;text-align:right;font-size:14px;color:#22863a">−${params.discountAmount.toFixed(2)} €</td></tr>` : ""}
      ${params.deliveryFee > 0 ? `<tr><td style="padding:8px 0;font-size:14px;color:#888">Frais de livraison</td><td style="padding:8px 0;text-align:right;font-size:14px;color:#888">${params.deliveryFee.toFixed(2)} €</td></tr>` : ""}
      <tr>
        <td style="padding:10px 0;font-weight:bold;font-size:16px;border-top:2px solid #eee">Total</td>
        <td style="padding:10px 0;font-weight:bold;font-size:16px;text-align:right;color:${BORDEAUX};border-top:2px solid #eee">${params.total.toFixed(2)} €</td>
      </tr>
    </table>

    <p style="background:#FEF3C7;padding:10px 14px;border-radius:6px;font-size:13px;color:#92400E;margin:0 0 12px">
      Paiement à la livraison (${paymentLabel}).
    </p>

    ${params.mode === "delivery" ? `
    <div style="background:#EFF6FF;padding:12px 14px;border-radius:6px;font-size:13px;color:#1E40AF;margin:0 0 12px">
      <strong>Adresse de livraison</strong><br>
      ${fullAddress}
    </div>
    <div style="background:${CREME};padding:12px 14px;border-radius:6px;font-size:13px;color:#555;margin:0 0 12px">
      Livraison entre <strong>${minTime} minutes</strong> et <strong>${maxLabel}</strong>, selon l'affluence et votre lieu de résidence.
    </div>
    ` : ""}

    ${params.trackingUrl ? buttonHtml("Suivre ma commande", params.trackingUrl) : ""}

    <p style="font-size:13px;color:#555;margin:16px 0 0">
      Une erreur dans votre commande ? Appelez-nous tout de suite au
      <a href="${restaurant.phoneHref}" style="color:${BORDEAUX};font-weight:bold">${restaurant.phoneDisplay}</a>.
    </p>

    <p style="font-size:14px;color:#555;margin:20px 0 0">
      À tout de suite,<br>
      <strong>Le Grill Dufour</strong><br>
      <span style="color:#888">Loïc et Christopher</span>
    </p>
  `;

  const textVersion = `Merci pour votre commande, ${firstName} !

Commande ${params.orderNumber}

${params.items.map((item) => {
  let line = `${item.quantity}x ${item.name}${item.variant_label ? ` (${item.variant_label})` : ""}${item.doneness_label ? ` — ${item.doneness_label}` : ""} : ${item.total_price.toFixed(2)} €`;
  if (item.supplements?.length) {
    line += "\n" + item.supplements.map((s) => `  · ${s.label}${s.price > 0 ? ` (+${s.price.toFixed(2)} €)` : ""}`).join("\n");
  }
  if (item.notes) line += `\n  Remarque : ${item.notes}`;
  return line;
}).join("\n")}

${params.discountAmount > 0 ? `Remise livraison (${discountPct} %) : -${params.discountAmount.toFixed(2)} €\n` : ""}${params.deliveryFee > 0 ? `Frais de livraison : ${params.deliveryFee.toFixed(2)} €\n` : ""}Total : ${params.total.toFixed(2)} €

Paiement à la livraison (${paymentLabel}).
${params.mode === "delivery" ? `\nAdresse de livraison : ${fullAddress}\nLivraison entre ${minTime} minutes et ${maxLabel}, selon l'affluence.\n` : ""}
${params.trackingUrl ? `Suivre ma commande : ${params.trackingUrl}\n` : ""}
Une erreur ? Appelez-nous au ${restaurant.phoneDisplay}.

À tout de suite,
Le Grill Dufour — Loïc et Christopher`;

  return sendEmail({
    to: params.to,
    subject: `Commande ${params.orderNumber} bien reçue`,
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
}

export async function sendFeedbackRequestEmail(params: FeedbackEmailParams) {
  const firstName = params.customerName.split(" ")[0];

  const content = `
    <h2 style="margin:0 0 4px;font-size:18px;color:${BORDEAUX}">Comment s'est passée votre commande ?</h2>
    <p style="margin:0 0 16px;color:#555">
      ${firstName}, nous débutons la livraison et chaque retour compte. Cela prend moins d'une minute, et votre réponse n'est lue que par le restaurant.
    </p>

    ${buttonHtml("Donnez-nous votre avis en privé", params.feedbackUrl)}

    <p style="font-size:13px;color:#555;text-align:center;margin:0 0 24px">
      Vous préférez en parler de vive voix ?<br>
      Appelez-nous au <a href="${restaurant.phoneHref}" style="color:${BORDEAUX};font-weight:bold">${restaurant.phoneDisplay}</a>.
    </p>

    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">

    <p style="font-size:13px;color:#888;text-align:center;margin:0 0 4px">
      Vous pouvez également laisser un avis sur Google.
    </p>

    ${buttonHtml("Laisser un avis Google", params.googleReviewUrl, "#4285F4")}

    <p style="font-size:14px;color:#555;margin:24px 0 0">
      Bonne soirée,<br>
      <strong>Le Grill Dufour</strong><br>
      <span style="color:#888">Loïc et Christopher</span>
    </p>

    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">

    <p style="font-size:11px;color:#aaa;text-align:center">
      Commande ${params.orderNumber} · Données conservées 12 mois · Jamais transmises à des tiers.<br>
      <a href="${params.unsubscribeUrl}" style="color:#aaa">Se désinscrire</a>
    </p>
  `;

  const textVersion = `Comment s'est passée votre commande ?

${firstName}, nous débutons la livraison et chaque retour compte. Cela prend moins d'une minute, et votre réponse n'est lue que par le restaurant.

Donnez-nous votre avis : ${params.feedbackUrl}

Ou appelez-nous au ${restaurant.phoneDisplay}.

---

Vous pouvez également laisser un avis sur Google : ${params.googleReviewUrl}

Bonne soirée,
Le Grill Dufour — Loïc et Christopher

Commande ${params.orderNumber} · Données conservées 12 mois.
Se désinscrire : ${params.unsubscribeUrl}`;

  return sendEmail({
    to: params.to,
    subject: `Votre avis sur la commande ${params.orderNumber}`,
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

export async function sendFeedbackNotifToRestaurant(params: FeedbackNotifParams) {
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
      <strong>${params.customerName}</strong> · <a href="tel:${params.customerPhone}" style="color:${BORDEAUX}">${params.customerPhone}</a>
    </p>

    <div style="background:${CREME};padding:14px;border-radius:6px;margin:0 0 16px">
      <div style="font-size:22px;text-align:center;margin:0 0 8px">${stars} <span style="color:#555;font-size:14px">(${params.rating}/5)</span></div>

      <table style="width:100%;font-size:14px;color:#555">
        <tr><td style="padding:4px 0">Commande complète ?</td><td style="padding:4px 0;text-align:right;font-weight:bold">${yesNo(params.isComplete)}</td></tr>
        <tr><td style="padding:4px 0">Plats encore chauds ?</td><td style="padding:4px 0;text-align:right;font-weight:bold">${yesNo(params.isHot)}</td></tr>
        <tr><td style="padding:4px 0">Délai correct ?</td><td style="padding:4px 0;text-align:right;font-weight:bold">${yesNo(params.isOnTime)}</td></tr>
      </table>
    </div>

    ${params.comment ? `<div style="background:#fff;border:1px solid #eee;padding:12px 14px;border-radius:6px;margin:0 0 16px;font-size:14px;color:#333;white-space:pre-wrap">${params.comment}</div>` : `<p style="color:#888;font-size:13px;font-style:italic">Pas de commentaire.</p>`}

    <p style="font-size:13px;color:#888">
      Commande ${params.orderNumber}${params.deliveryAddress ? ` · ${params.deliveryAddress}` : ""}
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
