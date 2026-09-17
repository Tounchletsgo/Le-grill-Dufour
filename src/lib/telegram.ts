const TELEGRAM_API = "https://api.telegram.org";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendTelegramNotification(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  try {
    await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    console.error("Telegram notification error:", err);
  }
}

export function formatOrderTelegram(order: {
  order_number: string;
  mode: string;
  customer_name: string;
  customer_phone: string;
  delivery_address?: string | null;
  delivery_city?: string | null;
  total: number;
  payment_method: string;
  notes?: string | null;
  items: { name: string; quantity: number; variant_label?: string | null; doneness_label?: string | null }[];
  discount_amount?: number;
}) {
  const mode = order.mode === "delivery" ? "Livraison" : "À emporter";
  const payment = order.payment_method === "online" ? "Payé en ligne" : order.payment_method === "cash" ? "Espèces" : "Carte / Bancontact";

  const name = escapeHtml(order.customer_name);
  const phone = escapeHtml(order.customer_phone);

  let msg = `🔔 <b>Nouvelle commande ${escapeHtml(order.order_number)}</b>\n\n`;
  msg += `📋 <b>${mode}</b> · ${payment}\n`;
  msg += `👤 ${name} — ${phone}\n`;

  if (order.mode === "delivery" && order.delivery_address) {
    msg += `📍 ${escapeHtml(order.delivery_address)}, ${escapeHtml(order.delivery_city || "")}\n`;
  }

  msg += `\n<b>Articles :</b>\n`;
  for (const item of order.items) {
    msg += `  ${item.quantity}x ${escapeHtml(item.name)}`;
    if (item.variant_label) msg += ` (${escapeHtml(item.variant_label)})`;
    if (item.doneness_label) msg += ` 🔥 ${escapeHtml(item.doneness_label)}`;
    msg += `\n`;
  }

  if (order.discount_amount && order.discount_amount > 0) {
    msg += `\n🏷️ Remise livraison : -${order.discount_amount.toFixed(2)} €`;
  }

  msg += `\n💰 <b>Total : ${order.total.toFixed(2)} €</b>`;

  if (order.notes) {
    msg += `\n\n📝 ${escapeHtml(order.notes)}`;
  }

  return msg;
}
