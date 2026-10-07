import { NextRequest, NextResponse } from "next/server";
import { verifyDriverSession } from "@/lib/driver-auth";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const driverId = request.headers.get("x-driver-id");
  if (!driverId || !UUID_RE.test(driverId)) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const driver = await verifyDriverSession(driverId);
  if (!driver) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  const { supabaseAdmin } = await import("@/lib/supabase-server");

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      mode,
      customer_name,
      customer_phone,
      delivery_address,
      house_number,
      delivery_postal,
      delivery_city,
      payment_method,
      payment_status,
      subtotal,
      delivery_fee,
      total,
      discount_amount,
      notes,
      created_at,
      confirmed_at,
      prepared_at,
      estimated_delivery_at,
      assigned_driver_id,
      driver_picked_up_at,
      driver_issue,
      driver_issue_at,
      is_test,
      locale,
      order_items (
        name,
        variant_label,
        doneness_label,
        quantity,
        unit_price,
        total_price,
        notes
      )
    `)
    .eq("mode", "delivery")
    .in("status", ["ready", "delivering"])
    .or(`assigned_driver_id.is.null,assigned_driver_id.eq.${driverId}`)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[driver/orders] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  const response = NextResponse.json({ orders: data || [] });
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

export async function PATCH(request: NextRequest) {
  const driverId = request.headers.get("x-driver-id");
  if (!driverId || !UUID_RE.test(driverId)) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const driver = await verifyDriverSession(driverId);
  if (!driver) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { order_id, action } = body;

    if (!order_id || !action) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("orders")
      .select("id, status, assigned_driver_id, mode")
      .eq("id", order_id)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    if (order.mode !== "delivery") {
      return NextResponse.json({ error: "Commande non-livraison" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    switch (action) {
      case "pickup": {
        if (order.status !== "ready") {
          return NextResponse.json({ error: "La commande n'est pas prête" }, { status: 400 });
        }
        updates.status = "delivering";
        updates.assigned_driver_id = driverId;
        updates.driver_picked_up_at = new Date().toISOString();
        break;
      }
      case "delivering": {
        if (order.status !== "delivering" || order.assigned_driver_id !== driverId) {
          return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
        }
        break;
      }
      case "delivered": {
        if (order.status !== "delivering" || order.assigned_driver_id !== driverId) {
          return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
        }
        updates.status = "delivered";
        updates.delivered_at = new Date().toISOString();
        break;
      }
      case "set_eta": {
        if (order.status !== "delivering" || order.assigned_driver_id !== driverId) {
          return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
        }
        const etaMinutes = Number(body.eta_minutes);
        if (!etaMinutes || etaMinutes < 1 || etaMinutes > 120) {
          return NextResponse.json({ error: "Durée invalide" }, { status: 400 });
        }
        updates.estimated_delivery_at = new Date(Date.now() + etaMinutes * 60_000).toISOString();
        break;
      }
      case "clear_eta": {
        if (order.status !== "delivering" || order.assigned_driver_id !== driverId) {
          return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
        }
        updates.estimated_delivery_at = null;
        break;
      }
      case "issue": {
        if (order.assigned_driver_id !== driverId) {
          return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
        }
        const issue = body.issue as string;
        if (!issue) {
          return NextResponse.json({ error: "Description du problème requise" }, { status: 400 });
        }
        updates.driver_issue = issue;
        updates.driver_issue_at = new Date().toISOString();
        break;
      }
      default:
        return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update(updates)
      .eq("id", order_id);

    if (updateErr) {
      console.error("[driver/orders] PATCH error:", updateErr);
      return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: updates.status || order.status });
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
}
