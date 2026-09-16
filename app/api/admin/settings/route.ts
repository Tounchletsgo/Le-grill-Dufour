import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

async function checkAuth(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth) {
    try {
      await requireRole(auth, "admin");
      return true;
    } catch {
      return false;
    }
  }
  const pin = request.headers.get("x-admin-pin");
  const expected = process.env.ADMIN_PIN;
  if (!expected) return false;
  return pin === expected;
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
      const { id, ...data } = body.delivery;
      const { error } = await supabaseAdmin
        .from("delivery_config")
        .update(data)
        .eq("id", id);
      if (error) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }
    }

    if (body.hours) {
      for (const hour of body.hours) {
        const { id, ...data } = hour;
        const { error } = await supabaseAdmin
          .from("opening_hours")
          .update(data)
          .eq("id", id);
        if (error) {
          return NextResponse.json({ error: "Update failed" }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
