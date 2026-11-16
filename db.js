// 노트 테이블 접근 (Supabase REST)
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { getAccessToken, refreshSession } from './auth.js';

const TABLE = 'notes';

// 로그인한 사용자의 토큰으로 호출 → DB의 RLS 정책이 본인 노트만 허용
async function dbFetch(path, opts = {}, retry = true) {
  const token = await getAccessToken();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    ...opts,
  });
  if (res.status === 401 && retry) {
    await refreshSession();
    return dbFetch(path, opts, false);
  }
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

export async function loadNotes()         { return (await dbFetch(`${TABLE}?select=*&order=updated_at.desc`)) || []; }
export async function createNoteDB(data)  { const [r] = (await dbFetch(TABLE, { method:'POST', body: JSON.stringify(data) })) || []; return r; }
// 수정된 행이 없으면(다른 기기에서 삭제된 노트 등) 저장 실패로 처리
// keepalive: 페이지를 떠나는 중에도 요청이 끝까지 전송되게 함 (본문 64KB 이하일 때만 가능)
export async function patchNote(id, data, { keepalive = false } = {}) {
  const [r] = (await dbFetch(`${TABLE}?id=eq.${id}`, { method:'PATCH', body: JSON.stringify(data), keepalive })) || [];
  if (!r) throw new Error('노트를 찾을 수 없어요. 다른 기기에서 삭제됐을 수 있어요.');
  return r;
}
export async function removeNoteDB(id)    { await dbFetch(`${TABLE}?id=eq.${id}`, { method:'DELETE' }); }
