import { Crepe, replaceAll, editorViewCtx } from './milkdown-crepe.bundle.js';
import { SESSION_KEY, setSession, isAuthed, authFetch, logout, currentUserEmail, changePassword } from './auth.js';
import { loadNotes, createNoteDB, patchNote, removeNoteDB } from './db.js';

// ─── THEME TOGGLE ─────────────────────────────────────────
const themeToggle = document.getElementById('theme-toggle');
const themeIcon   = document.getElementById('theme-icon');
const THEME_KEY   = 'md_theme';
const FONT_KEY    = 'md_font';
const FONT_MAP    = {
  monas: "'MonaS12', 'Segoe UI', sans-serif",
  mulmaru: "'Mulmaru', 'Segoe UI', sans-serif",
  iyagi: "'IyagiGGC', 'Segoe UI', sans-serif",
  nanum: "'NanumSquareNeo aLt', 'Segoe UI', sans-serif",
  kopub: "'KoPubWorld Batang', 'Segoe UI', sans-serif",
  gangwon: "'GangwonEdu Modu', 'Segoe UI', sans-serif",
};

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'light' ? 'W' : 'D';
  themeToggle.title = theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환';
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

const FONT_SIZE_MAP = {
  gangwon: '16.5px',
};
const DEFAULT_FONT_SIZE = '15.5px';
const FONT_SIZE_PREF_KEY = 'font-size-global'; // 'normal' | 'large'

function applyFontSize(size) {
  localStorage.setItem(FONT_SIZE_PREF_KEY, size);
  if (size === 'large') {
    document.documentElement.setAttribute('data-font-size', 'large');
  } else {
    document.documentElement.removeAttribute('data-font-size');
  }
  document.querySelectorAll('#global-size-btns .font-size-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === size);
  });
}

function applyFont(fontKey) {
  const resolved = FONT_MAP[fontKey] ? fontKey : 'monas';
  document.documentElement.style.setProperty('--font', FONT_MAP[resolved]);
  document.documentElement.style.setProperty('--font-size-base', FONT_SIZE_MAP[resolved] || DEFAULT_FONT_SIZE);
  localStorage.setItem(FONT_KEY, resolved);
  document.querySelectorAll('.font-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.fontKey === resolved);
  });
}

themeToggle.addEventListener('click', toggleTheme);

// 저장된 테마 복원
(function() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) applyTheme(saved);
  else applyTheme('light');

  const savedFont = localStorage.getItem(FONT_KEY);
  applyFont(savedFont || 'monas');

  const savedSize = localStorage.getItem(FONT_SIZE_PREF_KEY) || 'normal';
  applyFontSize(savedSize);
})();

// ─── LOGIN SCREEN ─────────────────────────────────────────
const loginScreen       = document.getElementById('login-screen');
const loginFormEl       = document.getElementById('login-form');
const registerFormEl    = document.getElementById('register-form');
const authBox           = document.getElementById('auth-box');
const authTitle         = document.getElementById('auth-title');

const idInput           = document.getElementById('id-input');
const pwInput           = document.getElementById('pw-input');
const loginBtn          = document.getElementById('login-btn');
const loginError        = document.getElementById('login-error');

const regEmailInput     = document.getElementById('reg-email-input');
const regNicknameInput  = document.getElementById('reg-nickname-input');
const regPwInput        = document.getElementById('reg-pw-input');
const registerBtn       = document.getElementById('register-btn');
const registerError     = document.getElementById('register-error');
const registerSuccess   = document.getElementById('register-success');

// 다른 탭에서 로그아웃하면 이 탭도 로그인 화면으로
window.addEventListener('storage', e => {
  if (e.key === SESSION_KEY && !e.newValue) location.reload();
});

/* ─── AUTO-LOGOUT (30분 미입력 시) ─── */
const IDLE_TIMEOUT = 30 * 60 * 1000;
const ACTIVE_KEY = 'md_last_active'; // 탭끼리 공유하는 마지막 활동 시각
let idleTimer = null;
let lastActiveWrite = 0;
function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  if (!isAuthed()) return;
  const now = Date.now();
  if (now - lastActiveWrite > 10000) { lastActiveWrite = now; localStorage.setItem(ACTIVE_KEY, now); }
  idleTimer = setTimeout(onIdleTimeout, IDLE_TIMEOUT);
}
function onIdleTimeout() {
  // 다른 탭에서 쓰고 있었다면 로그아웃하지 않고 남은 시간만큼 다시 대기
  const remaining = IDLE_TIMEOUT - (Date.now() - Number(localStorage.getItem(ACTIVE_KEY) || 0));
  if (remaining > 0) idleTimer = setTimeout(onIdleTimeout, remaining);
  else logout();
}
['mousemove','mousedown','keydown','touchstart','scroll','click'].forEach(evt =>
  document.addEventListener(evt, resetIdleTimer, { passive: true })
);

