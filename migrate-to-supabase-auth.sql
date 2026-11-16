-- 기존 DB를 Supabase Auth + RLS 방식으로 옮기는 스크립트
-- Supabase 대시보드 → SQL Editor에 전체를 붙여 넣고 한 번 실행합니다.
--
-- 실행 전에 반드시:
--   1) notes, memo_users 테이블을 CSV로 백업
--   2) Authentication → Users → Add user 로 기존과 같은 이메일의 계정 생성
--      ("Auto Confirm User" 체크)
--
-- 메모는 삭제하지 않습니다. 이메일이 적혀 있는데 계정과 연결되지 않는 메모가
-- 하나라도 있으면 오류를 내고, 아무것도 바꾸지 않은 상태로 되돌아갑니다.
-- 주인 이메일이 비어 있는 메모는 누구에게도 연결하지 않고 남겨 두며(앱에서는
-- 보이지 않음), 맨 아래 안내대로 직접 가져올 수 있습니다.
-- (아래 do 블록 전체가 하나의 작업으로 처리되어, 중간에 실패하면 모두 취소됩니다.)

do $$
declare
  missing text;
begin
  -- 1. 노트에 주인(Auth 사용자) 컬럼 추가
  alter table notes add column if not exists user_id uuid references auth.users(id) on delete set null;
  alter table notes alter column user_id set default auth.uid();
  create index if not exists notes_user_id_idx on notes (user_id);

  -- 2. 기존 노트를 같은 이메일의 (인증된) Auth 계정에 연결
  update notes n
     set user_id = u.id
    from auth.users u
   where n.user_id is null
     and u.email_confirmed_at is not null
     and lower(u.email) = lower(n.user_email);

  -- 3. 이메일이 있는데 연결되지 않은 노트가 있으면 중단 (위 변경도 모두 취소됨)
  select string_agg(distinct user_email, ', ')
    into missing
    from notes
   where user_id is null and user_email <> '';
  if missing is not null then
    raise exception '계정과 연결되지 않은 노트가 있어 중단합니다. 해당 이메일: %', missing
      using hint = 'Authentication → Users 에서 이 이메일로 계정을 만든 뒤 다시 실행하세요.';
  end if;

  -- 4. 로그인한 사용자가 본인 노트만 읽고 쓸 수 있도록 제한
  alter table notes enable row level security;
  drop policy if exists notes_owner on notes;
  create policy notes_owner on notes
    for all to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
  revoke all on notes from anon;
  grant select, insert, update, delete on notes to authenticated;

  -- 5. 더 이상 쓰지 않는 테이블은 API 접근 차단 (정책 없음 = 접근 불가)
  alter table memo_users enable row level security;
  alter table memos enable row level security;
end $$;

-- 결과 확인: 이메일별 노트 수와, 그중 계정에 연결된 수
select coalesce(nullif(user_email, ''), '(이메일 없음)') as user_email,
       count(*) as notes,
       count(user_id) as linked
  from notes group by 1 order by notes desc;

-- '(이메일 없음)' 노트를 내 계정으로 가져오려면 (이메일을 본인 것으로 바꿔서 실행):
-- update notes
--    set user_id = (select id from auth.users where email = 'me@example.com'),
--        user_email = 'me@example.com'
--  where user_id is null;

-- 모든 것이 정상 동작하는 것을 확인한 뒤, 예전 비밀번호 해시가 든 테이블 삭제를 권장합니다:
-- drop table memo_users;
