import { NextRequest, NextResponse } from "next/server";
import { isTestModeActive } from "@/lib/test-mode";

export async function GET(request: NextRequest) {
  const deviceId = request.headers.get("x-device-id");
  if (!deviceId) {
    return NextResponse.json({ testMode: false });
  }
  return NextResponse.json({ testMode: isTestModeActive(deviceId) });
}
