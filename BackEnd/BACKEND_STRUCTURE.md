# BackEnd Structure

`BackEnd` 디렉터리의 주요 파일과 패키지 역할을 정리합니다.

## Directory

```text
BackEnd/
  build.gradle
  settings.gradle
  gradlew
  gradlew.bat
  src/
    main/
      java/com/yorizori/
        auth/
        config/
        feature/
        foodapi/
        recipe/
      resources/
        application-local.yml
        db/schema.sql
        META-INF/
    test/
      java/com/yorizori/
        auth/
  gradle/
  chats/
  bin/
  build/
```

## Packages

### `auth`

회원가입, 로그인, 토큰 발급, 인증 사용자 식별을 담당합니다.

- `AuthController`: `/api/v1/auth/signup`, `/login`, `/refresh`
- `AuthService`: 회원 생성, 로그인 검증, 토큰 재발급
- `AuthDtos`: 인증/프로필 요청 및 응답 DTO
- `JwtTokenProvider`: HMAC SHA-256 기반 JWT 생성/검증
- `PasswordHasher`: PBKDF2 비밀번호 해시
- `AuthSupport`: `Authorization: Bearer` 또는 `X-User-Id`에서 사용자 ID 추출

### `config`

공통 설정과 실행 시 DB 보정 로직을 담당합니다.

- `DotenvEnvironmentPostProcessor`: `.env` 값을 Spring 환경 변수로 로드
- `SchemaMigrationRunner`: 기존 테이블 보정과 기능 테이블 생성
- `WebConfig`: CORS 설정

### `feature`

프론트 기능 요구사항에 대응하는 애플리케이션 API 계층입니다.

- `AppFeatureController`: 냉장고, 기피 재료, 추천, 장보기, 영양, 즐겨찾기, 제철, OCR, 바코드, 커스텀푸드 API
- `AppFeatureService`: 추천 매칭, 부족 재료 계산, 권장 섭취량 계산, OCR 텍스트 파싱
- `AppFeatureRepository`: `JdbcTemplate` 기반 기능 테이블 CRUD
- `FeatureDtos`: 기능별 요청/응답 DTO

### `foodapi`

식품의약품안전처 조리식품 레시피 OpenAPI 통신을 담당합니다.

- `FoodApiClient`: OpenAPI HTTP 요청
- `FoodApiProperties`: `food.api.*` 설정 바인딩
- `FoodApiFetchResult`: 원문 응답과 파싱 결과
- `FoodApiParseException`: XML 파싱 실패 예외

### `recipe`

레시피 수집, 저장, 조회 기능입니다.

- `recipe.web`
  - `RecipeController`: 레시피 목록/상세 조회
  - `RecipeIngestController`: 레시피 수집 관리자 API
  - `ApiExceptionHandler`: 공통 예외 응답
- `recipe.service`
  - `RecipeQueryService`: 레시피 조회 유스케이스
  - `RecipeIngestService`: OpenAPI 수집 유스케이스
- `recipe.repository`
  - `RecipeQueryRepository`: 검색, 상세, 추천 후보 조회
  - `RecipeIngestRepository`: 레시피/재료/단계/이미지 저장
- `recipe.dto`
  - 레시피, 영양, 재료, OpenAPI 응답 DTO

## Resources

### `application-local.yml`

로컬 프로필 설정입니다.

- `.env`, `BackEnd/.env` import
- MySQL datasource
- 식약처 OpenAPI 설정

### `db/schema.sql`

초기 레시피 수집 테이블 정의입니다. 현재 운영 경로에서는 `SchemaMigrationRunner`가 추가 기능 테이블을 보강 생성합니다.

## Generated Directories

### `bin`

컴파일된 클래스와 리소스가 들어가는 산출물 디렉터리입니다. 직접 수정하지 않습니다.

### `build`

Gradle 빌드 결과물 디렉터리입니다. 직접 수정하지 않습니다.

## Tests

현재 테스트는 인증 유틸리티 중심으로 구성되어 있습니다.

- `PasswordHasherTest`: 비밀번호 해시/검증
- `JwtTokenProviderTest`: Access/Refresh Token 생성과 파싱

실행:

```powershell
cd BackEnd
.\gradlew.bat test
```
