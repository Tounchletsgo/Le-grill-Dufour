import { NextRequest, NextResponse } from "next/server";
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
    return NextResponse.json({ emails: [] });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const url = new URL(request.url);
    const typeFilter = url.searchParams.get("type");

    let query = supabaseAdmin
      .from("email_queue")
      .select(`
        id, order_id, email_type, recipient, status, sent_at, last_error, created_at,
        orders!inner(order_number, customer_name, customer_email)
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    if (typeFilter) {
      query = query.eq("email_type", typeFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Emails fetch error:", error);
      return NextResponse.json({ emails: [] });
    }

    const emails = (data || []).map((e: any) => ({
      id: e.id,
      order_id: e.order_id,
      email_type: e.email_type,
      recipient: e.recipient,
      status: e.status,
      sent_at: e.sent_at,
      error: e.last_error,
      created_at: e.created_at,
      order_number: e.orders?.order_number,
      customer_name: e.orders?.customer_name,
      customer_email: e.orders?.customer_email,
    }));

    return NextResponse.json({ emails });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
