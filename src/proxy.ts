import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyAdminSession, getAdminCookieName } from "@/lib/auth/jwt";
import { buildAbsoluteUrl } from "@/lib/auth/request-origin";
import { clearSessionCookie } from "@/lib/auth/session-cookie";

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/api/whatsapp/:path*",
    "/api/workflows/:path*",
    "/api/inbox/:path*",
    "/api/contacts",
    "/api/contacts/:path*",
    "/api/stats",
    "/api/settings",
  ],
};

export default async function proxy(req: NextRequest) {
  const cookieName = getAdminCookieName();
  const token = req.cookies.get(cookieName)?.value;
  const isApi = req.nextUrl.pathname.startsWith("/api/");

  if (!token) {
    if (isApi) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(buildAbsoluteUrl(req, "/login?reason=missing"));
  }

  try {
    await verifyAdminSession(token);
    return NextResponse.next();
  } catch {
    const res = isApi
      ? NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(buildAbsoluteUrl(req, "/login?reason=invalid"));

    clearSessionCookie(res);
    return res;
  }
}
