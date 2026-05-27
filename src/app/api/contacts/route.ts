import { z } from "zod";
import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/services/database-service/supabase-admin";

const contactUpsertSchema = z.object({
  phone: z.string().min(1),
  name: z.string().min(1).optional(),
  tags: z
    .union([z.array(z.string().min(1)), z.string().min(1)])
    .optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const client = getSupabaseAdminClient();

  const { data, error } = await client
    .from("contacts")
    .select("id,phone,name,tags,notes,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, contacts: data ?? [] });
}

export async function POST(req: Request) {
  const client = getSupabaseAdminClient();

  const body = await req.json().catch(() => null);
  const parsed = contactUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { phone, name, notes } = parsed.data;
  const tagsRaw = parsed.data.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw
    : typeof tagsRaw === "string"
      ? tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

  const { data, error } = await client
    .from("contacts")
    .upsert(
      {
        phone,
        name: name ?? null,
        tags,
        notes: notes ?? null,
      },
      { onConflict: "phone" },
    )
    .select("id,phone,name,tags,notes,created_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, contact: data ?? null });
}

