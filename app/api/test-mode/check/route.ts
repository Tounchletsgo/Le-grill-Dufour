import { NextRequest, NextResponse } from "next/server";
import { isTestModeActive } from "@/lib/test-mode";

export async function GET(request: NextRequest) {
  const deviceId = request.headers.get("x-device-id");
  if (deviceId) {
    const active = await isTestModeActive(deviceId);
    return NextResponse.json({ testMode: active });
  }
  return NextResponse.json({ testMode: false });
}
