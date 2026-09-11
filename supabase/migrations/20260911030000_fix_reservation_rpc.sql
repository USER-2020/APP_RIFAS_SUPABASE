create or replace function public.create_reservation(p_raffle_id uuid, p_customer_name text, p_customer_phone text, p_selected_numbers integer[]) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  raffle_row public.raffles;
  customer_row public.customers;
  reservation_row public.reservations;
  normalized_phone text := regexp_replace(p_customer_phone, '[^0-9]', '', 'g');
  selected_count integer := coalesce(array_length(p_selected_numbers, 1), 0);
  unavailable integer;
  available_count integer;
  code_value text;
begin
  if length(trim(p_customer_name)) < 3 or selected_count = 0 then raise exception 'Datos de reserva inválidos'; end if;
  if selected_count <> (select count(distinct selected_number) from unnest(p_selected_numbers) as selected_number) then raise exception 'Hay números repetidos'; end if;
  select * into raffle_row from public.raffles where id = p_raffle_id for update;
  if not found then raise exception 'La rifa no existe'; end if;
  if raffle_row.status <> 'active' or raffle_row.sales_close_at <= now() then raise exception 'Las ventas están cerradas'; end if;
  select count(*) into available_count from public.raffle_numbers as rn where rn.raffle_id = p_raffle_id and rn.number = any(p_selected_numbers);
  if available_count <> selected_count then raise exception 'Uno de los números no existe en esta rifa'; end if;
  select count(*) into unavailable from public.raffle_numbers as rn where rn.raffle_id = p_raffle_id and rn.number = any(p_selected_numbers) and rn.status <> 'available';
  if unavailable > 0 then raise exception 'Uno de los números ya no está disponible'; end if;
  insert into public.customers(name, phone, phone_normalized) values(trim(p_customer_name), p_customer_phone, normalized_phone) on conflict(phone_normalized) do update set name = excluded.name, phone = excluded.phone, updated_at = now() returning * into customer_row;
  code_value := 'RF-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 6));
  insert into public.reservations(code, raffle_id, customer_id, price_per_number, quantity, total, reserved_until) values(code_value, p_raffle_id, customer_row.id, raffle_row.price_per_number, selected_count, raffle_row.price_per_number * selected_count, now() + make_interval(mins => raffle_row.reservation_minutes)) returning * into reservation_row;
  insert into public.reservation_numbers(reservation_id, raffle_number_id) select reservation_row.id, rn.id from public.raffle_numbers as rn where rn.raffle_id = p_raffle_id and rn.number = any(p_selected_numbers);
  update public.raffle_numbers as rn set status = 'pending', updated_at = now() where rn.raffle_id = p_raffle_id and rn.number = any(p_selected_numbers);
  return jsonb_build_object('reservation_id', reservation_row.id, 'reservation_code', reservation_row.code, 'numbers', p_selected_numbers, 'quantity', reservation_row.quantity, 'price_per_number', reservation_row.price_per_number, 'total', reservation_row.total, 'reserved_until', reservation_row.reserved_until, 'whatsapp_number', raffle_row.whatsapp_number, 'raffle_title', raffle_row.title);
end;
$$;

grant execute on function public.create_reservation(uuid, text, text, integer[]) to anon, authenticated;