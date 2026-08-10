const TELEGRAM_API = "https://api.telegram.org";

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
  items: { name: string; quantity: number; variant_label?: string | null }[];
}) {
  const mode = order.mode === "delivery" ? "Livraison" : "À emporter";
  const payment =
    order.payment_method === "cash"
      ? "Espèces"
      : order.payment_method === "online"
        ? "En ligne"
        : "Carte";

  let msg = `🔔 <b>Nouvelle commande ${order.order_number}</b>\n\n`;
  msg += `📋 <b>${mode}</b> · ${payment}\n`;
  msg += `👤 ${order.customer_name} — ${order.customer_phone}\n`;

  if (order.mode === "delivery" && order.delivery_address) {
    msg += `📍 ${order.delivery_address}, ${order.delivery_city}\n`;
  }

  msg += `\n<b>Articles :</b>\n`;
  for (const item of order.items) {
    msg += `  ${item.quantity}x ${item.name}`;
    if (item.variant_label) msg += ` (${item.variant_label})`;
    msg += `\n`;
  }

  msg += `\n💰 <b>Total : ${order.total.toFixed(2)} €</b>`;

  if (order.notes) {
    msg += `\n\n📝 ${order.notes}`;
  }

  return msg;
}