async function doLogin() {
  const email    = idInput.value.trim();
  const password = pwInput.value;
  if (!email || !password) {
    loginError.textContent = '이메일과 비밀번호를 입력해 주세요.';
    return;
  }
  loginBtn.disabled = true;
  try {
    setSession(await authFetch('token?grant_type=password', { email, password }));
    resetIdleTimer();
    loginScreen.style.display = 'none';
    initApp();
  } catch(e) {
    loginError.textContent = e.message;
    idInput.classList.add('error');
    pwInput.classList.add('error');
    pwInput.value = '';
    setTimeout(() => {
      idInput.classList.remove('error');
      pwInput.classList.remove('error');
      loginError.textContent = '';
    }, 1800);
    idInput.focus();
  } finally {
    loginBtn.disabled = false;
  }
}

async function doRegister() {
  const email    = regEmailInput.value.trim();
  const nickname = regNicknameInput.value.trim();
  const password = regPwInput.value;
  registerError.textContent = '';
  registerSuccess.textContent = '';
  if (!email || !nickname || !password) {
    registerError.textContent = '모든 항목을 입력해 주세요.';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    registerError.textContent = '올바른 이메일 형식이 아니에요.';
    regEmailInput.classList.add('error');
    setTimeout(() => { regEmailInput.classList.remove('error'); registerError.textContent = ''; }, 1800);
    return;
  }
  if (nickname.length < 2) {
    registerError.textContent = '닉네임은 2자 이상이어야 해요.';
    regNicknameInput.classList.add('error');
    setTimeout(() => { regNicknameInput.classList.remove('error'); registerError.textContent = ''; }, 1800);
    return;
  }
  if (password.length < 6) {
    registerError.textContent = '비밀번호는 6자 이상이어야 해요.';
    regPwInput.classList.add('error');
    setTimeout(() => { regPwInput.classList.remove('error'); registerError.textContent = ''; }, 1800);
    return;
  }
  registerBtn.disabled = true;
  try {
    const data = await authFetch('signup', { email, password, data: { nickname } });
    // 이메일 인증이 켜져 있으면 토큰 없이 응답이 오고, 인증 메일이 발송됨
    const needsConfirm = !data.access_token;
    registerSuccess.textContent = needsConfirm
      ? '인증 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.'
      : '가입 완료! 로그인해 주세요 🎉';
    regEmailInput.value = '';
    regNicknameInput.value = '';
    regPwInput.value = '';
    setTimeout(() => { registerSuccess.textContent = ''; showLoginForm(); }, needsConfirm ? 5000 : 1600);
  } catch(e) {
    registerError.textContent = e.message;
    regEmailInput.classList.add('error');
    setTimeout(() => { regEmailInput.classList.remove('error'); registerError.textContent = ''; }, 2500);
  } finally {
    registerBtn.disabled = false;
  }
}

function showLoginForm() {
  loginFormEl.style.display = '';
  registerFormEl.style.display = 'none';
  authBox.classList.remove('register-mode');
  authTitle.textContent = 'memyo';
  idInput.focus();
}

function showRegisterForm() {
  loginFormEl.style.display = 'none';
  registerFormEl.style.display = '';
  authBox.classList.add('register-mode');
  authTitle.textContent = '회원가입';
  regEmailInput.focus();
}

loginBtn.addEventListener('click', doLogin);
idInput.addEventListener('keydown', e => { if (e.key === 'Enter') pwInput.focus(); });
pwInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

registerBtn.addEventListener('click', doRegister);
regEmailInput.addEventListener('keydown', e => { if (e.key === 'Enter') regNicknameInput.focus(); });
regNicknameInput.addEventListener('keydown', e => { if (e.key === 'Enter') regPwInput.focus(); });
regPwInput.addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });

document.getElementById('show-register-btn').addEventListener('click', showRegisterForm);
document.getElementById('show-login-btn').addEventListener('click', showLoginForm);

// ─── STATE ────────────────────────────────────────────────
let notes = [];
let currentNoteId = null;
let crepe = null;
let searchQuery = '';
let editorReady = false;
let activeTag = null;
let sortOrder = 'created_desc';
let isLoadingNote = false;
let lastSavedContent = '';
let lastSavedTitle = '';

