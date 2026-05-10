-- Worship DB Phase7 4-1 schema preparation
-- 목적: 곡 원본 DB와 콘티 전용 수정값을 분리하기 위한 권장 스키마
-- 실제 적용 전 Supabase 테이블/컬럼 상태 확인 후 실행하세요.

-- songs: 원본 곡 정보 보강
alter table public.songs add column if not exists keys text[];
alter table public.songs add column if not exists bpm_min integer;
alter table public.songs add column if not exists bpm_max integer;
alter table public.songs add column if not exists bpm_label text;
alter table public.songs add column if not exists archived_at timestamptz;
alter table public.songs add column if not exists default_score_version_id uuid;

-- score_versions: 곡별/키별/버전별 악보 묶음
create table if not exists public.score_versions (
  id uuid primary key default gen_random_uuid(),
  song_id uuid,
  score_key text,
  score_type text default '기본악보',
  version_name text default '기본악보',
  is_default boolean default false,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- score_pages: 악보 페이지 이미지 단위
create table if not exists public.score_pages (
  id uuid primary key default gen_random_uuid(),
  version_id uuid,
  song_id uuid,
  page_order integer default 1,
  file_url text,
  original_filename text,
  source_type text default 'manual',
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- setlist_items: 콘티 안에서만 쓰는 곡별 선택값/override
create table if not exists public.setlist_items (
  id uuid primary key default gen_random_uuid(),
  setlist_id uuid,
  song_id uuid,
  song_name text,
  selected_key text,
  selected_score_version_id uuid,
  selected_score_version_name text,
  override_bpm_min integer,
  override_bpm_max integer,
  override_youtube_url text,
  memo text,
  item_order integer default 0,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_score_versions_song_id on public.score_versions(song_id);
create index if not exists idx_score_pages_version_id on public.score_pages(version_id);
create index if not exists idx_setlist_items_setlist_id on public.setlist_items(setlist_id);
create index if not exists idx_setlist_items_song_id on public.setlist_items(song_id);
