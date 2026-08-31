import { restaurant } from "@/data/restaurantData";

export async function sendOrderConfirmationEmail(params: {
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
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const modeLabel = params.mode === "delivery" ? "Livraison" : "À emporter";
  const paymentLabel = params.paymentMethod === "cash" ? "Espèces" : "Carte / Bancontact";

  const itemsHtml = params.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:6px 0;border-bottom:1px solid #eee">${item.quantity}x ${item.name}${item.variant_label ? ` (${item.variant_label})` : ""}${item.doneness_label ? ` — Cuisson : ${item.doneness_label}` : ""}</td>
          <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${item.total_price.toFixed(2)} €</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="max-width:500px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#8C2434;padding:20px;text-align:center">
        <h1 style="color:#FBF8F4;margin:0;font-size:20px">Grill Dufour</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="margin:0 0 8px;font-size:18px">Commande confirmée</h2>
        <p style="color:#666;margin:0 0 20px">Merci ${params.customerName} ! Votre commande <strong>${params.orderNumber}</strong> a été reçue.</p>

        <p style="background:#FBF8F4;padding:8px 12px;border-radius:6px;font-size:14px;color:#666">
          📋 ${modeLabel} · ${paymentLabel}
        </p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
          ${itemsHtml}
          ${params.discountAmount > 0 ? `<tr><td style="padding:6px 0;color:#22863a">Remise livraison</td><td style="padding:6px 0;text-align:right;color:#22863a">−${params.discountAmount.toFixed(2)} €</td></tr>` : ""}
          ${params.deliveryFee > 0 ? `<tr><td style="padding:6px 0;color:#999">Livraison</td><td style="padding:6px 0;text-align:right;color:#999">${params.deliveryFee.toFixed(2)} €</td></tr>` : ""}
          <tr>
            <td style="padding:10px 0;font-weight:bold;font-size:16px">Total</td>
            <td style="padding:10px 0;font-weight:bold;font-size:16px;text-align:right;color:#8C2434">${params.total.toFixed(2)} €</td>
          </tr>
        </table>

        <p style="background:#FEF3C7;padding:10px 12px;border-radius:6px;font-size:13px;color:#92400E;margin:16px 0">
          💳 Le paiement se fait à la ${params.mode === "delivery" ? "livraison" : "récupération"}
          (${paymentLabel}).
        </p>

        <p style="font-size:13px;color:#999;margin:20px 0 0">
          Pour toute question : <a href="${restaurant.phoneHref}">${restaurant.phone}</a>
        </p>
      </div>
      <div style="background:#f5f5f5;padding:12px;text-align:center;font-size:11px;color:#999">
        Grill Dufour · Rue des Courtils 1B · 7700 Mouscron
      </div>
    </div>
  `;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Grill Dufour <noreply@legrilldufour.be>",
        to: params.to,
        subject: `Commande ${params.orderNumber} confirmée — Grill Dufour`,
        html,
      }),
    });
  } catch (err) {
    console.error("Email send error:", err);
  }
}