// ─── DOM ──────────────────────────────────────────────────
const app         = document.getElementById('app');
const loading     = document.getElementById('loading');
const noteList    = document.getElementById('note-list');
const noteCountEl = document.getElementById('note-count');
const titleBar    = document.getElementById('title-bar');
const noteTitle   = document.getElementById('note-title');
const editorWrap  = document.getElementById('editor-wrap');
const emptyEditor = document.getElementById('empty-editor');
const saveLabel   = document.getElementById('save-label');
const charCountEl = document.getElementById('char-count');
const toastEl     = document.getElementById('toast');
const contextMenu = document.getElementById('context-menu');
const hashtagPanel = document.getElementById('hashtag-panel');
const tagListEl   = document.getElementById('tag-list');

let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

function setSaveStatus(state) {
  const dot = document.querySelector('#save-status .dot');
  dot.className = 'dot';
  if (state === 'saving')     { dot.classList.add('saving');  saveLabel.textContent = '저장 중...'; }
  else if (state === 'saved') { dot.classList.add('saved');   saveLabel.textContent = '저장 완료'; }
  else                        { dot.classList.add('unsaved'); saveLabel.textContent = '대기 중'; }
}

function getMarkdown() {
  if (!crepe) return '';
  try {
    let md = crepe.getMarkdown();
    // <br /> → 빈 줄로 치환 (Obsidian 등 순수 마크다운 호환)
    md = md.replace(/<br\s*\/?>/gi, '\n');
    return md;
  } catch { return ''; }
}

function updateCharCount() {
  charCountEl.textContent = `${getMarkdown().length}자`;
}

// ─── KOREAN DATE ──────────────────────────────────────────
function toKST(dateStr) {
  const d = new Date(dateStr);
  return new Date(d.getTime() + (d.getTimezoneOffset() + 540) * 60000);
}

function formatKoreanFull(dateStr) {
  const kr = toKST(dateStr);
  const y = kr.getFullYear();
  const m = kr.getMonth() + 1;
  const day = kr.getDate();
  const h = String(kr.getHours()).padStart(2, '0');
  const min = String(kr.getMinutes()).padStart(2, '0');
  return `${y}년 ${m}월 ${day}일 ${h}:${min}`;
}

function formatRelative(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  return formatKoreanFull(dateStr);
}

