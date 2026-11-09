-- Self-service API accounts for organizers and developers.
alter table public.api_consumers
  add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;

create unique index if not exists api_consumers_owner_user_idx
  on public.api_consumers(owner_user_id)
  where owner_user_id is not null;

create policy "owners read api consumers" on public.api_consumers
  for select using (owner_user_id = auth.uid() or public.is_admin());

create policy "owners read organizations" on public.organizations
  for select using (
    public.is_admin() or exists (
      select 1 from public.integrations i
      join public.api_consumers c on c.id = i.api_consumer_id
      where i.organization_id = organizations.id and c.owner_user_id = auth.uid()
    )
  );

create policy "owners read integrations" on public.integrations
  for select using (
    public.is_admin() or exists (
      select 1 from public.api_consumers c
      where c.id = integrations.api_consumer_id and c.owner_user_id = auth.uid()
    )
  );

create policy "owners read integration tokens" on public.integration_tokens
  for select using (
    public.is_admin() or exists (
      select 1 from public.integrations i
      join public.api_consumers c on c.id = i.api_consumer_id
      where i.id = integration_tokens.integration_id and c.owner_user_id = auth.uid()
    )
  );
