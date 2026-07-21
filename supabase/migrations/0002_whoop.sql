create table whoop_tokens (
  id integer primary key default 1 check (id = 1),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table whoop_tokens enable row level security;
-- No policies on purpose: with RLS enabled and zero policies, the public anon
-- key can neither read nor write this table. Only the service_role client
-- (server-only) bypasses RLS.