// ─── HASHTAG ──────────────────────────────────────────────
function extractTags(content) {
  const matches = (content || '').match(/#[가-힣a-zA-Z0-9_]+/g);
  return matches ? [...new Set(matches)] : [];
}

function collectAllTags() {
  const tagMap = {};
  notes.forEach(n => {
    extractTags(n.content).forEach(tag => {
      tagMap[tag] = (tagMap[tag] || 0) + 1;
    });
  });
  return Object.entries(tagMap).sort((a, b) => b[1] - a[1]);
}

function renderHashtags() {
  const tags = collectAllTags();
  tagListEl.innerHTML = '';
  if (tags.length === 0) {
    tagListEl.innerHTML = '<span style="font-size:0.72rem;color:var(--text-muted);">해시태그가 없습니다</span>';
    return;
  }
  tags.forEach(([tag, count]) => {
    const el = document.createElement('span');
    el.className = 'tag-item' + (activeTag === tag ? ' active' : '');
    el.innerHTML = `${tag} <span class="tag-count">${count}</span>`;
    el.addEventListener('click', () => {
      activeTag = activeTag === tag ? null : tag;
      renderHashtags();
      renderNoteList();
    });
    tagListEl.appendChild(el);
  });
  if (activeTag) {
    const clear = document.createElement('div');
    clear.className = 'tag-clear';
    clear.textContent = '✕ 필터 해제';
    clear.addEventListener('click', () => { activeTag = null; renderHashtags(); renderNoteList(); });
    tagListEl.appendChild(clear);
  }
}

document.getElementById('hashtag-btn').addEventListener('click', () => {
  hashtagPanel.classList.toggle('active');
  if (hashtagPanel.classList.contains('active')) renderHashtags();
});

// ─── SIDEBAR ──────────────────────────────────────────────
function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

let ctxNoteId = null;

function renderNoteList() {
  noteList.innerHTML = '';
  let filtered = notes.filter(n =>
    !searchQuery ||
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (activeTag) {
    filtered = filtered.filter(n => extractTags(n.content).includes(activeTag));
  }

  // 정렬 (생성일 기준 또는 제목순)
  filtered.sort((a, b) => {
    if (sortOrder === 'created_desc') return new Date(b.created_at) - new Date(a.created_at);
    if (sortOrder === 'created_asc')  return new Date(a.created_at) - new Date(b.created_at);
    if (sortOrder === 'title_asc')    return (a.title || '').localeCompare(b.title || '', 'ko');
    if (sortOrder === 'title_desc')   return (b.title || '').localeCompare(a.title || '', 'ko');
    return 0;
  });

  filtered.forEach(n => {
    const item = document.createElement('div');
    item.className = 'note-item' + (n.id === currentNoteId ? ' active' : '');

    const preview = (n.content || '')
      .replace(/<[^>]*>/g, '')
      .replace(/[#*`>_\-\[\]()!~|\\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 60);
    const updatedStr = formatRelative(n.updated_at);
    const createdStr = formatKoreanFull(n.created_at);

    item.innerHTML = `
      <div class="note-item-title">${escHtml(n.title || '제목 없음')}</div>
      <div class="note-item-meta">수정: ${updatedStr}<br>생성: ${createdStr}</div>
      <div class="note-item-preview">${escHtml(preview) || '내용 없음'}</div>
      <button class="delete-btn" title="삭제">✕</button>
    `;

    item.addEventListener('click', e => {
      if (e.target.closest('.delete-btn')) return;
      selectNote(n.id);
    });
    item.querySelector('.delete-btn').addEventListener('click', e => {
      e.stopPropagation();
      removeNote(n.id);
    });
    item.addEventListener('contextmenu', e => {
      e.preventDefault();
      ctxNoteId = n.id;
      contextMenu.style.display = 'block';
      contextMenu.style.left = e.clientX + 'px';
      contextMenu.style.top = e.clientY + 'px';
    });

    noteList.appendChild(item);
  });

  noteCountEl.textContent = `${notes.length}개의 노트`;
}

// ─── CONTEXT MENU ─────────────────────────────────────────
document.addEventListener('click', () => { contextMenu.style.display = 'none'; });

document.getElementById('ctx-export').addEventListener('click', () => {
  const note = notes.find(n => n.id === ctxNoteId);
  if (!note) return;
  const blob = new Blob([note.content || ''], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${note.title || '제목 없음'}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('마크다운을 내보냈어요!');
});

document.getElementById('ctx-delete').addEventListener('click', () => {
  if (ctxNoteId) removeNote(ctxNoteId);
});

// ─── SIDEBAR TOGGLE ───────────────────────────────────────
document.getElementById('sidebar-toggle').addEventListener('click', () => {
  app.classList.toggle('sidebar-collapsed');
});

// ─── MOBILE HAMBURGER ─────────────────────────────────────
const mobileHamburger = document.getElementById('mobile-hamburger');
const mobileHamburgerIcon = document.getElementById('mobile-hamburger-icon');

function isMobileView() {
  return window.innerWidth <= 768;
}

function updateMobileHamburgerIcon() {
  const isEditor = app.classList.contains('mobile-editor');
  if (isEditor) {
    // 에디터 모드 → 목록 아이콘 (햄버거)
    mobileHamburgerIcon.innerHTML = '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>';
  } else {
    // 목록 모드 → 연필 아이콘
    mobileHamburgerIcon.innerHTML = '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>';
  }
}

mobileHamburger.addEventListener('click', () => {
  if (!isMobileView()) return;
  app.classList.toggle('mobile-editor');
  updateMobileHamburgerIcon();
});

// 모바일에서 노트 선택시 자동으로 에디터로 전환
const origSelectNote = selectNote;
selectNote = function(id) {
  origSelectNote(id);
  if (isMobileView()) {
    app.classList.add('mobile-editor');
    updateMobileHamburgerIcon();
  }
};

// 화면 크기 변경 시 모바일 클래스 정리
window.addEventListener('resize', () => {
  if (!isMobileView()) {
    app.classList.remove('mobile-editor');
  }
  updateMobileHamburgerIcon();
});

// ─── FOCUS MODE ───────────────────────────────────────────
document.getElementById('focus-btn').addEventListener('click', () => {
  if (app.classList.contains('focus-mode')) {
    app.classList.remove('focus-mode');
    document.getElementById('focus-btn').textContent = '집중 켬';
    showToast('집중 모드 해제');
  } else {
    app.classList.add('focus-mode');
    document.getElementById('focus-btn').textContent = '집중 끔';
    showToast('집중 모드 · Esc로 해제');
  }
});

// ─── EDITOR ───────────────────────────────────────────────
async function initEditor() {
  crepe = new Crepe({
    root: document.getElementById('milkdown-editor'),
    defaultValue: '',
    featureConfigs: {
      'block-edit': {
        textGroup: {
          label: '텍스트',
          text: { label: '본문' },
          h1: { label: '제목 1' },
          h2: { label: '제목 2' },
          h3: { label: '제목 3' },
          h4: { label: '제목 4' },
          h5: { label: '제목 5' },
          h6: { label: '제목 6' },
          quote: { label: '인용문' },
          divider: { label: '구분선' },
        },
        listGroup: {
          label: '목록',
          bulletList: { label: '글머리 기호' },
          orderedList: { label: '번호 목록' },
          taskList: { label: '할 일 목록' },
        },
        advancedGroup: {
          label: '고급',
          image: { label: '이미지' },
          codeBlock: { label: '코드 블록' },
          table: { label: '표' },
          math: { label: '수식' },
        },
      },
    },
  });

  await crepe.create();
  editorReady = true;
  document.querySelector('#milkdown-editor .ProseMirror')?.setAttribute('spellcheck', 'false');

  // TOC: 에디터 스크롤 시 활성 헤딩 업데이트
  document.getElementById('milkdown-editor').addEventListener('scroll', () => {
    updateTocActive();
  }, { passive: true });

  // ─── Heading / Blockquote Backspace Fix ───
  crepe.editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    view.dom.addEventListener('keydown', (e) => {
      if (e.key !== 'Backspace') return;
      // CodeMirror 코드 블록 내부는 건드리지 않음
      if (e.target && e.target.closest && e.target.closest('.cm-editor')) return;
      const { state } = view;
      const { $from, empty } = state.selection;
      if (!empty || $from.parentOffset !== 0) return;

      // Fix 1: heading → paragraph 직변환
      if ($from.parent.type.name === 'heading') {
        const pos = $from.before();
        const tr = state.tr.setNodeMarkup(pos, state.schema.nodes.paragraph);
        view.dispatch(tr);
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      // Fix 2: blockquote 첫 단락 맨 앞 → blockquote 해제
      if ($from.depth >= 2 && $from.node(-1).type.name === 'blockquote') {
        const bqNode = $from.node(-1);
        const bqPos = $from.before(-1);
        const firstChild = bqNode.firstChild;
        if (!firstChild) return;
        let tr = state.tr;
        if (bqNode.childCount === 1) {
          // 자식이 하나면 blockquote 전체를 해당 노드로 대체
          tr = tr.replaceWith(bqPos, bqPos + bqNode.nodeSize, firstChild);
        } else {
          // 자식이 여럿이면 첫 번째만 blockquote 밖으로 꺼냄
          tr = tr.delete(bqPos + 1, bqPos + 1 + firstChild.nodeSize);
          tr = tr.insert(bqPos, state.schema.nodes.paragraph.create(null, firstChild.content));
        }
        view.dispatch(tr);
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);
  });

  crepe.on((listener) => {
    listener.markdownUpdated((_, md) => {
      if (!currentNoteId || isLoadingNote) return;
      const note = notes.find(n => n.id === currentNoteId);
      if (note) note.content = md;
      updateCharCount();
      scheduleHighlight();
      scheduleGrips();
      scheduleToc();
      if (md !== lastSavedContent) {
        debounceSave();
      }
    });
  });
}

let hlTimer = null;
function scheduleHighlight() {
  clearTimeout(hlTimer);
  hlTimer = setTimeout(() => {
    applyHashtagHighlight();
  }, 300);
}

// ─── IMAGE RESIZE GRIP ──────────────────────────────────
function setupImageResizeGrips() {
  const editorEl = document.querySelector('#milkdown-editor .ProseMirror');
  if (!editorEl) return;

  // 모든 이미지에 referrerpolicy 추가 (핫링크 차단 우회)
  editorEl.querySelectorAll('img:not([referrerpolicy])').forEach(img => {
    img.setAttribute('referrerpolicy', 'no-referrer');
  });

  editorEl.querySelectorAll('.milkdown-image-block > .image-wrapper').forEach(wrapper => {
    if (wrapper.querySelector('.img-resize-grip')) return;
    const img = wrapper.querySelector('img');
    if (!img) return;
    const grip = document.createElement('div');
    grip.className = 'img-resize-grip';
    wrapper.style.position = 'relative';
    wrapper.appendChild(grip);

    let startX, startY, startW, startH;
    grip.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      startX = e.clientX;
      startY = e.clientY;
      startW = img.offsetWidth;
      startH = img.offsetHeight;
      const ratio = startW / startH;

      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const newW = Math.max(80, startW + dx);
        img.style.width = newW + 'px';
        img.style.height = (newW / ratio) + 'px';
      };
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
  });
}

let gripTimer = null;
function scheduleGrips() {
  clearTimeout(gripTimer);
  gripTimer = setTimeout(setupImageResizeGrips, 500);
}

// ─── TOC OVERLAY ────────────────────────────────────────
let tocTimer = null;
function scheduleToc() {
  clearTimeout(tocTimer);
  tocTimer = setTimeout(buildToc, 400);
}

function buildToc() {
  const toc = document.getElementById('toc-overlay');
  const editorEl = document.querySelector('#milkdown-editor .ProseMirror');
  if (!toc || !editorEl) return;

  const headings = editorEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headings.length === 0) { toc.innerHTML = ''; return; }

  let html = '';
  headings.forEach((h, i) => {
    const level = parseInt(h.tagName[1]);
    const text = h.textContent.trim();
    if (!text) return;
    html += `<div class="toc-item" data-level="${level}" data-toc-idx="${i}">${escHtml(text)}</div>`;
  });
  toc.innerHTML = html;

  // 클릭 시 해당 헤딩으로 스크롤
  toc.querySelectorAll('.toc-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.tocIdx);
      const target = editorEl.querySelectorAll('h1, h2, h3, h4, h5, h6')[idx];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  // 현재 보이는 헤딩 하이라이트
  updateTocActive();
}

function updateTocActive() {
  const toc = document.getElementById('toc-overlay');
  const scrollEl = document.getElementById('milkdown-editor');
  const editorEl = document.querySelector('#milkdown-editor .ProseMirror');
  if (!toc || !scrollEl || !editorEl) return;

  const headings = editorEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const scrollTop = scrollEl.scrollTop;
  const offset = scrollEl.getBoundingClientRect().top + 80;
  let activeIdx = -1;

  headings.forEach((h, i) => {
    const rect = h.getBoundingClientRect();
    if (rect.top <= offset) activeIdx = i;
  });

  toc.querySelectorAll('.toc-item').forEach(item => {
    const idx = parseInt(item.dataset.tocIdx);
    item.classList.toggle('active', idx === activeIdx);
  });
}

function applyHashtagHighlight() {
  if (!CSS.highlights) return;
  const editorEl = document.querySelector('#milkdown-editor .ProseMirror');
  if (!editorEl) return;
  const ranges = [];
  const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT, null);
  const re = /#[가-힣a-zA-Z0-9_]+/g;
  let node;
  while ((node = walker.nextNode())) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(node.textContent)) !== null) {
      const r = new Range();
      r.setStart(node, m.index);
      r.setEnd(node, m.index + m[0].length);
      ranges.push(r);
    }
  }
  if (ranges.length > 0) {
    CSS.highlights.set('editor-hashtag', new Highlight(...ranges));
  } else {
    CSS.highlights.delete('editor-hashtag');
  }
}

// ─── AUTO SAVE ────────────────────────────────────────────
let saveTimer = null;

function debounceSave() {
  setSaveStatus('unsaved');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveCurrentNote, 1000);
}

