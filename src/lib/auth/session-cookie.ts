import type { NextResponse } from "next/server";

import { getAdminCookieName } from "@/lib/auth/jwt";

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(getAdminCookieName(), token, {
    ...getSessionCookieOptions(),
    maxAge: THIRTY_DAYS_SECONDS,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(getAdminCookieName(), "", {
    ...getSessionCookieOptions(),
    expires: new Date(0),
  });
}
