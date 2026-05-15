# FrontEnd Guide

`FrontEnd` is the current frontend app in this workspace.

## Quick Start

```powershell
cd FrontEnd
npm install
npm run start
```

## API Base

Use:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

The client appends `/api/v1` automatically unless it is already present.

## Real Recipe Data

Recipes are loaded from the backend API, which reads from the database.

Current recipe flow:

- App startup: `GET /api/v1/recipes?limit=50`
- Search by menu name: `GET /api/v1/recipes?query=<keyword>&limit=50`
- Search by ingredient: `GET /api/v1/recipes?ingredients=<ingredient>&limit=50`
- Detail screen uses the API-loaded recipe list.

There is no mock recipe fallback. An unavailable backend or empty DB produces an empty recipe screen with an API error/empty-state message.

## Real Nutrition Data

Nutrition logs and custom foods are also loaded from the backend API.

- Daily summary: `GET /api/v1/nutrition/daily-summary?date=<yyyy-MM-dd>`
- Custom foods: `GET /api/v1/custom-foods`

There is no bundled nutrition mock fallback. If the backend is unavailable, nutrition lists stay empty instead of using sample data.

## Endpoint Map

- `GET /api/v1/recipes`
- `GET /api/v1/recipes/{id}`
- `POST /api/v1/recommend`
- `GET /api/v1/seasonal-ingredients`
- `POST /api/v1/shopping-items/generate`
- `POST /api/v1/nutrition-logs`
- `GET /api/v1/nutrition/daily-summary`
- `GET/PATCH /api/v1/me`

Authenticated pantry/shopping/nutrition flows require `Authorization: Bearer <accessToken>` once login UI is connected.
