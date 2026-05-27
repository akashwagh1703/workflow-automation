import { getSupabaseAdminClient } from "@/services/database-service/supabase-admin";
import { updateSession, endSession } from "@/services/session-service/session-store";
import type { SessionRow } from "@/services/session-service/session-store";
import {
  sendWhatsAppInteractiveButtonsMessage,
  sendWhatsAppInteractiveListMessage,
  sendWhatsAppTextMessage,
} from "@/services/whatsapp-service/send";
import type { FlowDefinition, WorkflowStep } from "@/types/workflow";

export type ExecuteStepInput = {
  conversationId: string;
  recipientPhone?: string;
  phoneNumberId?: string;
  messageText?: string;

  step: WorkflowStep;
  flow: FlowDefinition;
  session: SessionRow;
};

function getStepIndex(flow: FlowDefinition, stepId: string) {
  return flow.steps.findIndex((s) => s.id === stepId);
}

async function persistOutboundMessage(params: {
  conversationId: string;
  type: string;
  message?: string | null;
  whatsappMessageId?: string | null;
  status: "sent" | "failed";
  rawPayload: unknown;
}) {
  const client = getSupabaseAdminClient();
  await client.from("messages").insert({
    conversation_id: params.conversationId,
    direction: "outbound",
    type: params.type,
    message: params.message ?? null,
    whatsapp_message_id: params.whatsappMessageId ?? null,
    status: params.status,
    raw_payload: params.rawPayload ?? {},
  });
}

async function getWhatsAppAccessToken(phoneNumberId?: string) {
  if (!phoneNumberId) return null;
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from("whatsapp_accounts")
    .select("access_token")
    .eq("phone_number_id", phoneNumberId)
    .limit(1)
    .maybeSingle();

  if (error || !data?.access_token) return null;
  return data.access_token as string;
}

