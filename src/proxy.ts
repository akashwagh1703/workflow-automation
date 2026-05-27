import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyAdminSession, getAdminCookieName } from "@/lib/auth/jwt";

export const config = {
  matcher: [
    // Include both so auth protection is consistent.
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
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await verifyAdminSession(token);
    return NextResponse.next();
  } catch {
    const res = isApi
      ? NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", req.url));

    // Clear the bad cookie so loops don't persist.
    res.cookies.set(cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0),
    });
    return res;
  }
}

