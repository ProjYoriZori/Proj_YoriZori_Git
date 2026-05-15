# FrontEnd_In Guide

This folder contains the frontend app (legacy-base44-src excluded).

## Branch
- Branch name: FrontEnd_In
- Path: ProjYoriZori/FrontEnd_In

## Quick Start
1) Install dependencies

```bash
npm install
```

2) Create .env

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

3) Run

```bash
npm start
```

## API Base
- The app expects the base URL to include /api/v1.
- If EXPO_PUBLIC_API_BASE_URL is missing, the app falls back to mock data.

## Endpoint Map (v1)
- POST /api/v1/auth/signup
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- GET  /api/v1/recipes
- GET  /api/v1/recipes/{id}
- GET  /api/v1/pantry-items
- POST /api/v1/pantry-items
- PATCH /api/v1/pantry-items/{id}
- DELETE /api/v1/pantry-items/{id}
- GET/POST/DELETE /api/v1/avoid-ingredients
- POST /api/v1/recommend
- POST /api/v1/shopping-items/generate
- GET/PATCH /api/v1/shopping-items
- POST /api/v1/nutrition-logs
- GET  /api/v1/nutrition/daily-summary
- GET/PATCH /api/v1/me
- POST/DELETE /api/v1/favorites
- GET  /api/v1/seasonal-ingredients
- POST /api/v1/ocr/ingredients
- POST /api/v1/barcode/lookup

## Notes
- Shopping items are generated via POST /shopping-items/generate.
- Shopping item toggle uses PATCH /shopping-items with shopping_item_id in body.
- Profile uses GET/PATCH /me.
- Nutrition logs are created via POST /nutrition-logs. Delete is local-only.
- Custom foods remain local-only (no backend endpoint in v1).
