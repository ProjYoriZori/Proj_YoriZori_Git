# YoriZori 문서 인덱스

> **YoriZori 프로젝트의 모든 개발 문서를 한눈에 확인할 수 있습니다.**

---

## 📚 문서 목록

### 🎯 시작하기

| 문서                                       | 설명                            | 대상        |
| ------------------------------------------ | ------------------------------- | ----------- |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | 프로젝트 전체 개요 및 기술 스택 | 모든 개발자 |
| [SETUP_AND_RUN.md](SETUP_AND_RUN.md)       | 로컬 환경 설정 및 실행 가이드   | 모든 개발자 |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md)   | 자주 발생하는 문제 해결법       | 모든 개발자 |

### 🏗️ 아키텍처

| 문서                               | 설명                                | 대상                  |
| ---------------------------------- | ----------------------------------- | --------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 시스템 전체 아키텍처 및 데이터 흐름 | 아키텍처 설계자, 리더 |

### 💻 BackEnd 개발

| 문서                                 | 설명                          | 대상                    |
| ------------------------------------ | ----------------------------- | ----------------------- |
| [BACKEND_GUIDE.md](BACKEND_GUIDE.md) | Spring Boot 개발 가이드       | BackEnd 개발자          |
| [DATABASE.md](DATABASE.md)           | 데이터베이스 스키마 및 관계도 | BackEnd 개발자, DBA     |
| [API_ENDPOINTS.md](API_ENDPOINTS.md) | REST API 엔드포인트 레퍼런스  | BackEnd/FrontEnd 개발자 |

### 📱 FrontEnd 개발

| 문서                                   | 설명                   | 대상            |
| -------------------------------------- | ---------------------- | --------------- |
| [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) | React/Expo 개발 가이드 | FrontEnd 개발자 |

### 🛠️ 도구 & 기타

| 문서                                                         | 설명                              | 대상        |
| ------------------------------------------------------------ | --------------------------------- | ----------- |
| [copilot-cli-workflow.md](copilot-cli-workflow.md)           | AI 도구 최소 컨텍스트 전달 절차   | 모든 개발자 |
| [CHANGELOG.md](CHANGELOG.md)                                 | 백엔드 주요 변경 이력             | 모든 개발자 |

---

## 🚀 신입 개발자 온보딩 순서

### 1️⃣ 첫날: 프로젝트 이해

1. [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) 읽기
   - 프로젝트 목표, 기능, 기술 스택 파악
2. [ARCHITECTURE.md](ARCHITECTURE.md) 읽기
   - 시스템 구조 및 계층 이해
   - 데이터 흐름 이해

### 2️⃣ 둘째날: 환경 설정

3. [SETUP_AND_RUN.md](SETUP_AND_RUN.md) 따라하기
   - 필수 요구사항 설치
   - BackEnd 환경 설정
   - FrontEnd 환경 설정
   - 통합 테스트

4. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) 시간에 맞추기
   - 문제 발생 시 참고

### 3️⃣ 셋째날: BackEnd 개발 시작 (BackEnd 개발자)

5. [BACKEND_GUIDE.md](BACKEND_GUIDE.md) 읽기
   - 프로젝트 구조 이해
   - 주요 패키지 역할 파악
   - 코딩 컨벤션 학습

6. [DATABASE.md](DATABASE.md) 읽기
   - 데이터베이스 스키마 이해
   - 테이블 관계도 파악

7. [API_ENDPOINTS.md](API_ENDPOINTS.md) 참고
   - 백엔드가 구현해야 할 API 확인

### 3️⃣ 셋째날: FrontEnd 개발 시작 (FrontEnd 개발자)

5. [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) 읽기
   - 프로젝트 구조 이해
   - 화면별 기능 파악
   - 상태 관리 학습

6. [API_ENDPOINTS.md](API_ENDPOINTS.md) 참고
   - 프론트엔드가 호출할 API 확인

---

## 🎯 역할별 참고 문서

### BackEnd 개발자

