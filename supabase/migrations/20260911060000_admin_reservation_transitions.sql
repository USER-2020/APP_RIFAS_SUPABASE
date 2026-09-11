-- Serialize decisions with number allocation and reject stale confirmations.
create or replace function public.confirm_reservation(p_reservation_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare target public.reservations;
begin
  if not public.is_admin() then raise exception 'No autorizado'; end if;
  select * into target from public.reservations where id = p_reservation_id;
  if not found then raise exception 'La reserva no existe'; end if;
  perform 1 from public.raffles where id = target.raffle_id for update;
  select * into target from public.reservations where id = p_reservation_id for update;
  if target.status <> 'pending' then raise exception 'La reserva ya no está pendiente. Actualiza el listado'; end if;
  if target.reserved_until <= now() then raise exception 'La reserva está vencida. Libera sus números y crea una nueva reserva'; end if;
  if exists(select 1 from public.reservation_numbers rn join public.raffle_numbers n on n.id = rn.raffle_number_id where rn.reservation_id = target.id and n.status <> 'pending') then
    raise exception 'Los números ya no están pendientes. Actualiza el listado';
  end if;
  update public.reservations set status = 'confirmed', confirmed_at = now(), confirmed_by = auth.uid(), updated_at = now() where id = target.id;
  update public.raffle_numbers set status = 'confirmed', updated_at = now() where id in (select raffle_number_id from public.reservation_numbers where reservation_id = target.id);
end;
$$;

create or replace function public.reject_reservation(p_reservation_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare target public.reservations;
begin
  if not public.is_admin() then raise exception 'No autorizado'; end if;
  select * into target from public.reservations where id = p_reservation_id;
  if not found then raise exception 'La reserva no existe'; end if;
  perform 1 from public.raffles where id = target.raffle_id for update;
  select * into target from public.reservations where id = p_reservation_id for update;
  if target.status <> 'pending' then raise exception 'La reserva ya no está pendiente. Actualiza el listado'; end if;
  update public.reservations set status = 'rejected', rejected_at = now(), rejected_by = auth.uid(), rejection_reason = nullif(trim(p_reason), ''), updated_at = now() where id = target.id;
  update public.raffle_numbers set status = 'available', updated_at = now() where status = 'pending' and id in (select raffle_number_id from public.reservation_numbers where reservation_id = target.id);
end;
$$;
revoke all on function public.confirm_reservation(uuid) from public, anon;
revoke all on function public.reject_reservation(uuid, text) from public, anon;
grant execute on function public.confirm_reservation(uuid) to authenticated;
grant execute on function public.reject_reservation(uuid, text) to authenticated;
