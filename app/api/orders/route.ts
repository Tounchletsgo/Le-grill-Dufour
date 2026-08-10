import { NextRequest, NextResponse } from "next/server";
import type { OrderMode, PaymentMethod } from "@/types/database";

interface OrderItemPayload {
  menuItemId: string;
  name: string;
  variantId?: string;
  variantLabel?: string;
  basePrice: number;
  quantity: number;
  supplements: { id: string; label: string; price: number }[];
}

interface OrderPayload {
  mode: OrderMode;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  deliveryPostal?: string;
  deliveryCity?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: OrderItemPayload[];
}

const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;
const POSTAL_RE = /^\d{4}$/;

function validateOrder(data: OrderPayload): string[] {
  const errors: string[] = [];

  if (!data.customerName?.trim()) errors.push("Nom requis.");
  if (!data.customerPhone?.trim() || !PHONE_RE.test(data.customerPhone.trim()))
    errors.push("Numéro de téléphone invalide.");

  if (!data.items?.length) errors.push("Le panier est vide.");

  if (!["delivery", "pickup"].includes(data.mode))
    errors.push("Mode de commande invalide.");

  if (!["cash", "card", "online"].includes(data.paymentMethod))
    errors.push("Moyen de paiement invalide.");

  if (data.mode === "delivery") {
    if (!data.deliveryAddress?.trim()) errors.push("Adresse requise pour la livraison.");
    if (!data.deliveryPostal?.trim() || !POSTAL_RE.test(data.deliveryPostal.trim()))
      errors.push("Code postal invalide (4 chiffres).");
    if (!data.deliveryCity?.trim()) errors.push("Ville requise.");
  }

  for (const item of data.items || []) {
    if (!item.name) errors.push("Article sans nom.");
    if (typeof item.basePrice !== "number" || item.basePrice < 0)
      errors.push(`Prix invalide pour ${item.name}.`);
    if (!item.quantity || item.quantity < 1)
      errors.push(`Quantité invalide pour ${item.name}.`);
  }

  const subtotal = (data.items || []).reduce((sum, item) => {
    const supTotal = (item.supplements || []).reduce((s, sup) => s + sup.price, 0);
    return sum + (item.basePrice + supTotal) * item.quantity;
  }, 0);

  const MIN_ORDER = 20;
  if (subtotal < MIN_ORDER)
    errors.push(`Minimum de commande : ${MIN_ORDER}€ (actuel : ${subtotal.toFixed(2)}€).`);

  return errors;
}

export async function POST(request: NextRequest) {
  try {
    const data: OrderPayload = await request.json();
    const errors = validateOrder(data);

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const subtotal = data.items.reduce((sum, item) => {
      const supTotal = (item.supplements || []).reduce((s, sup) => s + sup.price, 0);
      return sum + (item.basePrice + supTotal) * item.quantity;
    }, 0);

    const DELIVERY_FEE = 4;
    const FREE_FROM = 35;
    const deliveryFee =
      data.mode === "delivery" && subtotal < FREE_FROM ? DELIVERY_FEE : 0;
    const total = subtotal + deliveryFee;

    // If Supabase is configured, save to database
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { supabaseAdmin } = await import("@/lib/supabase-server");

      const orderRow = {
        status: "pending",
        mode: data.mode,
        customer_name: data.customerName.trim(),
        customer_phone: data.customerPhone.trim(),
        customer_email: data.customerEmail?.trim() || null,
        delivery_address: data.mode === "delivery" ? data.deliveryAddress!.trim() : null,
        delivery_postal: data.mode === "delivery" ? data.deliveryPostal!.trim() : null,
        delivery_city: data.mode === "delivery" ? data.deliveryCity!.trim() : null,
        payment_method: data.paymentMethod,
        payment_status: "pending",
        subtotal: parseFloat(subtotal.toFixed(2)),
        delivery_fee: deliveryFee,
        total: parseFloat(total.toFixed(2)),
        notes: data.notes?.trim() || null,
      };

      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert(orderRow as any)
        .select("id, order_number")
        .single();

      if (orderError) {
        console.error("Order insert error:", orderError);
        return NextResponse.json(
          { success: false, errors: ["Erreur lors de la création de la commande."] },
          { status: 500 }
        );
      }

      const orderItems = data.items.map((item) => {
        const supTotal = (item.supplements || []).reduce((s, sup) => s + sup.price, 0);
        const unitPrice = item.basePrice + supTotal;
        return {
          order_id: order.id,
          menu_item_id: item.menuItemId.startsWith("local-") ? null : item.menuItemId,
          variant_id: item.variantId?.startsWith("local-") ? null : (item.variantId || null),
          name: item.name,
          variant_label: item.variantLabel || null,
          quantity: item.quantity,
          unit_price: parseFloat(unitPrice.toFixed(2)),
          total_price: parseFloat((unitPrice * item.quantity).toFixed(2)),
        };
      });

      const { data: insertedItems, error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert(orderItems as any)
        .select();

      if (itemsError) {
        console.error("Order items insert error:", itemsError);
      }

      if (insertedItems) {
        const allSupplements: any[] = [];
        data.items.forEach((item, idx) => {
          if (item.supplements?.length && insertedItems[idx]) {
            item.supplements.forEach((sup) => {
              allSupplements.push({
                order_item_id: insertedItems[idx].id,
                supplement_id: sup.id.startsWith("local-") ? null : sup.id,
                label: sup.label,
                price: sup.price,
              });
            });
          }
        });
        if (allSupplements.length > 0) {
          await supabaseAdmin
            .from("order_item_supplements")
            .insert(allSupplements);
        }
      }

      // If paying online, create Mollie payment
      if (data.paymentMethod === "online" && process.env.MOLLIE_API_KEY) {
        const { createPayment } = await import("@/lib/mollie");
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const { paymentId, checkoutUrl } = await createPayment({
          orderId: order.id,
          orderNumber: order.order_number,
          amount: total,
          description: `Commande ${order.order_number} — Le Grill du Four`,
          redirectUrl: `${appUrl}/commande/${order.id}`,
          customerEmail: data.customerEmail,
        });

        await supabaseAdmin
          .from("orders")
          .update({ mollie_payment_id: paymentId } as any)
          .eq("id", order.id);

        return NextResponse.json({
          success: true,
          orderId: order.id,
          orderNumber: order.order_number,
          total,
          checkoutUrl,
        });
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        total,
      });
    }

    // Fallback without Supabase: generate a local order number
    const orderNumber = `GDF-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

    return NextResponse.json({
      success: true,
      orderId: orderNumber,
      orderNumber,
      total,
    });
  } catch (error) {
    console.error("Order API error:", error);
    return NextResponse.json(
      { success: false, errors: ["Erreur serveur. Veuillez réessayer."] },
      { status: 500 }
    );
  }
}
