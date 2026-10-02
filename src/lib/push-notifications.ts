import type { SupabaseClient } from "@supabase/supabase-js";

interface PushSubscriptionRow {
  id: string;
  driver_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPushToDriver(
  supabaseAdmin: SupabaseClient,
  driverId: string,
  payload: { title: string; body: string; url?: string }
) {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) return;

  const { data: subs } = await supabaseAdmin
    .from("driver_push_subscriptions")
    .select("id, driver_id, endpoint, p256dh, auth")
    .eq("driver_id", driverId);

  if (!subs || subs.length === 0) return;

  let webpush: typeof import("web-push");
  try {
    webpush = await import("web-push");
  } catch {
    return;
  }

  webpush.setVapidDetails(
    "mailto:chriswillen@me.com",
    vapidPublic,
    vapidPrivate
  );

  const jsonPayload = JSON.stringify(payload);
  const stale: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub: PushSubscriptionRow) => {
      try {
        await webpush!.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          jsonPayload,
          { TTL: 3600 }
        );
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          stale.push(sub.id);
        }
      }
    })
  );

  if (stale.length > 0) {
    await supabaseAdmin
      .from("driver_push_subscriptions")
      .delete()
      .in("id", stale);
  }
}

export async function sendPushToAllActiveDrivers(
  supabaseAdmin: SupabaseClient,
  payload: { title: string; body: string; url?: string }
) {
  const { data: drivers } = await supabaseAdmin
    .from("drivers")
    .select("id")
    .eq("is_active", true);

  if (!drivers) return;

  await Promise.allSettled(
    drivers.map((d) => sendPushToDriver(supabaseAdmin, d.id, payload))
  );
}
