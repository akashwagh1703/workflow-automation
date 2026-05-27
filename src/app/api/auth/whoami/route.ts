import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAdminCookieName, verifyAdminSession } from "@/lib/auth/jwt";

export async function GET() {
  const cookieStore = await cookies();
  const cookieName = getAdminCookieName();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) {
    return NextResponse.json({
      ok: true,
      authenticated: false,
      reason: "missing_cookie",
      cookieName,
    });
  }

  try {
    const claims = await verifyAdminSession(token);
    return NextResponse.json({
      ok: true,
      authenticated: true,
      cookieName,
      claims,
    });
  } catch (e) {
    return NextResponse.json({
      ok: true,
      authenticated: false,
      reason: "invalid_token",
      cookieName,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
