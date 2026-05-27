-- WhatsApp Cloud API credentials (single-row admin use, but can support multiple accounts).
create extension if not exists pgcrypto;

create table if not exists public.whatsapp_accounts (
  id uuid primary key default gen_random_uuid(),
  access_token text not null,
  phone_number_id text not null unique,
  business_account_id text not null,
  verify_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_whatsapp_accounts_updated_at on public.whatsapp_accounts;
create trigger set_whatsapp_accounts_updated_at
before update on public.whatsapp_accounts
for each row execute function public.set_updated_at();

