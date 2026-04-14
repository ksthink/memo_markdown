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
-- 메모는 공용 게시판 성격이므로 익명 접근 허용
create policy "Allow public access to memos" on memos for all using (true) with check (true);

-- ─── users 테이블 (회원 계정) ───
create table if not exists users (
  id            uuid        primary key default gen_random_uuid(),
  email         text        not null unique,
  nickname      text        not null,
  password_hash text        not null,
  created_at    timestamptz not null default now()
);
alter table users enable row level security;
-- 회원가입: 익명 사용자도 INSERT 가능
create policy "Allow anonymous registration" on users for insert with check (true);
-- 로그인: 이메일로 조회 허용 (password_hash 비교는 클라이언트에서 수행)
create policy "Allow email lookup for login" on users for select using (true);

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
-- 경고: 현재 앱은 Supabase Auth를 사용하지 않고 자체 users 테이블로 인증합니다.
-- RLS에서 auth.email()을 쓰려면 Supabase Auth로 마이그레이션이 필요합니다.
-- 아래 정책은 Supabase Auth 마이그레이션 후 교체해야 합니다.
-- TODO: Supabase Auth 적용 후 다음 정책으로 교체하세요:
--   create policy "Users can only access own notes" on notes
--     for all using (user_email = auth.email()) with check (user_email = auth.email());
create policy "Allow authenticated access to notes" on notes for all using (true) with check (true);

-- 기존 notes 테이블에 user_email 컬럼만 추가할 경우 (테이블이 이미 있을 때):
-- alter table notes add column if not exists user_email text not null default '';
