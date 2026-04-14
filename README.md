# 🐱 memyo — Markdown Editor

> 심플하고 아름다운 브라우저 기반 마크다운 WYSIWYG 노트 에디터  
> **제작자 : 송죽동길냥이 (@ksthink)**

<br>

## 📌 소개

**memyo**는 Milkdown(ProseMirror 기반) 에디터 엔진을 사용하는 마크다운 WYSIWYG 노트 에디터입니다.  
Supabase를 백엔드로 활용해 별도 서버 구축 없이 노트를 클라우드에 저장하며, **단일 HTML 파일 아키텍처**로 복잡한 빌드 과정 없이도 바로 배포할 수 있습니다.

### 핵심 특징

- **제로 프레임워크** — Vanilla HTML / CSS / JS만 사용, 프레임워크 의존 없음
- **싱글 파일** — `index.html` 하나에 마크업 / 스타일 / 로직 올인원 (~2,100줄)
- **서버리스** — Supabase REST API로 DB·인증 처리, 별도 백엔드 불필요
- **다중 사용자** — 이메일 기반 회원가입/로그인으로 사용자별 노트 격리
- **반응형** — 데스크톱 / 모바일 완전 대응 (768px 브레이크포인트)

---

## ✨ 주요 기능

### 에디팅

| 기능 | 설명 |
|------|------|
| **마크다운 WYSIWYG** | 제목(H1~H6), 목록, 체크리스트, 인용문, 코드 블록, 테이블, 이미지, 링크, 수식 등 완전한 마크다운 지원 |
| **슬래시 메뉴 (/)** | `/` 입력 시 한글 라벨의 블록 삽입 메뉴 표시 (본문, 제목 1~6, 인용문, 구분선, 글머리 기호, 번호 목록, 할 일 목록, 이미지, 코드 블록, 표, 수식) |
| **체크리스트 취소선** | 체크박스 체크 시 해당 텍스트에 자동 취소선 + 흐린 색상 적용 |
| **자동 저장** | 타이핑 멈춘 뒤 **1초 후** 자동으로 Supabase에 저장. 상태바에서 실시간으로 저장 상태 확인 가능 (`저장 중…` / `저장됨`) |
| **Heading / Blockquote Backspace 수정** | 제목 또는 인용문 맨 앞에서 Backspace 시 **바로 본문(paragraph)으로 변환** |
| **이미지 리사이즈** | 에디터 내 이미지에 커스텀 리사이즈 그립 핸들 표시, 드래그로 크기 조절 |
| **TOC (목차) 오버레이** | 에디터 우측에 H1~H6 기반 목차 자동 생성. 스크롤 연동 활성 표시 + 클릭 이동 |
| **Obsidian 호환 내보내기** | `<br />` 태그를 `\n`으로 자동 치환하여 순수 마크다운 호환성 보장 |

### 노트 관리

| 기능 | 설명 |
|------|------|
| **노트 검색** | 사이드바 검색창에서 제목·내용 기반 실시간 필터링 |
| **노트 정렬** | 생성일 내림차순/오름차순, 제목 가나다순/역순 (4가지 정렬 옵션) |
| **해시태그 모아보기** | 본문에 `#태그` 입력 시 자동 하이라이트, 사이드바에서 전체 태그 목록 확인 및 필터링 (빈도수 표시) |
| **마크다운 내보내기** | 노트 목록에서 우클릭 → `.txt` 파일로 마크다운 원문 다운로드 |
| **한국 시간(KST) 표시** | 노트 목록에 생성일·수정일을 KST 기준 표시 (상대 시간 지원: "방금 전", "N분 전", "N시간 전") |
| **컨텍스트 메뉴** | 노트 아이템 우클릭 시 "마크다운 내보내기", "삭제" 메뉴 제공 |

### 사용자 계정

