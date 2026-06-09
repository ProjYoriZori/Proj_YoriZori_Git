# Agent Skill Cast 작업 지침

> **AI 에이전트 스킬을 팀원들과 공유하고 프로젝트에 장착하세요.**

---

## 📋 개요

**Agent Skill Cast**는 AI 에이전트(Claude, Gemini, Codex)의 작업 지침(Skills)을 중앙 저장소에서 선택적으로 관리하고 필요한 프로젝트에 쉽게 장착할 수 있는 CLI 도구입니다.

### 🎯 핵심 문제 해결

- ✅ 스킬을 브랜치/레포에 종속시키지 않음
- ✅ 여러 프로젝트에서 동일한 스킬 공유 가능
- ✅ 필요한 스킬만 선택적으로 동기화
- ✅ Git 저장소 & 로컬 폴더 모두 지원

---

## 🚀 시작하기

### 1단계: 도구 설치

```bash
npm install -g agent-skill-cast
```

> **필수 요구사항**: Node.js 20 이상

### 2단계: 전역 설정 초기화

```bash
cast init
```

로컬 머신에서 처음 실행 시 필요합니다. 전역 설정 폴더(`~/.asc_sources`)를 생성합니다.

### 3단계: 스킬 소스 등록

#### GitHub 저장소 등록

```bash
cast source add https://github.com/dongsiKim/agent-skill-cast
```

#### 로컬 폴더 등록

```bash
cast source add ~/my-personal-skills
```

### 4단계: 스킬 선택 & 장착

#### 🔄 대화형 메뉴 (권장)

```bash
cast use
```

- 등록된 소스에서 선택
- 사용 가능한 스킬 목록 표시
- 스킬 번호 입력 (쉼표로 여러 개 선택 가능: `1,3,5`)

#### ⚡ 직접 지정

```bash
# 특정 스킬 하나만 장착
cast use source-name/skill-name

# 특정 소스의 모든 스킬 장착
cast use source-name --all

# 심볼릭 링크 대신 독립 사본으로 장착
cast use source-name/skill-name --copy
```

### 5단계: 장착된 스킬 확인

```bash
cast list
```

스킬이 아래 폴더에 설치됩니다:

- `.claude/skills/` - Claude 전용
- `.gemini/skills/` - Gemini 전용
- `.codex/skills/` - Codex 전용

---

## 📚 주요 명령어

| 명령어                      | 설명                   | 예시                                             |
| --------------------------- | ---------------------- | ------------------------------------------------ |
| `cast init`                 | 초기 설정              | `cast init`                                      |
| `cast use`                  | 스킬 장착 (대화형)     | `cast use`                                       |
| `cast use <소스>/<스킬>`    | 특정 스킬 장착         | `cast use shared-skills/testing-guide`           |
| `cast use <소스> --all`     | 모든 스킬 장착         | `cast use shared-skills --all`                   |
| `cast list`                 | 설치된 스킬 목록       | `cast list`                                      |
| `cast remove <스킬>`        | 스킬 제거              | `cast remove testing-guide`                      |
| `cast source add <URL>`     | 소스 등록              | `cast source add https://github.com/team/skills` |
| `cast source list`          | 등록된 소스 확인       | `cast source list`                               |
| `cast source sync`          | 소스 업데이트 & 재연결 | `cast source sync`                               |
| `cast source remove <name>` | 소스 제거              | `cast source remove shared-skills`               |

---

## ⚙️ 설정 옵션

### Agent 지정

```bash
# Claude에만 설치
cast use <소스>/<스킬> --claude

# Gemini에만 설치
cast use <소스>/<스킬> --gemini

# Codex에만 설치
cast use <소스>/<스킬> --codex
```

### 설치 방식

| 옵션                   | 설명               | 사용 경우                             |
| ---------------------- | ------------------ | ------------------------------------- |
| **기본 (심볼릭 링크)** | 소스와 링크된 상태 | 소스 업데이트가 즉시 반영되길 원할 때 |
| **--copy**             | 독립 사본 생성     | 프로젝트마다 다른 버전 사용 시        |

### 언어 설정

```bash
# 한국어
cast config lang ko

# 영어
cast config lang en
```

---

## 🔄 워크플로우

### 1️⃣ 팀 스킬 저장소에서 스킬 가져오기

```bash
# 1. 팀 저장소 등록
cast source add https://github.com/my-team/shared-skills

# 2. 사용 가능한 스킬 확인
cast source list

# 3. 필요한 스킬 선택
cast use
```

### 2️⃣ 로컬 스킬 관리

```bash
# 1. 로컬 폴더 등록
cast source add ~/my-personal-skills

# 2. 스킬 장착
cast use my-personal-skills --all
```

### 3️⃣ 소스 업데이트 반영

```bash
# Git 소스 자동 업데이트 & 심볼릭 링크 재연결
cast source sync
```

