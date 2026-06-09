# YoriZori 프로젝트 개요

> **요리조리**: 식재료 기반 레시피 추천 및 영양 관리 플랫폼

---

## 📱 프로젝트 소개

**YoriZori**는 사용자가 보유한 식재료를 입력하면 최적의 레시피를 추천하고, 영양 정보를 추적하는 종합 요리 및 건강 관리 애플리케이션입니다.

### 🎯 핵심 기능

| 기능            | 설명                                                |
| --------------- | --------------------------------------------------- |
| **레시피 검색** | 식품의약품안전처 OpenAPI 기반 50,000+ 레시피 데이터 |
| **스마트 추천** | 냉장고 식재료 기반 최적 레시피 매칭                 |
| **냉장고 관리** | 보유 식재료 추적 및 기피 재료 설정                  |
| **영양 로깅**   | 섭취 음식 기록 및 일일 영양 요약                    |
| **장보기**      | AI 기반 부족 재료 자동 감지 & 장보기 목록 생성      |
| **식재료 관리** | 제철 식재료 추천 및 커스텀 푸드 추가                |

---

## 🏗️ 기술 스택

### BackEnd (Java Spring Boot)

- **언어**: Java 17
- **프레임워크**: Spring Boot 3.3.x
- **빌드**: Gradle (wrapper 포함)
- **데이터베이스**: MySQL 8.x / Google Cloud SQL
- **인증**: JWT (HMAC SHA-256)
- **API**: RESTful API (Spring Web)
- **데이터 접근**: Spring JDBC (JdbcTemplate)

### FrontEnd (React/Expo)

- **언어**: JavaScript (ES6+)
- **프레임워크**: Expo / React Native
- **번들러**: Vite
- **스타일링**: Tailwind CSS
- **빌드**: npm scripts
- **API 통신**: Fetch API (native HTTP client)

### 외부 서비스

- **식품 데이터**: 식품의약품안전처 OpenAPI (COOKRCP01)
- **클라우드**: Google Cloud SQL + Auth Proxy (선택)

---

## 📂 디렉토리 구조

```
요리조리_프로젝트/
├── BackEnd/                          # Spring Boot 백엔드
│   ├── src/main/java/com/yorizori/
│   │   ├── auth/                     # 인증/JWT
│   │   ├── config/                   # 설정 & 초기화
│   │   ├── feature/                  # 기능 API
│   │   ├── foodapi/                  # 외부 API 연동
│   │   └── recipe/                   # 레시피 관련
│   ├── src/test/java/
│   ├── src/main/resources/
│   │   ├── application-local.yml     # 로컬 환경 설정
│   │   └── db/schema.sql             # 데이터베이스 스키마
│   ├── build.gradle                  # Gradle 설정
│   └── gradlew / gradlew.bat         # Gradle wrapper
│
├── FrontEnd/                         # React/Expo 프론트엔드
│   ├── src/
│   │   ├── api/                      # API 클라이언트
│   │   ├── components/               # UI 컴포넌트
│   │   ├── screens/                  # 화면 페이지
│   │   ├── context/                  # 상태 관리
│   │   └── utils/                    # 유틸리티
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── docs/                             # 개발 문서
│   ├── PROJECT_OVERVIEW.md           # 프로젝트 개요 (본 파일)
│   ├── ARCHITECTURE.md               # 시스템 아키텍처
│   ├── SETUP_AND_RUN.md              # 환경 설정 및 실행
│   ├── BACKEND_GUIDE.md              # 백엔드 개발 가이드
│   ├── FRONTEND_GUIDE.md             # 프론트엔드 개발 가이드
│   ├── DATABASE.md                   # 데이터베이스 정보
│   ├── API_ENDPOINTS.md              # API 엔드포인트
│   └── TROUBLESHOOTING.md            # 문제 해결
│
├── AGENT_SKILL_CAST_GUIDE.md         # Agent Skill Cast 도구 가이드
├── HOW_TO_RUN.md                     # 빠른 실행 가이드
├── CHANGELOG_JoRi.md                 # 변경 이력
├── TODO_JoRi.md                      # 진행 중인 작업
└── ErrorLog.md                       # 에러 로그
```

---

## 👥 역할 분담

### BackEnd 개발자

- Spring Boot API 서버 개발/유지보수
- 데이터베이스 스키마 설계 및 최적화
- JWT 기반 인증 시스템 구현
- 외부 API (식약처, Google Cloud SQL 등) 연동
- 단위/통합 테스트 작성

### FrontEnd 개발자