async function saveCurrentNote() {
  if (!currentNoteId) return;
  const note = notes.find(n => n.id === currentNoteId);
  if (!note) return;

  setSaveStatus('saving');
  try {
    const updated = await patchNote(note.id, {
      title: note.title,
      content: note.content,
      updated_at: new Date().toISOString(),
    });
    if (updated) note.updated_at = updated.updated_at;
    lastSavedContent = note.content || '';
    lastSavedTitle = note.title || '';
    setSaveStatus('saved');
    renderNoteList();
    if (hashtagPanel.classList.contains('active')) renderHashtags();
  } catch(e) {
    console.error(e);
    setSaveStatus('unsaved');
    showToast('저장 오류: ' + e.message);
  }
}

// ─── NOTE ACTIONS ─────────────────────────────────────────
async function addNote() {
  try {
    const note = await createNoteDB({
      user_email: currentUserEmail(),
      title: '제목 없음',
      content: '',
      updated_at: new Date().toISOString(),
    });
    notes.unshift(note);
    selectNote(note.id);
    renderNoteList();
    noteTitle.focus();
    noteTitle.select();
    showToast('새 노트를 만들었어요!');
  } catch(e) {
    console.error(e);
    showToast('오류: ' + e.message);
  }
}

function selectNote(id) {
  if (currentNoteId && saveTimer) {
    clearTimeout(saveTimer);
    saveCurrentNote();
  }

  currentNoteId = id;
  const note = notes.find(n => n.id === id);
  if (!note) return;

  titleBar.style.display = 'flex';
  editorWrap.style.display = 'flex';
  emptyEditor.style.display = 'none';
  noteTitle.value = note.title;

  isLoadingNote = true;
  if (crepe && editorReady) {
    crepe.editor.action(replaceAll(note.content || ''));
  }
  requestAnimationFrame(() => { isLoadingNote = false; });

  lastSavedContent = note.content || '';
  lastSavedTitle = note.title || '';
  updateCharCount();
  setSaveStatus('saved');
  renderNoteList();
  setTimeout(() => { applyHashtagHighlight(); setupImageResizeGrips(); buildToc(); }, 300);
}

