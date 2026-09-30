import { NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/auth";
import { getTestModeStatus, activateTestMode, deactivateTestMode } from "@/lib/test-mode";

export async function GET(request: NextRequest) {
  const authResult = await checkApiAuth(request, "admin", "staff");
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deviceId = request.headers.get("x-device-id") || "unknown";
  const status = await getTestModeStatus(deviceId);
  return NextResponse.json(status);
}

export async function POST(request: NextRequest) {
  const authResult = await checkApiAuth(request, "admin", "staff");
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, deviceId } = body;

  if (!deviceId) {
    return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
  }

  if (action === "activate") {
    const result = await activateTestMode(deviceId);
    if (result.error) {
      return NextResponse.json({ error: result.error, active: false }, { status: 500 });
    }
    return NextResponse.json(result);
  }

  if (action === "deactivate") {
    await deactivateTestMode(deviceId);
    return NextResponse.json({ active: false });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