- React/Expo 기반 UI/UX 구현
- 백엔드 API와의 통신 계층 개발
- 상태 관리 (Context API) 구성
- 반응형 디자인 & 성능 최적화
- 모바일/웹 호환성 테스트

### DevOps/Infra

- Google Cloud SQL 설정 및 관리
- 배포 파이프라인 구축
- 환경 변수 및 시크릿 관리
- 모니터링 및 로깅

---

## 🔄 데이터 흐름

### 사용자 여정 (User Flow)

```
1. 회원가입/로그인 (Auth)
   ↓
2. 냉장고에 식재료 추가 (Pantry)
   ↓
3. 레시피 검색/추천 (Recipe Search)
   ↓
4. 레시피 상세 조회 (Recipe Detail)
   ↓
5. 음식 섭취 기록 & 영양 추적 (Nutrition Logging)
   ↓
6. 부족 재료 감지 & 장보기 (Shopping List)
```

### 시스템 데이터 흐름

```
┌──────────────┐
│  FrontEnd    │ (React/Expo)
└──────┬───────┘
       │ HTTP REST API
       ↓
┌──────────────────┐
│   BackEnd API    │ (Spring Boot)
└──────┬───────────┘
       │ JDBC
       ↓
┌──────────────────┐
│   MySQL DB       │
└──────────────────┘

외부 연동:
└─→ 식약처 OpenAPI (레시피 수집)
└─→ Google Cloud SQL (클라우드 DB)
```

---

## 📊 주요 개체 (Entities)

### Users (사용자)

- 회원가입, 로그인, 프로필 관리
- JWT 토큰 기반 인증

### Recipes (레시피)

- 식품의약품안전처 API에서 수집
- 조리 단계, 재료, 영양 정보 포함

### Pantry Items (냉장고 식재료)

- 사용자별 보유 식재료 관리
- 유효기간 및 수량 추적

### Nutrition Logs (영양 로그)

- 섭취 음식 기록
- 일일 칼로리, 단백질, 지방, 탄수화물 추적

### Shopping Items (장보기 목록)

- 부족 재료 자동 감지
- 추천된 장보기 아이템

### Custom Foods (커스텀 푸드)

- 사용자 정의 음식 추가
- 영양 정보 커스터마이징

---

## 🔐 보안 사항

### 인증

- JWT (JSON Web Token) 기반
- Access Token: 15분 유효
- Refresh Token: 7일 유효

### 비밀번호

- PBKDF2 해시 알고리즘 사용
- 평문 저장 금지

### 환경 변수

- `.env` 파일에 민감 정보 보관
- Git에 커밋하지 않음 (.gitignore)

### API 보안

- CORS 설정으로 도메인 제한
- Bearer Token 기반 인증
- HTTPS 권장 (배포 시)

---

## 📈 성능 고려사항

### BackEnd

- `JdbcTemplate` 사용으로 DB 커넥션 풀 최적화
- 쿼리 최적화 및 인덱싱
- 대량 데이터 수집 시 배치 처리

### FrontEnd

- 레이지 로딩 (Lazy Loading)
- 이미지 최적화 (WebP, 압축)
- 상태 관리로 불필요한 리렌더링 방지
- API 요청 캐싱

---

## 🚀 배포 전략

### 개발 환경

- 로컬 MySQL 또는 Cloud SQL + Auth Proxy

### 스테이징 환경

- Cloud SQL 사용

### 프로덕션 환경

- Google Cloud Run (BackEnd)
- Firebase Hosting (FrontEnd)
- Cloud SQL 프로덕션 인스턴스

---

## 📝 개발 규칙

### Git 컨벤션

- `feature/`: 새 기능 개발
- `bugfix/`: 버그 수정
- `docs/`: 문서 업데이트
- `hotfix/`: 긴급 수정

### 커밋 메시지

```
[TYPE] 제목

본문 (선택)

footer (선택)

TYPE: feat, fix, docs, style, refactor, test, chore
```

### 코드 스타일

- BackEnd: Google Java Style Guide
- FrontEnd: Prettier + ESLint

---

## 🔗 참고 문서

- [빠른 시작](../HOW_TO_RUN.md)
- [환경 설정 및 실행](SETUP_AND_RUN.md)
- [시스템 아키텍처](ARCHITECTURE.md)
- [백엔드 개발 가이드](BACKEND_GUIDE.md)
- [프론트엔드 개발 가이드](FRONTEND_GUIDE.md)
- [API 엔드포인트](API_ENDPOINTS.md)
- [데이터베이스](DATABASE.md)
- [문제 해결](TROUBLESHOOTING.md)

---

**마지막 업데이트**: 2026-06-09
