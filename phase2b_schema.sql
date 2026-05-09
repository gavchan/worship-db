-- worship-db Phase 2-B schema
-- Supabase SQL Editor에서 한 번 실행하세요.
-- 기존 songs / worship_history / scores Storage는 보존하고, 확장 테이블만 추가합니다.

create table if not exists public.song_score_versions (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  version_name text not null default '기본',
  score_key text,
  score_type text default '코드악보',
  bpm_min integer,
  bpm_max integer,
  is_default boolean default false,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_song_score_versions_song_id on public.song_score_versions(song_id);
create index if not exists idx_song_score_versions_default on public.song_score_versions(song_id,is_default);

create table if not exists public.song_score_files (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.song_score_versions(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  page_no integer default 1,
  mime_type text,
  created_at timestamptz default now()
);

create index if not exists idx_song_score_files_version_id on public.song_score_files(version_id);
create index if not exists idx_song_score_files_song_page on public.song_score_files(song_id,page_no);

create table if not exists public.setlist_items (
  id uuid primary key default gen_random_uuid(),
  worship_history_id uuid references public.worship_history(id) on delete cascade,
  song_id uuid references public.songs(id) on delete set null,
  score_version_id uuid references public.song_score_versions(id) on delete set null,
  position integer not null default 1,
  song_name text,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_setlist_items_history_pos on public.setlist_items(worship_history_id,position);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- anon 접근 정책이 필요한 프로젝트용. 이미 RLS를 쓰지 않으면 실행해도 문제 없습니다.
alter table public.song_score_versions enable row level security;
alter table public.song_score_files enable row level security;
alter table public.setlist_items enable row level security;
alter table public.app_settings enable row level security;

do $$ begin
  create policy "anon read song score versions" on public.song_score_versions for select to anon using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "anon write song score versions" on public.song_score_versions for all to anon using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "anon read song score files" on public.song_score_files for select to anon using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "anon write song score files" on public.song_score_files for all to anon using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "anon read setlist items" on public.setlist_items for select to anon using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "anon write setlist items" on public.setlist_items for all to anon using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "anon read app settings" on public.app_settings for select to anon using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "anon write app settings" on public.app_settings for all to anon using (true) with check (true);
exception when duplicate_object then null; end $$;