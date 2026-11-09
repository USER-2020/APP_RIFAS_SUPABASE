create table public.participation_tokens (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integrations(id) on delete cascade,
  raffle_id uuid not null references public.raffles(id) on delete cascade,
  external_purchase_id text not null check (length(trim(external_purchase_id)) between 1 and 180),
  external_user_id text check (external_user_id is null or length(trim(external_user_id)) between 1 and 180),
  customer_name text not null check (length(trim(customer_name)) >= 3),
  customer_email text,
  customer_phone text not null,
  customer_phone_normalized text not null,
  token_prefix text not null,
  token_hash text not null unique,
  allowed_numbers integer not null check (allowed_numbers between 1 and 100),
  status text not null default 'active' check (status in ('active','redeemed','revoked','expired')),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint participation_token_prefix_check check (token_prefix ~ '^rfly_claim_[a-zA-Z0-9]{8}$'),
  constraint participation_token_hash_check check (length(token_hash) = 64),
  unique (integration_id, raffle_id, external_purchase_id)
);

alter table public.reservations add column if not exists source text not null default 'public' check (source in ('public','integration'));
alter table public.reservations add column if not exists integration_id uuid references public.integrations(id) on delete set null;
alter table public.reservations add column if not exists external_purchase_id text;
alter table public.reservations add column if not exists external_user_id text;
alter table public.reservations add column if not exists participation_token_id uuid unique references public.participation_tokens(id) on delete set null;

create index participation_tokens_lookup_idx on public.participation_tokens(token_hash) where status = 'active';
create index participation_tokens_raffle_idx on public.participation_tokens(raffle_id, status);
create index reservations_external_purchase_idx on public.reservations(integration_id, external_purchase_id);

alter table public.participation_tokens enable row level security;
create policy "admins read participation tokens" on public.participation_tokens for select using (public.is_admin());

create or replace function public.redeem_participation_token(
  p_token_id uuid,
  p_selected_numbers integer[]
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  token_row public.participation_tokens;
  raffle_row public.raffles;
  customer_row public.customers;
  reservation_row public.reservations;
  selected_count integer := coalesce(array_length(p_selected_numbers, 1), 0);
  unavailable integer;
  available_count integer;
  code_value text;
begin
  select * into token_row from public.participation_tokens where id = p_token_id for update;
  if not found then raise exception 'El token de participación no existe'; end if;
  if token_row.status <> 'active' then raise exception 'El token ya fue utilizado o revocado'; end if;
  if token_row.expires_at <= now() then
    update public.participation_tokens set status = 'expired', updated_at = now() where id = token_row.id;
    raise exception 'El token de participación venció';
  end if;
  if selected_count = 0 or selected_count > token_row.allowed_numbers then raise exception 'La cantidad de números no es válida'; end if;
  if selected_count <> (select count(distinct selected_number) from unnest(p_selected_numbers) as selected_number) then raise exception 'Hay números repetidos'; end if;

  select * into raffle_row from public.raffles where id = token_row.raffle_id for update;
  if not found or raffle_row.status <> 'active' or raffle_row.sales_close_at <= now() then raise exception 'Las ventas están cerradas'; end if;
  select count(*) into available_count from public.raffle_numbers where raffle_id = token_row.raffle_id and number = any(p_selected_numbers);
  if available_count <> selected_count then raise exception 'Uno de los números no existe en esta rifa'; end if;
  select count(*) into unavailable from public.raffle_numbers where raffle_id = token_row.raffle_id and number = any(p_selected_numbers) and status <> 'available';
  if unavailable > 0 then raise exception 'Uno de los números ya no está disponible'; end if;

  insert into public.customers(name, phone, phone_normalized)
  values (trim(token_row.customer_name), token_row.customer_phone, token_row.customer_phone_normalized)
  on conflict(phone_normalized) do update set name = excluded.name, phone = excluded.phone, updated_at = now()
  returning * into customer_row;

  code_value := 'RF-' || upper(substr(replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.reservations(code, raffle_id, customer_id, status, price_per_number, quantity, total, reserved_until, confirmed_at, source, integration_id, external_purchase_id, external_user_id, participation_token_id)
  values (code_value, token_row.raffle_id, customer_row.id, 'confirmed', raffle_row.price_per_number, selected_count, raffle_row.price_per_number * selected_count, now(), now(), 'integration', token_row.integration_id, token_row.external_purchase_id, token_row.external_user_id, token_row.id)
  returning * into reservation_row;
  insert into public.reservation_numbers(reservation_id, raffle_number_id)
  select reservation_row.id, id from public.raffle_numbers where raffle_id = token_row.raffle_id and number = any(p_selected_numbers);
  update public.raffle_numbers set status = 'confirmed', updated_at = now() where raffle_id = token_row.raffle_id and number = any(p_selected_numbers);
  update public.participation_tokens set status = 'redeemed', redeemed_at = now(), last_used_at = now() where id = token_row.id;

  return jsonb_build_object('reservation_id', reservation_row.id, 'reservation_code', reservation_row.code, 'numbers', p_selected_numbers, 'quantity', reservation_row.quantity, 'total', reservation_row.total, 'raffle_title', raffle_row.title);
end;
$$;

revoke all on function public.redeem_participation_token(uuid,integer[]) from public, anon, authenticated;
grant execute on function public.redeem_participation_token(uuid,integer[]) to service_role;
notify pgrst, 'reload schema';
