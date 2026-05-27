import { NextResponse } from "next/server";

import { env } from "@/config/env";

export async function GET(req: Request) {
  // Use 303 so any non-GET navigations end up as a GET.
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  res.cookies.set(env.COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
  return res;
}

