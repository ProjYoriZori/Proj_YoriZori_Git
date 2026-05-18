# YoriZori FrontEnd

Active frontend 앱의 로컬 실행 및 백엔드 연결 방법을 정리합니다.

## Prerequisites

- Node.js 18+ 및 npm
- (선택) Expo CLI: `npm install -g expo-cli` 또는 `npx expo`

## Run

```powershell
cd FrontEnd
npm install
npm run start
```

웹 전용 실행:

```powershell
npm run web
```

Expo 개발 서버는 백엔드 API를 프록시하지 않습니다. 앱은 `EXPO_PUBLIC_API_BASE_URL` 값으로 백엔드에 직접 요청하며, 값이 없으면 기본적으로 `http://localhost:8080`을 사용합니다. 웹에서는 현재 호스트 기준 주소를 참고하고, Android 에뮬레이터에서는 `http://10.0.2.2:8080`을 사용합니다.

## Backend Connection

API 클라이언트는 `src/api/client.js` 입니다. 기본 API 베이스 URL은 다음 환경변수로 제어합니다:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

- 값이 `/api/v1`로 끝나면 그대로 사용됩니다.
- 값이 없으면 기본값 `http://localhost:8080/api/v1`로 동작합니다.

Android 에뮬레이터:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080
```

## Recipe & Nutrition Data

- 레시피 및 영양 관련 데이터는 모두 백엔드 API에서 로드됩니다.
- 초기 목록 호출: `GET /api/v1/recipes?limit=50`
- 상세 호출: `GET /api/v1/recipes/{id}`
- 영양 일별 요약: `GET /api/v1/nutrition/daily-summary?date=<yyyy-MM-dd>`

백엔드가 실행 중이어야 앱이 정상 동작합니다. 레시피 테이블이 비어있다면 관리자 인제스트 API를 사용해 데이터를 채우세요:

```powershell
curl -X POST "http://localhost:8080/api/v1/admin/ingest/recipes?startIdx=1&endIdx=100"
```

## Verification

```powershell
cd FrontEnd
npm run doctor

Get-ChildItem -Path .\src -Recurse -Include *.js | ForEach-Object { node --check $_.FullName }
```

문제가 있다면 `EXPO_PUBLIC_API_BASE_URL` 설정과 백엔드의 상태(포트, CORS 등)를 먼저 확인하세요.
