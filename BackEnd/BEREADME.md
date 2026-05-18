# YoriZori BackEnd

YoriZori 백엔드는 레시피, 냉장고 재료, 장보기, 영양 기록, 추천 기능을 제공하는 Spring Boot API 서버입니다. 기본 레시피 데이터는 식품의약품안전처 OpenAPI(`COOKRCP01`)에서 수집합니다.

## Stack

- Java 17
- Spring Boot 3.3.x
- Gradle wrapper
- Spring Web, Spring JDBC (JdbcTemplate)
- MySQL 8.x (개발: 로컬 MySQL 또는 Cloud SQL + Auth Proxy)

## Prerequisites

- JDK 17
- MySQL 8.x 또는 Cloud SQL 접근 권한
- Gradle wrapper(프로젝트 포함)

## Environment

로컬 실행을 위해 `BackEnd/.env` 파일에 값을 넣습니다. 민감 정보는 절대 커밋하지 마세요.

```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=yorizori_DB
DB_USERNAME=testAccount
DB_PASSWORD=your-db-password
FOOD_API_KEY=your-food-api-key
JWT_SECRET=change-this-local-secret
CLOUD_SQL_CONNECTION_NAME=project-id:region:instance-name
```

참고: `DB_URL`(JDBC) 전체 URL을 제공하면 그 값을 우선 사용합니다.

## Run

개발 서버 실행:

```powershell
cd BackEnd
.\gradlew.bat bootRun --args='--spring.profiles.active=local'
```

빌드/테스트:

```powershell
cd BackEnd
.\gradlew.bat build
.\gradlew.bat test
```

## Database

애플리케이션 시작 시 `SchemaMigrationRunner`가 누락된 기능 테이블을 자동 생성합니다. 레시피 관련 기본 테이블은 다음과 같습니다.

- `recipes`
- `ingredients`
- `recipe_ingredients`
- `recipe_steps` (단계 텍스트 컬럼: `instruction`)
- `images`
- `ingest_jobs`
- `api_raw_responses`

추가 기능 테이블: `users`, `pantry_items`, `avoid_ingredients`, `shopping_items`, `nutrition_logs`, `favorites`, `seasonal_ingredients`, `custom_foods` 등.

## Recipe Ingest

식품의약품안전처 레시피를 수집하려면 관리자 인제스트 엔드포인트를 호출하세요.

```http
POST /api/v1/admin/ingest/recipes?startIdx=1&endIdx=100
```

예시:

```powershell
curl -X POST "http://localhost:8080/api/v1/admin/ingest/recipes?startIdx=1&endIdx=20"
```

## API (요약)

인증 관련, 레시피 조회/상세, 추천, 냉장고/기피 재료, 장보기, 영양 로그 등 주요 엔드포인트를 제공합니다. (원문 문서는 코드에서 API 시그니처를 참조하세요.)

## Security Notes

- `.env` 파일은 절대 커밋하지 마세요.
- 운영 환경에서는 `JWT_SECRET`을 반드시 교체하세요.
- 비밀번호는 PBKDF2로 해시 저장됩니다.

---

필요하면 이 README에 더 상세한 엔드포인트 표나 데이터베이스 마이그레이션 절차를 추가하겠습니다.
