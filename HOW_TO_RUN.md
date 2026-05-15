# How To Run ProjYoriZori

This workspace currently uses `FrontEnd` as the active frontend app.

## Backend

Create `BackEnd/.env` with local credentials. Do not commit real secrets.

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=yorizori_DB
DB_USERNAME=testAccount
DB_PASSWORD=your-db-password
# Optional full JDBC URL. If set, backend uses this before DB_HOST/DB_PORT/DB_NAME.
DB_URL=jdbc:mysql://127.0.0.1:3306/yorizori_DB?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
# Optional mysql://user:password@host:port/db URL. The backend normalizes it to JDBC.
DB_CONNECTION=
FOOD_API_KEY=your-food-api-key
JWT_SECRET=change-this-local-secret
CLOUD_SQL_CONNECTION_NAME=project-id:region:instance-name
```

Run Cloud SQL Auth Proxy if needed:

```powershell
.\tools\cloud-sql-proxy.exe <CLOUD_SQL_CONNECTION_NAME> --port 3306
```

If local MySQL already owns port `3306`, run the proxy on another port and point the backend to that port:

```powershell
.\cloud-sql-proxy.exe <CLOUD_SQL_CONNECTION_NAME> --address 127.0.0.1 --port 3307
$env:DB_PORT='3307'
```

Run backend:

```powershell
cd BackEnd
.\gradlew.bat bootRun --args='--spring.profiles.active=local'
```

Seed recipe data from the Food Safety Korea API:

```powershell
curl -X POST "http://localhost:8080/api/v1/admin/ingest/recipes?startIdx=1&endIdx=100"
```

Smoke test:

```powershell
Invoke-RestMethod "http://localhost:8080/api/v1/recipes?limit=3"
```

If the backend log says `Access denied for user ...`, the API route is wired but MySQL rejected the configured `DB_USERNAME`/`DB_PASSWORD`. Fix the credentials in `BackEnd/.env`, create/grant that MySQL user, or use a valid `DB_URL`.

If `Access denied` appears while `127.0.0.1:3306` is owned by a local `mysqld` process, the backend is connecting to local MySQL instead of Cloud SQL. Start Cloud SQL Auth Proxy on a free port such as `3307` and set `DB_PORT=3307`.

Current local startup reads `BackEnd/.env` through `DotenvEnvironmentPostProcessor`; do not rely on Spring `.env[.properties]` parsing for secrets.

## Frontend

Run frontend:

```powershell
cd FrontEnd
npm install
npm run start
```

Recommended frontend env:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

Android emulator:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080
```

Recipe data is loaded only from `BackEnd` through `/api/v1/recipes`. Nutrition logs and custom foods are also API-only. There is no bundled recipe or nutrition mock fallback.

## Verification

```powershell
cd BackEnd
.\gradlew.bat test
```

```powershell
cd FrontEnd
npm run doctor
```
