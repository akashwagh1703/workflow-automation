import { apiError, apiOk } from "@/lib/api/errors";
import { getSupabaseAdminClient } from "@/services/database-service/supabase-admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ contactId: string }> },
) {
  const { contactId } = await params;
  const client = getSupabaseAdminClient();

  const { data: conversations, error: convError } = await client
    .from("conversations")
    .select("id,status,last_interaction_at")
    .eq("contact_id", contactId)
    .order("last_interaction_at", { ascending: false })
    .limit(20);

  if (convError) return apiError(convError.message, 500);

  const conversationIds = (conversations ?? []).map((c) => c.id);
  if (!conversationIds.length) {
    return apiOk({ sessions: [], conversations: [] });
  }

  const { data: sessions, error: sessError } = await client
    .from("sessions")
    .select(
      "id,conversation_id,current_flow,current_step,status,session_data,last_interaction_at,expires_at",
    )
    .in("conversation_id", conversationIds)
    .order("last_interaction_at", { ascending: false })
    .limit(50);

  if (sessError) return apiError(sessError.message, 500);

  return apiOk({
    conversations: conversations ?? [],
    sessions: sessions ?? [],
  });
}
