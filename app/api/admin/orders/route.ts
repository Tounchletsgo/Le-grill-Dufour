import { NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/auth";

function toBrussels(date: Date): string {
  return date.toLocaleDateString("sv-SE", { timeZone: "Europe/Brussels" });
}

function brusselsStartOfDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const offset = getOffset(d, "Europe/Brussels");
  const utc = new Date(d.getTime() - offset);
  return utc.toISOString();
}

function brusselsEndOfDay(dateStr: string): string {
  const d = new Date(`${dateStr}T23:59:59.999`);
  const offset = getOffset(d, "Europe/Brussels");
  const utc = new Date(d.getTime() - offset);
  return utc.toISOString();
}

function getOffset(date: Date, tz: string): number {
  const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = date.toLocaleString("en-US", { timeZone: tz });
  return new Date(tzStr).getTime() - new Date(utcStr).getTime();
}

function getPeriodRange(period: string): { start: string; end: string } | null {
  const now = new Date();
  const todayStr = toBrussels(now);

  switch (period) {
    case "today": {
      return { start: brusselsStartOfDay(todayStr), end: brusselsEndOfDay(todayStr) };
    }
    case "yesterday": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      const str = toBrussels(d);
      return { start: brusselsStartOfDay(str), end: brusselsEndOfDay(str) };
    }
    case "this-week": {
      const parts = todayStr.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const dow = d.getDay();
      const mondayOffset = dow === 0 ? 6 : dow - 1;
      d.setDate(d.getDate() - mondayOffset);
      const mondayStr = toBrussels(d);
      return { start: brusselsStartOfDay(mondayStr), end: brusselsEndOfDay(todayStr) };
    }
    case "this-month": {
      const firstDay = todayStr.slice(0, 7) + "-01";
      return { start: brusselsStartOfDay(firstDay), end: brusselsEndOfDay(todayStr) };
    }
    case "last-month": {
      const parts = todayStr.split("-").map(Number);
      const prevMonth = new Date(parts[0], parts[1] - 2, 1);
      const lastDayPrev = new Date(parts[0], parts[1] - 1, 0);
      const startStr = toBrussels(prevMonth);
      const endStr = toBrussels(lastDayPrev);
      return { start: brusselsStartOfDay(startStr), end: brusselsEndOfDay(endStr) };
    }
    default: return null;
  }
}

async function checkAuth(request: NextRequest) {
  const result = await checkApiAuth(request, "admin", "staff");
  return result;
}

