import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminCookieName, verifyAdminSession } from "@/lib/auth/jwt";

/** Server-side guard for dashboard pages (backup to proxy). */
export async function requireAdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminCookieName())?.value;

  if (!token) {
    redirect("/login?reason=missing");
  }

  try {
    await verifyAdminSession(token);
  } catch {
    redirect("/login?reason=invalid");
  }
}
