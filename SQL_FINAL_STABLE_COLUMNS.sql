-- Worship DB 최종 안정화 SQL
-- Supabase SQL Editor에서 1회 실행하세요.
-- 기존 데이터는 유지됩니다.

alter table public.songs
add column if not exists memo text,
add column if not exists bpm_min integer,
add column if not exists bpm_max integer;

-- 기존 bpm 값을 bpm_min/bpm_max로 보정
update public.songs
set
  bpm_min = case
    when bpm_min is not null then bpm_min
    when bpm::text ~ '^\s*\d+\s*$' then bpm::text::integer
    when bpm::text ~ '\d+\D+\d+' then least(
      (regexp_match(bpm::text, '\d+'))[1]::integer,
      (regexp_match(bpm::text, '\d+\D+(\d+)'))[1]::integer
    )
    else bpm_min
  end,
  bpm_max = case
    when bpm_max is not null then bpm_max
    when bpm::text ~ '^\s*\d+\s*$' then bpm::text::integer
    when bpm::text ~ '\d+\D+\d+' then greatest(
      (regexp_match(bpm::text, '\d+'))[1]::integer,
      (regexp_match(bpm::text, '\d+\D+(\d+)'))[1]::integer
    )
    else bpm_max
  end
where bpm is not null;
