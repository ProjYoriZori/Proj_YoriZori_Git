# How To Run ProjYoriZori

빠르게 로컬 환경을 띄우는 방법과 자주 발생하는 문제 해결 팁을 정리합니다.

이 워크스페이스는 `FrontEnd`를 활성 프론트엔드 앱으로 사용합니다.

Prerequisites

- Java 17 (JDK)
- Gradle wrapper (프로젝트에 포함)
- Node.js 18+ 및 npm
- Expo CLI (선택): `npm install -g expo-cli` (또는 `npx expo` 사용)
- MySQL 8.x (또는 Google Cloud SQL + Cloud SQL Auth Proxy)

## Backend

1. 환경 파일 생성

BackEnd 디렉터리에 `.env` 파일을 생성하고 로컬 값을 넣습니다. 실제 비밀번호/키는 절대 커밋하지 마세요.

```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=yorizori_DB
DB_USERNAME=testAccount
DB_PASSWORD=your-db-password
# Optional: 전체 JDBC URL이 있다면 우선 사용됩니다.
DB_URL=jdbc:mysql://127.0.0.1:3307/yorizori_DB?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
FOOD_API_KEY=your-food-api-key
JWT_SECRET=change-this-local-secret
CLOUD_SQL_CONNECTION_NAME=project-id:region:instance-name
```

2. (Cloud SQL 사용 시) Cloud SQL Auth Proxy

로컬 MySQL을 사용하지 않고 Cloud SQL에 연결하려면 Cloud SQL Auth Proxy를 실행하고 `DB_PORT`를 프록시에 맞춰 설정하세요.

예: 프록시를 3307 포트로 실행한 뒤 `.env`에 `DB_PORT=3307` 설정.

3. 백엔드 실행

```powershell
cd BackEnd
.\gradlew.bat bootRun --args='--spring.profiles.active=local'
```

로컬에서 기본적으로 서버는 `http://localhost:8080` 으로 실행됩니다.

4. 데이터 수집(선택)

식품의약품안전처 레시피를 수집하려면 관리자 인제스트 엔드포인트를 사용하세요:

```powershell
curl -X POST "http://localhost:8080/api/v1/admin/ingest/recipes?startIdx=1&endIdx=100"
```

5. 간단한 검증

```powershell
Invoke-RestMethod "http://localhost:8080/api/v1/recipes?limit=3"
```

문제가 발생하면 로그를 확인하세요. MySQL의 `Access denied` 오류는 자격증명 문제이며 `.env` 값을 점검하거나 MySQL 사용자 권한을 부여해야 합니다.

참고: 애플리케이션은 `DotenvEnvironmentPostProcessor`를 통해 `BackEnd/.env` 를 로드합니다.

데이터베이스 스키마 메모: `recipe_steps` 테이블의 단계 텍스트 컬럼은 `instruction`입니다(과거의 `description`이 아니라는 점을 유의).

## Frontend

1. 설치 및 시작

```powershell
cd FrontEnd
npm install
npm run start
```

`npm run start`는 Expo 개발 서버를 실행합니다(웹, iOS, Android 디바이스/에뮬레이터 선택 가능).

Expo 개발 서버는 백엔드 API를 프록시하지 않습니다. 앱은 `EXPO_PUBLIC_API_BASE_URL` 값으로 백엔드에 직접 요청하며, 값이 없으면 기본적으로 `http://localhost:8080`을 사용합니다. 웹에서는 현재 호스트 기준 주소를 참고하고, Android 에뮬레이터에서는 `http://10.0.2.2:8080`을 사용합니다.

2. 환경 변수

웹/모바일에서 API 서버 주소를 명시하려면 `.env` 또는 시스템 환경 변수로 설정하세요:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

Expo가 사용 중인 포트를 자동으로 변경할 수 있으므로(예: 8081이 바쁘면 8082 사용) 브라우저에서 열리는 URL을 확인하세요. Android 에뮬레이터에서 로컬 백엔드에 접근하려면 다음을 사용합니다:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080
```

3. 검증

```powershell
cd FrontEnd
npm run doctor
```

또는 코드 유효성 검사를 위해:

```powershell
Get-ChildItem -Path .\src -Recurse -Include *.js | ForEach-Object { node --check $_.FullName }
```

## Troubleshooting

- 포트 충돌: Cloud SQL Auth Proxy 또는 로컬 MySQL이 3307을 점유하면 프록시를 다른 포트(예: 3308)로 실행하고 `DB_PORT`를 조정하세요.
- Expo 포트: Expo는 기본적으로 19000/19001(모바일) 또는 8081(웹)을 사용합니다. 브라우저에서 열리는 주소를 확인하거나 `npm run web`을 사용해 웹 전용 빌드를 시도하세요.
- API 500 에러: 백엔드 로그의 SQL 쿼리/스택트레이스를 확인하세요. 최근 수정으로 `recipe_steps`의 단계 텍스트 컬럼은 `instruction`입니다.

---

필요하면 이 문서를 기반으로 `BackEnd/`와 `FrontEnd/`의 README들을 동기화하겠습니다.
