-- Foundation for external platforms such as REM Experience.
-- Tokens are stored as SHA-256 hashes; the raw token is returned only at creation time.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) >= 2),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) >= 2),
  provider_key text not null unique check (provider_key ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.integration_tokens (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integrations(id) on delete cascade,
  token_prefix text not null,
  token_hash text not null unique,
  scopes text[] not null default array['raffles:read','raffles:write']::text[],
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint integration_token_prefix_check check (token_prefix ~ '^rfly_live_[a-zA-Z0-9]{8}$'),
  constraint integration_token_hash_check check (length(token_hash) = 64)
);

alter table public.raffles add column if not exists organization_id uuid references public.organizations(id) on delete set null;

create index integrations_organization_idx on public.integrations(organization_id);
create index integration_tokens_integration_idx on public.integration_tokens(integration_id);
create index integration_tokens_active_lookup_idx on public.integration_tokens(token_hash) where revoked_at is null;
create index raffles_organization_idx on public.raffles(organization_id);

alter table public.organizations enable row level security;
alter table public.integrations enable row level security;
alter table public.integration_tokens enable row level security;

create policy "admins manage organizations" on public.organizations
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage integrations" on public.integrations
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage integration tokens" on public.integration_tokens
  for all using (public.is_admin()) with check (public.is_admin());

comment on table public.integration_tokens is 'Only token hashes are stored. Raw tokens must never be persisted or returned after creation.';
