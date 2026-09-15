-- RATHOD HUB VIP Bridge Bot event queue
-- Run once in Supabase SQL Editor.
-- The browser can insert only its own public-safe event. The bridge bot reads
-- and marks events with the Railway-only service_role key.

create table if not exists public.rh_bridge_events (
  id bigint generated always as identity primary key,
  event_type text not null check (char_length(event_type) between 2 and 60),
  delivery_mode text not null default 'digest' check (delivery_mode in ('immediate','digest')),
  user_id uuid references public.profiles(id) on delete set null,
  display_name text not null default 'RATHOD Aspirant',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  delivered_by text
);

create index if not exists rh_bridge_events_pending_idx
  on public.rh_bridge_events(delivery_mode, delivered_at, created_at);

alter table public.rh_bridge_events enable row level security;

drop policy if exists rh_bridge_events_insert_own on public.rh_bridge_events;
create policy rh_bridge_events_insert_own
  on public.rh_bridge_events for insert to authenticated
  with check (user_id=auth.uid());

grant insert on public.rh_bridge_events to authenticated;

-- Keep old bridge events bounded after 30 days. Run manually if pg_cron is not enabled:
-- delete from public.rh_bridge_events where created_at < now() - interval '30 days';
