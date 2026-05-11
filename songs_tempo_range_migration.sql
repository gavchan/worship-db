-- Worship DB songs tempo range migration
-- Supabase SQL Editor에서 한 번 실행하세요. 기존 bpm/key 데이터는 유지됩니다.
alter table public.songs add column if not exists bpm_min integer;
alter table public.songs add column if not exists bpm_max integer;
update public.songs set bpm_min = bpm where bpm_min is null and bpm is not null;
update public.songs set bpm_max = bpm where bpm_max is null and bpm is not null;
