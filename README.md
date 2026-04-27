# 개인 구성개념 분석 앱
## Personal Construct Psychology App

조지 켈리(George Kelly)의 개인구성개념 이론 기반 자기분석 및 자기관리 방안 도출 앱입니다.

---

## 🚀 Vercel 배포 방법 (10분 완성)

### 1단계 — GitHub에 올리기
```bash
# GitHub에서 새 저장소(repository) 생성 후:
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/[내아이디]/[저장소이름].git
git push -u origin main
```

### 2단계 — Vercel 연결
1. [vercel.com](https://vercel.com) 접속 → GitHub 계정으로 로그인
2. **"Add New Project"** 클릭
3. 방금 만든 GitHub 저장소 선택 → **Import**
4. Framework Preset: **Next.js** (자동 감지됨)
5. **"Environment Variables"** 펼치기 →
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (Anthropic 콘솔에서 발급한 키)
6. **"Deploy"** 클릭

✅ 약 1~2분 후 `https://[프로젝트명].vercel.app` 주소로 공개 접근 가능

---

## 💻 로컬 개발 방법

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.local.example .env.local
# .env.local 파일을 열어서 ANTHROPIC_API_KEY 값 입력

# 개발 서버 실행
npm run dev
# → http://localhost:3000 접속
```

---

## 📁 파일 구조

```
pcp-app/
├── pages/
│   ├── index.js        ← 메인 앱 (UI 전체)
│   ├── _app.js         ← 앱 래퍼
│   └── api/
│       └── chat.js     ← Anthropic API 프록시 (API 키 보호)
├── styles/
│   └── globals.css
├── .env.local.example  ← 환경변수 예시
├── .gitignore
├── next.config.js
└── package.json
```

---

## 🔑 API 키 발급

1. [console.anthropic.com](https://console.anthropic.com) 접속
2. 회원가입 / 로그인
3. **API Keys** → **Create Key**
4. 발급된 `sk-ant-...` 키를 복사

> ⚠️ API 키는 `.env.local` 파일에만 저장하고 GitHub에 올리지 마세요.  
> `.gitignore`에 이미 `.env.local`이 포함되어 있습니다.

---

## 💰 비용 안내

- **Vercel 배포**: 무료 (Hobby 플랜)
- **Anthropic API**: 사용량 기반 과금
  - Claude Sonnet 4.5 기준: 분석 1회당 약 $0.01~0.03 (약 15~45원)
  - [가격 상세](https://www.anthropic.com/pricing)
