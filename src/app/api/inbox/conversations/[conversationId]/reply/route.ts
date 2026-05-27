import { z } from "zod";
import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/services/database-service/supabase-admin";
import { sendWhatsAppTextMessage } from "@/services/whatsapp-service/send";

const replySchema = z.object({
  text: z.string().min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = replySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const client = getSupabaseAdminClient();

  const { data: conversation, error: convError } = await client
    .from("conversations")
    .select("id,contact_id,whatsapp_account_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (convError || !conversation) {
    return NextResponse.json(
      { ok: false, error: convError?.message ?? "Conversation not found" },
      { status: 404 },
    );
  }

  const { data: contact } = await client
    .from("contacts")
    .select("phone")
    .eq("id", conversation.contact_id)
    .maybeSingle();

  if (!contact?.phone) {
    return NextResponse.json(
      { ok: false, error: "Contact phone not found" },
      { status: 404 },
    );
  }

  const { data: waAccount } = await client
    .from("whatsapp_accounts")
    .select("access_token,phone_number_id")
    .eq("id", conversation.whatsapp_account_id)
    .maybeSingle();

  if (!waAccount?.access_token || !waAccount.phone_number_id) {
    return NextResponse.json(
      { ok: false, error: "WhatsApp account not configured" },
      { status: 400 },
    );
  }

  let providerMessageId: string | null = null;
  let providerRaw: unknown = null;
  let status: "sent" | "failed" = "sent";

  try {
    const result = await sendWhatsAppTextMessage({
      accessToken: waAccount.access_token,
      phoneNumberId: waAccount.phone_number_id,
      to: contact.phone,
      text: parsed.data.text,
    });
    providerMessageId = result.messageId;
    providerRaw = result.raw;
  } catch (e) {
    status = "failed";
    providerRaw = { error: e instanceof Error ? e.message : String(e) };
  }

  const { data: msgRow, error: insertError } = await client
    .from("messages")
    .insert({
      conversation_id: conversationId,
      direction: "outbound",
      type: "text",
      message: parsed.data.text,
      whatsapp_message_id: providerMessageId,
      status,
      raw_payload: { source: "manual_reply", providerRaw },
    })
    .select("id,direction,type,message,status,created_at")
    .maybeSingle();

  if (insertError) {
    return NextResponse.json(
      { ok: false, error: insertError.message },
      { status: 500 },
    );
  }

  await client
    .from("conversations")
    .update({ last_interaction_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (status === "failed") {
    return NextResponse.json(
      {
        ok: false,
        error:
          typeof providerRaw === "object" &&
          providerRaw !== null &&
          "error" in providerRaw
            ? String((providerRaw as { error: string }).error)
            : "Failed to send message",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, message: msgRow });
}
