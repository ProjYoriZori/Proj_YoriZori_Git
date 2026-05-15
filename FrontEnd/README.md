# YoriZori FrontEnd

This is the active frontend app for YoriZori.

## Run

```powershell
cd FrontEnd
npm install
npm run start
```

## Backend Connection

The API client is `src/api/client.js`.

Default behavior:

- `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080` resolves to `http://localhost:8080/api/v1`.
- If the value already ends with `/api/v1`, it is used as-is.
- If the variable is omitted, the app defaults to `http://localhost:8080/api/v1`.

Android emulator:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080
```

## Recipe Data

Recipe data is API-only.

- Initial load calls `GET /api/v1/recipes?limit=50`.
- Recipe search calls `GET /api/v1/recipes` with `query` and `ingredients`.
- The app no longer falls back to bundled mock recipes.
- If the backend or DB is unavailable, the recipe list is empty and the screen shows the API error.

The backend must be running and connected to MySQL/Cloud SQL. If the recipe table is empty, run:

```powershell
curl -X POST "http://localhost:8080/api/v1/admin/ingest/recipes?startIdx=1&endIdx=100"
```

## Nutrition Data

Nutrition logs and custom foods are API-only.

- Daily summary calls `GET /api/v1/nutrition/daily-summary?date=<yyyy-MM-dd>`.
- Custom foods call `GET /api/v1/custom-foods`.
- The app no longer falls back to bundled mock nutrition logs or custom foods.

## Verification

```powershell
cd FrontEnd
npm run doctor
```

```powershell
Get-ChildItem -Path .\src -Recurse -Include *.js | ForEach-Object { node --check $_.FullName }
node --check .\App.js
node --check .\index.js
```
