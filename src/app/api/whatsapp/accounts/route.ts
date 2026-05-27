import { z } from "zod";
import { NextResponse } from "next/server";

import { apiError, apiOk } from "@/lib/api/errors";
import { getSupabaseAdminClient } from "@/services/database-service/supabase-admin";

const whatsappAccountSchema = z.object({
  access_token: z.string().optional(),
  phone_number_id: z.string().min(1),
  business_account_id: z.string().min(1),
  verify_token: z.string().min(1),
});

export async function GET() {
  const client = getSupabaseAdminClient();

  const { data, error } = await client
    .from("whatsapp_accounts")
    .select(
      "id,phone_number_id,business_account_id,verify_token,created_at,updated_at,access_token",
    )
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return apiError(error.message, 500);

  if (!data) {
    return apiOk({ account: null });
  }

  const { access_token: _token, ...rest } = data;

  return apiOk({
    account: {
      ...rest,
      has_access_token: Boolean(_token),
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = whatsappAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const client = getSupabaseAdminClient();

  let accessToken = parsed.data.access_token?.trim();
  if (!accessToken) {
    const { data: existing } = await client
      .from("whatsapp_accounts")
      .select("access_token")
      .eq("phone_number_id", parsed.data.phone_number_id)
      .maybeSingle();

    accessToken = existing?.access_token ?? undefined;
  }

  if (!accessToken) {
    return apiError("Access token is required", 400);
  }

  const { error } = await client.from("whatsapp_accounts").upsert(
    {
      access_token: accessToken,
      phone_number_id: parsed.data.phone_number_id,
      business_account_id: parsed.data.business_account_id,
      verify_token: parsed.data.verify_token,
    },
    { onConflict: "phone_number_id" },
  );

  if (error) return apiError(error.message, 500);

  return apiOk({ saved: true });
}
