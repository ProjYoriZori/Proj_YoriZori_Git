# FrontEnd Guide

이 문서는 로컬에서 `FrontEnd` 앱을 실행하고 백엔드에 연결하는 방법을 안내합니다.

## Quick Start

```powershell
cd FrontEnd
npm install
npm run start
```

`npm run start`는 Expo 개발 도구를 시작합니다. 웹 전용으로 실행하려면 `npm run web`을 사용할 수 있습니다.

## Prerequisites

- Node.js 18+ 및 npm
- Expo(선택): `npm install -g expo-cli` 또는 `npx expo`

## API Base

환경변수로 API 기본 URL을 지정합니다. 기본값은 `http://localhost:8080` 입니다.

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

Expo가 사용하는 포트는 시스템 환경에 따라 달라질 수 있습니다(예: 웹이 8081 대신 8082를 사용). 브라우저에서 열리는 URL을 확인하세요.

Android 에뮬레이터에서 로컬 호스트에 접속하려면:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080
```

## Data Flow

- 레시피, 영양, 커스텀 푸드 등은 모두 백엔드 API에서 로드합니다.
- 초기 목록 호출: `GET /api/v1/recipes?limit=50`
- 검색: `GET /api/v1/recipes?query=<keyword>&ingredients=<ingredient>`
- 상세: `GET /api/v1/recipes/{id}`

백엔드가 동작하지 않으면 화면은 빈 리스트 또는 에러 메시지를 표시합니다(로컬 개발용 더미 데이터 미포함).

## Endpoint Map (요약)

- `GET /api/v1/recipes`
- `GET /api/v1/recipes/{id}`
- `POST /api/v1/recommend`
- `GET /api/v1/seasonal-ingredients`
- `POST /api/v1/shopping-items/generate`
- `POST /api/v1/nutrition-logs`
- `GET /api/v1/nutrition/daily-summary`
- `GET/PATCH /api/v1/me`

## Troubleshooting

- Expo 포트 충돌: Expo가 기본 포트를 사용하지 못하면 다른 포트를 선택합니다. 브라우저에서 표시된 URL을 확인하세요.
- CORS/네트워크: 로컬 백엔드에 접근할 수 없는 경우 `EXPO_PUBLIC_API_BASE_URL` 값을 올바르게 설정했는지 확인하세요.
- Android 에뮬레이터: 에뮬레이터의 로컬 호스트 주소는 `10.0.2.2` 입니다.

필요하면 이 가이드를 바탕으로 배포 및 CI 환경에 맞춘 문서도 추가하겠습니다.
