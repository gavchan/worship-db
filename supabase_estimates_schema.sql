create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  quote_no text not null unique,
  quote_date date,
  client_name text not null default '',
  client_person text not null default '',
  client_phone text not null default '',
  site_address text not null default '',
  subtotal integer not null default 0,
  vat integer not null default 0,
  grand_total integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists estimates_quote_date_idx
  on public.estimates (quote_date desc);

create index if not exists estimates_client_name_idx
  on public.estimates (client_name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists estimates_set_updated_at on public.estimates;

create trigger estimates_set_updated_at
before update on public.estimates
for each row
execute function public.set_updated_at();

alter table public.estimates enable row level security;

create policy "Allow authenticated estimate read"
on public.estimates
for select
to authenticated
using (true);

create policy "Allow authenticated estimate insert"
on public.estimates
for insert
to authenticated
with check (true);

create policy "Allow authenticated estimate update"
on public.estimates
for update
to authenticated
using (true)
with check (true);
