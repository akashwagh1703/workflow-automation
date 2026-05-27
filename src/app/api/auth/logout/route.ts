import { NextResponse } from "next/server";

import { buildAbsoluteUrl } from "@/lib/auth/request-origin";
import { clearSessionCookie } from "@/lib/auth/session-cookie";

export async function GET(req: Request) {
  const res = NextResponse.redirect(buildAbsoluteUrl(req, "/login"), 303);
  clearSessionCookie(res);
  return res;
}