| 기능 | 설명 |
|------|------|
| **회원가입** | 이메일 / 닉네임 / 비밀번호로 계정 생성 (이메일 유효성 검증, 비밀번호 4자 이상, 닉네임 2자 이상) |
| **로그인** | 이메일 + 비밀번호 로그인, `localStorage` 기반 세션 유지 |
| **로그아웃** | 세션 제거 후 로그인 화면으로 복귀 |
| **데이터 격리** | `user_email` 기반으로 사용자별 노트 분리 조회·저장 |

### UI / UX

| 기능 | 설명 |
|------|------|
| **다크 / 라이트 모드** | "D" / "W" 토글 버튼으로 전환. 새로고침에도 유지 (`localStorage`) |
| **테마별 로고 전환** | 다크 모드: 윤곽선 고양이 아이콘 🐱 / 라이트 모드: 채움형 고양이 아이콘 |
| **집중 모드** | 사이드바·제목바·상태바를 숨기고 글 작성에만 집중. 타이포그래피 ×1.2 확대. `Esc`로 해제 |
| **사이드바 토글** | `☰` 버튼으로 노트 목록 사이드바 접기/펼치기 |
| **모바일 반응형** | 768px 이하에서 햄버거 메뉴, 노트 목록↔에디터 전환 UI |
| **커스텀 캐럿** | ProseMirror 기본 캐럿을 숨기고 커스텀 캐럿 표시 (다크: 노란색 `#f0c040`, 라이트: 파란색 `#005FB8`) |
| **로그인 화면 연출** | cat.gif 이미지 + "당신이 써 내려갈 이야기" 타이프라이터 애니메이션 |
| **토스트 알림** | 하단 중앙에 2.2초간 알림 메시지 표시 |
| **MonaS12 폰트** | 가독성 좋은 MonaS12 웹폰트 적용 |

---

## 🎨 해시태그 하이라이트 시스템

memyo는 **CSS Custom Highlight API** (`CSS.highlights`)를 사용하여 에디터 본문 내의 해시태그를 실시간으로 하이라이트합니다.

### 동작 원리

1. `markdownUpdated` 콜백 발생 시 `scheduleHighlight()` 호출 (300ms 디바운스)
2. `document.createTreeWalker`로 에디터 내 텍스트 노드 순회
3. 정규식 `/#[가-힣a-zA-Z0-9_]+/g`로 해시태그 매칭
4. 매칭된 범위를 `Range` 객체로 생성 → `new Highlight(...ranges)`
5. `CSS.highlights.set('editor-hashtag', highlight)`로 등록
6. CSS `::highlight(editor-hashtag)` 의사 요소로 스타일 적용

### 테마별 스타일

| 테마 | 배경색 | 글자색 |
|------|--------|--------|
| 다크 모드 | 흰색 (`#ffffff`) | 검은색 (`#000000`) |
| 라이트 모드 | 검은색 (`#1C1C1E`) | 흰색 (`#ffffff`) |

---

## ⌨️ 키보드 단축키

### 앱 단축키

| 단축키 | 동작 |
|--------|------|
| `Ctrl + N` (`⌘ + N`) | 새 노트 생성 |
| `Ctrl + S` (`⌘ + S`) | 즉시 저장 (디바운스 취소 후 바로 저장) |
| `Escape` | 집중 모드 해제 |
| `Enter` (로그인 화면) | 로그인 확인 |

### 마크다운 에디터 단축키

Milkdown / ProseMirror 기본 단축키가 모두 지원됩니다:

