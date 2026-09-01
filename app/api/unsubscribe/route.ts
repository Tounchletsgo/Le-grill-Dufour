import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Non configuré" }, { status: 500 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("customer_phone")
      .eq("feedback_token", token)
      .single();

    if (!order) {
      return new Response(htmlPage("Lien invalide", "Ce lien de désinscription n'est pas valide."), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        status: 404,
      });
    }

    await supabaseAdmin
      .from("email_unsubscribes")
      .upsert({ phone: order.customer_phone }, { onConflict: "phone" });

    return new Response(
      htmlPage(
        "Désinscription confirmée",
        "Vous ne recevrez plus d'e-mails de suivi après vos commandes.<br>Vous pouvez fermer cette page."
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch {
    return new Response(htmlPage("Erreur", "Une erreur est survenue. Veuillez réessayer."), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 500,
    });
  }
}

function htmlPage(title: string, message: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Grill Dufour</title>
<style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FBF8F4;color:#333}
.card{background:#fff;padding:2rem;border-radius:12px;max-width:420px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.08)}
h1{color:#8C2434;font-size:1.3rem;margin:0 0 .75rem}</style>
</head>
<body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
}
