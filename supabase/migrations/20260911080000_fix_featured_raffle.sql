create or replace function public.set_featured_raffle(p_raffle_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if not exists (
    select 1 from public.raffles where id = p_raffle_id and status = 'active'
  ) then
    raise exception 'Solo puedes destacar una rifa activa';
  end if;

  update public.raffles
  set is_featured = false, updated_at = now()
  where is_featured = true;

  update public.raffles
  set is_featured = true, updated_at = now()
  where id = p_raffle_id;
end;
$$;
