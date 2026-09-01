import { NextRequest, NextResponse } from "next/server";
import type { OrderMode, PaymentMethod } from "@/types/database";
import { sendTelegramNotification, formatOrderTelegram } from "@/lib/telegram";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { cookingLevels, cookingGroups, getGroupLevels } from "@/data/cookingData";
import { optionGroups as validOptionGroups } from "@/data/optionGroups";

function sendNotifications(params: {
  orderNumber: string;
  mode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  paymentMethod: string;
  notes?: string;
  items: { name: string; quantity: number; variant_label?: string | null; total_price: number }[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  deliveryMinTime?: number;
  deliveryMaxTime?: number;
}) {
  const telegramMsg = formatOrderTelegram({
    order_number: params.orderNumber,
    mode: params.mode,
    customer_name: params.customerName,
    customer_phone: params.customerPhone,
    delivery_address: params.deliveryAddress,
    delivery_city: params.deliveryCity,
    total: params.total,
    payment_method: params.paymentMethod,
    notes: params.notes,
    items: params.items,
    discount_amount: params.discountAmount,
  });
  sendTelegramNotification(telegramMsg).catch(() => {});

  if (params.customerEmail) {
    sendOrderConfirmationEmail({
      to: params.customerEmail,
      orderNumber: params.orderNumber,
      customerName: params.customerName,
      mode: params.mode,
      paymentMethod: params.paymentMethod,
      items: params.items,
      subtotal: params.subtotal,
      deliveryFee: params.deliveryFee,
      discountAmount: params.discountAmount,
      total: params.total,
      deliveryMinTime: params.deliveryMinTime,
      deliveryMaxTime: params.deliveryMaxTime,
    }).catch(() => {});
  }
}

interface OptionSelectionPayload {
  groupKey: string;
  groupLabel: string;
  choices: { key: string; label: string; price: number; quantity: number }[];
}

interface OrderItemPayload {
  menuItemId: string;
  name: string;
  variantId?: string;
  variantLabel?: string;
  basePrice: number;
  quantity: number;
  supplements: { id: string; label: string; price: number }[];
  optionSelections?: OptionSelectionPayload[];
  itemNote?: string;
  donenessKey?: string;
  donenessLabel?: string;
  cookingGroupKey?: string;
}

interface OrderPayload {
  mode: OrderMode;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  deliveryPostal?: string;
  deliveryCity?: string;
  houseNumber?: string;
  addressSource?: "autocomplete" | "manual";
  paymentMethod: PaymentMethod;
  notes?: string;
  items: OrderItemPayload[];
}

const PHONE_BE = /^(\+32|0)\s?[1-9](\d\s?){7,8}$/;
const POSTAL_RE = /^\d{4}$/;
const DELIVERY_POSTAL_CODES = ["7700", "7711", "7712"];
const HOUSE_NUMBER_RE = /^\d{1,4}[a-zA-Z]?$/;

const rateLimitMap = new Map<string, number[]>();

function isRateLimited(key: string, maxPerHour: number): boolean {
  const now = Date.now();
  const windowMs = 3600_000;
  const timestamps = (rateLimitMap.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxPerHour) {
    rateLimitMap.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return false;
}

function validateOrder(data: OrderPayload): string[] {
  const errors: string[] = [];

  if (!data.customerName?.trim()) errors.push("Nom requis.");

  const phone = data.customerPhone?.trim().replace(/[\s\-().]/g, "") || "";
  if (!PHONE_BE.test(data.customerPhone?.trim() || ""))
    errors.push("Numéro de téléphone belge invalide (ex: +32 470 12 34 56).");

  if (!data.items?.length) errors.push("Le panier est vide.");

  if (!["delivery", "pickup"].includes(data.mode))
    errors.push("Mode de commande invalide.");

  if (!["cash", "card"].includes(data.paymentMethod))
    errors.push("Moyen de paiement invalide.");

  if (data.mode === "delivery") {
    if (!data.deliveryAddress?.trim()) errors.push("Adresse requise pour la livraison.");
    if (!data.deliveryPostal?.trim() || !POSTAL_RE.test(data.deliveryPostal.trim()))
      errors.push("Code postal invalide (4 chiffres).");
    if (!data.deliveryCity?.trim()) errors.push("Ville requise.");
    if (data.houseNumber !== undefined && !HOUSE_NUMBER_RE.test(data.houseNumber?.trim() || ""))
      errors.push("Numéro de maison invalide.");
    if (data.addressSource === "manual" && data.deliveryPostal?.trim()) {
      if (!DELIVERY_POSTAL_CODES.includes(data.deliveryPostal.trim())) {
        errors.push(`Nous ne livrons pas dans le code postal ${data.deliveryPostal.trim()}. Zone : ${DELIVERY_POSTAL_CODES.join(", ")}.`);
      }
    }
  }

  for (const item of data.items || []) {
    if (!item.name) errors.push("Article sans nom.");
    if (typeof item.basePrice !== "number" || item.basePrice < 0)
      errors.push(`Prix invalide pour ${item.name}.`);
    if (!item.quantity || item.quantity < 1)
      errors.push(`Quantité invalide pour ${item.name}.`);

    if (item.donenessKey) {
      const validLevel = cookingLevels.find((l) => l.key === item.donenessKey);
      if (!validLevel) {
        errors.push(`Cuisson invalide pour ${item.name} : ${item.donenessKey}.`);
      } else if (item.cookingGroupKey) {
        const groupLevels = getGroupLevels(item.cookingGroupKey);
        if (groupLevels.length > 0 && !groupLevels.find((gl) => gl.key === item.donenessKey)) {
          errors.push(`Cuisson "${validLevel.label}" non disponible pour ${item.name}.`);
        }
      }
    }

    if (item.optionSelections?.length) {
      for (const os of item.optionSelections) {
        const group = validOptionGroups[os.groupKey];
        if (!group) {
          errors.push(`Groupe d'options inconnu "${os.groupKey}" pour ${item.name}.`);
          continue;
        }
        for (const choice of os.choices) {
          const validOpt = group.options.find((o) => o.key === choice.key);
          if (!validOpt) {
            errors.push(`Option "${choice.label}" non trouvée dans le groupe "${group.label}" pour ${item.name}.`);
          } else if (Math.abs(choice.price - validOpt.price) > 0.01) {
            errors.push(`Prix incorrect pour "${choice.label}" (${item.name}).`);
          }
          if (choice.quantity < 1) {
            errors.push(`Quantité invalide pour "${choice.label}" (${item.name}).`);
          }
        }
      }
    }
  }

  return errors;
}

export async function POST(request: NextRequest) {
  try {
    const data: OrderPayload = await request.json();
    const errors = validateOrder(data);

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const phone = data.customerPhone.trim().replace(/[\s\-().]/g, "");
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(`phone:${phone}`, 3) || isRateLimited(`ip:${ip}`, 3)) {
      return NextResponse.json(
        { success: false, errors: ["Trop de commandes récentes. Réessayez dans une heure."] },
        { status: 429 }
      );
    }

    const subtotal = data.items.reduce((sum, item) => {
      const supTotal = (item.supplements || []).reduce((s, sup) => s + sup.price, 0);
      const optTotal = (item.optionSelections || []).reduce(
        (s, os) => s + os.choices.reduce((cs, c) => cs + c.price * c.quantity, 0),
        0
      );
      return sum + (item.basePrice + supTotal + optTotal) * item.quantity;
    }, 0);

    let configFee = 5;
    let configMinOrder = 25;
    let discountActive = false;
    let discountPercentage = 10;
    let configMinTime = 20;
    let configMaxTime = 60;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { supabaseAdmin } = await import("@/lib/supabase-server");

      const { data: deliveryConfigData } = await supabaseAdmin
        .from("delivery_config")
        .select("*")
        .limit(1)
        .single();

      if (deliveryConfigData) {
        configFee = deliveryConfigData.fee ?? 5;
        configMinOrder = deliveryConfigData.min_order ?? 25;
        discountActive = deliveryConfigData.discount_active ?? false;
        discountPercentage = deliveryConfigData.discount_percentage ?? 10;
        configMinTime = deliveryConfigData.delivery_min_time ?? 20;
        configMaxTime = deliveryConfigData.delivery_max_time ?? 60;
      }

      if (data.mode === "delivery") {
        const menuItemIds = data.items
          .map((i) => i.menuItemId)
          .filter((id) => !id.startsWith("local-"));
        if (menuItemIds.length > 0) {
          const { data: dbItems } = await supabaseAdmin
            .from("menu_items")
            .select("id, name, is_deliverable")
            .in("id", menuItemIds);
          const nonDeliverable = (dbItems || []).filter((i) => !i.is_deliverable);
          if (nonDeliverable.length > 0) {
            const names = nonDeliverable.map((i) => i.name).join(", ");
            return NextResponse.json(
              { success: false, errors: [`Articles non disponibles en livraison : ${names}.`] },
              { status: 400 }
            );
          }
        }
      }

      if (data.mode === "pickup") {
        const menuItemIds = data.items
          .map((i) => i.menuItemId)
          .filter((id) => !id.startsWith("local-"));
        if (menuItemIds.length > 0) {
          const { data: dbItems } = await supabaseAdmin
            .from("menu_items")
            .select("id, name, is_delivery_only")
            .in("id", menuItemIds);
          const deliveryOnly = (dbItems || []).filter((i) => i.is_delivery_only);
          if (deliveryOnly.length > 0) {
            const names = deliveryOnly.map((i) => i.name).join(", ");
            return NextResponse.json(
              { success: false, errors: [`Articles disponibles uniquement en livraison : ${names}.`] },
              { status: 400 }
            );
          }
        }
      }

      // Check out-of-stock
      {
        const allIds = data.items
          .map((i) => i.menuItemId)
          .filter((id) => !id.startsWith("local-"));
        if (allIds.length > 0) {
          const { data: dbItems } = await supabaseAdmin
            .from("menu_items")
            .select("id, name, is_out_of_stock")
            .in("id", allIds);
          const outOfStock = (dbItems || []).filter((i) => i.is_out_of_stock);
          if (outOfStock.length > 0) {
            const names = outOfStock.map((i) => i.name).join(", ");
            return NextResponse.json(
              { success: false, errors: [`Articles en rupture de stock : ${names}.`] },
              { status: 400 }
            );
          }
        }
      }

      // Check blacklist
      const { data: blocked } = await supabaseAdmin
        .from("blacklist")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();

      if (blocked) {
        return NextResponse.json(
          { success: false, errors: ["Ce numéro ne peut plus passer de commande."] },
          { status: 403 }
        );
      }

      let discountAmount = 0;
      if (discountActive && discountPercentage > 0) {
        const discountExcludedSlugs = ["boissons", "boissons-livraison", "desserts"];
        const menuItemIds = data.items
          .map((i) => i.menuItemId)
          .filter((id) => !id.startsWith("local-"));

        const categoryMap = new Map<string, string>();
        if (menuItemIds.length > 0) {
          const { data: itemCats } = await supabaseAdmin
            .from("menu_items")
            .select("id, category_id")
            .in("id", menuItemIds);
          if (itemCats) {
            const catIds = [...new Set(itemCats.map((ic) => ic.category_id))];
            const { data: cats } = await supabaseAdmin
              .from("categories")
              .select("id, slug")
              .in("id", catIds);
            const catSlugMap = new Map((cats || []).map((c) => [c.id, c.slug]));
            for (const ic of itemCats) {
              categoryMap.set(ic.id, catSlugMap.get(ic.category_id) || "");
            }
          }
        }

        for (const item of data.items) {
          const catSlug = categoryMap.get(item.menuItemId) || "";
          if (discountExcludedSlugs.includes(catSlug)) continue;
          const supTotal = (item.supplements || []).reduce((s, sup) => s + sup.price, 0);
          const optTotal = (item.optionSelections || []).reduce(
            (s, os) => s + os.choices.reduce((cs, c) => cs + c.price * c.quantity, 0),
            0
          );
          const unitPrice = item.basePrice + supTotal + optTotal;
          const discountedUnitPrice = Math.round(unitPrice * (1 - discountPercentage / 100) / 0.05) * 0.05;
          discountAmount += (unitPrice - discountedUnitPrice) * item.quantity;
        }
        discountAmount = parseFloat(discountAmount.toFixed(2));
      }

      const deliveryFee = data.mode === "delivery" ? configFee : 0;
      const subtotalAfterDiscount = subtotal - discountAmount;
      const total = subtotalAfterDiscount + deliveryFee;

      if (data.mode === "delivery" && subtotalAfterDiscount < configMinOrder) {
        return NextResponse.json(
          {
            success: false,
            errors: [
              `Minimum de commande en livraison : ${configMinOrder.toFixed(2)}€ (votre sous-total après remise : ${subtotalAfterDiscount.toFixed(2)}€).`,
            ],
          },
          { status: 400 }
        );
      }

      const orderRow = {
        status: "confirmed",
        mode: data.mode,
        customer_name: data.customerName.trim(),
        customer_phone: data.customerPhone.trim(),
        customer_email: data.customerEmail?.trim() || null,
        delivery_address: data.mode === "delivery" ? data.deliveryAddress!.trim() : null,
        delivery_postal: data.mode === "delivery" ? data.deliveryPostal!.trim() : null,
        delivery_city: data.mode === "delivery" ? data.deliveryCity!.trim() : null,
        house_number: data.mode === "delivery" ? (data.houseNumber?.trim() || null) : null,
        address_source: data.mode === "delivery" ? (data.addressSource || "manual") : null,
        payment_method: data.paymentMethod,
        payment_status: "pending",
        subtotal: parseFloat(subtotal.toFixed(2)),
        delivery_fee: deliveryFee,
        discount_amount: discountAmount,
        total: parseFloat(total.toFixed(2)),
        notes: data.notes?.trim() || null,
        confirmed_at: new Date().toISOString(),
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
        const optTotal = (item.optionSelections || []).reduce(
          (s, os) => s + os.choices.reduce((cs, c) => cs + c.price * c.quantity, 0),
          0
        );
        const unitPrice = item.basePrice + supTotal + optTotal;
        return {
          order_id: order.id,
          menu_item_id: item.menuItemId.startsWith("local-") ? null : item.menuItemId,
          variant_id: item.variantId?.startsWith("local-") ? null : (item.variantId || null),
          name: item.name,
          variant_label: item.variantLabel || null,
          quantity: item.quantity,
          unit_price: parseFloat(unitPrice.toFixed(2)),
          total_price: parseFloat((unitPrice * item.quantity).toFixed(2)),
          doneness_key: item.donenessKey || null,
          doneness_label: item.donenessLabel || null,
          notes: item.itemNote?.trim() || null,
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
          if (!insertedItems[idx]) return;
          const orderItemId = insertedItems[idx].id;

          if (item.supplements?.length) {
            item.supplements.forEach((sup) => {
              allSupplements.push({
                order_item_id: orderItemId,
                supplement_id: sup.id.startsWith("local-") ? null : sup.id,
                label: sup.label,
                price: sup.price,
              });
            });
          }

          if (item.optionSelections?.length) {
            item.optionSelections.forEach((os) => {
              os.choices.forEach((c) => {
                const label = c.quantity > 1 ? `${c.label} x${c.quantity}` : c.label;
                allSupplements.push({
                  order_item_id: orderItemId,
                  supplement_id: null,
                  label,
                  price: c.price * c.quantity,
                });
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

      const notifItems = data.items.map((item) => {
        const supTotal = (item.supplements || []).reduce((s, sup) => s + sup.price, 0);
        const optTotal = (item.optionSelections || []).reduce(
          (s, os) => s + os.choices.reduce((cs, c) => cs + c.price * c.quantity, 0),
          0
        );
        return {
          name: item.name,
          quantity: item.quantity,
          variant_label: item.variantLabel || null,
          total_price: (item.basePrice + supTotal + optTotal) * item.quantity,
          doneness_label: item.donenessLabel || null,
        };
      });

      sendNotifications({
        orderNumber: order.order_number,
        mode: data.mode,
        customerName: data.customerName.trim(),
        customerPhone: data.customerPhone.trim(),
        customerEmail: data.customerEmail?.trim(),
        deliveryAddress: data.mode === "delivery" ? data.deliveryAddress!.trim() : undefined,
        deliveryCity: data.mode === "delivery" ? data.deliveryCity!.trim() : undefined,
        paymentMethod: data.paymentMethod,
        notes: data.notes?.trim(),
        items: notifItems,
        subtotal,
        deliveryFee,
        discountAmount,
        total,
        deliveryMinTime: configMinTime,
        deliveryMaxTime: configMaxTime,
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        total,
      });
    }

    const fallbackFee = data.mode === "delivery" ? configFee : 0;
    const fallbackTotal = subtotal + fallbackFee;
    const orderNumber = `GDF-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

    return NextResponse.json({
      success: true,
      orderId: orderNumber,
      orderNumber,
      total: fallbackTotal,
    });
  } catch (error) {
    console.error("Order API error:", error);
    return NextResponse.json(
      { success: false, errors: ["Erreur serveur. Veuillez réessayer."] },
      { status: 500 }
    );
  }
}
