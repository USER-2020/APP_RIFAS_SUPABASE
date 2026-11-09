create table public.api_consumers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) >= 2),
  email text not null unique,
  active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.integrations add column if not exists api_consumer_id uuid references public.api_consumers(id) on delete set null;
create index integrations_api_consumer_idx on public.integrations(api_consumer_id);

alter table public.api_consumers enable row level security;
create policy "admins manage api consumers" on public.api_consumers for all using (public.is_admin()) with check (public.is_admin());
