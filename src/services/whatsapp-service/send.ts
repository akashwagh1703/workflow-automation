import { env } from "@/config/env";

export async function sendWhatsAppTextMessage(params: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  text: string;
}) {
  const version = env.META_GRAPH_API_VERSION.startsWith("v")
    ? env.META_GRAPH_API_VERSION
    : `v${env.META_GRAPH_API_VERSION}`;

  const url = `https://graph.facebook.com/${version}/${encodeURIComponent(
    params.phoneNumberId,
  )}/messages?access_token=${encodeURIComponent(params.accessToken)}`;

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: params.to,
    type: "text",
    text: { body: params.text },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error?.message ?? "Failed to send WhatsApp text message");
  }

  const id = json?.messages?.[0]?.id ?? null;
  return { messageId: id, raw: json };
}

function slugifyButtonId(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 40);
}

export async function sendWhatsAppInteractiveButtonsMessage(params: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  text: string;
  buttons: string[];
}) {
  const version = env.META_GRAPH_API_VERSION.startsWith("v")
    ? env.META_GRAPH_API_VERSION
    : `v${env.META_GRAPH_API_VERSION}`;

  const url = `https://graph.facebook.com/${version}/${encodeURIComponent(
    params.phoneNumberId,
  )}/messages?access_token=${encodeURIComponent(params.accessToken)}`;

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: params.to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: params.text },
      action: {
        buttons: params.buttons.map((title) => ({
          type: "reply",
          reply: { id: `btn_${slugifyButtonId(title)}`, title },
        })),
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      json?.error?.message ?? "Failed to send WhatsApp interactive buttons",
    );
  }

  const id = json?.messages?.[0]?.id ?? null;
  return { messageId: id, raw: json };
}

export async function sendWhatsAppInteractiveListMessage(params: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  text: string;
  sectionTitle: string;
  rows: string[];
}) {
  const version = env.META_GRAPH_API_VERSION.startsWith("v")
    ? env.META_GRAPH_API_VERSION
    : `v${env.META_GRAPH_API_VERSION}`;

  const url = `https://graph.facebook.com/${version}/${encodeURIComponent(
    params.phoneNumberId,
  )}/messages?access_token=${encodeURIComponent(params.accessToken)}`;

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: params.to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: params.text },
      action: {
        button: "Open",
        sections: [
          {
            title: params.sectionTitle,
            rows: params.rows.map((title) => ({
              id: `row_${slugifyButtonId(title)}`,
              title,
            })),
          },
        ],
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error?.message ?? "Failed to send WhatsApp list");
  }

  const id = json?.messages?.[0]?.id ?? null;
  return { messageId: id, raw: json };
}

