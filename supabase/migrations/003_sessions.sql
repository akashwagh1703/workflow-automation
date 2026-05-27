-- Session state for active workflow execution.
create extension if not exists pgcrypto;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references public.conversations(id),

  current_flow text,
  current_step text,

  session_data jsonb not null default '{}'::jsonb,
  status text not null default 'active',

  last_interaction_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),

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

drop trigger if exists set_sessions_updated_at on public.sessions;
create trigger set_sessions_updated_at
before update on public.sessions
for each row execute function public.set_updated_at();

create index if not exists sessions_status_idx on public.sessions(status);
create index if not exists sessions_expires_at_idx on public.sessions(expires_at);

