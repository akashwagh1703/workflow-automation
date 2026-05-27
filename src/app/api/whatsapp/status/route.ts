import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { getSupabaseAdminClient } from "@/services/database-service/supabase-admin";
import { isSignatureVerificationEnabled } from "@/services/whatsapp-service/verify-signature";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.searchParams.get("origin") ?? "";

  const webhookPath = "/api/webhook";
  const appUrl = env.APP_URL ?? (origin ? origin.replace(/\/$/, "") : "");
  const webhookUrl = appUrl ? `${appUrl}${webhookPath}` : null;

  let account: {
    phone_number_id: string;
    business_account_id: string;
    verify_token: string;
    updated_at: string;
  } | null = null;

  try {
    const client = getSupabaseAdminClient();
    const { data } = await client
      .from("whatsapp_accounts")
      .select(
        "phone_number_id,business_account_id,verify_token,updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    account = data ?? null;
  } catch {
    account = null;
  }

  return NextResponse.json({
    ok: true,
    status: {
      supabaseConfigured: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
      credentialsConfigured: !!account,
      phoneNumberId: account?.phone_number_id ?? null,
      businessAccountId: account?.business_account_id ?? null,
      verifyTokenConfigured: !!account?.verify_token,
      webhookPath,
      webhookUrl,
      metaGraphApiVersion: env.META_GRAPH_API_VERSION,
      signatureVerificationEnabled: isSignatureVerificationEnabled(),
    },
  });
}
