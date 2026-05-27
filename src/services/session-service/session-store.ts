import { getSupabaseAdminClient } from "@/services/database-service/supabase-admin";

export type SessionRow = {
  id: string;
  conversation_id: string;
  current_flow: string | null;
  current_step: string | null;
  session_data: Record<string, unknown>;
  status: string;
  last_interaction_at: string;
  expires_at: string;
};

const SESSION_TIMEOUT_MINUTES = 30;

export async function getActiveSession(
  conversationId: string,
): Promise<SessionRow | null> {
  const client = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await client
    .from("sessions")
    .select(
      "id,conversation_id,current_flow,current_step,session_data,status,last_interaction_at,expires_at",
    )
    .eq("conversation_id", conversationId)
    .eq("status", "active")
    .gt("expires_at", nowIso)
    .maybeSingle();

  if (error) {
    // Router should not crash the webhook; fail open (no active session).
    return null;
  }

  return (data as SessionRow) ?? null;
}

export async function startSession(params: {
  conversationId: string;
  currentFlowId: string;
  currentStepId: string;
  sessionData?: Record<string, unknown>;
}) {
  const client = getSupabaseAdminClient();

  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000);

  const { data, error } = await client
    .from("sessions")
    .upsert(
      {
        conversation_id: params.conversationId,
        current_flow: params.currentFlowId,
        current_step: params.currentStepId,
        session_data: params.sessionData ?? {},
        status: "active",
        last_interaction_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "conversation_id" },
    )
    .select(
      "id,conversation_id,current_flow,current_step,session_data,status,last_interaction_at,expires_at",
    )
    .maybeSingle();

  if (error) return null;
  return (data as SessionRow) ?? null;
}

export async function touchSession(conversationId: string) {
  const client = getSupabaseAdminClient();

  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000);
  await client
    .from("sessions")
    .update({
      last_interaction_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("conversation_id", conversationId);
}

export async function updateSession(conversationId: string, patch: {
  currentFlowId?: string | null;
  currentStepId?: string | null;
  sessionData?: Record<string, unknown>;
  status?: string;
}) {
  const client = getSupabaseAdminClient();
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000);

  const updatePayload: Record<string, unknown> = {
    last_interaction_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  if (typeof patch.currentFlowId !== "undefined") updatePayload.current_flow = patch.currentFlowId;
  if (typeof patch.currentStepId !== "undefined") updatePayload.current_step = patch.currentStepId;
  if (typeof patch.sessionData !== "undefined") updatePayload.session_data = patch.sessionData;
  if (typeof patch.status !== "undefined") updatePayload.status = patch.status;

  const { error } = await client.from("sessions").update(updatePayload).eq("conversation_id", conversationId);
  return { error };
}

export async function endSession(conversationId: string) {
  const client = getSupabaseAdminClient();
  await client.from("sessions").update({ status: "completed" }).eq("conversation_id", conversationId);
}

