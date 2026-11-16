// auth.js / db.js 단위 테스트 — 가짜 fetch·localStorage만 사용하며 네트워크에 접속하지 않습니다.
// 실행: npm test
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ---------- fake browser globals (installed BEFORE importing modules) ----------
const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: k => { store.delete(k); },
  clear: () => store.clear(),
};
const loc = { hash: '', pathname: '/app/', search: '?v=1', reloads: 0, reload() { this.reloads++; } };
globalThis.location = loc;
const replaceCalls = [];
globalThis.history = { replaceState: (...a) => { replaceCalls.push(a); loc.hash = ''; } };

const calls = [];       // { url, opts, sessionAtCall }
let handlers = [];      // queue of (url, opts) => Response | Promise<Response>
globalThis.fetch = async (url, opts = {}) => {
  calls.push({ url: String(url), opts, sessionAtCall: store.get('md_session') ?? null });
  const h = handlers.shift();
  if (!h) throw new Error(`unexpected fetch (no fake queued): ${opts.method || 'GET'} ${url}`);
  return h(String(url), opts);
};
const json = (status, body) => () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const empty = status => () => new Response(null, { status });
const text = (status, body) => () => new Response(body, { status });
const queue = (...hs) => { handlers.push(...hs); };

// legacy key present before first import
store.set('md_user', 'old@example.com');
const auth = await import('../auth.js');
const legacyRemovedAtImport = !store.has('md_user');
const db = await import('../db.js');
const { SUPABASE_URL, SUPABASE_KEY } = await import('../config.js');
const { SESSION_KEY } = auth;
const AUTH = `${SUPABASE_URL}/auth/v1/`;
const REST = `${SUPABASE_URL}/rest/v1/`;

const now = () => Math.floor(Date.now() / 1000);
const b64url = s => Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwt = payload => `${b64url('{"alg":"HS256"}')}.${b64url(JSON.stringify(payload))}.sig`;
const putSession = (o = {}) => store.set(SESSION_KEY, JSON.stringify({ access_token: 'AT1', refresh_token: 'RT1', expires_at: now() + 3600, ...o }));
const stored = () => JSON.parse(store.get(SESSION_KEY) ?? 'null');
const hdr = (c, name) => c.opts.headers?.[name];
const tick = () => new Promise(r => setImmediate(r));

beforeEach(() => {
  assert.equal(handlers.length, 0, 'previous test left unused fake responses');
  store.clear(); calls.length = 0; handlers = []; loc.reloads = 0; loc.hash = ''; replaceCalls.length = 0;
});

// ---------- session ----------
test('legacy md_user key removed at import', () => { assert.equal(legacyRemovedAtImport, true); });

test('session: none', () => {
  assert.equal(auth.getSession(), null);
  assert.equal(auth.isAuthed(), false);
});
test('session: corrupt JSON', () => {
  store.set(SESSION_KEY, '{not json');
  assert.equal(auth.getSession(), null);
  assert.equal(auth.isAuthed(), false);
});
test('session: valid', () => {
  putSession();
  assert.equal(auth.isAuthed(), true);
  assert.equal(auth.getSession().access_token, 'AT1');
});
test('session: without refresh_token is not authed', () => {
  store.set(SESSION_KEY, JSON.stringify({ access_token: 'x' }));
  assert.equal(auth.isAuthed(), false);
});
test('setSession keeps explicit expires_at and stores only 3 fields', () => {
  auth.setSession({ access_token: 'a', refresh_token: 'r', expires_at: 12345, expires_in: 99, user: { id: 1 } });
  assert.deepEqual(stored(), { access_token: 'a', refresh_token: 'r', expires_at: 12345 });
});
test('setSession computes expires_at from expires_in when expires_at is 0 or missing', () => {
  for (const extra of [{ expires_at: 0 }, {}]) {
    const t = now();
    auth.setSession({ access_token: 'a', refresh_token: 'r', expires_in: 600, ...extra });
    const e = stored().expires_at;
    assert.ok(e >= t + 600 && e <= t + 602, `expires_at=${e}`);
  }
});
test('setSession defaults to 1h when neither given', () => {
  const t = now();
  auth.setSession({ access_token: 'a', refresh_token: 'r' });
  const e = stored().expires_at;
  assert.ok(e >= t + 3600 && e <= t + 3602);
});
test('clearSession', () => { putSession(); auth.clearSession(); assert.equal(auth.getSession(), null); });

