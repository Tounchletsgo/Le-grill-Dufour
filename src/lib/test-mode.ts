const TEST_MODE_DURATION_MS = 60 * 60 * 1000;

async function getSupabase() {
  const { supabaseAdmin } = await import("@/lib/supabase-server");
  return supabaseAdmin;
}

async function cleanExpired(sb: any) {
  await sb
    .from("test_mode_sessions")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .catch(() => {});
}

export async function isTestModeActive(deviceId: string): Promise<boolean> {
  try {
    const sb = await getSupabase();
    const { data } = await sb
      .from("test_mode_sessions")
      .select("expires_at")
      .eq("device_id", deviceId)
      .gt("expires_at", new Date().toISOString())
      .single();
    return !!data;
  } catch {
    return false;
  }
}

export async function getTestModeStatus(deviceId: string): Promise<{ active: boolean; expiresAt?: number; remainingMinutes?: number }> {
  try {
    const sb = await getSupabase();
    await cleanExpired(sb);
    const { data } = await sb
      .from("test_mode_sessions")
      .select("expires_at")
      .eq("device_id", deviceId)
      .gt("expires_at", new Date().toISOString())
      .single();
    if (data) {
      const expiresAt = new Date(data.expires_at).getTime();
      return {
        active: true,
        expiresAt,
        remainingMinutes: Math.ceil((expiresAt - Date.now()) / 60000),
      };
    }
    return { active: false };
  } catch {
    return { active: false };
  }
}

export async function activateTestMode(deviceId: string): Promise<{ active: boolean; expiresAt: number; remainingMinutes: number }> {
  const sb = await getSupabase();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TEST_MODE_DURATION_MS);

  await sb
    .from("test_mode_sessions")
    .upsert({
      device_id: deviceId,
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    }, { onConflict: "device_id" });

  return { active: true, expiresAt: expiresAt.getTime(), remainingMinutes: 60 };
}

export async function deactivateTestMode(deviceId: string): Promise<void> {
  const sb = await getSupabase();
  await sb
    .from("test_mode_sessions")
    .delete()
    .eq("device_id", deviceId);
}

export async function hasAnyActiveTestMode(): Promise<boolean> {
  try {
    const sb = await getSupabase();
    const { data } = await sb
      .from("test_mode_sessions")
      .select("device_id")
      .gt("expires_at", new Date().toISOString())
      .limit(1);
    return !!(data && data.length > 0);
  } catch {
    return false;
  }
}