| 입력 | 결과 |
|------|------|
| `# ` ~ `###### ` | 제목 H1 ~ H6 |
| `- ` / `* ` | 글머리 기호 목록 |
| `1. ` | 번호 목록 |
| `[ ] ` | 체크리스트 |
| `> ` | 인용문 |
| `` ``` `` | 코드 블록 |
| `**bold**` | **굵게** |
| `*italic*` | *기울임* |
| `~~strike~~` | ~~취소선~~ |
| `---` | 구분선 |

---

## 🛠 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| **에디터 엔진** | [Milkdown Crepe](https://milkdown.dev/) (ProseMirror 기반) | v7.20+ |
| **백엔드 / DB** | [Supabase](https://supabase.com/) (PostgreSQL + REST API) | — |
| **번들러** | [esbuild](https://esbuild.github.io/) | v0.28+ |
| **프론트엔드** | Vanilla HTML / CSS / JS (싱글 파일, 프레임워크 없음) | ES Modules |
| **폰트** | MonaS12 (CDN: `fontcdn-six.vercel.app`) | — |
| **하이라이팅** | CSS Custom Highlight API (`::highlight()`) | — |
| **레이아웃** | CSS Grid (`280px 1fr` 2-column) + 반응형 | — |

---

## 📁 프로젝트 구조

```
memo/
├── index.html                  # 메인 앱 (HTML + CSS + JS 올인원, ~2100줄)
├── milkdown-crepe.bundle.js    # Milkdown Crepe + replaceAll + editorViewCtx 번들 (esbuild 출력)
├── milkdown-common.css         # Milkdown 에디터 공통 테마 CSS (~2000줄)
├── milkdown-frame-dark.css     # Milkdown 다크/라이트 모드 CSS 변수 오버라이드
├── build-entry.js              # esbuild 엔트리 포인트 (3줄)
├── package.json                # npm 의존성 정의
├── schema.sql                  # Supabase 데이터베이스 스키마 (users + notes + memos 테이블)
└── README.md                   # 이 문서
```

### 번들 엔트리 (`build-entry.js`)

```javascript
export { Crepe } from '@milkdown/crepe';
export { replaceAll } from '@milkdown/utils';
export { editorViewCtx } from '@milkdown/core';
```

> Milkdown의 핵심 모듈 3개만 선별 re-export하여, `index.html`에서 ES Module import로 사용합니다.

---

## 🗄 데이터베이스 스키마

Supabase PostgreSQL에 세 테이블이 정의되어 있습니다.

### `users` 테이블 (회원 계정)

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `id` | `uuid` (PK) | `gen_random_uuid()` | 자동 생성 UUID |
| `email` | `text` (UNIQUE) | — | 이메일 (로그인 ID) |
| `nickname` | `text` | — | 닉네임 |
| `password_hash` | `text` | — | 레거시 컬럼 (현재 앱 인증 경로에서는 미사용, 기존 데이터 호환 목적 보존) |
| `created_at` | `timestamptz` | `now()` | 가입 시각 |

### `notes` 테이블 (마크다운 에디터용)

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `id` | `uuid` (PK) | `gen_random_uuid()` | 자동 생성 UUID |
| `user_email` | `text` | `''` | 소유자 이메일 (사용자별 데이터 격리) |
| `title` | `text` | `'제목 없음'` | 노트 제목 |
| `content` | `text` | `''` | 마크다운 본문 |
| `updated_at` | `timestamptz` | `now()` | 마지막 수정 시각 |
| `created_at` | `timestamptz` | `now()` | 생성 시각 |

### `memos` 테이블 (포스트잇 메모앱용)

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `id` | `uuid` (PK) | `gen_random_uuid()` | 자동 생성 UUID |
| `content` | `text` | `''` | 메모 내용 |
| `color` | `text` | `'#fef08a'` | 메모 배경색 |
| `pinned` | `boolean` | `false` | 고정 여부 |
| `completed` | `boolean` | `false` | 완료 여부 |
| `position_x` | `integer` | `100` | X 좌표 |
| `position_y` | `integer` | `100` | Y 좌표 |
| `created_at` | `timestamptz` | `now()` | 생성 시각 |

> 현재 스키마는 RLS(Row Level Security) 활성화 기준이며, `notes`는 **로그인 사용자 이메일(auth.jwt email) = user_email** 정책으로 사용자별 접근이 제한됩니다.

---

## 🚀 설치 및 실행

### 1단계: 의존성 설치

```bash
npm install
```

> `@milkdown/crepe` v7.20+ 와 `esbuild` v0.28+ 가 설치됩니다.

### 2단계: JS 번들 빌드

Milkdown 라이브러리를 단일 ES Module JS 파일로 번들링합니다:

```bash
npx esbuild build-entry.js \
  --bundle \
  --format=esm \
  --outfile=milkdown-crepe.bundle.js
