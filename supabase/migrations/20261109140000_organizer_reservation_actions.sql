create or replace function public.confirm_organization_reservation(p_reservation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.reservations r
    join public.raffles rf on rf.id = r.raffle_id
    join public.integrations i on i.organization_id = rf.organization_id
    join public.api_consumers c on c.id = i.api_consumer_id
    where r.id = p_reservation_id and c.owner_user_id = auth.uid()
  ) then
    raise exception 'No autorizado para esta reserva';
  end if;

  if exists (select 1 from public.reservations where id = p_reservation_id and reserved_until <= now()) then
    raise exception 'La reserva venció y ya no puede confirmarse';
  end if;

  update public.reservations
  set status = 'confirmed', confirmed_at = now(), confirmed_by = auth.uid(), updated_at = now()
  where id = p_reservation_id and status = 'pending';
  if not found then raise exception 'La reserva no está pendiente'; end if;

  update public.raffle_numbers
  set status = 'confirmed', updated_at = now()
  where id in (select raffle_number_id from public.reservation_numbers where reservation_id = p_reservation_id);
end;
$$;

create or replace function public.reject_organization_reservation(p_reservation_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.reservations r
    join public.raffles rf on rf.id = r.raffle_id
    join public.integrations i on i.organization_id = rf.organization_id
    join public.api_consumers c on c.id = i.api_consumer_id
    where r.id = p_reservation_id and c.owner_user_id = auth.uid()
  ) then
    raise exception 'No autorizado para esta reserva';
  end if;

  update public.reservations
  set status = 'rejected', rejected_at = now(), rejected_by = auth.uid(), rejection_reason = nullif(trim(p_reason), ''), updated_at = now()
  where id = p_reservation_id and status = 'pending';
  if not found then raise exception 'La reserva no está pendiente'; end if;

  update public.raffle_numbers
  set status = 'available', updated_at = now()
  where id in (select raffle_number_id from public.reservation_numbers where reservation_id = p_reservation_id);
end;
$$;

grant execute on function public.confirm_organization_reservation(uuid) to authenticated;
grant execute on function public.reject_organization_reservation(uuid, text) to authenticated;

notify pgrst, 'reload schema';
