import { NextResponse } from "next/server";

import { verifyAdminCredentials } from "@/lib/auth/credentials";
import { signAdminSession } from "@/lib/auth/jwt";
import { buildAbsoluteUrl } from "@/lib/auth/request-origin";
import { setSessionCookie } from "@/lib/auth/session-cookie";

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.redirect(
      buildAbsoluteUrl(req, "/login?error=credentials"),
      303,
    );
  }

  const token = await signAdminSession({
    sub: "admin",
    email: email.trim().toLowerCase(),
  });

  const res = NextResponse.redirect(buildAbsoluteUrl(req, "/dashboard"), 303);
  setSessionCookie(res, token);
  return res;
}