```

> 출력: `milkdown-crepe.bundle.js` (~4.7MB)  
> ⚠️ 이미 빌드된 번들이 포함되어 있으므로, 수정하지 않았다면 이 단계는 건너뛸 수 있습니다.

### 3단계: Supabase 설정

1. [Supabase](https://supabase.com/)에서 프로젝트를 생성합니다.
2. **SQL Editor**에서 `schema.sql`을 실행하여 테이블을 생성합니다.
3. `index.html` 내의 Supabase 설정값을 본인의 프로젝트 값으로 교체합니다:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
```

### 4단계: 웹 서버 실행

정적 파일 서버로 실행합니다 (ES Module 사용으로 인해 HTTP 서버 필수):

```bash
# Python
python3 -m http.server 8089

# Node.js
npx serve -p 8089

# 또는 Caddy, Nginx, Apache 등 원하는 서버 사용
```

### 5단계: 접속

브라우저에서 `http://localhost:8089`에 접속하여 회원가입 후 로그인하면 사용할 수 있습니다.

> ⚠️ ES Module(`import`)을 사용하므로, `file://` 프로토콜로는 동작하지 않습니다. 반드시 HTTP(S) 서버를 통해 접속하세요.

---

## 🎨 테마 커스터마이징

### 다크 모드 (기본) — `:root`

```css
:root {
  --bg-primary:    #111111;    /* 메인 배경 */
  --bg-secondary:  #0a0a0a;    /* 보조 배경 (상태바, 팝업) */
  --bg-sidebar:    #080808;    /* 사이드바 배경 */
  --bg-hover:      #1a1a1a;    /* 호버 배경 */
  --bg-active:     #222222;    /* 활성 상태 배경 */
  --text-primary:  #e8e8e8;    /* 주요 텍스트 */
  --text-secondary:#999999;    /* 보조 텍스트 */
  --text-muted:    #666666;    /* 흐린 텍스트 */
  --accent:        #cccccc;    /* 강조 색상 */
  --accent-hover:  #ffffff;    /* 강조 호버 */
  --border:        #262626;    /* 테두리 */
  --success:       #7ccf7c;    /* 성공 (저장됨) */
  --danger:        #e06060;    /* 위험 (삭제) */
  --font: 'MonaS12', 'Segoe UI', sans-serif;
}
```

### 라이트 모드 — `[data-theme="light"]`

```css
[data-theme="light"] {
  --bg-primary:    #F5F5F5;
  --bg-secondary:  #EAEAEA;
  --bg-sidebar:    #F0F0F0;
  --bg-hover:      #E0E0E0;
  --bg-active:     #D8D8D8;
  --text-primary:  #2D2D2D;
  --text-secondary:#555555;
  --text-muted:    #888888;
  --accent:        #005FB8;
  --accent-hover:  #003D7A;
  --border:        #D0D0D0;
  --success:       #2E8B57;
  --danger:        #CC3333;
}
```

### Milkdown 에디터 테마 (`milkdown-frame-dark.css`)

Milkdown 자체 CSS 변수도 다크/라이트 모드에 맞게 오버라이드됩니다:

```css
.milkdown {
  --crepe-color-background:     #111111;
  --crepe-color-on-background:  #e8e8e8;
  --crepe-color-surface:        #0a0a0a;
  --crepe-color-primary:        #cccccc;
  --crepe-color-outline:        #444444;
  --crepe-color-selected:       rgba(255,255,255,0.08);
  --crepe-font-default:         'MonaS12', sans-serif;
  --crepe-font-code:            'Fira Code', monospace;
  /* ... 20+ 변수 */
}
```

> 색상만 수정하면 전체 앱의 분위기를 간편하게 바꿀 수 있습니다.

