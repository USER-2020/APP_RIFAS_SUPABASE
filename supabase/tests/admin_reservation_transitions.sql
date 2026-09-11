-- Run against a migrated database. All fixtures and actions are rolled back.
begin;
do $$
declare raffle_id uuid; admin_id uuid;
begin
  select id into admin_id from public.profiles where role = 'admin' limit 1;
  if admin_id is null then raise exception 'An admin profile is required for this test'; end if;
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  insert into public.raffles(title, slug, prize_name, price_per_number, number_end, sales_close_at, draw_at, status)
  values ('Prueba temporal', 'test-' || gen_random_uuid(), 'Premio', 10000, 2, now() + interval '1 day', now() + interval '2 days', 'active') returning id into raffle_id;
  insert into public.raffle_numbers(raffle_id, number, number_display) select raffle_id, n, n::text from generate_series(0, 2) n;
  perform set_config('test.raffle_id', raffle_id::text, true);
end;
$$;
set local role authenticated;
do $$
declare test_raffle uuid := current_setting('test.raffle_id')::uuid; r jsonb; reservation_id uuid; blocked boolean;
begin
  r := public.create_reservation(test_raffle, 'Prueba temporal', '570000000000', array[0]);
  reservation_id := (r->>'reservation_id')::uuid;
  perform public.confirm_reservation(reservation_id);
  if not exists(select 1 from public.reservations where id = reservation_id and status = 'confirmed' and confirmed_by = auth.uid()) then raise exception 'Confirmation failed'; end if;
  if not exists(select 1 from public.raffle_numbers where raffle_numbers.raffle_id = test_raffle and number = 0 and status = 'confirmed') then raise exception 'Number not confirmed'; end if;
  blocked := false;
  begin perform public.reject_reservation(reservation_id); exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'Confirmed reservation was released'; end if;
  r := public.create_reservation(test_raffle, 'Prueba temporal', '570000000000', array[1]);
  reservation_id := (r->>'reservation_id')::uuid;
  update public.reservations set reserved_until = now() - interval '1 minute' where id = reservation_id;
  blocked := false;
  begin perform public.confirm_reservation(reservation_id); exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'Overdue reservation was confirmed'; end if;
  perform public.reject_reservation(reservation_id, 'Pago no recibido');
  if not exists(select 1 from public.reservations where id = reservation_id and status = 'rejected' and rejection_reason = 'Pago no recibido') then raise exception 'Rejection failed'; end if;
  if not exists(select 1 from public.raffle_numbers where raffle_numbers.raffle_id = test_raffle and number = 1 and status = 'available') then raise exception 'Number not released'; end if;
  blocked := false;
  begin perform public.reject_reservation(reservation_id); exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'Duplicate decision accepted'; end if;
  perform set_config('request.jwt.claim.sub', '', true);
  blocked := false;
  begin perform public.confirm_reservation(reservation_id); exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'Unauthorized confirmation allowed'; end if;
end;
$$;
rollback;
select 'Confirmation, release, expiry, duplicate decision and authorization checks passed' as result;
