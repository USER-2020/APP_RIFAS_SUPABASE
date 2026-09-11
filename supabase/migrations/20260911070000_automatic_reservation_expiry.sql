-- Use the same raffle -> reservation lock order as allocation and admin decisions.
create or replace function public.release_expired_reservations()
returns integer language plpgsql security definer set search_path = '' as $$
declare target_raffle_id uuid; expired_id uuid; released integer := 0;
begin
  for target_raffle_id in
    select f.id from public.raffles f
    where exists(select 1 from public.reservations r where r.raffle_id = f.id and r.status = 'pending' and r.reserved_until <= now())
    order by f.id for update of f skip locked
  loop
    for expired_id in
      update public.reservations r set status = 'expired', expired_at = now(), updated_at = now()
      where r.raffle_id = target_raffle_id and r.status = 'pending' and r.reserved_until <= now()
      returning r.id
    loop
      update public.raffle_numbers n set status = 'available', updated_at = now()
      where n.status = 'pending'
        and exists(select 1 from public.reservation_numbers rn where rn.reservation_id = expired_id and rn.raffle_number_id = n.id)
        and not exists(select 1 from public.reservation_numbers rn join public.reservations r on r.id = rn.reservation_id where rn.raffle_number_id = n.id and r.status in ('pending', 'confirmed'));
      released := released + 1;
    end loop;
  end loop;
  return released;
end;
$$;
revoke all on function public.release_expired_reservations() from public, anon, authenticated;
grant execute on function public.release_expired_reservations() to service_role;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('rifly-release-expired-reservations', '* * * * *', 'select public.release_expired_reservations();');
