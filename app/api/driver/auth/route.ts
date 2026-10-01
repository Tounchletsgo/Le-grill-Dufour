import { NextRequest, NextResponse } from "next/server";
import { authenticateDriver, verifyDriverSession } from "@/lib/driver-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pin = body.pin as string | null;

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const result = await authenticateDriver(pin, ip);

    if (result.driver) {
      return NextResponse.json({ driver: result.driver });
    }

    return NextResponse.json({ error: result.error }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const driverId = request.headers.get("x-driver-id");
  if (!driverId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const driver = await verifyDriverSession(driverId);
  if (!driver) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  return NextResponse.json({ driver });
}
