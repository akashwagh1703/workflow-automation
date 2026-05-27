import { NextResponse } from "next/server";

import { env } from "@/config/env";

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.set(env.COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
  return res;
}