### 4️⃣ 스킬 제거

```bash
# 심볼릭 링크 스킬만 제거 (--copy 사본은 유지)
cast remove skill-name
```

---

## 📁 스킬 구조

### 스킬 인식 방법

스킬로 인식되려면 반드시 `SKILL.md` 파일이 있어야 합니다.

```
my-skill-repo/
├── my-skill/
│   ├── SKILL.md          ✅ 인식됨
│   ├── .instructions.md
│   └── ...
├── another-skill/
│   ├── SKILL.md          ✅ 인식됨
│   └── ...
└── docs/                 ❌ SKILL.md 없음 - 인식 안 됨
```

### 스킬 검색 경로

1. **루트 디렉토리**: `my-skill/SKILL.md`
2. **Agent 특정 디렉토리**:
   - `.claude/skills/my-skill/SKILL.md`
   - `.gemini/skills/my-skill/SKILL.md`
   - `.codex/skills/my-skill/SKILL.md`

---

## 💡 실제 사용 예시

### 예시 1: React 프로젝트에서 테스팅 스킬 추가

```bash
# 1. 팀 스킬 저장소 등록
cast source add https://github.com/my-team/frontend-skills

# 2. 사용 가능한 스킬 확인
cast list

# 3. 테스팅 관련 스킬 선택
cast use frontend-skills/testing-guide
cast use frontend-skills/react-patterns

# 4. 확인
cast list
```

### 예시 2: 여러 프로젝트에서 동일한 스킬 공유

```bash
# 프로젝트 A에서
cast source add https://github.com/team/shared-skills
cast use shared-skills/api-guide

# 프로젝트 B에서
cast source add https://github.com/team/shared-skills
cast use shared-skills/api-guide

# 두 프로젝트 모두 동일한 스킬 사용 가능
```

### 예시 3: 프로젝트별 독립 스킬 설치

```bash
# 프로젝트 A: 버전 v1.0
cast use shared-skills/helper --copy

# 프로젝트 B: 버전 v2.0 (독립적으로 관리)
cast use shared-skills/helper --copy

# 프로젝트 B에서만 스킬 수정 가능, 프로젝트 A에 영향 없음
```

---

## 🤖 CI/CD 및 자동화

### 비대화형 모드 (스크립트)

```bash
# JSON 출력
cast source list --ci --json

# 특정 스킬 자동 설치
cast use my-skills/helper --ci

# 모든 스킬 자동 설치
cast use my-skills --all --ci
```

### GitHub Actions 예시

```yaml
- name: Setup Agent Skills
  run: |
    npm install -g agent-skill-cast
    cast init
    cast source add https://github.com/team/skills
    cast use team-skills --all --ci
```

---

## 📂 프로젝트 구조

```
~/.asc_sources/                    # 전역 스킬 소스 저장소
├── source-name1/                  # Git 클론 또는 심볼릭 링크
│   ├── skill1/
│   │   └── SKILL.md
│   └── skill2/
│       └── SKILL.md
└── source-name2/
    └── ...
```

```
프로젝트 폴더/
├── .claude/
│   └── skills/
│       ├── skill1 → (심볼릭 링크)
│       └── skill2 → (심볼릭 링크)
├── .gemini/
│   └── skills/
│       └── ...
└── .codex/
    └── skills/
        └── ...
```

---

## 🔗 관련 파일

- **리포지토리**: `agent-skill-cast/` 폴더
- **README**:
  - [영문 문서](agent-skill-cast/README.md)
  - [한국어 문서](agent-skill-cast/README-KR.md)
- **패키지 정보**: [npm - agent-skill-cast](https://www.npmjs.com/package/agent-skill-cast)

---

## ⚠️ 주의사항

1. **심볼릭 링크 vs 복사**
   - 기본값: 심볼릭 링크 (소스 업데이트 자동 반영)
   - `--copy` 옵션: 독립 사본 (프로젝트별 관리)
   - `cast remove`는 심볼릭 링크만 제거, `--copy` 사본은 유지

2. **Node.js 버전**
   - 최소 Node.js 20 이상 필요

3. **소스 제거**
   ```bash
   cast source remove source-name
   ```
   소스 제거 시 해당 소스의 심볼릭 링크도 정리됨

---

## 🆘 문제 해결

### 스킬이 보이지 않음

```bash
# 소스 재등록
cast source add <URL>

# 캐시 새로고침
cast source sync
```

### 설치 오류

```bash
# 전역 설정 초기화
cast init

# 권한 문제 시
sudo npm install -g agent-skill-cast
```

### 스킬 업데이트 미반영

```bash
# 심볼릭 링크 재연결
cast source sync
```

---

## 📞 추가 정보

- **GitHub**: https://github.com/dongsiKim/agent-skill-cast
- **라이선스**: MIT
- **메인 개발자**: Shin-JaeHeon

---

**마지막 업데이트**: 2026-06-09
