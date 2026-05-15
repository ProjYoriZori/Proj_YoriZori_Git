# YoriZori BackEnd

YoriZori 백엔드는 레시피 추천, 냉장고 재료 관리, 장보기, 영양 기록, 프로필 기반 권장 섭취량 계산을 제공하는 Spring Boot API 서버입니다. 기본 레시피 데이터는 식품의약품안전처 조리식품 레시피 OpenAPI(`COOKRCP01`)에서 수집합니다.

## Stack

- Java 17
- Spring Boot 3.3
- Gradle
- Spring Web
- Spring JDBC / JdbcTemplate
- MySQL 8.0
- Google Cloud SQL Auth Proxy

## Environment

`BackEnd/.env`에 로컬 값을 저장합니다. 실제 키와 비밀번호는 커밋하지 않습니다.

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=yorizori_DB
DB_USERNAME=testAccount
DB_PASSWORD=your-db-password
FOOD_API_KEY=your-food-api-key
JWT_SECRET=change-this-local-secret
CLOUD_SQL_CONNECTION_NAME=project-id:region:instance-name
```

## Run

```powershell
cd BackEnd
.\gradlew.bat bootRun --args='--spring.profiles.active=local'
```

빌드:

```powershell
cd BackEnd
.\gradlew.bat build
```

검증:

```powershell
cd BackEnd
.\gradlew.bat compileJava
.\gradlew.bat test
```

## Database

애플리케이션 시작 시 `SchemaMigrationRunner`가 기능 테이블을 생성합니다.

기존 레시피 수집/조회 테이블:

- `recipes`
- `ingredients`
- `recipe_ingredients`
- `recipe_steps`
- `images`
- `ingest_jobs`
- `api_raw_responses`

추가 기능 테이블:

- `users`
- `pantry_items`
- `avoid_ingredients`
- `shopping_items`
- `nutrition_logs`
- `favorites`
- `seasonal_ingredients`
- `custom_foods`

## Recipe Ingest

식품의약품안전처 레시피 DB를 수집합니다.

```http
POST /api/v1/admin/ingest/recipes?startIdx=1&endIdx=100
```

예시:

```powershell
curl -X POST "http://localhost:8080/api/v1/admin/ingest/recipes?startIdx=1&endIdx=20"
```

## API

### Auth

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/v1/auth/signup` | 회원가입과 프로필 생성 |
| POST | `/api/v1/auth/login` | 이메일/비밀번호 로그인, JWT 발급 |
| POST | `/api/v1/auth/refresh` | Refresh Token으로 토큰 재발급 |

인증이 필요한 API는 `Authorization: Bearer <accessToken>` 헤더를 사용합니다. 개발 편의를 위해 `X-User-Id` 헤더도 지원합니다.

### Recipes

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/recipes` | 레시피 목록, 메뉴명/재료 검색, 페이지네이션, 정렬 |
| GET | `/api/v1/recipes/{id}` | 레시피 상세, 재료, 조리 단계, 영양 정보 |
| POST | `/api/v1/recommend` | 보유 재료와 기피 재료 기반 추천 |

`GET /api/v1/recipes` 쿼리:

- `query`: 메뉴명 또는 재료 키워드
- `ingredients`: 재료 키워드. 반복 파라미터 사용 가능
- `page`: 0부터 시작
- `size` 또는 `limit`: 페이지 크기
- `sort`: `latest`, `name`, `calorieAsc`, `calorieDesc`

### Pantry and Avoid Ingredients

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/pantry-items` | 내 냉장고 재료 목록 |
| POST | `/api/v1/pantry-items` | 재료 추가 |
| PATCH | `/api/v1/pantry-items/{id}` | 재료 수정 |
| DELETE | `/api/v1/pantry-items/{id}` | 재료 삭제 |
| GET | `/api/v1/avoid-ingredients` | 기피/알레르기 재료 목록 |
| POST | `/api/v1/avoid-ingredients` | 기피 재료 추가 |
| DELETE | `/api/v1/avoid-ingredients/{id}` | 기피 재료 삭제 |

### Shopping

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/v1/shopping-items/generate` | 레시피 부족 재료를 장보기 항목으로 생성 |
| GET | `/api/v1/shopping-items` | 장보기 목록 |
| POST | `/api/v1/shopping-items` | 장보기 항목 직접 추가 |
| PATCH | `/api/v1/shopping-items/{id}` | 체크 상태 변경. 체크 완료 시 냉장고에 중복 없이 추가 |

### Nutrition

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/v1/nutrition-logs` | 먹은 음식 기록 추가 |
| GET | `/api/v1/nutrition/daily-summary` | 날짜별 섭취량과 권장량 비교 |
| GET | `/api/v1/custom-foods` | 자주 먹는 음식 목록 |
| POST | `/api/v1/custom-foods` | 자주 먹는 음식/식품 등록 |

권장량은 성별, 나이, 키, 체중, 목표, 활동량을 사용해 BMR 기반으로 계산합니다.

### Profile and Favorites

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/me` | 내 프로필 조회 |
| PATCH | `/api/v1/me` | 닉네임, 신체 정보, 목표, 활동량 수정 |
| POST | `/api/v1/favorites` | 레시피 즐겨찾기 등록 |
| DELETE | `/api/v1/favorites` | 레시피 즐겨찾기 해제 |

### Seasonal, OCR, Barcode

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/seasonal-ingredients` | 월별 제철 재료와 연관 레시피 |
| POST | `/api/v1/ocr/ingredients` | OCR 인식 텍스트에서 재료 후보 추출 |
| POST | `/api/v1/barcode/lookup` | 바코드 기반 상품 조회 플로우용 응답 |

OCR과 바코드는 외부 ML/상품 DB 연동 전 단계입니다. 현재는 프론트 편집 플로우를 연결할 수 있는 서버 응답을 제공합니다.

## Security Notes

- `.env`는 커밋하지 않습니다.
- `JWT_SECRET`은 운영 환경에서 반드시 교체합니다.
- 비밀번호는 PBKDF2로 해시 저장합니다.
- 실제 `FOOD_API_KEY`, `DB_PASSWORD`, 토큰은 문서와 로그에 남기지 않습니다.
