alter table public.participation_tokens
  add column if not exists confirmation_email_sent_at timestamptz,
  add column if not exists confirmation_email_attempted_at timestamptz,
  add column if not exists confirmation_email_last_error text;

create index if not exists participation_tokens_confirmation_email_idx
  on public.participation_tokens (confirmation_email_sent_at, confirmation_email_attempted_at)
  where status = 'redeemed';
