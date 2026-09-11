alter table public.raffles add column if not exists is_featured boolean not null default false;
create unique index if not exists one_featured_public_raffle on public.raffles (is_featured) where is_featured = true;

create or replace function public.set_featured_raffle(p_raffle_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'No autorizado'; end if;
  if not exists (select 1 from public.raffles where id = p_raffle_id and status in ('active','closed')) then raise exception 'La rifa no puede ser destacada'; end if;
  update public.raffles set is_featured = false, updated_at = now();
  update public.raffles set is_featured = true, updated_at = now() where id = p_raffle_id;
end;
$$;

grant execute on function public.set_featured_raffle(uuid) to authenticated;