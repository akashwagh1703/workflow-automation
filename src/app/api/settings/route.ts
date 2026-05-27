import { NextResponse } from "next/server";

import { env } from "@/config/env";

export async function GET() {
  const email = env.ADMIN_EMAIL;
  const maskedEmail = email.replace(/(^.).*(@.*$)/, "$1***$2");

  return NextResponse.json({
    ok: true,
    settings: {
      adminEmailMasked: maskedEmail,
      supabaseConfigured: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
      metaGraphApiVersion: env.META_GRAPH_API_VERSION,
      appUrl: env.APP_URL ?? null,
      sessionTimeoutMinutes: 30,
      cookieName: env.COOKIE_NAME,
    },
  });
}
