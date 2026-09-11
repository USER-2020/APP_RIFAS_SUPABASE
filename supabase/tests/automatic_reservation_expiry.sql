begin;
do $$
declare test_raffle uuid; admin_id uuid; expired_reservation uuid; active_reservation uuid; confirmed_reservation uuid; result jsonb;
begin
  select id into admin_id from public.profiles where role = 'admin' limit 1;
  if admin_id is null then raise exception 'An admin profile is required'; end if;
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  insert into public.raffles(title, slug, prize_name, price_per_number, number_end, sales_close_at, draw_at, status)
  values ('Prueba temporal', 'expiry-test-' || gen_random_uuid(), 'Premio', 10000, 3, now() + interval '1 day', now() + interval '2 days', 'active') returning id into test_raffle;
  insert into public.raffle_numbers(raffle_id, number, number_display) select test_raffle, n, n::text from generate_series(0, 3) n;
  result := public.create_reservation(test_raffle, 'Prueba temporal', '570000000000', array[0,1]);
  expired_reservation := (result->>'reservation_id')::uuid;
  result := public.create_reservation(test_raffle, 'Prueba temporal', '570000000000', array[2]);
  active_reservation := (result->>'reservation_id')::uuid;
  result := public.create_reservation(test_raffle, 'Prueba temporal', '570000000000', array[3]);
  confirmed_reservation := (result->>'reservation_id')::uuid;
  perform public.confirm_reservation(confirmed_reservation);
  update public.reservations set reserved_until = now() - interval '1 minute' where id in (expired_reservation, confirmed_reservation);
  perform public.release_expired_reservations();
  if not exists(select 1 from public.reservations where id = expired_reservation and status = 'expired' and expired_at is not null) then raise exception 'Reservation not expired'; end if;
  if (select count(*) from public.raffle_numbers where raffle_id = test_raffle and number in (0,1) and status = 'available') <> 2 then raise exception 'Numbers not released'; end if;
  if not exists(select 1 from public.reservations where id = active_reservation and status = 'pending') then raise exception 'Active reservation changed'; end if;
  if not exists(select 1 from public.raffle_numbers where raffle_id = test_raffle and number = 2 and status = 'pending') then raise exception 'Active number changed'; end if;
  if not exists(select 1 from public.raffle_numbers where raffle_id = test_raffle and number = 3 and status = 'confirmed') then raise exception 'Confirmed number changed'; end if;
  perform public.release_expired_reservations();
  result := public.create_reservation(test_raffle, 'Otro comprador', '570000000001', array[0,1]);
  perform public.release_expired_reservations();
  if (select count(*) from public.raffle_numbers where raffle_id = test_raffle and number in (0,1) and status = 'pending') <> 2 then raise exception 'Re-reserved numbers released'; end if;
end;
$$;
rollback;
select 'Expiry, active and confirmed preservation, repeat execution and re-reservation passed' as result;
