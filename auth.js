// Supabase Auth: 세션 보관, 로그인·가입 API 호출, 토큰 갱신
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// 세션: { access_token, refresh_token, expires_at(초) }
export const SESSION_KEY = 'md_session';
localStorage.removeItem('md_user'); // 예전 방식(이메일만 저장하던) 세션 제거

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}
export function setSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
  }));
}
export function clearSession() { localStorage.removeItem(SESSION_KEY); }

// 이메일 인증 링크를 누르고 돌아온 경우: 주소의 #access_token=... 을 세션으로 저장
(function consumeAuthRedirect() {
  const p = new URLSearchParams(location.hash.slice(1));
  if (!p.get('access_token') || !p.get('refresh_token')) return;
  setSession({
    access_token: p.get('access_token'),
    refresh_token: p.get('refresh_token'),
    expires_at: Number(p.get('expires_at')) || 0,
    expires_in: Number(p.get('expires_in')) || 0,
  });
  history.replaceState(null, '', location.pathname + location.search);
})();

export function isAuthed() { return !!getSession()?.refresh_token; }

// Supabase Auth(GoTrue) 호출
const AUTH_ERRORS = {
  invalid_credentials: '이메일 또는 비밀번호가 틀렸어요.',
  email_not_confirmed: '이메일 인증을 먼저 완료해 주세요.',
  user_already_exists: '이미 사용 중인 이메일이에요.',
  email_exists: '이미 사용 중인 이메일이에요.',
  weak_password: '비밀번호는 6자 이상이어야 해요.',
  email_address_invalid: '사용할 수 없는 이메일 주소예요.',
  over_email_send_rate_limit: '메일 발송 한도를 넘었어요. 잠시 후 다시 시도해 주세요.',
  over_request_rate_limit: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',
  signup_disabled: '지금은 회원가입을 받지 않아요.',
  same_password: '새 비밀번호가 현재 비밀번호와 같아요.',
  current_password_mismatch: '현재 비밀번호가 틀렸어요.',
};

export async function authFetch(path, body, token, method = 'POST') {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(AUTH_ERRORS[data.error_code] || data.msg || data.error_description || `인증 오류 (${res.status})`);
    err.status = res.status;
    err.code = data.error_code;
    throw err;
  }
  return data;
}

// 액세스 토큰 갱신 (동시에 여러 번 호출돼도 요청은 한 번만)
let refreshPromise = null;
export function refreshSession() {
  refreshPromise ??= (async () => {
    try {
      const refreshToken = getSession()?.refresh_token;
      const data = await authFetch('token?grant_type=refresh_token', { refresh_token: refreshToken });
      // 갱신을 기다리는 동안 로그아웃(또는 다른 계정 로그인)했다면 세션을 되살리지 않음
      if (getSession()?.refresh_token !== refreshToken) throw new Error('로그인이 필요해요.');
      setSession(data);
      return data.access_token;
    } catch (e) {
      // 갱신 토큰이 만료·폐기된 경우에만 로그아웃 (네트워크 오류·요청 제한은 유지)
      if (e.status >= 400 && e.status < 500 && e.status !== 429) { clearSession(); location.reload(); }
      throw e;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function getAccessToken() {
  const s = getSession();
  if (!s) throw new Error('로그인이 필요해요.');
  if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
  return refreshSession();
}

export async function logout() {
  const s = getSession();
  clearSession();
  // 서버 세션 폐기는 최대 2초만 기다림 (연결이 느려도 화면은 바로 전환)
  if (s) await Promise.race([
    authFetch('logout?scope=local', {}, s.access_token).catch(() => {}),
    new Promise(r => setTimeout(r, 2000)),
  ]);
  location.reload();
}

// 토큰(JWT)에 들어 있는 이메일 — 표시·기록용이며 접근 권한은 DB가 user_id로 판단
export function currentUserEmail() {
  try {
    const payload = getSession().access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).email || '';
  } catch { return ''; }
}

// 현재 비밀번호를 확인한 뒤 새 비밀번호로 변경
export async function changePassword(currentPassword, newPassword) {
  // 현재 비밀번호로 다시 로그인해 본인 확인 (새 세션으로 교체)
  let session;
  try {
    session = await authFetch('token?grant_type=password', { email: currentUserEmail(), password: currentPassword });
  } catch (e) {
    if (e.code === 'invalid_credentials') throw new Error('현재 비밀번호가 틀렸어요.');
    throw e;
  }
  setSession(session);
  await authFetch('user', { password: newPassword, current_password: currentPassword }, session.access_token, 'PUT');
}