---

## 🔐 인증 시스템

memyo는 Supabase Auth 기반 이메일 인증 시스템을 사용합니다.

### 회원가입 흐름

```
이메일 + 닉네임 + 비밀번호 입력 → 유효성 검증 → Supabase Auth `signup` 요청 → 세션 저장(가능 시) 또는 로그인 폼 전환
```

- 이메일 형식 검증 (정규식)
- 닉네임 2자 이상
- 비밀번호 4자 이상
- 이메일 중복/인증 오류 시 Supabase Auth 에러 메시지 처리

### 로그인 흐름

```
이메일 + 비밀번호 입력 → Supabase Auth `password grant` → access/refresh token 세션 저장 → 앱 진입
```

| 항목 | 설명 |
|------|------|
| **저장** | `localStorage`에 Supabase 세션(JSON) 저장 |
| **만료 처리** | 앱 시작/DB 요청 시 refresh token으로 세션 자동 갱신 |
| **로그아웃** | `localStorage` 세션 키 제거 → 페이지 새로고침 |
| **실패 시** | 에러 메시지 + 입력창 `shake` 애니메이션 |

---

## 🧩 아키텍처 상세

### 앱 레이아웃 (CSS Grid)

```
┌──────────────────────────────────────────────┐
│                  #app (CSS Grid)              │
│  grid-template-columns: 280px 1fr            │
│  grid-template-rows: 1fr auto                │
│                                              │
│  ┌──────────┐ ┌────────────────────────────┐ │
│  │ #sidebar  │ │  #editor-area              │ │
│  │           │ │  ┌────────────────────────┐│ │
│  │ 헤더      │ │  │ #title-bar             ││ │
│  │ 검색/정렬 │ │  │ (제목 입력 + 집중모드)  ││ │
│  │ 노트목록  │ │  ├────────────────────────┤│ │
│  │ 해시태그  │ │  │ #milkdown-editor       ││ │
│  │           │ │  │ (WYSIWYG 에디터)       ││ │
│  │           │ │  │         [TOC 오버레이]  ││ │
│  │           │ │  ├────────────────────────┤│ │
│  │           │ │  │ #statusbar             ││ │
│  │           │ │  │ (저장상태·글자수·단축키)││ │
│  └──────────┘ │  └────────────────────────┘│ │
│               └────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### UI 컴포넌트 트리

| 컴포넌트 | 선택자 | 설명 |
|----------|--------|------|
| 로그인 화면 | `#login-screen` | 로그인/회원가입 폼 전환, cat.gif, 타이프라이터 애니메이션, 에러/성공 메시지 |
| 로딩 스피너 | `#loading` | 앱 초기화 중 스피너 + "불러오는 중..." |
| 사이드바 | `#sidebar` | 헤더(로고 + 제목), 새 노트/해시태그 버튼, 검색, 정렬, 노트 목록, 로그아웃 |
| 해시태그 패널 | `#hashtag-panel` | 태그 목록(빈도수), 필터 토글, "필터 해제" 버튼 |
| 노트 목록 | `#note-list` | 제목, 수정/생성 일시, 미리보기, 삭제 버튼 |
| 타이틀 바 | `#title-bar` | 노트 제목 편집, 집중 모드 버튼 |
| 에디터 영역 | `#milkdown-editor` | Milkdown Crepe WYSIWYG 에디터 + 커스텀 캐럿 + 이미지 리사이즈 |
| TOC 오버레이 | TOC 패널 | H1~H6 목차 자동 생성, 스크롤 연동 |
| 빈 에디터 | `#empty-editor` | 노트 미선택 시 안내 화면 |
| 상태바 | `#statusbar` | 저장 상태(dot), 글자 수, 단축키 안내 |
| 사이드바 토글 | `#sidebar-toggle` | ☰ 버튼으로 사이드바 접기/펴기 |
| 테마 토글 | `#theme-toggle` | 원형 버튼(D/W)으로 다크↔라이트 전환 |
| 컨텍스트 메뉴 | `#context-menu` | 우클릭 시 "마크다운 내보내기", "삭제" |
| 토스트 | `#toast` | 하단 중앙 알림 (2.2초 자동 닫힘) |

