-- Worship DB: multi-code + tempo range support
-- Supabase SQL Editor에서 1회 실행하세요.
alter table public.songs
  add column if not exists keys text[];

alter table public.songs
  add column if not exists bpm_min integer default 0,
  add column if not exists bpm_max integer default 0;

-- 기존 key / bpm 값을 새 컬럼에 부드럽게 복사
update public.songs
set keys = regexp_split_to_array(coalesce(key, ''), '\\s*[\\/,|·]+\\s*')
where keys is null and coalesce(key, '') <> '';

update public.songs
set bpm_min = coalesce(nullif(bpm_min, 0), bpm, 0),
    bpm_max = coalesce(nullif(bpm_max, 0), bpm, 0)
where coalesce(bpm, 0) > 0;
