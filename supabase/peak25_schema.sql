create table if not exists public.peak25_daily_records (
  record_key text primary key,
  challenge_id text not null default 'peak-25',
  player_id text not null check (player_id in ('vlad', 'simon', 'ali', 'loren')),
  record_date date not null,
  record_type text not null check (record_type in ('activity', 'exclusion')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now(),
  constraint peak25_daily_records_challenge_check check (challenge_id = 'peak-25'),
  constraint peak25_daily_records_record_key_check check (record_key = player_id || ':' || record_date::text),
  unique (challenge_id, player_id, record_date)
);

create or replace function public.set_peak25_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_peak25_daily_records_updated_at on public.peak25_daily_records;
create trigger set_peak25_daily_records_updated_at
before update on public.peak25_daily_records
for each row
execute function public.set_peak25_updated_at();

alter table public.peak25_daily_records enable row level security;

grant select, insert, update on public.peak25_daily_records to anon, authenticated;

drop policy if exists "Peak 25 read records" on public.peak25_daily_records;
create policy "Peak 25 read records"
on public.peak25_daily_records
for select
to anon, authenticated
using (challenge_id = 'peak-25');

drop policy if exists "Peak 25 insert records" on public.peak25_daily_records;
create policy "Peak 25 insert records"
on public.peak25_daily_records
for insert
to anon, authenticated
with check (
  challenge_id = 'peak-25'
  and record_key = player_id || ':' || record_date::text
  and player_id in ('vlad', 'simon', 'ali', 'loren')
  and record_type in ('activity', 'exclusion')
);

drop policy if exists "Peak 25 update records" on public.peak25_daily_records;
create policy "Peak 25 update records"
on public.peak25_daily_records
for update
to anon, authenticated
using (challenge_id = 'peak-25')
with check (
  challenge_id = 'peak-25'
  and record_key = player_id || ':' || record_date::text
  and player_id in ('vlad', 'simon', 'ali', 'loren')
  and record_type in ('activity', 'exclusion')
);
