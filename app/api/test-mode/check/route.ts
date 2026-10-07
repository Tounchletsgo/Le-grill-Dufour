import { NextRequest, NextResponse } from "next/server";
import { isTestModeActive, hasAnyActiveTestMode } from "@/lib/test-mode";

export async function GET(request: NextRequest) {
  const deviceId = request.headers.get("x-device-id");
  if (!deviceId) {
    return NextResponse.json({ testMode: false });
  }
  const active = await isTestModeActive(deviceId);
  if (active) return NextResponse.json({ testMode: true });
  const anyActive = await hasAnyActiveTestMode();
  return NextResponse.json({ testMode: anyActive });
}
