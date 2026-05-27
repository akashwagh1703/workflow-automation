import { NextResponse } from "next/server";

import { getAdminCookieName, verifyAdminSession } from "@/lib/auth/jwt";

export async function GET(req: Request) {
  const cookieName = getAdminCookieName();
  const token = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${cookieName}=`))
    ?.slice(`${cookieName}=`.length);

  if (!token) {
    return NextResponse.json(
      { ok: true, authenticated: false, reason: "missing_cookie", cookieName },
      { status: 200 },
    );
  }

  try {
    const claims = await verifyAdminSession(decodeURIComponent(token));
    return NextResponse.json(
      { ok: true, authenticated: true, cookieName, claims },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: true,
        authenticated: false,
        reason: "invalid_token",
        cookieName,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 200 },
    );
  }
}

