import { z } from "zod";
import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/services/database-service/supabase-admin";
import { testMetaGraphConnection } from "@/services/whatsapp-service/meta-graph";

const testBodySchema = z.object({
  access_token: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = testBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  let accessToken = parsed.data.access_token;
  if (!accessToken) {
    const client = getSupabaseAdminClient();
    const { data, error } = await client
      .from("whatsapp_accounts")
      .select("access_token")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }
    accessToken = data?.access_token;
  }

  if (!accessToken) {
    return NextResponse.json(
      { ok: false, error: "No WhatsApp access_token configured yet." },
      { status: 400 },
    );
  }

  const result = await testMetaGraphConnection(accessToken);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({ ok: true, meta: result.data });
}

