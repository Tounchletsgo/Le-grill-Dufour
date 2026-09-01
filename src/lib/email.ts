import { restaurant } from "@/data/restaurantData";

const RESEND_URL = "https://api.resend.com/emails";
const FROM = "Grill Dufour <noreply@legrilldufour.be>";
const BORDEAUX = "#8C2434";
const CREME = "#FBF8F4";

function emailShell(content: string) {
  return `<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#333;line-height:1.5">
  <div style="background:${BORDEAUX};padding:20px;text-align:center">
    <h1 style="color:${CREME};margin:0;font-size:20px">Grill Dufour</h1>
  </div>
  <div style="padding:24px;background:#fff">
    ${content}
  </div>
  <div style="background:#f5f5f5;padding:14px;text-align:center;font-size:11px;color:#999">
    Grill Dufour · Rue des Courtils 1B · 7700 Mouscron
  </div>
</div>`;
}

function buttonHtml(text: string, url: string, bg: string = BORDEAUX) {
  return `<div style="text-align:center;margin:20px 0">
  <a href="${url}" style="display:inline-block;background:${bg};color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px">${text}</a>
</div>`;
}

// ── Email A : confirmation de commande ──

export interface OrderEmailParams {
  to: string;
  orderNumber: string;
  customerName: string;
  mode: string;
  paymentMethod: string;
  items: { name: string; quantity: number; variant_label?: string | null; total_price: number; doneness_label?: string | null }[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryMinTime?: number;
  deliveryMaxTime?: number;
  trackingUrl?: string;
}

export async function sendOrderConfirmationEmail(params: OrderEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const paymentLabel = params.paymentMethod === "cash" ? "Espèces" : "Carte / Bancontact";

  const itemsHtml = params.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px">${item.quantity}x ${item.name}${item.variant_label ? ` (${item.variant_label})` : ""}${item.doneness_label ? ` — ${item.doneness_label}` : ""}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-size:14px;white-space:nowrap">${item.total_price.toFixed(2)} €</td>
        </tr>`
    )
    .join("");

  const minTime = params.deliveryMinTime ?? 20;
  const maxTime = params.deliveryMaxTime ?? 60;
  const maxLabel = maxTime === 60 ? "1 heure" : `${maxTime} minutes`;

  const content = `
    <h2 style="margin:0 0 4px;font-size:18px;color:${BORDEAUX}">Merci pour votre commande !</h2>
    <p style="margin:0 0 16px;color:#555">Notre équipe s'en occupe en ce moment même.</p>

    <p style="background:${CREME};padding:10px 14px;border-radius:6px;font-size:14px;color:#555;margin:0 0 16px">
      Commande <strong>${params.orderNumber}</strong>
    </p>

    <table style="width:100%;border-collapse:collapse;margin:0 0 8px">
      ${itemsHtml}
      ${params.discountAmount > 0 ? `<tr><td style="padding:8px 0;font-size:14px;color:#22863a">Remise livraison</td><td style="padding:8px 0;text-align:right;font-size:14px;color:#22863a">−${params.discountAmount.toFixed(2)} €</td></tr>` : ""}
      ${params.deliveryFee > 0 ? `<tr><td style="padding:8px 0;font-size:14px;color:#888">Frais de livraison</td><td style="padding:8px 0;text-align:right;font-size:14px;color:#888">${params.deliveryFee.toFixed(2)} €</td></tr>` : ""}
      <tr>
        <td style="padding:10px 0;font-weight:bold;font-size:16px;border-top:2px solid #eee">Total</td>
        <td style="padding:10px 0;font-weight:bold;font-size:16px;text-align:right;color:${BORDEAUX};border-top:2px solid #eee">${params.total.toFixed(2)} €</td>
      </tr>
    </table>

    ${params.mode === "delivery" ? `
    <div style="background:#EFF6FF;padding:12px 14px;border-radius:6px;font-size:13px;color:#1E40AF;margin:0 0 12px">
      <strong>Adresse de livraison</strong><br>
      ${params.deliveryAddress || ""}${params.deliveryCity ? `, ${params.deliveryCity}` : ""}
    </div>
    <div style="background:${CREME};padding:12px 14px;border-radius:6px;font-size:13px;color:#555;margin:0 0 12px">
      Livraison estimée entre <strong>${minTime} minutes</strong> et <strong>${maxLabel}</strong>, selon l'affluence.
    </div>
    ` : ""}

    <p style="background:#FEF3C7;padding:10px 14px;border-radius:6px;font-size:13px;color:#92400E;margin:0 0 16px">
      Paiement à la ${params.mode === "delivery" ? "livraison" : "récupération"} (${paymentLabel}).
    </p>

    ${params.trackingUrl ? buttonHtml("Suivre ma commande", params.trackingUrl) : ""}

    <p style="font-size:13px;color:#888;margin:16px 0 0">
      Si vous avez la moindre question, appelez-nous au <a href="${restaurant.phoneHref}" style="color:${BORDEAUX}">${restaurant.phoneDisplay}</a>.
    </p>

    <p style="font-size:14px;color:#555;margin:20px 0 0">
      À tout de suite,<br>
      <strong>Le Grill Dufour</strong><br>
      <span style="color:#888">Loïc et Christopher</span>
    </p>
  `;

  const html = emailShell(content);

  try {
    await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: params.to,
        subject: `Votre commande ${params.orderNumber} est en route !`,
        html,
      }),
    });
  } catch (err) {
    console.error("Email send error:", err);
  }
}

// ── Email B : demande de retour après livraison ──

export interface FeedbackEmailParams {
  to: string;
  customerName: string;
  orderNumber: string;
  feedbackUrl: string;
  googleReviewUrl: string;
  unsubscribeUrl: string;
}

export async function sendFeedbackRequestEmail(params: FeedbackEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const content = `
    <h2 style="margin:0 0 4px;font-size:18px;color:${BORDEAUX}">Comment s'est passé votre repas ?</h2>
    <p style="margin:0 0 16px;color:#555">
      Nous espérons que vous vous êtes régalé(e) !
      Votre avis compte beaucoup pour nous : il nous aide à nous améliorer chaque jour.
    </p>

    ${buttonHtml("Nous donner votre avis", params.feedbackUrl)}

    <p style="font-size:12px;color:#888;text-align:center;margin:0 0 24px">
      Ce retour est confidentiel : il n'est lu que par le restaurant et ne sera publié nulle part.
    </p>

    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">

    <p style="font-size:14px;color:#555;text-align:center;margin:0 0 4px">
      Vous souhaitez partager votre expérience publiquement ?
    </p>

    ${buttonHtml("Laisser un avis Google", params.googleReviewUrl, "#4285F4")}

    <p style="font-size:14px;color:#555;margin:24px 0 0">
      Merci pour votre confiance,<br>
      <strong>Le Grill Dufour</strong><br>
      <span style="color:#888">Loïc et Christopher</span>
    </p>

    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">

    <p style="font-size:11px;color:#aaa;text-align:center">
      Cet e-mail vous a été envoyé suite à votre commande ${params.orderNumber}.
      Vos données sont utilisées uniquement pour le suivi de votre commande et ne seront jamais transmises à des tiers.
      Durée de conservation : 12 mois.<br>
      <a href="${params.unsubscribeUrl}" style="color:#aaa">Se désinscrire des e-mails de suivi</a>
    </p>
  `;

  const html = emailShell(content);

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: params.to,
        subject: `Comment s'est passé votre repas ?`,
        html,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Feedback email send error:", err);
    return false;
  }
}