async function removeNote(id) {
  if (!confirm('이 노트를 삭제할까요?')) return;
  try {
    await removeNoteDB(id);
    notes = notes.filter(n => n.id !== id);
    if (currentNoteId === id) {
      currentNoteId = null;
      titleBar.style.display = 'none';
      editorWrap.style.display = 'none';
      emptyEditor.style.display = 'flex';
      if (crepe && editorReady) crepe.editor.action(replaceAll(''));
      setSaveStatus('unsaved');
    }
    renderNoteList();
    showToast('노트를 삭제했어요.');
  } catch(e) {
    console.error(e);
    showToast('삭제 오류: ' + e.message);
  }
}

// ─── TITLE EDIT ───────────────────────────────────────────
noteTitle.addEventListener('input', () => {
  if (!currentNoteId) return;
  const note = notes.find(n => n.id === currentNoteId);
  if (note) note.title = noteTitle.value;
  if (noteTitle.value !== lastSavedTitle) {
    debounceSave();
  }
});

// ─── SEARCH ───────────────────────────────────────────────
document.getElementById('sidebar-search').addEventListener('input', e => {
  searchQuery = e.target.value.trim();
  renderNoteList();
});

// ─── SORT ─────────────────────────────────────────────────
const sortDateBtn  = document.getElementById('sort-date-btn');
const sortTitleBtn = document.getElementById('sort-title-btn');

