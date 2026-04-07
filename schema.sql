-- Supabase SQL Editor에서 실행해주세요

-- ─── memos 테이블 (포스트잇 메모앱) ───
create table if not exists memos (
  id          uuid        primary key default gen_random_uuid(),
  content     text        not null default '',
  color       text        not null default '#fef08a',
  pinned      boolean     not null default false,
  completed   boolean     not null default false,
  position_x  integer     not null default 100,
  position_y  integer     not null default 100,
  created_at  timestamptz not null default now()
);
alter table memos disable row level security;

-- ─── notes 테이블 (마크다운 편집기) ───
create table if not exists notes (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null default '제목 없음',
  content     text        not null default '',
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
alter table notes disable row level security;
