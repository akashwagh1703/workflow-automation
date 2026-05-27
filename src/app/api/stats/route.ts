import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/services/database-service/supabase-admin";

export async function GET() {
  const client = getSupabaseAdminClient();

  const [{ count: messagesCount }, { count: activeConversations }, { count: workflowsCount }, { count: contactsCount }] =
    await Promise.all([
      client
        .from("messages")
        .select("id", { count: "exact", head: true }),
      client
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      client.from("flows").select("id", { count: "exact", head: true }).eq("enabled", true),
      client.from("contacts").select("id", { count: "exact", head: true }),
    ]);

  return NextResponse.json({
    ok: true,
    stats: {
      totalMessages: messagesCount ?? 0,
      activeConversations: activeConversations ?? 0,
      workflowsCount: workflowsCount ?? 0,
      contactsCount: contactsCount ?? 0,
    },
  });
}

