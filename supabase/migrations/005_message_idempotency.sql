-- Prevent duplicate processing when Meta retries webhooks.
create unique index if not exists messages_whatsapp_message_id_uq
  on public.messages (whatsapp_message_id)
  where whatsapp_message_id is not null;
