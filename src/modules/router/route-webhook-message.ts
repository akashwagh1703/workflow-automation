import type { FlowDefinition, WorkflowStep } from "@/types/workflow";

import { getSupabaseAdminClient } from "@/services/database-service/supabase-admin";
import {
  getActiveSession,
  startSession,
  touchSession,
  updateSession,
  endSession,
} from "@/services/session-service/session-store";
import type { SessionRow } from "@/services/session-service/session-store";
import {
  getFallbackFlow,
  getFlowById,
  getFlowByTrigger,
} from "@/services/flow-engine/flow-engine";
import { executeStep } from "@/services/flow-executor/flow-executor";

export type WebhookRouteInput = {
  conversationId: string;
  messageId: string;
  phoneNumberId?: string;
  senderPhone?: string;
};

function findFirstStep(flow: FlowDefinition): WorkflowStep | null {
  return flow.steps[0] ?? null;
}

function getStepIndex(flow: FlowDefinition, stepId: string) {
  return flow.steps.findIndex((s) => s.id === stepId);
}

async function runStep(params: {
  conversationId: string;
  messageText: string;
  flow: FlowDefinition;
  step: WorkflowStep;
  session: SessionRow;
  phoneNumberId?: string;
  senderPhone?: string;
}) {
  await executeStep({
    conversationId: params.conversationId,
    messageText: params.messageText,
    step: params.step,
    flow: params.flow,
    session: params.session,
    phoneNumberId: params.phoneNumberId,
    recipientPhone: params.senderPhone,
  });
}

/** Continue an active session: process input/condition on current step, else advance. */
async function continueActiveSession(
  input: WebhookRouteInput,
  activeSession: SessionRow,
  messageText: string,
) {
  if (!activeSession.current_flow || !activeSession.current_step) {
    await touchSession(input.conversationId);
    return;
  }

  const flow = await getFlowById(activeSession.current_flow);
  if (!flow) {
    await endSession(input.conversationId);
    return;
  }

  const currentIndex = getStepIndex(flow, activeSession.current_step);
  const currentStep =
    currentIndex >= 0 ? flow.steps[currentIndex] : findFirstStep(flow);

  if (!currentStep) {
    await endSession(input.conversationId);
    return;
  }

  if (currentStep.type === "input" || currentStep.type === "condition") {
    await runStep({
      conversationId: input.conversationId,
      messageText,
      flow,
      step: currentStep,
      session: activeSession,
      phoneNumberId: input.phoneNumberId,
      senderPhone: input.senderPhone,
    });
    await touchSession(input.conversationId);
    return;
  }

  const nextStep = flow.steps[currentIndex + 1];
  if (!nextStep) {
    await endSession(input.conversationId);
    return;
  }

  await updateSession(input.conversationId, {
    currentStepId: nextStep.id,
    status: "active",
  });

  const refreshed = await getActiveSession(input.conversationId);
  if (!refreshed) return;

  await runStep({
    conversationId: input.conversationId,
    messageText,
    flow,
    step: nextStep,
    session: refreshed,
    phoneNumberId: input.phoneNumberId,
    senderPhone: input.senderPhone,
  });
  await touchSession(input.conversationId);
}

async function startFlow(
  input: WebhookRouteInput,
  flow: FlowDefinition,
  messageText: string,
) {
  const firstStep = findFirstStep(flow);
  if (!firstStep) return;

  const session = await startSession({
    conversationId: input.conversationId,
    currentFlowId: flow.id,
    currentStepId: firstStep.id,
    sessionData: {},
  });

  if (!session) return;

  await runStep({
    conversationId: input.conversationId,
    messageText,
    flow,
    step: firstStep,
    session,
    phoneNumberId: input.phoneNumberId,
    senderPhone: input.senderPhone,
  });
  await touchSession(input.conversationId);
}

export async function routeWebhookMessage(input: WebhookRouteInput) {
  const client = getSupabaseAdminClient();

  const { data: msgRow } = await client
    .from("messages")
    .select("id,message,type")
    .eq("id", input.messageId)
    .maybeSingle();

  const messageText = (msgRow?.message ?? "").toString();

  const activeSession = await getActiveSession(input.conversationId);
  if (activeSession) {
    await continueActiveSession(input, activeSession, messageText);
    return;
  }

  const flow = await getFlowByTrigger(messageText);
  if (flow) {
    await startFlow(input, flow, messageText);
    return;
  }

  const fallbackFlow = await getFallbackFlow();
  if (fallbackFlow) {
    await startFlow(input, fallbackFlow, messageText);
  }
}