export async function executeStep(input: ExecuteStepInput) {
  const { conversationId, phoneNumberId, recipientPhone, step, flow, session } = input;

  const messageText = input.messageText ?? "";
  const payload = (step.payload ?? {}) as Record<string, unknown>;

  const currentIndex = getStepIndex(flow, step.id);
  const sequentialNext = currentIndex >= 0 ? flow.steps[currentIndex + 1] : null;

  // Helper to advance session to a given step id (or complete if null).
  async function advanceToNext(nextStep: WorkflowStep | null) {
    if (!nextStep) {
      await endSession(conversationId);
      return;
    }
    await updateSession(conversationId, {
      currentStepId: nextStep.id,
      status: "active",
    });
  }

  // Steps that do not require sending a message.
  if (step.type === "end") {
    await endSession(conversationId);
    return;
  }

  // For any step that sends to the user, we need Meta credentials.
  const accessToken = await getWhatsAppAccessToken(phoneNumberId);
  if (!accessToken || !recipientPhone) {
    // Fail open: don't crash webhook; just keep session.
    return;
  }

  // Execute step type.
  try {
    if (step.type === "message") {
      const text = String(payload.text ?? payload.message ?? "");
      if (!text) return;

      let status: "sent" | "failed" = "sent";
      let providerMessageId: string | null = null;
      let providerRaw: unknown = null;
      try {
        const res = await sendWhatsAppTextMessage({
          accessToken,
          phoneNumberId: phoneNumberId!,
          to: recipientPhone,
          text,
        });
        providerMessageId = res.messageId;
        providerRaw = res.raw;
      } catch (e) {
        status = "failed";
        providerRaw = { error: e instanceof Error ? e.message : String(e) };
      }

      await persistOutboundMessage({
        conversationId,
        type: "text",
        message: text,
        whatsappMessageId: providerMessageId,
        status,
        rawPayload: { stepId: step.id, stepType: step.type, providerRaw },
      });

      await advanceToNext(sequentialNext);
      return;
    }

    if (step.type === "buttons") {
      const text = String(payload.text ?? "Choose an option");
      const buttons = Array.isArray(payload.buttons) ? (payload.buttons as unknown[]).map(String) : [];
      if (!buttons.length) {
        // If no buttons are configured, just treat it like a message.
        if (text) {
          await persistOutboundMessage({
            conversationId,
            type: "text",
            message: text,
            status: "failed",
            rawPayload: { stepId: step.id, stepType: step.type, reason: "No buttons configured" },
          });
        }
        await advanceToNext(sequentialNext);
        return;
      }

      let status: "sent" | "failed" = "sent";
      let providerMessageId: string | null = null;
      let providerRaw: unknown = null;
      try {
        const res = await sendWhatsAppInteractiveButtonsMessage({
          accessToken,
          phoneNumberId: phoneNumberId!,
          to: recipientPhone,
          text,
          buttons,
        });
        providerMessageId = res.messageId;
        providerRaw = res.raw;
      } catch (e) {
        status = "failed";
        providerRaw = { error: e instanceof Error ? e.message : String(e) };
      }

      await persistOutboundMessage({
        conversationId,
        type: "interactive_buttons",
        message: text,
        whatsappMessageId: providerMessageId,
        status,
        rawPayload: { stepId: step.id, stepType: step.type, buttons, providerRaw },
      });

      await advanceToNext(sequentialNext);
      return;
    }

    if (step.type === "list") {
      const text = String(payload.text ?? "Choose an option");
      const sectionTitle = String(payload.sectionTitle ?? payload.section_title ?? "Options");
      const rows = Array.isArray(payload.rows)
        ? (payload.rows as unknown[]).map(String)
        : Array.isArray(payload.items)
          ? (payload.items as unknown[]).map(String)
          : Array.isArray(payload.options)
            ? (payload.options as unknown[]).map(String)
            : [];

      if (!rows.length) {
        if (text) {
          await persistOutboundMessage({
            conversationId,
            type: "text",
            message: text,
            status: "failed",
            rawPayload: { stepId: step.id, stepType: step.type, reason: "No list rows configured" },
          });
        }
        await advanceToNext(sequentialNext);
        return;
      }

      let status: "sent" | "failed" = "sent";
      let providerMessageId: string | null = null;
      let providerRaw: unknown = null;
      try {
        const res = await sendWhatsAppInteractiveListMessage({
          accessToken,
          phoneNumberId: phoneNumberId!,
          to: recipientPhone,
          text,
          sectionTitle,
          rows,
        });
        providerMessageId = res.messageId;
        providerRaw = res.raw;
      } catch (e) {
        status = "failed";
        providerRaw = { error: e instanceof Error ? e.message : String(e) };
      }

      await persistOutboundMessage({
        conversationId,
        type: "interactive_list",
        message: text,
        whatsappMessageId: providerMessageId,
        status,
        rawPayload: { stepId: step.id, stepType: step.type, rows, providerRaw },
      });

      await advanceToNext(sequentialNext);
      return;
    }

    if (step.type === "input") {
      const key = String(payload.key ?? payload.session_key ?? "input");
      const prompt = String(payload.prompt ?? payload.text ?? "Please enter a value");
      const promptFlag = `__input_prompted_${step.id}`;

      const alreadyPrompted = session.session_data?.[promptFlag] === true;
      if (!alreadyPrompted) {
        // 1) Ask the question (stay on same step until user replies).
        let status: "sent" | "failed" = "sent";
        let providerMessageId: string | null = null;
        let providerRaw: unknown = null;
        try {
          const res = await sendWhatsAppTextMessage({
            accessToken,
            phoneNumberId: phoneNumberId!,
            to: recipientPhone,
            text: prompt,
          });
          providerMessageId = res.messageId;
          providerRaw = res.raw;
        } catch (e) {
          status = "failed";
          providerRaw = { error: e instanceof Error ? e.message : String(e) };
        }

        await persistOutboundMessage({
          conversationId,
          type: "text",
          message: prompt,
          whatsappMessageId: providerMessageId,
          status,
          rawPayload: { stepId: step.id, prompt, providerRaw },
        });

        await updateSession(conversationId, {
          sessionData: { ...(session.session_data ?? {}), [promptFlag]: true, [`__input_key_${step.id}`]: key },
          status: "active",
          currentStepId: step.id,
        });
        return;
      }

      // 2) Capture the user response and advance.
      const inputValue = messageText.trim();
      const nextStep = sequentialNext;
      const ackText = String(payload.ack_text ?? payload.ackText ?? "Thanks!");

      let providerMessageId: string | null = null;
      let providerRaw: unknown = null;
      try {
        const res = await sendWhatsAppTextMessage({
          accessToken,
          phoneNumberId: phoneNumberId!,
          to: recipientPhone,
          text: ackText,
        });
        providerMessageId = res.messageId;
        providerRaw = res.raw;
      } catch (e) {
        providerRaw = { error: e instanceof Error ? e.message : String(e) };
      }

      await persistOutboundMessage({
        conversationId,
        type: "text",
        message: ackText,
        whatsappMessageId: providerMessageId,
        status: "sent",
        rawPayload: { stepId: step.id, ackText, providerRaw },
      });

      await updateSession(conversationId, {
        sessionData: {
          ...(session.session_data ?? {}),
          [key]: inputValue,
        },
        status: "active",
      });

      await advanceToNext(nextStep);
      return;
    }

    if (step.type === "condition") {
      const operator = String(payload.operator ?? payload.match ?? "equals");
      const expected = String(payload.value ?? payload.expected ?? "");
      const thenStepId = String(payload.then_step_id ?? payload.true_step_id ?? "");
      const elseStepId = String(payload.else_step_id ?? payload.false_step_id ?? "");

      const inputLower = messageText.trim().toLowerCase();
      const expectedLower = expected.trim().toLowerCase();

      const matches =
        operator === "includes" ? inputLower.includes(expectedLower) : inputLower === expectedLower;

      const nextId = matches ? thenStepId : elseStepId;
      const nextStep =
        flow.steps.find((s) => s.id === nextId) ?? sequentialNext;

      await updateSession(conversationId, {
        currentStepId: nextStep ? nextStep.id : null,
        status: "active",
      });
      return;
    }

    if (step.type === "api") {
      const url = String(payload.url ?? "");
      if (!url) return;

      const method = String(payload.method ?? "POST").toUpperCase();
      const headers = (payload.headers ?? {}) as Record<string, string>;
      const body = payload.body;
      const storeKey = String(payload.storeKey ?? payload.store_key ?? "api_result");

      let apiResult: unknown = null;
      try {
        const res = await fetch(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        apiResult = await res.json().catch(() => null);
      } catch (e) {
        apiResult = { error: e instanceof Error ? e.message : String(e) };
      }

      await updateSession(conversationId, {
        sessionData: { ...(session.session_data ?? {}), [storeKey]: apiResult },
        status: "active",
      });

      const replyText = payload.reply_text ?? payload.replyText ?? null;
      if (typeof replyText === "string" && replyText) {
        let providerMessageId: string | null = null;
        let providerRaw: unknown = null;
        try {
          const res = await sendWhatsAppTextMessage({
            accessToken,
            phoneNumberId: phoneNumberId!,
            to: recipientPhone,
            text: replyText,
          });
          providerMessageId = res.messageId;
          providerRaw = res.raw;
        } catch (e) {
          providerRaw = { error: e instanceof Error ? e.message : String(e) };
        }

        await persistOutboundMessage({
          conversationId,
          type: "text",
          message: replyText,
          whatsappMessageId: providerMessageId,
          status: "sent",
          rawPayload: { stepId: step.id, type: "api_reply", providerRaw, apiResult },
        });
      }

      await advanceToNext(sequentialNext);
      return;
    }
  } catch {
    // Never throw; webhook handlers should remain resilient.
    return;
  }
}