export async function GET(request: NextRequest) {
  const authResult = await checkAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ orders: [], stats: null });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const period = searchParams.get("period") || "today";
    const customStart = searchParams.get("start");
    const customEnd = searchParams.get("end");
    const includeTest = searchParams.get("includeTest") === "true";

    let query = supabaseAdmin
      .from("orders")
      .select("*, order_items(name, variant_label, quantity, unit_price, total_price, doneness_label)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (!includeTest) {
      query = query.eq("is_test", false);
    }

    if (search) {
      const sanitized = search.replace(/[,().%*\\]/g, "");
      if (sanitized) {
        query = query.or(`order_number.ilike.%${sanitized}%,customer_name.ilike.%${sanitized}%,customer_phone.ilike.%${sanitized}%`);
      }
    }

    const { data: orders, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }

    let range: { start: string; end: string } | null = null;
    if (customStart && customEnd) {
      range = {
        start: brusselsStartOfDay(customStart),
        end: brusselsEndOfDay(customEnd),
      };
    } else {
      range = getPeriodRange(period);
    }

    let stats = null;
    let periodOrders: any[] = [];
    if (range) {
      let statsQuery = supabaseAdmin
        .from("orders")
        .select("id, total, subtotal, delivery_fee, status, payment_method, payment_status, mode, created_at, is_test")
        .gte("created_at", range.start)
        .lte("created_at", range.end)
        .eq("is_test", false);

      const { data: periodData } = await statsQuery;
      periodOrders = periodData || [];

      const active = periodOrders.filter((o: any) => o.status !== "cancelled" && o.status !== "pending_payment");
      const confirmed = active.filter((o: any) => o.payment_status === "paid");

      stats = {
        orderCount: active.length,
        revenue: confirmed.reduce((s: number, o: any) => s + Number(o.total), 0),
        avgBasket: confirmed.length > 0
          ? confirmed.reduce((s: number, o: any) => s + Number(o.total), 0) / confirmed.length
          : 0,
        deliveryCount: active.filter((o: any) => o.mode === "delivery").length,
        pickupCount: active.filter((o: any) => o.mode === "pickup").length,
        cancelledCount: periodOrders.filter((o: any) => o.status === "cancelled").length,
        pendingPaymentCount: periodOrders.filter((o: any) => o.status === "pending_payment").length,
        cashTotal: active.filter((o: any) => o.payment_method === "cash").reduce((s: number, o: any) => s + Number(o.total), 0),
        cardTotal: active.filter((o: any) => o.payment_method === "card").reduce((s: number, o: any) => s + Number(o.total), 0),
        onlineTotal: active.filter((o: any) => o.payment_method === "online").reduce((s: number, o: any) => s + Number(o.total), 0),
        paidTotal: active.filter((o: any) => o.payment_status === "paid").reduce((s: number, o: any) => s + Number(o.total), 0),
        unpaidTotal: active.filter((o: any) => o.payment_status !== "paid").reduce((s: number, o: any) => s + Number(o.total), 0),
        foodRevenue: confirmed.reduce((s: number, o: any) => s + Number(o.subtotal), 0),
        deliveryFees: confirmed.reduce((s: number, o: any) => s + Number(o.delivery_fee), 0),
      };
    }

    let monthlyComparison = null;
    if (period === "this-month" || period === "last-month") {
      const now = new Date();
      const todayStr = toBrussels(now);
      const parts = todayStr.split("-").map(Number);
      const thisMonthStart = todayStr.slice(0, 7) + "-01";
      const prevMonthStart = toBrussels(new Date(parts[0], parts[1] - 2, 1));
      const prevMonthEnd = toBrussels(new Date(parts[0], parts[1] - 1, 0));

      const { data: thisMonthData } = await supabaseAdmin
        .from("orders")
        .select("total, status, payment_status")
        .gte("created_at", brusselsStartOfDay(thisMonthStart))
        .lte("created_at", brusselsEndOfDay(todayStr))
        .eq("is_test", false);

      const { data: prevMonthData } = await supabaseAdmin
        .from("orders")
        .select("total, status, payment_status")
        .gte("created_at", brusselsStartOfDay(prevMonthStart))
        .lte("created_at", brusselsEndOfDay(prevMonthEnd))
        .eq("is_test", false);

      const thisActive = (thisMonthData || []).filter((o: any) => o.status !== "cancelled" && o.status !== "pending_payment" && o.payment_status === "paid");
      const prevActive = (prevMonthData || []).filter((o: any) => o.status !== "cancelled" && o.status !== "pending_payment" && o.payment_status === "paid");

      monthlyComparison = {
        thisMonth: {
          revenue: thisActive.reduce((s: number, o: any) => s + Number(o.total), 0),
          count: thisActive.length,
        },
        lastMonth: {
          revenue: prevActive.reduce((s: number, o: any) => s + Number(o.total), 0),
          count: prevActive.length,
        },
      };
    }

    let dailyChart = null;
    if (range && periodOrders.length > 0) {
      const dayMap = new Map<string, { revenue: number; count: number }>();
      const paidOrders = periodOrders.filter((o: any) => o.status !== "cancelled" && o.status !== "pending_payment" && o.payment_status === "paid");
      for (const o of paidOrders) {
        const day = toBrussels(new Date(o.created_at));
        const existing = dayMap.get(day) || { revenue: 0, count: 0 };
        existing.revenue += Number(o.total);
        existing.count += 1;
        dayMap.set(day, existing);
      }
      dailyChart = Array.from(dayMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    let popularItems = null;
    if (range) {
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("name, quantity, total_price, order_id")
        .in("order_id",
          periodOrders
            .filter((o: any) => o.status !== "cancelled" && o.status !== "pending_payment")
            .map((o: any) => o.id || "")
            .filter(Boolean)
        );

      if (items && items.length > 0) {
        const itemMap = new Map<string, { quantity: number; revenue: number }>();
        for (const item of items) {
          const existing = itemMap.get(item.name) || { quantity: 0, revenue: 0 };
          existing.quantity += item.quantity;
          existing.revenue += Number(item.total_price);
          itemMap.set(item.name, existing);
        }
        popularItems = Array.from(itemMap.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 15);
      }
    }

    let peakHours = null;
    if (range && periodOrders.length > 0) {
      const hourMap = new Map<number, number>();
      const paidOrders = periodOrders.filter((o: any) => o.status !== "cancelled" && o.status !== "pending_payment");
      for (const o of paidOrders) {
        const hour = parseInt(new Date(o.created_at).toLocaleString("en-US", { timeZone: "Europe/Brussels", hour: "numeric", hour12: false }));
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      }
      peakHours = Array.from(hourMap.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour - b.hour);
    }

    return NextResponse.json({
      orders: orders || [],
      total: count || 0,
      stats,
      monthlyComparison,
      dailyChart,
      popularItems,
      peakHours,
    });
  } catch (e) {
    console.error("Admin orders error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await checkAuth(request);
  if (!authResult.authenticated || authResult.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const body = await request.json();
    const { action, orderId, orderIds } = body;

    if (action === "mark_test") {
      if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
      const { error } = await supabaseAdmin
        .from("orders")
        .update({ is_test: true })
        .eq("id", orderId);
      if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "unmark_test") {
      if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
      const { error } = await supabaseAdmin
        .from("orders")
        .update({ is_test: false })
        .eq("id", orderId);
      if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete_test") {
      if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("is_test, payment_status")
        .eq("id", orderId)
        .single();
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      if (!order.is_test && order.payment_status === "paid") {
        return NextResponse.json({ error: "Impossible de supprimer une commande payée. Marquez-la comme test d'abord." }, { status: 400 });
      }
      const { error } = await supabaseAdmin.from("orders").delete().eq("id", orderId);
      if (error) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete_all_test") {
      const { error } = await supabaseAdmin
        .from("orders")
        .delete()
        .eq("is_test", true);
      if (error) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await checkAuth(request);
  if (!authResult.authenticated || authResult.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const body = await request.json();

    if (body.action === "export") {
      const period = body.period || "this-month";
      const customStart = body.start;
      const customEnd = body.end;

      let range: { start: string; end: string } | null = null;
      if (customStart && customEnd) {
        range = { start: brusselsStartOfDay(customStart), end: brusselsEndOfDay(customEnd) };
      } else {
        range = getPeriodRange(period);
      }

      if (!range) return NextResponse.json({ error: "Invalid period" }, { status: 400 });

      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("order_number, status, mode, customer_name, customer_phone, customer_email, delivery_address, delivery_city, payment_method, payment_status, subtotal, delivery_fee, discount_amount, total, notes, created_at, is_test")
        .gte("created_at", range.start)
        .lte("created_at", range.end)
        .eq("is_test", false)
        .order("created_at", { ascending: true });

      if (!orders) return NextResponse.json({ error: "Fetch failed" }, { status: 500 });

      const headers = ["N° Commande", "Date", "Statut", "Mode", "Client", "Téléphone", "Email", "Adresse", "Ville", "Paiement", "Statut paiement", "Sous-total", "Frais livraison", "Remise", "Total", "Notes"];
      const rows = orders.map((o: any) => [
        o.order_number,
        new Date(o.created_at).toLocaleString("fr-BE", { timeZone: "Europe/Brussels" }),
        o.status,
        o.mode === "delivery" ? "Livraison" : "À emporter",
        o.customer_name,
        o.customer_phone,
        o.customer_email || "",
        o.delivery_address || "",
        o.delivery_city || "",
        o.payment_method,
        o.payment_status,
        Number(o.subtotal).toFixed(2),
        Number(o.delivery_fee).toFixed(2),
        Number(o.discount_amount).toFixed(2),
        Number(o.total).toFixed(2),
        (o.notes || "").replace(/\n/g, " "),
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
        .join("\n");

      return NextResponse.json({ csv: csvContent, count: orders.length });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
