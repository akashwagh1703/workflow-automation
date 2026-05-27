import { NextResponse } from "next/server";

import { apiError, apiOk } from "@/lib/api/errors";
import { getSupabaseAdminClient } from "@/services/database-service/supabase-admin";
import { routeWebhookMessage } from "@/modules/router/route-webhook-message";
import { parseWebhookPayload } from "@/services/whatsapp-service/parse-webhook";
import { verifyMetaWebhookSignature } from "@/services/whatsapp-service/verify-signature";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const verifyToken = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (!mode || !verifyToken || !challenge) {
    return apiError("Missing webhook params", 400);
  }

  if (mode !== "subscribe") {
    return apiError("Unsupported hub.mode", 400);
  }

  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from("whatsapp_accounts")
    .select("id")
    .eq("verify_token", verifyToken)
    .limit(1)
    .maybeSingle();

  if (error) return apiError(error.message, 500);
  if (!data?.id) return apiError("Invalid verify_token", 403);

  return new NextResponse(challenge, { status: 200 });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyMetaWebhookSignature(rawBody, signature)) {
    return apiError("Invalid webhook signature", 401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = parseWebhookPayload(payload);

  if (parsed.kind === "status" || parsed.kind === "ignored") {
    return apiOk({});
  }

  if (parsed.kind === "error") {
    return apiError(parsed.error, 400);
  }

  const {
    phoneNumberId,
    senderPhone,
    senderName,
    whatsappMessageId,
    messageText,
    messageType,
    rawPayload,
  } = parsed.data;

  const client = getSupabaseAdminClient();

  if (whatsappMessageId) {
    const { data: existing } = await client
      .from("messages")
      .select("id")
      .eq("whatsapp_message_id", whatsappMessageId)
      .maybeSingle();

    if (existing?.id) {
      return apiOk({ duplicate: true });
    }
  }

  const { data: waRow, error: waError } = await client
    .from("whatsapp_accounts")
    .select("id")
    .eq("phone_number_id", phoneNumberId)
    .limit(1)
    .maybeSingle();

  if (waError) return apiError(waError.message, 500);
  if (!waRow?.id) {
    return apiError(`No whatsapp account for phone_number_id=${phoneNumberId}`, 404);
  }

  const { data: contactData, error: contactError } = await client
    .from("contacts")
    .upsert(
      {
        phone: senderPhone,
        name: senderName ?? senderPhone,
      },
      { onConflict: "phone" },
    )
    .select("id")
    .maybeSingle();

  if (contactError) return apiError(contactError.message, 500);
  if (!contactData?.id) return apiError("Failed to upsert contact", 500);

  const { data: conversationData, error: convoError } = await client
    .from("conversations")
    .upsert(
      {
        whatsapp_account_id: waRow.id,
        contact_id: contactData.id,
        status: "active",
        last_interaction_at: new Date().toISOString(),
      },
      { onConflict: "whatsapp_account_id,contact_id" },
    )
    .select("id")
    .maybeSingle();

  if (convoError) return apiError(convoError.message, 500);
  if (!conversationData?.id) return apiError("Failed to upsert conversation", 500);

  const { data: msgData, error: msgError } = await client
    .from("messages")
    .insert({
      conversation_id: conversationData.id,
      direction: "inbound",
      type: messageType,
      message: messageText,
      whatsapp_message_id: whatsappMessageId,
      status: "received",
      raw_payload: rawPayload,
    })
    .select("id")
    .maybeSingle();

  if (msgError) {
    if (msgError.code === "23505" && whatsappMessageId) {
      return apiOk({ duplicate: true });
    }
    return apiError(msgError.message, 500);
  }

  if (!msgData?.id) return apiError("Failed to store message", 500);

  try {
    await routeWebhookMessage({
      conversationId: conversationData.id,
      messageId: msgData.id,
      phoneNumberId,
      senderPhone,
    });
  } catch (e) {
    console.error("routeWebhookMessage failed", e);
  }

  return apiOk({});
}
