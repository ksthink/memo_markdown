-- 새 프로젝트용 스키마. Supabase SQL Editor에서 실행해주세요.
-- (기존 DB를 옮기는 경우에는 migrate-to-supabase-auth.sql 을 사용)
--
-- 회원 계정은 Supabase Auth(auth.users)가 관리하므로 별도 테이블이 없습니다.

-- ─── notes 테이블 (마크다운 편집기) ───
create table if not exists notes (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references auth.users(id) on delete set null default auth.uid(),
  user_email  text        not null default '',
  title       text        not null default '제목 없음',
  content     text        not null default '',
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index if not exists notes_user_id_idx on notes (user_id);

-- 본인 노트만 읽고 쓸 수 있도록 제한
alter table notes enable row level security;
drop policy if exists notes_owner on notes;
create policy notes_owner on notes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
