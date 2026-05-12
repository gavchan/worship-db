-- Worship DB BPM min/max 컬럼 추가
-- Supabase SQL Editor에서 1회 실행하세요.

alter table public.songs
add column if not exists bpm_min integer,
add column if not exists bpm_max integer;

-- 기존 bpm 문자열/숫자 값이 있는 곡을 min/max로 보정
-- 예: '105' -> 105/105, '100-115' -> 100/115
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
