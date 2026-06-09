# 변경 이력 (Changelog)

> **YoriZori 백엔드 주요 변경 사항을 시간순으로 기록합니다.**

---

## [2026-06-09] DB를 Google Cloud SQL에서 로컬 MySQL로 전환

- **이유**: Google Cloud 크레딧 소진으로 인해 로컬 MySQL 8.x로 전환
- `BackEnd/.env`: Cloud SQL Auth Proxy 주석 및 `CLOUD_SQL_CONNECTION_NAME` 제거, 로컬 MySQL 설정 유지
- `BackEnd/.env.example`: Cloud SQL 환경변수 제거, 포트 기본값 3307→3306으로 수정
- `BackEnd/src/main/resources/application-local.yml`: 기본 포트 3307→3306으로 수정
- `docs/PROJECT_OVERVIEW.md`, `docs/SETUP_AND_RUN.md`: Cloud SQL 참조 제거

---

## [2026-05-xx] 백엔드 기능 개선

> 출처: `BackEnd/backend-docs/backend-change-summary.md`

### 1. 회원가입 이메일 검증 강화

- `AuthService`에 이메일 형식 정규식 검사 추가
- `signup`과 `login`에서 이메일을 소문자화하고 공백 제거 후 검증
- 잘못된 이메일 형식에 대해 `Invalid email format.` 예외 처리

**변경 파일**: `AuthService.java`

---

### 2. 탈퇴 회원 처리 (Soft Delete)

- `users` 테이블에 `is_deleted`, `deleted_at` 컬럼 추가
- `SchemaMigrationRunner`에서 해당 컬럼을 자동 생성/보장
- `AuthService`에서 탈퇴 사용자 로그인 차단
- `AppFeatureService`에 `deleteMe` 서비스 추가
- `AppFeatureController`에 `DELETE /api/v1/users/me` 엔드포인트 추가

**변경 파일**: `AuthService.java`, `SchemaMigrationRunner.java`, `AppFeatureController.java`, `AppFeatureService.java`

---

### 3. 로그아웃 및 UI 진입점 처리

- `AuthController`에 `POST /api/v1/auth/logout` 유지
- 프론트엔드용 placeholder 엔드포인트 추가:
  - `POST /api/v1/auth/find-email` (미구현, UI 진입점)
  - `POST /api/v1/auth/forgot-password` (미구현, UI 진입점)

**변경 파일**: `AuthController.java`

---

### 4. 추천 및 검색 로직 개선

- `RecipeQueryRepository`에서 검색어와 재료명을 공백 제거 버전으로도 매칭
- 토큰 길이가 짧을 경우 과도한 부분 매칭 제한으로 오추천 감소
- `recommendRecipes`에서 결과가 없으면 랜덤/최신 레시피로 fallback 반환
- 검색 시 `ing.name`과 `ri.original_name` 모두 검사

**변경 파일**: `RecipeQueryRepository.java`

---

### 5. 재료명 정규화 및 동의어 처리

- `RecipeQueryRepository.normalize`에 동의어 매핑 추가:
  - `계란` / `달걀` 통합
  - `대파` → `파`
  - `방울토마토` / `방울토마토소박이` 통합
- 검색어와 재료명 모두 공백 제거 후 비교

**변경 파일**: `RecipeQueryRepository.java`

---

### 6. 상세 레시피 응답 확장

- `RecipeIngredientResponse`에 `unit`, `note` 필드 추가
- 현재 기본값은 빈 문자열, 향후 데이터 정제 작업에서 채워질 예정

**변경 파일**: `RecipeIngredientResponse.java`

---

### 검증 결과

```powershell
cd BackEnd
.\gradlew.bat clean build
# 결과: BUILD SUCCESSFUL
```

---

## [2026-05-10] 초기 API 연동 및 프론트 연결

### 백엔드

- `GET /api/v1/recipes`, `GET /api/v1/recipes/{id}` 레시피 조회 API 추가
- 레시피 응답 DTO, 조회 서비스, 조회 Repository 추가
- 프론트 연동을 위한 `/api/**` CORS 설정 추가
- `application-local.yml`에 `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_URL` 환경변수 기반으로 보강

### 프론트엔드

- 레시피 목록/상세/홈/장보기 화면을 백엔드 API 기반으로 연결
- mock 레시피 이미지 fallback 및 Unsplash fallback 제거
- DB `image` 값 있을 때만 이미지 렌더링, 없으면 placeholder 표시

### 개발 도구

- `tools/copilot-compact-context.ps1` 추가 (`.env` 값 마스킹 compact context 생성)
- `docs/copilot-cli-workflow.md` 추가

---

## [2026-05-09] 프로젝트 최초 구성

### 초기 구성

- Spring Boot 3.3.x + Java 17 + Gradle Wrapper 프로젝트 생성
- `.env` 로더 (`DotenvEnvironmentPostProcessor`) 구현
- 식품의약품안전처 OpenAPI 클라이언트 구현
- MySQL DDL 스키마 작성 (`recipes`, `ingredients`, `recipe_steps`, `images`, `ingest_jobs`, `api_raw_responses`)
- 레시피 수집 관리자 API (`POST /api/v1/admin/ingest/recipes`) 구현
- `.gitignore`에 `.env`, `tools/`, `build/` 추가

---

**마지막 업데이트**: 2026-06-09