```
필수:
✅ BACKEND_GUIDE.md
✅ DATABASE.md
✅ API_ENDPOINTS.md
✅ ARCHITECTURE.md

선택:
⭐ SETUP_AND_RUN.md (환경 설정)
⭐ TROUBLESHOOTING.md (문제 해결)
```

### FrontEnd 개발자

```
필수:
✅ FRONTEND_GUIDE.md
✅ API_ENDPOINTS.md
✅ ARCHITECTURE.md

선택:
⭐ SETUP_AND_RUN.md (환경 설정)
⭐ DATABASE.md (데이터 이해)
⭐ TROUBLESHOOTING.md (문제 해결)
```

### DevOps / DevTools

```
필수:
✅ PROJECT_OVERVIEW.md
✅ SETUP_AND_RUN.md
✅ ARCHITECTURE.md

선택:
⭐ DATABASE.md (데이터베이스 관리)
⭐ BACKEND_GUIDE.md (빌드 & 배포)
⭐ TROUBLESHOOTING.md (모니터링)
```

### QA 엔지니어 / 테스터

```
필수:
✅ TEST_CASES.md
✅ ERROR_LOG.md
✅ SETUP_AND_RUN.md (환경 설정)

선택:
⭐ PROJECT_OVERVIEW.md (프로젝트 이해)
⭐ API_ENDPOINTS.md (API 테스트)
⭐ TROUBLESHOOTING.md (문제 해결)
```

### 프로젝트 리더 / 아키텍트

```
필수:
✅ PROJECT_OVERVIEW.md
✅ ARCHITECTURE.md
✅ ROADMAP.md

선택:
⭐ BACKEND_GUIDE.md (기술 검토)
⭐ FRONTEND_GUIDE.md (기술 검토)
⭐ DATABASE.md (데이터 설계)
⭐ TEST_CASES.md (품질 관리)
```

---

## 📖 각 문서의 주요 내용

### PROJECT_OVERVIEW.md

- ✅ 프로젝트 목표 및 기능
- ✅ 기술 스택 및 버전
- ✅ 디렉토리 구조
- ✅ 역할 분담
- ✅ 데이터 흐름

### ARCHITECTURE.md

- ✅ 고수준 아키텍처 다이어그램
- ✅ 계층 구조 (Layered Architecture)
- ✅ 패키지별 설명
- ✅ API 통신 흐름
- ✅ 인증 시스템
- ✅ 배포 아키텍처

### SETUP_AND_RUN.md

- ✅ 필수 요구사항
- ✅ BackEnd 환경 설정 (6단계)
- ✅ FrontEnd 환경 설정 (4단계)
- ✅ 통합 테스트
- ✅ 초기 데이터 로드
- ✅ 트러블슈팅

### BACKEND_GUIDE.md

- ✅ 프로젝트 구조
- ✅ IDE 설정
- ✅ 패키지별 개발 가이드
- ✅ 엔드포인트 설명
- ✅ JdbcTemplate 활용
- ✅ 테스트 작성
- ✅ 코딩 컨벤션

### FRONTEND_GUIDE.md

- ✅ 프로젝트 구조
- ✅ IDE 설정
- ✅ 화면별 기능
- ✅ API 클라이언트
- ✅ 상태 관리 (Context API)
- ✅ 스타일링 (Tailwind CSS)
- ✅ 컴포넌트 테스트

### DATABASE.md

- ✅ 데이터베이스 개요
- ✅ 테이블 정의 (12개 테이블)
- ✅ 관계도 (ERD)
- ✅ 인덱싱 전략
- ✅ 트랜잭션 처리
- ✅ 데이터 보안
- ✅ 마이그레이션

### API_ENDPOINTS.md

- ✅ 모든 REST API 엔드포인트
- ✅ 요청/응답 포맷
- ✅ 인증 (JWT)
- ✅ 에러 코드
- ✅ cURL 예제

### TROUBLESHOOTING.md

- ✅ BackEnd 문제 해결 (12가지)
- ✅ FrontEnd 문제 해결 (8가지)
- ✅ 데이터베이스 문제 해결 (5가지)
- ✅ 디버깅 팁
- ✅ 로그 레벨 설정

