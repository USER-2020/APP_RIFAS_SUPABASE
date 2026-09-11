-- Exact-code lookup exposes reservation details, never customer contact data.
create or replace function public.get_reservation_by_code(p_code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'code', r.code, 'status', r.status,
    'overdue', r.status = 'pending' and r.reserved_until <= now(),
    'reserved_until', r.reserved_until, 'total', r.total,
    'quantity', r.quantity, 'raffle_title', f.title,
    'raffle_slug', f.slug, 'whatsapp_number', f.whatsapp_number,
    'numbers', coalesce((select jsonb_agg(n.number order by n.number)
      from public.reservation_numbers rn
      join public.raffle_numbers n on n.id = rn.raffle_number_id
      where rn.reservation_id = r.id), '[]'::jsonb)
  ) from public.reservations r
    join public.raffles f on f.id = r.raffle_id
  where r.code = upper(trim(p_code))
    and upper(trim(p_code)) ~ '^RF-[0-9A-F]{6}$';
$$;
revoke all on function public.get_reservation_by_code(text) from public;
grant execute on function public.get_reservation_by_code(text) to anon, authenticated;
notify pgrst, 'reload schema';
