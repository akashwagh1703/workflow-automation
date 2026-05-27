import { z } from "zod";
import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/services/database-service/supabase-admin";

const stepSchema = z.object({
  step_id: z.string().min(1),
  type: z.enum([
    "message",
    "buttons",
    "list",
    "input",
    "condition",
    "api",
    "end",
  ]),
  payload: z.record(z.string(), z.unknown()).default({}),
});

const flowUpsertSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, "Flow id must be lowercase letters, numbers, underscores"),
  name: z.string().min(1),
  trigger_keywords: z.array(z.string()).default([]),
  fallback_flow_id: z.string().nullable().optional(),
  enabled: z.boolean().default(true),
  steps: z.array(stepSchema).default([]),
});

export async function GET() {
  const client = getSupabaseAdminClient();

  const { data: flows, error } = await client
    .from("flows")
    .select("id,name,trigger_keywords,fallback_flow_id,enabled,created_at,updated_at")
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const flowIds = (flows ?? []).map((f) => f.id);
  const countByFlow = new Map<string, number>();

  if (flowIds.length) {
    const { data: stepCounts } = await client
      .from("flow_steps")
      .select("flow_id")
      .in("flow_id", flowIds);

    for (const row of stepCounts ?? []) {
      const fid = row.flow_id as string;
      countByFlow.set(fid, (countByFlow.get(fid) ?? 0) + 1);
    }
  }

  return NextResponse.json({
    ok: true,
    flows: (flows ?? []).map((f) => ({
      ...f,
      stepCount: countByFlow.get(f.id) ?? 0,
    })),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = flowUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { id, name, trigger_keywords, fallback_flow_id, enabled, steps } =
    parsed.data;

  const client = getSupabaseAdminClient();

  const { error: flowError } = await client.from("flows").upsert(
    {
      id,
      name,
      trigger_keywords,
      fallback_flow_id: fallback_flow_id ?? null,
      enabled,
    },
    { onConflict: "id" },
  );

  if (flowError) {
    return NextResponse.json(
      { ok: false, error: flowError.message },
      { status: 500 },
    );
  }

  const { error: deleteError } = await client
    .from("flow_steps")
    .delete()
    .eq("flow_id", id);

  if (deleteError) {
    return NextResponse.json(
      { ok: false, error: deleteError.message },
      { status: 500 },
    );
  }

  if (steps.length) {
    const rows = steps.map((step, index) => ({
      flow_id: id,
      step_index: index,
      step_id: step.step_id,
      type: step.type,
      payload: step.payload,
    }));

    const { error: stepsError } = await client.from("flow_steps").insert(rows);
    if (stepsError) {
      return NextResponse.json(
        { ok: false, error: stepsError.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, id });
}
