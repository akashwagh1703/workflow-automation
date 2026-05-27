import { z } from "zod";

const messageSchema = z.object({
  from: z.string(),
  id: z.string().optional(),
  timestamp: z.string().optional(),
  type: z.string().optional(),
  text: z.object({ body: z.string().optional() }).optional(),
  interactive: z
    .object({
      type: z.string().optional(),
      button_reply: z
        .object({ id: z.string().optional(), title: z.string().optional() })
        .optional(),
      list_reply: z
        .object({ id: z.string().optional(), title: z.string().optional() })
        .optional(),
    })
    .optional(),
});

const webhookPayloadSchema = z.object({
  object: z.string().optional(),
  entry: z
    .array(
      z.object({
        changes: z.array(
          z.object({
            value: z.object({
              metadata: z
                .object({
                  phone_number_id: z.string(),
                })
                .optional(),
              contacts: z
                .array(
                  z.object({
                    wa_id: z.string().optional(),
                    profile: z.object({ name: z.string().optional() }).optional(),
                  }),
                )
                .optional(),
              messages: z.array(messageSchema).optional(),
              statuses: z.array(z.unknown()).optional(),
            }),
          }),
        ),
      }),
    )
    .optional(),
});

export type ParsedIncomingMessage = {
  phoneNumberId: string;
  senderPhone: string;
  senderName: string | null;
  whatsappMessageId: string | null;
  messageText: string;
  messageType: string;
  rawPayload: unknown;
};

export function parseWebhookPayload(payload: unknown):
  | { kind: "message"; data: ParsedIncomingMessage }
  | { kind: "status" }
  | { kind: "ignored" }
  | { kind: "error"; error: string } {
  const parsed = webhookPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { kind: "error", error: "Invalid webhook payload shape" };
  }

  const value = parsed.data.entry?.[0]?.changes?.[0]?.value;
  if (!value) return { kind: "ignored" };

  if (value.statuses?.length && !value.messages?.length) {
    return { kind: "status" };
  }

  const message = value.messages?.[0];
  const phoneNumberId = value.metadata?.phone_number_id;
  if (!message || !phoneNumberId) {
    return { kind: "ignored" };
  }

  const interactive = message.interactive;
  const messageText =
    message.text?.body ??
    interactive?.button_reply?.title ??
    interactive?.list_reply?.title ??
    interactive?.button_reply?.id ??
    interactive?.list_reply?.id ??
    "";

  const messageType = message.text?.body
    ? "text"
    : interactive?.type ?? message.type ?? "unknown";

  const contactProfile = value.contacts?.find(
    (c) => c.wa_id === message.from || !c.wa_id,
  );

  return {
    kind: "message",
    data: {
      phoneNumberId,
      senderPhone: message.from,
      senderName: contactProfile?.profile?.name ?? null,
      whatsappMessageId: message.id ?? null,
      messageText,
      messageType,
      rawPayload: payload,
    },
  };
}
