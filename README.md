# 타다닥 v1.3

> 심플하고 아름다운 마크다운 노트 에디터  
> **made in ksthink@ksthink.com**

---

## 📌 소개

**타다닥**은 브라우저 기반의 마크다운 WYSIWYG 노트 에디터입니다.  
Milkdown(ProseMirror 기반) 에디터 엔진을 사용하며, Supabase를 백엔드로 활용해 별도 서버 구축 없이 노트를 클라우드에 저장합니다.

단일 HTML 파일 아키텍처로, 복잡한 빌드 과정 없이도 바로 배포할 수 있습니다.

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| **마크다운 WYSIWYG 편집** | 제목, 목록, 체크리스트, 인용문, 코드 블록, 테이블, 링크, 이미지 등 완전한 마크다운 지원 |
| **자동 저장** | 내용 변경 후 1초 뒤 자동으로 Supabase에 저장. 상태바에서 저장 상태 확인 가능 |
| **한국 시간(KST) 날짜** | 노트 목록에 생성일과 수정일을 한국 시간 기준으로 표시 (상대 시간 지원: "방금 전", "N분 전") |
| **해시태그 모아보기** | 본문에 `#태그` 입력 시 자동 하이라이트. 사이드바에서 전체 태그 목록 확인 및 필터링 |
| **마크다운 내보내기** | 노트 목록에서 우클릭 → `.txt` 파일로 마크다운 원문 다운로드 |
| **집중 모드** | 사이드바·제목바·상태바를 숨기고 글 작성에만 집중. `Esc`로 해제 |
| **사이드바 토글** | `☰` 버튼으로 노트 목록 사이드바 접기/펼치기 |
| **노트 검색** | 사이드바 검색창에서 제목·내용 기반 실시간 필터링 |
| **체크리스트 취소선** | 체크박스 체크 시 해당 텍스트에 자동으로 취소선 적용 |
| **비밀번호 보호** | 세션 기반 간단한 비밀번호 인증 (DJB2 해시) |
| **다크 모드 (B&W)** | 블랙 & 화이트 톤의 미니멀 다크 테마 |
| **MonaS12 폰트** | 가독성 좋은 MonaS12 웹폰트 적용 |

---

## 🛠 기술 스택

| 구분 | 기술 |
|------|------|
| **에디터 엔진** | [Milkdown Crepe](https://milkdown.dev/) v7.20+ (ProseMirror 기반 WYSIWYG 마크다운 에디터) |
| **백엔드/DB** | [Supabase](https://supabase.com/) (PostgreSQL + REST API) |
| **번들러** | [esbuild](https://esbuild.github.io/) v0.28+ |
| **프론트엔드** | Vanilla HTML/CSS/JS (싱글 파일, 프레임워크 없음) |
| **폰트** | MonaS12 (CDN: fontcdn-six.vercel.app) |
| **하이라이팅** | CSS Custom Highlight API (`::highlight()`) |

---

## 📁 프로젝트 구조

```
memo/
├── index.html                  # 메인 앱 (HTML + CSS + JS 올인원)
├── milkdown-common.css         # Milkdown 에디터 공통 테마 CSS (~2000줄, 번들링됨)
├── milkdown-frame-dark.css     # Milkdown 다크 모드 변수 오버라이드
├── milkdown-crepe.bundle.js    # Milkdown Crepe + replaceAll 번들 (esbuild 출력)
├── build-entry.js              # esbuild 엔트리 포인트
├── package.json                # npm 의존성 정의
├── schema.sql                  # Supabase 데이터베이스 스키마
└── README.md                   # 이 파일
```

---

## 🗄 데이터베이스 스키마

`notes` 테이블 (Supabase PostgreSQL):

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | `uuid` (PK) | 자동 생성 UUID |
| `title` | `text` | 노트 제목 (기본값: '제목 없음') |
| `content` | `text` | 마크다운 본문 |
| `updated_at` | `timestamptz` | 마지막 수정 시각 |
| `created_at` | `timestamptz` | 생성 시각 |

> RLS(Row Level Security)는 비활성화 상태입니다.

---

## 🚀 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. JS 번들 빌드

Milkdown 라이브러리를 단일 JS 파일로 번들링합니다:

```bash
npx esbuild build-entry.js --bundle --format=esm --outfile=milkdown-crepe.bundle.js
```

### 3. Supabase 설정

1. [Supabase](https://supabase.com/)에서 프로젝트를 생성합니다.
2. SQL Editor에서 `schema.sql`을 실행하여 테이블을 생성합니다.
3. `index.html` 내의 `SUPABASE_URL`과 `SUPABASE_KEY`를 본인의 프로젝트 값으로 교체합니다:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
```

### 4. 웹 서버 실행

정적 파일 서버로 실행합니다 (아무 HTTP 서버 사용 가능):

```bash
# Python
python3 -m http.server 8089

# Node.js (npx)
npx serve -p 8089

# Caddy, Nginx 등 원하는 서버 사용 가능
```

### 5. 접속

브라우저에서 `http://localhost:8089` 접속 후 비밀번호를 입력하면 사용할 수 있습니다.

---

## ⌨️ 단축키

| 단축키 | 동작 |
|--------|------|
| `Ctrl + N` | 새 노트 생성 |
| `Ctrl + S` | 즉시 저장 |
| `Esc` | 집중 모드 해제 |

에디터 내에서는 Milkdown/ProseMirror 기본 마크다운 단축키가 모두 지원됩니다:

- `# ` → 제목 (H1~H6)
- `- ` / `* ` → 목록
- `1. ` → 순서 목록
- `[ ] ` → 체크리스트
- `> ` → 인용문
- `` ``` `` → 코드 블록
- `**bold**` → **굵게**
- `*italic*` → *기울임*
- `~~strike~~` → ~~취소선~~

---

## 🎨 테마 커스터마이징

### 앱 테마 변수 (`index.html` 내 `:root`)

```css
:root {
  --bg-primary: #111111;      /* 메인 배경 */
  --bg-secondary: #0a0a0a;    /* 보조 배경 (상태바, 팝업) */
  --bg-sidebar: #080808;      /* 사이드바 배경 */
  --bg-hover: #1a1a1a;        /* 호버 배경 */
  --bg-active: #222222;       /* 활성 상태 배경 */
  --text-primary: #e8e8e8;    /* 주요 텍스트 */
  --text-secondary: #999999;  /* 보조 텍스트 */
  --text-muted: #666666;      /* 흐린 텍스트 */
  --accent: #cccccc;          /* 강조 색상 */
  --border: #262626;          /* 테두리 */
}
```

### Milkdown 에디터 테마 변수 (`milkdown-frame-dark.css`)

```css
.milkdown {
  --crepe-color-background: #111111;
  --crepe-color-primary: #cccccc;
  --crepe-color-surface: #0a0a0a;
  /* ... 기타 변수는 파일 참조 */
}
```

---

## 📋 버전 히스토리

### v1.3 (현재)
- 블랙 & 화이트 미니멀 테마로 전면 리디자인
- 해시태그 하이라이트 (CSS Custom Highlight API)
- 해시태그 모아보기 및 필터링
- 집중 모드
- 마크다운 내보내기 (txt)
- 사이드바 토글
- KST 날짜 표시
- 체크리스트 취소선
- MonaS12 폰트 적용
- 노란색 커서
- 텍스트 선택 시 반전 스타일

---

## 📜 라이선스

이 프로젝트의 저작권은 **ksthink@ksthink.com**에 있습니다.