---

## 🔗 문서 간 연결

```
PROJECT_OVERVIEW
    ├─→ ARCHITECTURE
    ├─→ SETUP_AND_RUN
    ├─→ BACKEND_GUIDE
    ├─→ FRONTEND_GUIDE
    ├─→ DATABASE
    ├─→ API_ENDPOINTS
    └─→ TROUBLESHOOTING

SETUP_AND_RUN
    ├─→ BACKEND_GUIDE
    ├─→ FRONTEND_GUIDE
    └─→ TROUBLESHOOTING

ARCHITECTURE
    ├─→ BACKEND_GUIDE
    ├─→ FRONTEND_GUIDE
    ├─→ DATABASE
    └─→ API_ENDPOINTS
```

---

## 💡 문서 이용 팁

### 🔍 빠른 검색

각 문서는 목차와 헤더로 구성되어 있습니다:

- `Ctrl+F` (윈도우) / `Cmd+F` (맥)로 검색
- 목차를 클릭하여 섹션으로 이동

### 📌 북마크

자주 참고하는 문서는 즐겨찾기 추가:

- 브라우저: GitHub 별 추가
- IDE: 문서 탭 고정

### ✏️ 피드백

문서 개선 제안:

- 오류 발견 시 이슈 등록
- Pull Request로 수정 제안

---

## 📅 문서 업데이트 정보

| 문서                    | 마지막 업데이트 | 버전 |
| ----------------------- | --------------- | ---- |
| PROJECT_OVERVIEW.md     | 2026-06-09      | 1.0  |
| ARCHITECTURE.md         | 2026-06-09      | 1.0  |
| SETUP_AND_RUN.md        | 2026-06-09      | 1.0  |
| BACKEND_GUIDE.md        | 2026-06-09      | 1.0  |
| FRONTEND_GUIDE.md       | 2026-06-09      | 1.0  |
| DATABASE.md             | 2026-06-09      | 1.0  |
| API_ENDPOINTS.md        | 2026-06-09      | 1.0  |
| TROUBLESHOOTING.md      | 2026-06-09      | 1.0  |
| TEST_CASES.md           | 2026-06-09      | 1.0  |
| CHANGELOG.md            | 2026-06-09      | 1.0  |
| ROADMAP.md              | 2026-06-09      | 1.0  |
| copilot-cli-workflow.md | 2026-06-09      | 1.0  |

---

## 🎓 학습 경로

### 완전 신입 (개발 경험 있음)

```
Day 1: PROJECT_OVERVIEW.md → SETUP_AND_RUN.md
Day 2: 환경 설정 및 테스트 (TROUBLESHOOTING.md 참고)
Day 3: ARCHITECTURE.md → 역할별 가이드
       (BACKEND_GUIDE.md 또는 FRONTEND_GUIDE.md)
Day 4-5: DATABASE.md / API_ENDPOINTS.md
```

### 신규 팀원 (백엔드 경험 있음)

```
1. PROJECT_OVERVIEW.md (30분)
2. SETUP_AND_RUN.md (1시간)
3. BACKEND_GUIDE.md (2시간)
4. DATABASE.md (1시간)
5. API_ENDPOINTS.md (30분)
```

### 신규 팀원 (프론트엔드 경험 있음)

```
1. PROJECT_OVERVIEW.md (30분)
2. SETUP_AND_RUN.md (1시간)
3. FRONTEND_GUIDE.md (2시간)
4. API_ENDPOINTS.md (30분)
5. ARCHITECTURE.md (1시간)
```

---

## 🚦 다음 단계

### 로컬 환경 설정

👉 [SETUP_AND_RUN.md](SETUP_AND_RUN.md)로 이동

### 첫 기여하기

1. [BACKEND_GUIDE.md](BACKEND_GUIDE.md) 또는 [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) 읽기
2. 작은 버그 수정으로 시작
3. Pull Request 제출

### 문제 해결

👉 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)로 이동

---

**마지막 업데이트**: 2026-06-09
