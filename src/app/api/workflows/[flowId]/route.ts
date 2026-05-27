import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/services/database-service/supabase-admin";
import { getFlowById } from "@/services/flow-engine/flow-engine";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ flowId: string }> },
) {
  const { flowId } = await params;
  const flow = await getFlowById(flowId);

  if (!flow) {
    return NextResponse.json({ ok: false, error: "Flow not found" }, { status: 404 });
  }

  const client = getSupabaseAdminClient();
  const { data: meta } = await client
    .from("flows")
    .select("name,trigger_keywords,fallback_flow_id,enabled")
    .eq("id", flowId)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    flow: {
      id: flow.id,
      name: meta?.name ?? flow.id,
      enabled: flow.enabled,
      trigger_keywords: flow.triggerKeywords,
      fallback_flow_id: flow.fallbackFlowId,
      steps: flow.steps.map((s) => ({
        step_id: s.id,
        type: s.type,
        payload: s.payload,
      })),
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ flowId: string }> },
) {
  const { flowId } = await params;
  const client = getSupabaseAdminClient();

  const { error } = await client.from("flows").delete().eq("id", flowId);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
