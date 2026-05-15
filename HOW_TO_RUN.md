# How To Run ProjYoriZori

이 문서는 로컬 개발 환경에서 `BackEnd`와 `FrontEnd`를 실행하는 최소 절차를 정리합니다.

## Prerequisites

- Java 17 이상
- Node.js LTS, npm
- MySQL 8.0 또는 Google Cloud SQL MySQL
- Windows PowerShell 권장
- Android Studio 또는 Expo Go

## Backend

백엔드는 Spring Boot 3, Java 17, Gradle, Spring JDBC, MySQL을 사용합니다.

### 1. 환경 변수

`BackEnd/.env` 파일을 만들고 실제 값은 로컬에만 보관합니다. 민감정보는 커밋하지 않습니다.

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

### 2. Cloud SQL Auth Proxy

Cloud SQL을 사용할 때만 실행합니다.

```powershell
.\tools\cloud-sql-proxy.exe <CLOUD_SQL_CONNECTION_NAME> --port 3306
Test-NetConnection 127.0.0.1 -Port 3306
```

### 3. 실행

```powershell
cd BackEnd
.\gradlew.bat bootRun --args='--spring.profiles.active=local'
```

또는 빌드 후 JAR로 실행합니다.

```powershell
cd BackEnd
.\gradlew.bat build
java -jar build\libs\yorizori-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=local
```

기본 주소는 `http://localhost:8080`입니다.

### 4. 레시피 DB 수집

식품의약품안전처 조리식품 레시피 DB(`COOKRCP01`)를 수집합니다.

```powershell
curl -X POST "http://localhost:8080/api/v1/admin/ingest/recipes?startIdx=1&endIdx=100"
```

### 5. 주요 API 확인

```powershell
Invoke-RestMethod "http://localhost:8080/api/v1/recipes?limit=3"
Invoke-RestMethod "http://localhost:8080/api/v1/seasonal-ingredients"
```

인증이 필요한 API는 회원가입 또는 로그인 응답의 `accessToken`을 사용합니다.

```powershell
$body = @{
  email = "test@example.com"
  password = "password1234"
  nickname = "tester"
  age = 24
  heightCm = 175
  weightKg = 70
  goal = "MAINTAIN"
  activityLevel = "NORMAL"
} | ConvertTo-Json

$auth = Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/v1/auth/signup" -ContentType "application/json" -Body $body
$headers = @{ Authorization = "Bearer $($auth.accessToken)" }
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/pantry-items" -Headers $headers
```

## Frontend

프론트엔드는 Expo Router 기반 React Native 앱입니다.

```powershell
cd FrontEnd
npm install
npm run start
```

플랫폼별 실행:

```powershell
npm run android
npm run ios
npm run web
```

백엔드 주소를 명시하려면 `EXPO_PUBLIC_API_BASE_URL`을 사용합니다.

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

Android 에뮬레이터는 기본적으로 `http://10.0.2.2:8080`을 사용합니다.

## Verification

```powershell
cd BackEnd
.\gradlew.bat compileJava
.\gradlew.bat test
```

```powershell
cd FrontEnd
npm run lint
npx tsc --noEmit
```

## Troubleshooting

- `Connection refused`: Cloud SQL Auth Proxy 또는 MySQL 포트를 확인합니다.
- `Access denied`: `DB_USERNAME`, `DB_PASSWORD`, DB 권한을 확인합니다.
- 레시피가 비어 있음: `/api/v1/admin/ingest/recipes`를 먼저 실행합니다.
- 인증 API 실패: 요청 JSON 필드명과 `JWT_SECRET` 설정을 확인합니다.
- Expo에서 백엔드 호출 실패: 같은 네트워크, CORS, `EXPO_PUBLIC_API_BASE_URL`을 확인합니다.