function updateSortButtons() {
  const isDate = sortOrder.startsWith('created');
  sortDateBtn.classList.toggle('active', isDate);
  sortTitleBtn.classList.toggle('active', !isDate);
  sortDateBtn.textContent  = sortOrder === 'created_asc' ? '생성일 ▲' : '생성일 ▼';
  sortTitleBtn.textContent = sortOrder === 'title_desc' ? '제목순(ㅎ)' : '제목순(ㄱ)';
}

sortDateBtn.addEventListener('click', () => {
  sortOrder = sortOrder === 'created_desc' ? 'created_asc' : 'created_desc';
  updateSortButtons();
  renderNoteList();
});

sortTitleBtn.addEventListener('click', () => {
  sortOrder = sortOrder === 'title_asc' ? 'title_desc' : 'title_asc';
  updateSortButtons();
  renderNoteList();
});

// ─── BUTTONS ──────────────────────────────────────────────
document.getElementById('new-note-btn').addEventListener('click', addNote);

const settingsBtn = document.getElementById('settings-btn');
const fontMenu = document.getElementById('font-menu');

settingsBtn.addEventListener('click', e => {
  e.stopPropagation();
  fontMenu.classList.toggle('open');
  fontMenu.setAttribute('aria-hidden', fontMenu.classList.contains('open') ? 'false' : 'true');
});

document.querySelectorAll('.font-item').forEach(btn => {
  btn.addEventListener('click', () => {
    applyFont(btn.dataset.fontKey);
    fontMenu.classList.remove('open');
    fontMenu.setAttribute('aria-hidden', 'true');
    showToast('폰트가 변경되었습니다.');
  });
});

document.querySelectorAll('#global-size-btns .font-size-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    applyFontSize(btn.dataset.size);
  });
});

document.addEventListener('click', e => {
  if (!fontMenu.classList.contains('open')) return;
  if (fontMenu.contains(e.target) || settingsBtn.contains(e.target)) return;
  fontMenu.classList.remove('open');
  fontMenu.setAttribute('aria-hidden', 'true');
});

document.getElementById('logout-btn').addEventListener('click', logout);

// ─── 비밀번호 변경 ────────────────────────────────────────
const pwDialog  = document.getElementById('pw-dialog');
const pwForm    = document.getElementById('pw-form');
const pwCurrent = document.getElementById('pw-current');
const pwNew     = document.getElementById('pw-new');
const pwNew2    = document.getElementById('pw-new2');
const pwError   = document.getElementById('pw-error');
const pwSubmit  = document.getElementById('pw-submit');