### JavaScript 함수 맵

#### 인증 관련

| 함수 | 설명 |
|------|------|
| `isAuthed()` | `localStorage`에서 인증 상태 확인 |
| `currentUserEmail()` | 로그인된 사용자 이메일 반환 |
| `doLogin()` | 이메일 + 비밀번호 로그인 |
| `doRegister()` | 회원가입 (이메일/닉네임/비밀번호 유효성 검증 포함) |
| `showLoginForm()` | 로그인 폼 표시 |
| `showRegisterForm()` | 회원가입 폼 표시 |
| `authApiFetch(path, opts)` | Supabase Auth API fetch |
| `ensureValidSession()` | 세션 유효성 확인 및 필요 시 refresh |

#### 테마 관련

| 함수 | 설명 |
|------|------|
| `applyTheme(theme)` | `data-theme` 속성 설정, 아이콘(D/W) 변경, `localStorage` 저장 |
| `toggleTheme()` | 현재 테마 감지 후 반대 테마로 전환 |

#### Supabase API

| 함수 | 설명 |
|------|------|
| `dbFetch(path, opts)` | REST API fetch 래퍼 (apikey, Authorization 헤더 자동 추가) |
| `loadNotes()` | `user_email` 필터링하여 노트 로드 |
| `createNoteDB(data)` | POST로 새 노트 생성 (`user_email` 포함) |
| `patchNote(id, data)` | PATCH로 노트 업데이트 |
| `removeNoteDB(id)` | DELETE로 노트 삭제 |

#### 에디터 관련

| 함수 | 설명 |
|------|------|
| `initEditor()` | Milkdown Crepe 에디터 초기화 (슬래시 메뉴 한글화, heading/blockquote backspace fix, 이벤트 등록) |
| `getMarkdown()` | 에디터에서 마크다운 추출 + `<br />` → `\n` 치환 |
| `debounceSave()` | 1000ms 디바운스 자동 저장 스케줄 |
| `saveCurrentNote()` | Supabase에 현재 노트 PATCH |
| `updateCharCount()` | 상태바 글자 수 업데이트 |
| `updateCustomCaret()` | ProseMirror 커서 위치에 커스텀 캐럿 동기화 |
| `setupImageResizeGrips()` | 이미지에 리사이즈 그립 핸들 추가 + `referrerpolicy` 설정 |
| `scheduleGrips()` | 리사이즈 그립 500ms 디바운스 |

#### TOC (목차) 관련

| 함수 | 설명 |
|------|------|
| `buildToc()` | 에디터 내 H1~H6 수집하여 목차 오버레이 생성 |
| `updateTocActive()` | 스크롤 위치에 따라 활성 목차 항목 표시 |
| `scheduleToc()` | TOC 400ms 디바운스 |

#### 해시태그 관련

| 함수 | 설명 |
|------|------|
| `extractTags(content)` | 정규식으로 해시태그 추출, 중복 제거 |
| `collectAllTags()` | 전체 노트에서 태그 수집, 빈도순 정렬 |
| `renderHashtags()` | 해시태그 패널 UI 렌더링, 필터 토글 |
| `scheduleHighlight()` | 300ms 디바운스로 해시태그 하이라이트 예약 |
| `applyHashtagHighlight()` | CSS Highlight API로 에디터 내 해시태그 시각적 하이라이트 |

#### 노트 관리 관련

| 함수 | 설명 |
|------|------|
| `addNote()` | 새 노트 생성 후 선택 |
| `selectNote(id)` | 노트 선택, 에디터에 content 로드 |
| `removeNote(id)` | confirm 후 노트 삭제 |
| `renderNoteList()` | 검색어 + 태그 필터 + 정렬 적용 후 노트 목록 렌더링 |
| `updateSortButtons()` | 정렬 버튼 활성 상태 업데이트 |