// ---------- import-time redirect ----------
test('redirect hash with both tokens stores session and clears hash', async () => {
  store.set('md_user', 'x');
  loc.hash = '#access_token=HAT&refresh_token=HRT&expires_in=900&token_type=bearer&type=signup';
  const t = now();
  await import('../auth.js?case=both');
  const s = stored();
  assert.equal(s.access_token, 'HAT'); assert.equal(s.refresh_token, 'HRT');
  assert.ok(s.expires_at >= t + 900 && s.expires_at <= t + 902);
  assert.deepEqual(replaceCalls, [[null, '', '/app/?v=1']]);
  assert.equal(store.has('md_user'), false);
});
test('redirect hash with explicit expires_at uses it', async () => {
  loc.hash = '#access_token=HAT&refresh_token=HRT&expires_at=2000000000&expires_in=900';
  await import('../auth.js?case=expat');
  assert.equal(stored().expires_at, 2000000000);
});
test('redirect hash with only one token / unrelated / empty does nothing', async () => {
  let i = 0;
  for (const h of ['#access_token=only', '#refresh_token=only', '#note-12', '', '#error=access_denied&error_description=x']) {
    loc.hash = h;
    await import(`../auth.js?case=none${i++}`);
    assert.equal(store.has(SESSION_KEY), false, h);
    assert.equal(replaceCalls.length, 0, h);
    assert.equal(loc.hash, h);
  }
});
test('unrelated hash does not clobber an existing session', async () => {
  putSession(); const before = store.get(SESSION_KEY);
  loc.hash = '#access_token=only';
  await import('../auth.js?case=keep');
  assert.equal(store.get(SESSION_KEY), before);
});

