# Proj_YoriZori_Git

요리조리(YoriZori) 프로젝트의 Spring Boot 백엔드입니다.  
식품의약품안전처 조리식품 레시피 OpenAPI(`COOKRCP01`)를 호출해 레시피, 재료, 조리 단계, 이미지, 수집 로그를 Google Cloud SQL MySQL DB에 저장합니다.

## 주요 기능

- 식약처 조리식품 레시피 OpenAPI XML 호출
- 레시피 기본 정보 저장
- 재료 및 레시피-재료 매핑 저장
- 조리 단계 및 단계 이미지 저장
- 대표/썸네일/단계 이미지 저장
- 수집 작업 로그(`ingest_jobs`) 저장
- API 원문 응답(`api_raw_responses`) 저장
- Cloud SQL Auth Proxy 기반 로컬 개발 DB 연결 지원

## 기술 스택

- Java 17
- Spring Boot 3
- Gradle
- Spring JDBC / JdbcTemplate
- MySQL 8.0
- Google Cloud SQL
- Cloud SQL Auth Proxy

## 프로젝트 구조

```text
src/main/java/com/yorizori
├── config
│   ├── DotenvEnvironmentPostProcessor.java
│   └── SchemaMigrationRunner.java
├── foodapi
│   ├── FoodApiClient.java
│   └── FoodApiProperties.java
└── recipe
    ├── dto
    ├── repository
    ├── service
    └── web
```

## 환경 변수

실제 값은 `.env`에 작성합니다. `.env`는 Git에 커밋하지 않습니다.

```env
DB_HOST=127.0.0.1:3306
DB_PASSWORD=your-db-password
FOOD_API_KEY=your-food-api-key
CLOUD_SQL_CONNECTION_NAME=project-id:region:instance-name
```

`DB_PASSWORD`는 Google 계정 비밀번호가 아니라 Cloud SQL MySQL 사용자(`testAccount`)의 DB 비밀번호입니다.

## Cloud SQL Auth Proxy 실행

```powershell
.\tools\cloud-sql-proxy.exe <CLOUD_SQL_CONNECTION_NAME> --port 3306
```

정상 연결 확인:

```powershell
Test-NetConnection 127.0.0.1 -Port 3306
```

`TcpTestSucceeded : True`가 나오면 Spring Boot 앱이 `DB_HOST=127.0.0.1:3306`으로 Cloud SQL에 접속할 수 있습니다.

## 빌드 및 실행

```powershell
.\gradlew.bat build
java -jar build\libs\yorizori-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=local
```

## 레시피 수집 API

수동 실행용 관리자 API입니다.

```http
POST /api/v1/admin/ingest/recipes?startIdx=1&endIdx=100
```

예시:

```powershell
curl -X POST "http://localhost:8080/api/v1/admin/ingest/recipes?startIdx=1&endIdx=20"
```

응답 예시:

```json
{
  "ingestJobId": 59,
  "startIdx": 1,
  "endIdx": 20,
  "totalCount": 1146,
  "fetchedCount": 20,
  "savedCount": 20
}
```

## DB 저장 테이블

현재 Repository는 프로젝트 SQL 설계안(`Proj_YoriZori_Fin`)의 컬럼명을 기준으로 저장합니다.

- `recipes`
- `ingredients`
- `recipe_ingredients`
- `recipe_steps`
- `images`
- `ingest_jobs`
- `api_raw_responses`

## 검증 결과

- 식약처 API 키 유효성 확인 완료
- Cloud SQL Auth Proxy 연결 확인 완료
- Spring Boot 앱에서 Cloud SQL 접속 확인 완료
- `COOKRCP01` 전체 1146건 수집 및 저장 완료
- 중복 재료 저장 충돌 보정 완료

## 보안 주의사항

- `.env`는 절대 커밋하지 않습니다.
- 실제 `FOOD_API_KEY`, `DB_PASSWORD`, Google OAuth 토큰은 코드와 README에 기록하지 않습니다.
- `.env.example`에는 placeholder만 유지합니다.