#### 모바일 관련

| 함수 | 설명 |
|------|------|
| `isMobileView()` | `window.innerWidth <= 768` 확인 |
| `updateMobileHamburgerIcon()` | 모바일 모드별 햄버거 아이콘 전환 |

#### 유틸리티

| 함수 | 설명 |
|------|------|
| `toKST(dateStr)` | UTC → KST(+9시간) 변환 |
| `formatKoreanFull(dateStr)` | "2026년 4월 8일 15:30" 형식 |
| `formatRelative(dateStr)` | "방금 전", "N분 전", "N시간 전" 또는 전체 날짜 표시 |
| `escHtml(s)` | HTML 이스케이프 |
| `showToast(msg)` | 하단 토스트 메시지 표시 (2.2초) |
| `setSaveStatus(state)` | 상태바 저장 상태 표시 (`saving` / `saved` / `unsaved`) |
| `initApp()` | 앱 초기화 (에디터 생성 → 노트 로드 → 첫 노트 선택) |

---

## 🎭 CSS 애니메이션

| 이름 | 용도 | 설명 |
|------|------|------|
| `@keyframes shake` | 로그인 실패 | 입력창 좌우 흔들림 효과 |
| `@keyframes spin` | 로딩 스피너 | 360° 무한 회전 |
| `@keyframes blink-caret` | 커스텀 캐럿 | 1초 주기 `step-end` 깜빡임 (`opacity: 0 ↔ 1`) |

---

## 📐 반응형 & 스크롤바

### 스크롤바 커스터마이징

사이드바와 에디터 모두 webkit 커스텀 스크롤바를 사용합니다:

- **너비**: 4~6px (슬림 스크롤바)
- **트랙**: 투명
- **썸**: `var(--border)` 색상, `border-radius: 3px`

### 레이아웃

- **CSS Grid**: `grid-template-columns: 280px 1fr`
- **사이드바 축소**: `.sidebar-collapsed` 클래스 → 사이드바 너비 0
- **집중 모드**: `.focus-mode` 클래스 → 사이드바, 상태바, 토글 버튼 숨김 + 타이포그래피 ×1.2
- **모바일**: `@media (max-width: 768px)` — 사이드바 오버레이, 노트 목록↔에디터 전환

---

## 🧾 이벤트 리스너 전체 목록

| 이벤트 | 대상 | 동작 |
|--------|------|------|
| `click` | `#login-btn` | 로그인 |
| `click` | `#register-btn` | 회원가입 |
| `keydown` (Enter) | `#pw-input` | 로그인 |
| `click` | `#theme-toggle` | 테마 전환 |
| `click` | `#new-note-btn` | 새 노트 |
| `click` | `#hashtag-btn` | 해시태그 패널 토글 |
| `click` | `#sidebar-toggle` | 사이드바 접기/펴기 |
| `click` | `#focus-btn` | 집중 모드 진입 |
| `click` | `.note-item` | 노트 선택 |
| `click` | `.delete-btn` | 노트 삭제 |
| `contextmenu` | `.note-item` | 컨텍스트 메뉴 표시 |
| `click` | `document` | 컨텍스트 메뉴 닫기 |
| `click` | `#ctx-export` | 마크다운 내보내기 |
| `click` | `#ctx-delete` | 노트 삭제 |
| `input` | `#note-title` | 제목 변경 → 디바운스 저장 |
| `input` | `#sidebar-search` | 검색 필터 |
| `keydown` | `document` | Ctrl+N, Ctrl+S, Escape |
| `keydown` (capture) | ProseMirror DOM | Heading / Blockquote backspace fix |
| `selectionchange` | `document` | 커스텀 캐럿 위치 동기화 |
| `keyup` | `document` | 커스텀 캐럿 위치 동기화 |
| `click` | `document` | 커스텀 캐럿 위치 동기화 (rAF) |
| `scroll` | 에디터 영역 | TOC 활성 항목 업데이트 |
| `markdownUpdated` | Crepe listener | 자동 저장 + 글자 수 + 해시태그 하이라이트 + TOC + 이미지 그립 |

