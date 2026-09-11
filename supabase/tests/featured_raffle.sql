-- Run after migrations in the Supabase SQL Editor. Changes are rolled back.
begin;
do $$
declare
  admin_id uuid;
  first_id uuid;
  second_id uuid;
  closed_id uuid;
  blocked boolean;
begin
  select id into admin_id from public.profiles where role = 'admin' limit 1;
  if admin_id is null then raise exception 'An admin profile is required'; end if;
  perform set_config('request.jwt.claim.sub', admin_id::text, true);

  insert into public.raffles(title, slug, prize_name, price_per_number, number_end, sales_close_at, draw_at, status)
  values ('Test featured A', 'test-' || gen_random_uuid(), 'Prize', 10000, 2, now() + interval '1 day', now() + interval '2 days', 'active') returning id into first_id;
  insert into public.raffles(title, slug, prize_name, price_per_number, number_end, sales_close_at, draw_at, status)
  values ('Test featured B', 'test-' || gen_random_uuid(), 'Prize', 10000, 2, now() + interval '1 day', now() + interval '2 days', 'active') returning id into second_id;
  insert into public.raffles(title, slug, prize_name, price_per_number, number_end, sales_close_at, draw_at, status)
  values ('Test closed', 'test-' || gen_random_uuid(), 'Prize', 10000, 2, now() + interval '1 day', now() + interval '2 days', 'closed') returning id into closed_id;

  perform public.set_featured_raffle(first_id);
  perform public.set_featured_raffle(second_id);
  perform public.set_featured_raffle(second_id);
  if (select count(*) from public.raffles where is_featured) <> 1
    or not exists (select 1 from public.raffles where id = second_id and is_featured) then
    raise exception 'Replacing or reselecting the featured raffle failed';
  end if;

  blocked := false;
  begin
    perform public.set_featured_raffle(closed_id);
  exception when raise_exception then blocked := true;
  end;
  if not blocked then raise exception 'A closed raffle was accepted'; end if;
  if not exists (select 1 from public.raffles where id = second_id and is_featured) then
    raise exception 'An invalid selection cleared the previous featured raffle';
  end if;

  perform set_config('request.jwt.claim.sub', '', true);
  blocked := false;
  begin
    perform public.set_featured_raffle(first_id);
  exception when raise_exception then blocked := true;
  end;
  if not blocked then raise exception 'Unauthorized selection was accepted'; end if;
end;
$$;
rollback;
select 'Featured raffle checks passed' as result;
