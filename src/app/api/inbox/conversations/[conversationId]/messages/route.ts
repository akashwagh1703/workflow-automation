import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/services/database-service/supabase-admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;
  const client = getSupabaseAdminClient();

  const { data: conversation, error: convError } = await client
    .from("conversations")
    .select("id,status,contact_id,whatsapp_account_id,last_interaction_at")
    .eq("id", conversationId)
    .maybeSingle();

  if (convError) {
    return NextResponse.json(
      { ok: false, error: convError.message },
      { status: 500 },
    );
  }

  if (!conversation) {
    return NextResponse.json(
      { ok: false, error: "Conversation not found" },
      { status: 404 },
    );
  }

  const { data: contact } = await client
    .from("contacts")
    .select("id,phone,name,tags,notes")
    .eq("id", conversation.contact_id)
    .maybeSingle();

  const { data: messages, error: msgError } = await client
    .from("messages")
    .select("id,direction,type,message,status,created_at,whatsapp_message_id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (msgError) {
    return NextResponse.json(
      { ok: false, error: msgError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    conversation: { ...conversation, contact },
    messages: messages ?? [],
  });
}
