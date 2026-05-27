import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/services/database-service/supabase-admin";

export async function GET(req: Request) {
  const client = getSupabaseAdminClient();
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  let contactFilterIds: string[] | null = null;
  if (q) {
    const { data: matches } = await client
      .from("contacts")
      .select("id")
      .or(`phone.ilike.%${q}%,name.ilike.%${q}%`)
      .limit(100);

    contactFilterIds = (matches ?? []).map((c) => c.id as string);
    if (!contactFilterIds.length) {
      return NextResponse.json({ ok: true, conversations: [] });
    }
  }

  let conversationQuery = client
    .from("conversations")
    .select("id,status,last_interaction_at,contact_id")
    .order("last_interaction_at", { ascending: false })
    .limit(50);

  if (contactFilterIds) {
    conversationQuery = conversationQuery.in("contact_id", contactFilterIds);
  }

  const { data: conversations, error: convError } = await conversationQuery;

  if (convError) {
    return NextResponse.json(
      { ok: false, error: convError.message },
      { status: 500 },
    );
  }

  if (!conversations?.length) {
    return NextResponse.json({ ok: true, conversations: [] });
  }

  const contactIds = conversations.map((c) => c.contact_id).filter(Boolean);
  const conversationIds = conversations.map((c) => c.id);

  const { data: contacts } = await client
    .from("contacts")
    .select("id,phone,name,tags,notes")
    .in("id", contactIds);

  const contactsById = new Map((contacts ?? []).map((c) => [c.id, c]));

  const { data: messages } = await client
    .from("messages")
    .select("conversation_id,id,direction,type,message,created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false })
    .limit(500);

  const lastMessageByConversationId = new Map<string, unknown>();
  for (const m of messages ?? []) {
    const cid = m.conversation_id as string;
    if (!lastMessageByConversationId.has(cid)) {
      lastMessageByConversationId.set(cid, m);
    }
  }

  return NextResponse.json({
    ok: true,
    conversations: conversations.map((c) => {
      const contact = contactsById.get(c.contact_id as string) ?? null;
      const lastMessage = lastMessageByConversationId.get(c.id) ?? null;

      return {
        id: c.id,
        status: c.status,
        lastInteractionAt: c.last_interaction_at,
        contact,
        lastMessage,
      };
    }),
  });
}