document.getElementById('change-pw-btn').addEventListener('click', () => {
  fontMenu.classList.remove('open');
  fontMenu.setAttribute('aria-hidden', 'true');
  pwForm.reset();
  pwError.textContent = '';
  pwDialog.showModal();
});
document.getElementById('pw-cancel').addEventListener('click', () => pwDialog.close());

pwForm.addEventListener('submit', async e => {
  e.preventDefault();
  pwError.textContent = '';
  if (pwNew.value.length < 6) { pwError.textContent = '새 비밀번호는 6자 이상이어야 해요.'; pwNew.focus(); return; }
  if (pwNew.value !== pwNew2.value) { pwError.textContent = '새 비밀번호가 서로 달라요.'; pwNew2.focus(); return; }
  if (pwNew.value === pwCurrent.value) { pwError.textContent = '새 비밀번호가 현재 비밀번호와 같아요.'; pwNew.focus(); return; }
  pwSubmit.disabled = true;
  try {
    await changePassword(pwCurrent.value, pwNew.value);
    pwDialog.close();
    pwForm.reset();
    showToast('비밀번호를 변경했어요.');
  } catch (err) {
    pwError.textContent = err.message;
  } finally {
    pwSubmit.disabled = false;
  }
});

// ─── HELP POPUP ─────────────────────────────────────────
const helpBtn = document.getElementById('help-btn');
const helpPopup = document.getElementById('help-popup');
const helpPopupClose = document.getElementById('help-popup-close');

helpBtn.addEventListener('click', e => {
  e.stopPropagation();
  helpPopup.classList.toggle('open');
  helpPopup.setAttribute('aria-hidden', helpPopup.classList.contains('open') ? 'false' : 'true');
});

helpPopupClose.addEventListener('click', () => {
  helpPopup.classList.remove('open');
  helpPopup.setAttribute('aria-hidden', 'true');
});

helpPopup.addEventListener('click', e => e.stopPropagation());

document.addEventListener('click', e => {
  if (!helpPopup.classList.contains('open')) return;
  if (helpPopup.contains(e.target) || helpBtn.contains(e.target)) return;
  helpPopup.classList.remove('open');
  helpPopup.setAttribute('aria-hidden', 'true');
});

// ─── KEYBOARD ─────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); e.stopPropagation(); addNote(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); e.stopPropagation(); clearTimeout(saveTimer); saveCurrentNote(); }
  if (e.key === 'Escape' && app.classList.contains('focus-mode')) {
    app.classList.remove('focus-mode');
    document.getElementById('focus-btn').textContent = '집중 켬';
    showToast('집중 모드 해제');
  }
}, true);

// ─── INIT ─────────────────────────────────────────────────
async function initApp() {
  app.classList.add('active');
  loading.style.display = 'flex';

  try {
    await initEditor();
    notes = await loadNotes();
    renderNoteList();
    if (notes.length > 0) selectNote(notes[0].id);
  } catch(e) {
    console.error(e);
    showToast('로딩 오류: ' + e.message);
  } finally {
    loading.style.display = 'none';
  }
}

// ─── CUSTOM CARET ─────────────────────────────────────────
const customCaret = document.getElementById('custom-caret');
const editorWrapEl = document.getElementById('editor-wrap');

function updateCustomCaret() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) {
    customCaret.style.display = 'none';
    return;
  }
  const proseMirror = document.querySelector('#milkdown-editor .ProseMirror');
  if (!proseMirror || !proseMirror.contains(sel.anchorNode)) {
    customCaret.style.display = 'none';
    return;
  }
  const range = sel.getRangeAt(0);
  const rect = range.getClientRects()[0] || range.getBoundingClientRect();
  const wrapRect = editorWrapEl.getBoundingClientRect();
  if (!rect || rect.height === 0) { customCaret.style.display = 'none'; return; }
  customCaret.style.display = 'block';
  customCaret.style.left = (rect.left - wrapRect.left) + 'px';
  customCaret.style.top = (rect.top - wrapRect.top) + 'px';
  customCaret.style.height = rect.height + 'px';
}

document.addEventListener('selectionchange', updateCustomCaret);
document.addEventListener('keyup', updateCustomCaret);
document.addEventListener('click', () => requestAnimationFrame(updateCustomCaret));

if (isAuthed()) {
  resetIdleTimer();
  loginScreen.style.display = 'none';
  initApp();
} else {
  loading.style.display = 'none';
  idInput.focus();
}
