import { getSupabaseAdminClient } from "@/services/database-service/supabase-admin";
import type { FlowDefinition, WorkflowStep } from "@/types/workflow";

function mapStep(stepRow: {
  step_id: string;
  type: string;
  payload: Record<string, unknown>;
}): WorkflowStep {
  return {
    id: stepRow.step_id,
    type: stepRow.type as WorkflowStep["type"],
    payload: stepRow.payload ?? {},
  };
}

export async function getFlowById(flowId: string): Promise<FlowDefinition | null> {
  const client = getSupabaseAdminClient();

  const { data: flowRow, error: flowError } = await client
    .from("flows")
    .select("id,enabled,trigger_keywords,fallback_flow_id")
    .eq("id", flowId)
    .maybeSingle();

  if (flowError || !flowRow) return null;

  const { data: stepRows, error: stepError } = await client
    .from("flow_steps")
    .select("step_index,step_id,type,payload")
    .eq("flow_id", flowId)
    .order("step_index", { ascending: true });

  if (stepError || !stepRows) return null;

  return {
    id: flowRow.id,
    enabled: !!flowRow.enabled,
    triggerKeywords: (flowRow.trigger_keywords ?? []) as string[],
    fallbackFlowId: flowRow.fallback_flow_id ?? null,
    steps: stepRows.map(mapStep),
  };
}

export async function getFlowByTrigger(
  messageText?: string,
): Promise<FlowDefinition | null> {
  if (!messageText) return null;

  const text = messageText.toLowerCase();
  const client = getSupabaseAdminClient();

  const { data: flows, error } = await client
    .from("flows")
    .select("id,enabled,trigger_keywords,fallback_flow_id")
    .eq("enabled", true);

  if (error || !flows) return null;

  for (const flow of flows) {
    const keywords = (flow.trigger_keywords ?? []) as string[];
    const hit = keywords.some((k) => text.includes(String(k).toLowerCase()));
    if (hit) {
      return getFlowById(flow.id);
    }
  }

  return null;
}

export async function getFallbackFlow(): Promise<FlowDefinition | null> {
  // By convention, we seed a global fallback flow with this ID.
  const fallback = await getFlowById("fallback_flow");
  if (fallback) return fallback;

  // Last resort: return the first enabled flow so execution can proceed.
  const client = getSupabaseAdminClient();
  const { data } = await client
    .from("flows")
    .select("id")
    .eq("enabled", true)
    .limit(1)
    .maybeSingle();

  if (!data?.id) return null;
  return getFlowById(data.id);
}

