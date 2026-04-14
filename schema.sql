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
alter table memos enable row level security;

-- ─── users 테이블 (회원 계정) ───
create table if not exists users (
  id            uuid        primary key default gen_random_uuid(),
  email         text        not null unique,
  nickname      text        not null,
  -- legacy column: Supabase Auth 전환 후 앱 인증 경로에서는 사용하지 않음
  password_hash text        not null,
  created_at    timestamptz not null default now()
);
alter table users enable row level security;

-- ─── notes 테이블 (마크다운 편집기) ───
create table if not exists notes (
  id          uuid        primary key default gen_random_uuid(),
  user_email  text        not null default '',
  title       text        not null default '제목 없음',
  content     text        not null default '',
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
alter table notes enable row level security;

drop policy if exists notes_select_own on notes;
create policy notes_select_own
on notes
for select
to authenticated
using ((auth.jwt() ->> 'email') = user_email);

drop policy if exists notes_insert_own on notes;
create policy notes_insert_own
on notes
for insert
to authenticated
with check ((auth.jwt() ->> 'email') = user_email);

drop policy if exists notes_update_own on notes;
create policy notes_update_own
on notes
for update
to authenticated
using ((auth.jwt() ->> 'email') = user_email)
with check ((auth.jwt() ->> 'email') = user_email);

drop policy if exists notes_delete_own on notes;
create policy notes_delete_own
on notes
for delete
to authenticated
using ((auth.jwt() ->> 'email') = user_email);

-- 기존 notes 테이블에 user_email 컬럼만 추가할 경우 (테이블이 이미 있을 때):
-- alter table notes add column if not exists user_email text not null default '';