// ---------- authFetch ----------
test('authFetch: apikey header, no Authorization without token, POST default, JSON body', async () => {
  queue(json(200, { ok: 1 }));
  const r = await auth.authFetch('signup', { email: 'a@b.c' });
  assert.deepEqual(r, { ok: 1 });
  const c = calls[0];
  assert.equal(c.url, AUTH + 'signup');
  assert.equal(c.opts.method, 'POST');
  assert.equal(hdr(c, 'apikey'), SUPABASE_KEY);
  assert.equal(hdr(c, 'Content-Type'), 'application/json');
  assert.equal('Authorization' in c.opts.headers, false);
  assert.equal(c.opts.body, '{"email":"a@b.c"}');
});
test('authFetch: Authorization with token, method override, default body {}', async () => {
  queue(json(200, {}));
  await auth.authFetch('user', undefined, 'TOK', 'PUT');
  assert.equal(calls[0].opts.method, 'PUT');
  assert.equal(hdr(calls[0], 'Authorization'), 'Bearer TOK');
  assert.equal(calls[0].opts.body, '{}');
});
test('authFetch: maps every known error_code to Korean message and sets status', async () => {
  const map = {
    invalid_credentials: ['이메일 또는 비밀번호가 틀렸어요.', 400],
    email_not_confirmed: ['이메일 인증을 먼저 완료해 주세요.', 400],
    user_already_exists: ['이미 사용 중인 이메일이에요.', 422],
    email_exists: ['이미 사용 중인 이메일이에요.', 422],
    weak_password: ['비밀번호는 6자 이상이어야 해요.', 422],
    email_address_invalid: ['사용할 수 없는 이메일 주소예요.', 400],
    over_email_send_rate_limit: ['메일 발송 한도를 넘었어요. 잠시 후 다시 시도해 주세요.', 429],
    over_request_rate_limit: ['요청이 너무 많아요. 잠시 후 다시 시도해 주세요.', 429],
    signup_disabled: ['지금은 회원가입을 받지 않아요.', 422],
    same_password: ['새 비밀번호가 현재 비밀번호와 같아요.', 422],
    current_password_mismatch: ['현재 비밀번호가 틀렸어요.', 400],
  };
  for (const [code, [msg, status]] of Object.entries(map)) {
    queue(json(status, { error_code: code, msg: 'english text' }));
    await assert.rejects(auth.authFetch('x', {}), e => { assert.equal(e.message, msg); assert.equal(e.status, status); return true; });
  }
});
test('authFetch: fallbacks msg → error_description → generic', async () => {
  queue(json(400, { error_code: 'unknown_thing', msg: 'M', error_description: 'D' }));
  await assert.rejects(auth.authFetch('x'), { message: 'M', status: 400 });
  queue(json(401, { error: 'invalid_grant', error_description: 'D' }));
  await assert.rejects(auth.authFetch('x'), { message: 'D', status: 401 });
  queue(json(500, {}));
  await assert.rejects(auth.authFetch('x'), { message: '인증 오류 (500)', status: 500 });
  queue(text(502, '<html>Bad gateway</html>'));
  await assert.rejects(auth.authFetch('x'), { message: '인증 오류 (502)', status: 502 });
});
test('authFetch: tolerates empty 204 body', async () => {
  queue(empty(204));
  assert.deepEqual(await auth.authFetch('logout?scope=local', {}, 'T'), {});
});
test('authFetch: network error propagates without status', async () => {
  queue(() => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(auth.authFetch('x'), e => e instanceof TypeError && e.status === undefined);
});

// ---------- getAccessToken / refresh ----------
test('getAccessToken: no session throws, no network', async () => {
  await assert.rejects(auth.getAccessToken(), { message: '로그인이 필요해요.' });
  assert.equal(calls.length, 0);
});
test('getAccessToken: fresh token → no network', async () => {
  putSession({ expires_at: now() + 120 });
  assert.equal(await auth.getAccessToken(), 'AT1');
  assert.equal(calls.length, 0);
});
test('getAccessToken: expiring within 60s → one refresh for concurrent callers; rotated token saved', async () => {
  putSession({ expires_at: now() + 30 });
  let release;
  queue(() => new Promise(r => { release = () => r(json(200, { access_token: 'AT2', refresh_token: 'RT2', expires_in: 3600 })()); }));
  const ps = [auth.getAccessToken(), auth.getAccessToken(), auth.refreshSession(), auth.getAccessToken()];
  await tick();
  assert.equal(calls.length, 1);
  release();
  assert.deepEqual(await Promise.all(ps), ['AT2', 'AT2', 'AT2', 'AT2']);
  assert.equal(calls.length, 1);
  const c = calls[0];
  assert.equal(c.url, AUTH + 'token?grant_type=refresh_token');
  assert.equal(c.opts.method, 'POST');
  assert.equal(c.opts.body, '{"refresh_token":"RT1"}');
  assert.equal(hdr(c, 'apikey'), SUPABASE_KEY);
  const s = stored();
  assert.equal(s.access_token, 'AT2'); assert.equal(s.refresh_token, 'RT2');
  assert.ok(s.expires_at >= now() + 3590);
  assert.equal(loc.reloads, 0);
  // now fresh: no further network
  assert.equal(await auth.getAccessToken(), 'AT2');
  assert.equal(calls.length, 1);
});
test('getAccessToken: already expired → refresh', async () => {
  putSession({ expires_at: now() - 10 });
  queue(json(200, { access_token: 'AT2', refresh_token: 'RT2', expires_in: 3600 }));
  assert.equal(await auth.getAccessToken(), 'AT2');
});
test('after a successful refresh a later refresh makes a new request with the rotated token', async () => {
  putSession();
  queue(json(200, { access_token: 'AT2', refresh_token: 'RT2', expires_in: 3600 }),
        json(200, { access_token: 'AT3', refresh_token: 'RT3', expires_in: 3600 }));
  await auth.refreshSession();
  assert.equal(await auth.refreshSession(), 'AT3');
  assert.equal(calls[1].opts.body, '{"refresh_token":"RT2"}');
});
for (const status of [400, 401]) {
  test(`refreshSession ${status} → session cleared, reload once (even for concurrent callers), then retryable`, async () => {
    putSession();
    queue(json(status, { error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' }));
    const rs = await Promise.allSettled([auth.refreshSession(), auth.refreshSession()]);
    assert.ok(rs.every(r => r.status === 'rejected' && r.reason.status === status));
    assert.equal(calls.length, 1);
    assert.equal(auth.getSession(), null);
    assert.equal(loc.reloads, 1);
    // in-flight promise reset: a later call tries again
    putSession({ refresh_token: 'RTn' });
    queue(json(200, { access_token: 'AT9', refresh_token: 'RT9', expires_in: 3600 }));
    assert.equal(await auth.refreshSession(), 'AT9');
    assert.equal(calls.length, 2);
    assert.equal(loc.reloads, 1);
  });
}
test('refreshSession 429 → session kept, no reload, retryable', async () => {
  putSession(); const before = store.get(SESSION_KEY);
  queue(json(429, { error_code: 'over_request_rate_limit' }));
  await assert.rejects(auth.refreshSession(), { status: 429, message: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.' });
  assert.equal(store.get(SESSION_KEY), before);
  assert.equal(loc.reloads, 0);
  queue(json(200, { access_token: 'AT2', refresh_token: 'RT2', expires_in: 3600 }));
  assert.equal(await auth.refreshSession(), 'AT2');
});
test('refreshSession 500 → session kept, no reload', async () => {
  putSession(); const before = store.get(SESSION_KEY);
  queue(json(500, {}));
  await assert.rejects(auth.refreshSession(), { status: 500 });
  assert.equal(store.get(SESSION_KEY), before);
  assert.equal(loc.reloads, 0);
});
test('refreshSession network TypeError → session kept, no reload, retryable', async () => {
  putSession(); const before = store.get(SESSION_KEY);
  queue(() => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(auth.refreshSession(), TypeError);
  assert.equal(store.get(SESSION_KEY), before);
  assert.equal(loc.reloads, 0);
  queue(json(200, { access_token: 'AT2', refresh_token: 'RT2', expires_in: 3600 }));
  assert.equal(await auth.refreshSession(), 'AT2');
  assert.equal(calls.length, 2);
});

// ---------- db ----------
const dbHeaders = (c, token) => {
  assert.equal(hdr(c, 'apikey'), SUPABASE_KEY);
  assert.equal(hdr(c, 'Authorization'), `Bearer ${token}`);
  assert.notEqual(hdr(c, 'Authorization'), `Bearer ${SUPABASE_KEY}`);
  assert.equal(hdr(c, 'Content-Type'), 'application/json');
  assert.equal(hdr(c, 'Prefer'), 'return=representation');
};
test('loadNotes: GET with user token, returns rows', async () => {
  putSession();
  queue(json(200, [{ id: 1 }, { id: 2 }]));
  assert.deepEqual(await db.loadNotes(), [{ id: 1 }, { id: 2 }]);
  const c = calls[0];
  assert.equal(c.url, REST + 'notes?select=*&order=updated_at.desc');
  assert.ok(c.opts.method === undefined || c.opts.method === 'GET');
  assert.equal(c.opts.body, undefined);
  dbHeaders(c, 'AT1');
});
test('loadNotes: 204 → []', async () => {
  putSession(); queue(empty(204));
  assert.deepEqual(await db.loadNotes(), []);
});
test('createNoteDB: POST body, returns first row', async () => {
  putSession();
  queue(json(201, [{ id: 'n1', title: 't' }]));
  assert.deepEqual(await db.createNoteDB({ title: 't', content: '한글' }), { id: 'n1', title: 't' });
  const c = calls[0];
  assert.equal(c.url, REST + 'notes'); assert.equal(c.opts.method, 'POST');
  assert.equal(c.opts.body, JSON.stringify({ title: 't', content: '한글' }));
  dbHeaders(c, 'AT1');
});
test('patchNote: PATCH url/body, returns first row', async () => {
  putSession();
  queue(json(200, [{ id: 'n1', title: 'new' }]));
  assert.deepEqual(await db.patchNote('n1', { title: 'new' }), { id: 'n1', title: 'new' });
  const c = calls[0];
  assert.equal(c.url, REST + 'notes?id=eq.n1'); assert.equal(c.opts.method, 'PATCH');
  assert.equal(c.opts.body, '{"title":"new"}');
  dbHeaders(c, 'AT1');
});
test('patchNote: zero rows matched ([]) → rejects so the caller reports a failed save', async () => {
  putSession(); queue(json(200, []));
  await assert.rejects(db.patchNote('gone', { title: 'x' }), { message: '노트를 찾을 수 없어요. 다른 기기에서 삭제됐을 수 있어요.' });
});
test('patchNote: 204 without body → rejects with the same message, not a TypeError', async () => {
  putSession(); queue(empty(204));
  await assert.rejects(db.patchNote('n1', { title: 'x' }), { message: '노트를 찾을 수 없어요. 다른 기기에서 삭제됐을 수 있어요.' });
});
test('createNoteDB: 204 without body → undefined, not a TypeError', async () => {
  putSession(); queue(empty(204));
  assert.equal(await db.createNoteDB({ title: 'x' }), undefined);
});
test('removeNoteDB: DELETE, 204 → undefined without throwing', async () => {
  putSession(); queue(empty(204));
  assert.equal(await db.removeNoteDB('n1'), undefined);
  const c = calls[0];
  assert.equal(c.url, REST + 'notes?id=eq.n1'); assert.equal(c.opts.method, 'DELETE');
  assert.equal(c.opts.body, undefined);
  dbHeaders(c, 'AT1');
});
test('removeNoteDB: 200 with representation body also fine', async () => {
  putSession(); queue(json(200, [{ id: 'n1' }]));
  assert.equal(await db.removeNoteDB('n1'), undefined);
});
test('db: no session → throws, no network', async () => {
  await assert.rejects(db.loadNotes(), { message: '로그인이 필요해요.' });
  assert.equal(calls.length, 0);
});
test('db: expiring token is refreshed before the request', async () => {
  putSession({ expires_at: now() + 10 });
  queue(json(200, { access_token: 'AT2', refresh_token: 'RT2', expires_in: 3600 }), json(200, []));
  await db.loadNotes();
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, AUTH + 'token?grant_type=refresh_token');
  dbHeaders(calls[1], 'AT2');
});
test('db: 401 → refresh → retried exactly once with new token and same method/body', async () => {
  putSession();
  queue(json(401, { message: 'JWT expired' }),
        json(200, { access_token: 'AT2', refresh_token: 'RT2', expires_in: 3600 }),
        json(200, [{ id: 'n1' }]));
  assert.deepEqual(await db.patchNote('n1', { title: 'z' }), { id: 'n1' });
  assert.equal(calls.length, 3);
  dbHeaders(calls[0], 'AT1');
  assert.equal(calls[1].url, AUTH + 'token?grant_type=refresh_token');
  assert.equal(calls[1].opts.body, '{"refresh_token":"RT1"}');
  assert.equal(calls[2].url, REST + 'notes?id=eq.n1');
  assert.equal(calls[2].opts.method, 'PATCH'); assert.equal(calls[2].opts.body, '{"title":"z"}');
  dbHeaders(calls[2], 'AT2');
  assert.equal(loc.reloads, 0);
});
test('db: second 401 surfaces as error (no infinite loop)', async () => {
  putSession();
  queue(json(401, { message: 'JWT expired' }),
        json(200, { access_token: 'AT2', refresh_token: 'RT2', expires_in: 3600 }),
        text(401, 'still unauthorized'));
  await assert.rejects(db.loadNotes(), e => { assert.match(e.message, /^401 still unauthorized/); return true; });
  assert.equal(calls.length, 3);
});
test('db: 401 then refresh rejected (400) → error, session cleared, reload once, no retry', async () => {
  putSession();
  queue(json(401, {}), json(400, { error_code: 'refresh_token_not_found', msg: 'gone' }));
  await assert.rejects(db.loadNotes(), { status: 400 });
  assert.equal(calls.length, 2);
  assert.equal(auth.getSession(), null);
  assert.equal(loc.reloads, 1);
});
test('db: concurrent requests hitting 401 share one refresh', async () => {
  putSession();
  let n401 = 0;
  const rest = (url, opts) => (opts.headers.Authorization === 'Bearer AT1' ? json(401, {})() : json(200, [])());
  const refresh = json(200, { access_token: 'AT2', refresh_token: 'RT2', expires_in: 3600 });
  // route by URL rather than order
  const router = (url, opts) => (url.startsWith(AUTH) ? (n401++, refresh()) : rest(url, opts));
  queue(router, router, router, router, router);
  await Promise.all([db.loadNotes(), db.loadNotes()]);
  assert.equal(n401, 1);
  assert.equal(calls.length, 5);
});
test('db: non-OK throws with status and body text in message', async () => {
  putSession();
  queue(text(500, 'boom'));
  await assert.rejects(db.loadNotes(), { message: '500 boom' });
  queue(json(403, { code: '42501', message: 'rls' }));
  await assert.rejects(db.createNoteDB({}), e => e.message.startsWith('403 ') && e.message.includes('42501'));
  queue(json(409, {}));
  await assert.rejects(db.removeNoteDB('n1'), /^Error: 409 /);
  assert.equal(calls.length, 3);
});

// ---------- logout ----------
test('logout: clears session before network call, old token to logout endpoint, reloads', async () => {
  putSession({ access_token: 'OLD' });
  queue(empty(204));
  await auth.logout();
  assert.equal(calls.length, 1);
  const c = calls[0];
  assert.equal(c.sessionAtCall, null, 'session must already be cleared when fetch is called');
  assert.equal(c.url, AUTH + 'logout?scope=local'); assert.equal(c.opts.method, 'POST');
  assert.equal(hdr(c, 'Authorization'), 'Bearer OLD');
  assert.equal(hdr(c, 'apikey'), SUPABASE_KEY);
  assert.equal(auth.getSession(), null);
  assert.equal(loc.reloads, 1);
});
test('logout: server error / network error still reloads once', async () => {
  putSession(); queue(json(401, { msg: 'bad jwt' }));
  await auth.logout();
  assert.equal(loc.reloads, 1);
  putSession(); queue(() => { throw new TypeError('Failed to fetch'); });
  await auth.logout();
  assert.equal(loc.reloads, 2);
  assert.equal(auth.getSession(), null);
});
test('logout: request never resolves → still reloads within ~2s', async () => {
  putSession();
  queue(() => new Promise(() => {}));
  const t0 = Date.now();
  const p = auth.logout();
  await tick();
  assert.equal(auth.getSession(), null);
  assert.equal(loc.reloads, 0);
  await p;
  const dt = Date.now() - t0;
  assert.ok(dt >= 1900 && dt < 2600, `took ${dt}ms`);
  assert.equal(loc.reloads, 1);
});
test('logout: no session → no network, reloads', async () => {
  await auth.logout();
  assert.equal(calls.length, 0);
  assert.equal(loc.reloads, 1);
});
test('logout during an in-flight refresh must not resurrect the session', async () => {
  putSession({ expires_at: now() - 1 });
  let release;
  queue(() => new Promise(r => { release = () => r(json(200, { access_token: 'AT2', refresh_token: 'RT2', expires_in: 3600 })()); }),
        empty(204));
  const rp = auth.getAccessToken().catch(() => {});
  await tick();
  await auth.logout();
  release(); await rp;
  assert.equal(auth.getSession(), null);
});

// ---------- currentUserEmail ----------
test('currentUserEmail: none / malformed → ""', () => {
  assert.equal(auth.currentUserEmail(), '');
  for (const t of ['garbage', 'a.b.c', 'a.!!!!.c', `h.${b64url('not json')}.s`, `h.${b64url('{"sub":"1"}')}.s`, '']) {
    putSession({ access_token: t });
    assert.equal(auth.currentUserEmail(), '', JSON.stringify(t));
  }
  store.set(SESSION_KEY, JSON.stringify({ refresh_token: 'r' }));
  assert.equal(auth.currentUserEmail(), '');
  store.set(SESSION_KEY, '{bad');
  assert.equal(auth.currentUserEmail(), '');
});
test('currentUserEmail: payloads of every padding length', () => {
  const seen = new Set();
  for (let i = 0; i < 6; i++) {
    const email = `${'u'.repeat(i + 1)}@example.com`;
    const tok = jwt({ sub: 'abc', email });
    seen.add(tok.split('.')[1].length % 4);
    putSession({ access_token: tok });
    assert.equal(auth.currentUserEmail(), email);
  }
  assert.ok(seen.has(2) && seen.has(3) && seen.has(0), 'covered padded and unpadded payloads');
});
test('currentUserEmail: non-ASCII metadata and base64url -/_ characters', () => {
  let tok, i = 0;
  do {
    tok = jwt({ user_metadata: { name: '김메모 ✍️', bio: '??>>~~ÿÿ' + '?'.repeat(i++) }, email: 'kim@example.com', role: 'authenticated' });
  } while (!(tok.split('.')[1].includes('-') && tok.split('.')[1].includes('_')) && i < 50);
  const p = tok.split('.')[1];
  assert.ok(p.includes('-') && p.includes('_'), 'payload exercises url-safe alphabet');
  putSession({ access_token: tok });
  assert.equal(auth.currentUserEmail(), 'kim@example.com');
});

// ---------- changePassword ----------
test('changePassword: wrong current password → Korean error, no PUT, session untouched', async () => {
  putSession({ access_token: jwt({ email: 'me@example.com' }) });
  const before = store.get(SESSION_KEY);
  queue(json(400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' }));
  await assert.rejects(auth.changePassword('wrong', 'newpass1'), { message: '현재 비밀번호가 틀렸어요.' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, AUTH + 'token?grant_type=password');
  assert.equal(calls.some(c => c.opts.method === 'PUT'), false);
  assert.equal(store.get(SESSION_KEY), before);
  assert.equal(loc.reloads, 0);
});
test('changePassword: non-400 re-login failure passes through, session untouched', async () => {
  putSession({ access_token: jwt({ email: 'me@example.com' }) });
  const before = store.get(SESSION_KEY);
  queue(json(429, { error_code: 'over_request_rate_limit' }));
  await assert.rejects(auth.changePassword('cur', 'new'), { status: 429, message: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.' });
  queue(() => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(auth.changePassword('cur', 'new'), TypeError);
  assert.equal(store.get(SESSION_KEY), before);
});
test('changePassword: success → re-login with session email, session replaced, PUT user with new token + new password', async () => {
  putSession({ access_token: jwt({ email: 'me@example.com' }) });
  queue(json(200, { access_token: 'NEWAT', refresh_token: 'NEWRT', expires_in: 3600, user: {} }), json(200, { id: 'u1' }));
  assert.equal(await auth.changePassword('curpass', 'newpass1'), undefined);
  assert.equal(calls.length, 2);
  const [login, put] = calls;
  assert.equal(login.url, AUTH + 'token?grant_type=password'); assert.equal(login.opts.method, 'POST');
  assert.deepEqual(JSON.parse(login.opts.body), { email: 'me@example.com', password: 'curpass' });
  assert.equal('Authorization' in login.opts.headers, false);
  assert.equal(put.url, AUTH + 'user'); assert.equal(put.opts.method, 'PUT');
  assert.equal(hdr(put, 'Authorization'), 'Bearer NEWAT');
  assert.equal(hdr(put, 'apikey'), SUPABASE_KEY);
  assert.equal(JSON.parse(put.opts.body).password, 'newpass1');
  assert.equal(JSON.parse(put.sessionAtCall).access_token, 'NEWAT', 'session replaced before PUT');
  const s = stored();
  assert.equal(s.access_token, 'NEWAT'); assert.equal(s.refresh_token, 'NEWRT');
  assert.equal(loc.reloads, 0);
});
test('changePassword: server rejects PUT → mapped message surfaces', async () => {
  for (const [code, status, msg] of [['same_password', 422, '새 비밀번호가 현재 비밀번호와 같아요.'], ['weak_password', 422, '비밀번호는 6자 이상이어야 해요.']]) {
    putSession({ access_token: jwt({ email: 'me@example.com' }) });
    queue(json(200, { access_token: 'NEWAT', refresh_token: 'NEWRT', expires_in: 3600 }), json(status, { error_code: code, msg: 'en' }));
    await assert.rejects(auth.changePassword('cur', 'x'), { message: msg, status });
    assert.equal(stored().access_token, 'NEWAT');
  }
});
test('changePassword: PUT failing with 400 is NOT reported as wrong current password unless server says so', async () => {
  putSession({ access_token: jwt({ email: 'me@example.com' }) });
  queue(json(200, { access_token: 'NEWAT', refresh_token: 'NEWRT', expires_in: 3600 }), json(400, { error_code: 'validation_failed', msg: 'bad input' }));
  await assert.rejects(auth.changePassword('cur', 'x'), { message: 'bad input', status: 400 });
});

test('changePassword: re-login fails for another reason → that reason is shown, not "wrong password"', async () => {
  putSession({ access_token: jwt({ email: 'me@example.com' }) });
  const before = store.get(SESSION_KEY);
  queue(json(400, { error_code: 'email_not_confirmed', msg: 'Email not confirmed' }));
  await assert.rejects(auth.changePassword('right', 'newpass1'), { message: '이메일 인증을 먼저 완료해 주세요.' });
  assert.equal(calls.length, 1);
  assert.equal(store.get(SESSION_KEY), before);
});
test('authFetch: error carries the GoTrue error_code', async () => {
  queue(json(422, { error_code: 'weak_password', msg: 'x' }));
  await assert.rejects(auth.authFetch('signup', {}), e => e.code === 'weak_password' && e.status === 422);
});