---

## 📋 버전 히스토리

### memyo (현재)
- **리브랜딩**: 타다닥 → memyo
- **다중 사용자 지원**: 이메일 기반 회원가입/로그인 시스템
- `users` 테이블 추가, `notes.user_email` 컬럼으로 사용자별 데이터 격리
- `localStorage` 기반 세션 유지 (브라우저 닫아도 로그인 유지)
- **로그인 화면 연출**: cat.gif + "당신이 써 내려갈 이야기" 타이프라이터 애니메이션
- **TOC (목차) 오버레이**: H1~H6 기반 목차 자동 생성, 스크롤 연동, 클릭 이동
- **이미지 리사이즈 그립**: 에디터 내 이미지 드래그 크기 조절
- **노트 정렬**: 생성일 ▲▼ / 제목 가나다순(ㄱ/ㅎ) 4가지 옵션
- **모바일 반응형**: 768px 이하 완전 대응 (햄버거 메뉴, 목록↔에디터 전환)
- **집중 모드 글꼴 확대**: 모든 타이포그래피 ×1.2 스케일
- **Blockquote Backspace Fix**: 인용문 맨 앞에서 Backspace 시 본문으로 변환
- 이미지 `referrerpolicy="no-referrer"` 자동 설정

### v1.3
- 블랙 & 화이트 미니멀 테마로 전면 리디자인
- **다크 / 라이트 모드 전환** (`D` / `W` 토글)
- **테마별 고양이 로고** (다크: 윤곽선, 라이트: 채움형)
- 해시태그 하이라이트 (CSS Custom Highlight API)
- 해시태그 모아보기 및 필터링 (빈도수 표시)
- 슬래시 메뉴 한글화 (텍스트/목록/고급 3그룹)
- 집중 모드
- 마크다운 내보내기 (.txt) + Obsidian 호환 `<br />` 치환
- 사이드바 토글 (☰)
- KST 날짜 표시 (상대 시간 지원)
- 체크리스트 취소선
- Heading Backspace → Paragraph 직접 변환
- 블록 핸들 (+/⋮⋮) 숨김
- MonaS12 폰트 적용
- 커스텀 캐럿 (다크: 노란색, 라이트: 파란색)
- 텍스트 선택 시 반전 스타일

---

## 🔧 트러블슈팅

### ES Module import 오류

```
Failed to resolve module specifier "milkdown-crepe.bundle.js"
```

→ `file://` 프로토콜로 열었을 때 발생합니다. 반드시 HTTP 서버를 통해 접속하세요.

### CSS Highlight API 미지원

해시태그 하이라이트가 동작하지 않는 경우:

→ **Chrome 105+**, **Edge 105+** 이상에서 지원됩니다.  
→ Firefox는 119+, Safari는 17.2+ 부터 지원합니다.

### 번들 재빌드가 필요한 경우

`build-entry.js`를 수정했거나 Milkdown 버전을 업그레이드한 경우:

```bash
npx esbuild build-entry.js --bundle --format=esm --outfile=milkdown-crepe.bundle.js
```

---

## 🌐 브라우저 호환성

| 브라우저 | 최소 버전 | 비고 |
|----------|-----------|------|
| Chrome | 105+ | 모든 기능 지원 (권장) |
| Edge | 105+ | 모든 기능 지원 |
| Firefox | 119+ | CSS Highlight API 119부터 지원 |
| Safari | 17.2+ | CSS Highlight API 17.2부터 지원 |

> ES Modules, CSS Custom Highlight API, CSS Custom Properties를 사용하므로 최신 브라우저가 필요합니다.

---

## 📜 라이선스

이 프로젝트의 저작권은 **송죽동길냥이 (ksthink@ksthink.com)** 에 있습니다.
