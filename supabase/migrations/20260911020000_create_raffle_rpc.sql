create or replace function public.create_raffle(
  p_title text,
  p_slug text,
  p_description text,
  p_prize_name text,
  p_price_per_number numeric,
  p_number_start integer,
  p_number_end integer,
  p_sales_close_at timestamptz,
  p_draw_at timestamptz,
  p_draw_method text,
  p_whatsapp_number text default null,
  p_payment_instructions text default null,
  p_reservation_minutes integer default 15,
  p_status public.raffle_status default 'draft'
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  raffle_id uuid;
  padding integer := greatest(length(p_number_end::text), 2);
begin
  if not public.is_admin() then raise exception 'No autorizado'; end if;
  if p_number_start < 0 or p_number_end < p_number_start then raise exception 'Rango de números inválido'; end if;
  if p_draw_at <= p_sales_close_at then raise exception 'El sorteo debe ser posterior al cierre de ventas'; end if;
  insert into public.raffles (title, slug, description, prize_name, price_per_number, number_start, number_end, sales_close_at, draw_at, draw_method, whatsapp_number, payment_instructions, reservation_minutes, status, created_by)
  values (trim(p_title), lower(trim(p_slug)), trim(p_description), trim(p_prize_name), p_price_per_number, p_number_start, p_number_end, p_sales_close_at, p_draw_at, trim(p_draw_method), nullif(trim(p_whatsapp_number), ''), nullif(trim(p_payment_instructions), ''), p_reservation_minutes, p_status, auth.uid())
  returning id into raffle_id;
  insert into public.raffle_numbers (raffle_id, number, number_display)
  select raffle_id, value, lpad(value::text, padding, '0') from generate_series(p_number_start, p_number_end) as value;
  return raffle_id;
exception when unique_violation then
  raise exception 'El slug ya está en uso';
end;
$$;

grant execute on function public.create_raffle(text,text,text,text,numeric,integer,integer,timestamptz,timestamptz,text,text,text,integer,public.raffle_status) to authenticated;