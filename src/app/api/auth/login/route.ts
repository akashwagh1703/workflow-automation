import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { signAdminSession } from "@/lib/auth/jwt";

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
    return NextResponse.redirect(new URL("/login?error=1", req.url));
  }

  const token = await signAdminSession({ sub: "admin", email });
  const res = NextResponse.redirect(new URL("/dashboard", req.url));

  res.cookies.set(env.COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return res;
}

