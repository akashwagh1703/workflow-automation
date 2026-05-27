-- Workflow definitions (data-driven).
create table if not exists public.flows (
  id text primary key,
  name text not null default '',
  trigger_keywords text[] not null default '{}',
  fallback_flow_id text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists flows_enabled_idx on public.flows(enabled);

-- Trigger for updated_at
drop trigger if exists set_flows_updated_at on public.flows;
create trigger set_flows_updated_at
before update on public.flows
for each row execute function public.set_updated_at();

-- Ensure fallback_flow_id references flows.id (after table exists).
alter table public.flows
  add constraint flows_fallback_flow_id_fk
  foreign key (fallback_flow_id) references public.flows(id)
  on delete set null;

create table if not exists public.flow_steps (
  id uuid primary key default gen_random_uuid(),
  flow_id text not null references public.flows(id) on delete cascade,
  step_index int not null,
  step_id text not null,
  type text not null,
  payload jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create unique index if not exists flow_steps_flowid_stepindex_uq
  on public.flow_steps(flow_id, step_index);

create unique index if not exists flow_steps_flowid_stepid_uq
  on public.flow_steps(flow_id, step_id);

-- Seed example flows so the system is testable right away.
insert into public.flows (id, name, trigger_keywords, fallback_flow_id, enabled)
values
  (
    'welcome_flow',
    'Welcome Flow',
    array['hi','hello']::text[],
    'fallback_flow',
    true
  ),
  (
    'fallback_flow',
    'Fallback Flow',
    array[]::text[],
    null,
    true
  )
on conflict (id) do nothing;

-- welcome_flow steps
insert into public.flow_steps (flow_id, step_index, step_id, type, payload)
values
  (
    'welcome_flow',
    0,
    'step_1',
    'message',
    '{"text":"Welcome to our business"}'::jsonb
  ),
  (
    'welcome_flow',
    1,
    'step_2',
    'buttons',
    '{"text":"How can we help?","buttons":["Support","Pricing","Order"]}'::jsonb
  )
on conflict do nothing;

-- fallback_flow steps
insert into public.flow_steps (flow_id, step_index, step_id, type, payload)
values
  (
    'fallback_flow',
    0,
    'step_1',
    'message',
    '{"text":"Sorry, I did not understand. Type hi to start."}'::jsonb
  )
on conflict do nothing;

