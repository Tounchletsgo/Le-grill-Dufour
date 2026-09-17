import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkApiAuth } from "@/lib/auth";

async function checkAuth(request: NextRequest) {
  const result = await checkApiAuth(request, "admin", "staff");
  return result.authenticated;
}

export async function GET(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ delivery: null, hours: [] });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const [deliveryRes, hoursRes] = await Promise.all([
      supabaseAdmin.from("delivery_config").select("*").limit(1).single(),
      supabaseAdmin.from("opening_hours").select("*").order("sort_order"),
    ]);

    return NextResponse.json({
      delivery: deliveryRes.data,
      hours: hoursRes.data || [],
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const body = await request.json();

    if (typeof body.is_closed === "boolean") {
      const { data: config } = await supabaseAdmin
        .from("delivery_config")
        .select("id")
        .limit(1)
        .single();
      if (config) {
        const { error } = await supabaseAdmin
          .from("delivery_config")
          .update({ is_closed: body.is_closed })
          .eq("id", config.id);
        if (error) {
          return NextResponse.json({ error: "Toggle failed" }, { status: 500 });
        }
      }
      return NextResponse.json({ success: true });
    }

    if (body.delivery) {
      const { id, ...raw } = body.delivery;
      const deliveryAllowed = ["is_enabled", "is_closed", "min_order", "fee", "zone_radius_km", "zone_center_postal", "zone_description", "estimated_time", "pickup_time", "delivery_min_time", "delivery_max_time", "discount_percentage", "discount_active", "discount_excluded_slugs", "feedback_delay_hours"];
      const deliveryData: Record<string, unknown> = {};
      for (const key of Object.keys(raw)) {
        if (deliveryAllowed.includes(key)) deliveryData[key] = raw[key];
      }
      if (Object.keys(deliveryData).length > 0) {
        const { error } = await supabaseAdmin
          .from("delivery_config")
          .update(deliveryData)
          .eq("id", id);
        if (error) {
          return NextResponse.json({ error: "Update failed" }, { status: 500 });
        }
      }
    }

    if (body.hours) {
      const hoursAllowed = ["day_of_week", "day_label", "open_time", "close_time", "is_closed", "sort_order"];
      for (const hour of body.hours) {
        const { id, ...raw } = hour;
        const hoursData: Record<string, unknown> = {};
        for (const key of Object.keys(raw)) {
          if (hoursAllowed.includes(key)) hoursData[key] = raw[key];
        }
        if (Object.keys(hoursData).length > 0) {
          const { error } = await supabaseAdmin
            .from("opening_hours")
            .update(hoursData)
            .eq("id", id);
          if (error) {
            return NextResponse.json({ error: "Update failed" }, { status: 500 });
          }
        }
      }
    }

    revalidatePath("/", "layout");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
