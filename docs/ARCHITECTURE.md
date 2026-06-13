# 시스템 아키텍처

> **YoriZori 전체 시스템의 구조, 계층, 통신 방식을 설명합니다.**

---

## 🏛️ 고수준 아키텍처 (High-Level Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                    FrontEnd Layer                       │
│  (React/Expo Web + Mobile)                              │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP REST API (port 8080)
                   ↓
┌─────────────────────────────────────────────────────────┐
│                    BackEnd Layer                        │
│  (Spring Boot REST API Server)                          │
└──────┬───────────────────┬──────────────────────────────┘
       │ JDBC              │ HTTP
       ↓                   ↓
   ┌───────┐          ┌──────────────┐
   │ MySQL │          │식품의약품     │
   │  DB   │          │안전처 API     │
   └───────┘          └──────────────┘
```

---

## 📋 계층 구조 (Layered Architecture)

### BackEnd 계층

```
┌─────────────────────────────────────────────┐
│  Presentation Layer (Controller)            │
│  - RecipeController                         │
│  - AuthController                           │
│  - AppFeatureController                     │
│  - RecipeIngestController (Admin)           │
└────────────────┬────────────────────────────┘
                 │
┌────────────────↓────────────────────────────┐
│  Service Layer (Business Logic)             │
│  - RecipeQueryService                       │
│  - RecipeIngestService                      │
│  - AuthService                              │
│  - AppFeatureService                        │
└────────────────┬────────────────────────────┘
                 │
┌────────────────↓────────────────────────────┐
│  Repository Layer (Data Access)             │
│  - RecipeQueryRepository                    │
│  - RecipeIngestRepository                   │
│  - AppFeatureRepository                     │
│  (JdbcTemplate 기반)                        │
└────────────────┬────────────────────────────┘
                 │
┌────────────────↓────────────────────────────┐
│  Data Layer (Database)                      │
│  - MySQL 8.x                                │
│  - JDBC Driver                              │
└─────────────────────────────────────────────┘
```

### FrontEnd 계층

```
┌─────────────────────────────────────────────┐
│  UI Layer (Screens & Components)            │
│  - HomeScreen                               │
│  - RecipesScreen                            │
│  - FridgeScreen                             │
│  - NutritionScreen                          │
│  - ShoppingScreen                           │
│  - MyPageScreen                             │
└────────────────┬────────────────────────────┘
                 │
┌────────────────↓────────────────────────────┐
│  State Management Layer (Context)           │
│  - AppDataContext                           │
│  - User State                               │
│  - Pantry State                             │
│  - Recipes State                            │
└────────────────┬────────────────────────────┘
                 │
┌────────────────↓────────────────────────────┐
│  API Client Layer                           │
│  - client.js (Fetch API)                    │
│  - Base URL: EXPO_PUBLIC_API_BASE_URL       │
└────────────────┬────────────────────────────┘
                 │
                 ↓ HTTP REST
            BackEnd API Server
```

---

## 📦 BackEnd 패키지 구조

### `com.yorizori.auth`

**역할**: 사용자 인증 및 권한 관리

```
auth/
├── AuthController
│   ├── POST /api/v1/auth/signup
│   ├── POST /api/v1/auth/login
│   └── POST /api/v1/auth/refresh
├── AuthService
│   ├── signup(email, password, name)
│   ├── login(email, password)
│   └── refreshToken(refreshToken)
├── JwtTokenProvider
│   ├── generateAccessToken(userId)
│   ├── generateRefreshToken(userId)
│   └── validateToken(token)
├── PasswordHasher
│   ├── hash(password)
│   └── verify(password, hash)
└── AuthSupport
    └── extractUserId(request)
```

### `com.yorizori.config`

**역할**: 애플리케이션 설정, 초기화, CORS

```
config/
├── DotenvEnvironmentPostProcessor
│   └── .env 파일 → Spring Environment
├── SchemaMigrationRunner
│   ├── 기존 테이블 보정
│   └── 기능 테이블 자동 생성
└── WebConfig
    └── CORS 설정 (FrontEnd URL 허용)
```

### `com.yorizori.recipe`

**역할**: 레시피 검색, 조회, 수집

```
recipe/
├── web/
│   ├── RecipeController
│   │   ├── GET /api/v1/recipes
│   │   ├── GET /api/v1/recipes/{id}
│   │   └── POST /api/v1/recommend
│   ├── RecipeIngestController (Admin)
│   │   └── POST /api/v1/admin/ingest/recipes
│   └── ApiExceptionHandler
├── service/
│   ├── RecipeQueryService
│   │   ├── searchRecipes(query, ingredients)
│   │   ├── getRecipeById(id)
│   │   └── recommendRecipes(userPantry)
│   └── RecipeIngestService
│       ├── ingestRecipes(startIdx, endIdx)
│       └── parseAndSaveRecipes(xmlData)
├── repository/
│   ├── RecipeQueryRepository
│   │   ├── findAll(limit, offset)
│   │   ├── findById(id)
│   │   ├── search(query)
│   │   └── findByIngredients(ingredients)
│   └── RecipeIngestRepository
│       ├── saveRecipe(recipe)
│       ├── saveIngredients(ingredients)
│       └── saveRecipeSteps(steps)
└── dto/
    ├── RecipeDto
    ├── IngredientDto
    ├── RecipeStepDto
    └── NutritionDto
```

### `com.yorizori.feature`

**역할**: 냉장고, 기피재료, 영양, 장보기 등

```
feature/
├── AppFeatureController
│   ├── Pantry APIs (냉장고 관리)
│   ├── Nutrition APIs (영양 로그)
│   ├── Shopping APIs (장보기)
│   ├── Favorites APIs (즐겨찾기)
│   ├── Seasonal APIs (제철 식재료)
│   └── Custom Food APIs (커스텀 푸드)
├── AppFeatureService
│   ├── 추천 매칭 로직
│   ├── 부족 재료 계산
│   ├── 영양 요약 생성
│   └── 장보기 목록 생성
├── AppFeatureRepository
│   ├── Pantry CRUD
│   ├── Nutrition CRUD
│   ├── Shopping CRUD
│   └── Custom Food CRUD
└── dto/
    ├── PantryItemDto
    ├── NutritionLogDto
    ├── ShoppingItemDto
    └── CustomFoodDto
```

### `com.yorizori.foodapi`

**역할**: 식품의약품안전처 OpenAPI 연동

```
foodapi/
├── FoodApiClient
│   └── fetchRecipes(startIdx, endIdx)
├── FoodApiProperties
│   └── api.key, api.endpoint 바인딩
├── FoodApiFetchResult
│   └── 원문 응답 + 파싱 결과
└── FoodApiParseException
    └── XML 파싱 실패 처리
```

---

## 🌐 API 통신 흐름

### 1. 로그인 흐름

```
┌─────────┐
│FrontEnd │
└────┬────┘
     │ POST /api/v1/auth/login
     │ { email, password }
     ↓
┌─────────────────────────────────────┐
│ AuthController.login()              │
└────┬────────────────────────────────┘
     │
     ↓
┌─────────────────────────────────────┐
│ AuthService.login()                 │
│ 1. 사용자 조회                      │
│ 2. 비밀번호 검증                    │
│ 3. JWT 토큰 생성                    │
└────┬────────────────────────────────┘
     │
     ↓
┌─────────────────────────────────────┐
│ { accessToken, refreshToken }       │
│ HTTP 200                            │
└────┬────────────────────────────────┘
     │
     ↓
┌─────────┐
│FrontEnd │ (Token 저장)
└─────────┘
```

### 2. 레시피 검색 흐름

```
┌──────────┐
│FrontEnd  │
└────┬─────┘
     │ GET /api/v1/recipes?query=파스타&ingredients=토마토
     │ Authorization: Bearer <accessToken>
     ↓
┌──────────────────────────────────────┐
│ RecipeController.searchRecipes()    │
└────┬─────────────────────────────────┘
     │
     ↓
┌──────────────────────────────────────┐
│ RecipeQueryService.searchRecipes()  │
└────┬─────────────────────────────────┘
     │
     ↓
┌──────────────────────────────────────┐
│ RecipeQueryRepository.search()       │
│ SQL: SELECT * FROM recipes          │
│ WHERE name LIKE ? AND ...            │
└────┬─────────────────────────────────┘
     │
     ↓
┌──────────────────────────────────────┐
│ MySQL (recipes table)               │
└────┬─────────────────────────────────┘
     │ 결과 반환
     ↓
┌──────────────────────────────────────┐
│ [ RecipeDto, RecipeDto, ... ]        │
│ HTTP 200                            │
└────┬─────────────────────────────────┘
     │
     ↓
┌──────────┐
│FrontEnd  │ (화면 렌더링)
└──────────┘
```

### 3. 냉장고 기반 추천 흐름

```
┌──────────┐
│FrontEnd  │
└────┬─────┘
     │ POST /api/v1/recommend
     │ { pantryItems: [...] }
     │ Authorization: Bearer <accessToken>
     ↓
┌──────────────────────────────────────┐
│AppFeatureController.recommend()    │
└────┬─────────────────────────────────┘
     │
     ↓
┌──────────────────────────────────────┐
│AppFeatureService.recommend()        │
│ 1. 사용자 냉장고 조회                │
│ 2. 가능한 레시피 매칭                │
│ 3. 우선순위 정렬                     │
└────┬─────────────────────────────────┘
     │
     ↓
┌──────────────────────────────────────┐
│RecipeQueryRepository                │
│.findByIngredients(pantryItems)      │
└────┬─────────────────────────────────┘
     │
     ↓
┌──────────────────────────────────────┐
│MySQL (complex JOIN query)           │
│recipes, recipe_ingredients,         │
│ingredients 테이블 결합               │
└────┬─────────────────────────────────┘
     │
     ↓
┌──────────────────────────────────────┐
│[ RecipeDto, ... ]                   │
│HTTP 200                             │
└────┬─────────────────────────────────┘
     │
     ↓
┌──────────┐
│FrontEnd  │ (추천 목록 표시)
└──────────┘
```

---

## 🔐 인증 흐름

### JWT 토큰 구조

```
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "userId": 123,
  "iat": 1234567890,
  "exp": 1234569690  // 15분
}

Signature: HMAC-SHA256(
  base64(header) + "." + base64(payload),
  JWT_SECRET
)
```

### 요청 시 인증 검증

```
1. FrontEnd가 Authorization 헤더에 Bearer 토큰 포함
   GET /api/v1/recipes
   Authorization: Bearer eyJhbGc...

2. BackEnd AuthSupport.extractUserId() 호출
   - Authorization 헤더 파싱
   - Bearer 토큰 추출
   - JwtTokenProvider.validateToken() 검증
   - userId 추출

3. Controller에서 userId 사용
   @GetMapping("/recipes")
   public List<Recipe> getRecipes(
       @RequestHeader("Authorization") String token
   ) {
       Long userId = AuthSupport.extractUserId(token);
       // ...
   }
```

---

## 📊 데이터베이스 관계도

```
users
├─ id (PK)
├─ email (UNIQUE)
├─ name
└─ password_hash

recipes
├─ id (PK)
├─ name
├─ image_url
└─ nutrition_info (JSON)

recipe_ingredients (JOIN)
├─ id (PK)
├─ recipe_id (FK)
└─ ingredient_id (FK)

ingredients
├─ id (PK)
└─ name

recipe_steps
├─ id (PK)
├─ recipe_id (FK)
├─ step_order
└─ instruction

pantry_items (사용자별)
├─ id (PK)
├─ user_id (FK)
├─ ingredient_id (FK)
├─ quantity
└─ expiry_date

nutrition_logs
├─ id (PK)
├─ user_id (FK)
├─ recipe_id (FK)
├─ log_date
└─ serving_size

shopping_items
├─ id (PK)
├─ user_id (FK)
├─ ingredient_id (FK)
└─ created_date

custom_foods
├─ id (PK)
├─ user_id (FK)
├─ name
├─ nutrition_info
└─ created_date
```

---

## 🔄 배포 아키텍처

### 개발 환경

```
Local Machine
├─ BackEnd: localhost:8080
├─ FrontEnd: localhost:5173 (Vite) / localhost:19000 (Expo)
└─ MySQL: localhost:3306
```

### 클라우드 환경 (권장)

```
Google Cloud Platform
├─ Cloud Run
│  └─ BackEnd (Spring Boot Container)
├─ Firebase Hosting
│  └─ FrontEnd (React/Expo Web Build)
└─ Cloud SQL
   └─ MySQL 8.x (Managed)
```

---

## 🎯 확장성 고려사항

### 수평 확장 (Horizontal Scaling)

- BackEnd: Cloud Run의 자동 스케일링
- FrontEnd: CDN (Firebase Hosting)
- DB: Cloud SQL 읽기 복제본 (Read Replica)

### 캐싱 전략

- BackEnd: Redis (추천 결과, 자주 조회하는 레시피)
- FrontEnd: 브라우저 로컬 스토리지 (사용자 세션)

### 비동기 처리

- 대량 레시피 수집: Cloud Tasks / Cloud Pub/Sub
- 이메일 알림: Cloud Functions

---

## 📝 보안 계층

```
┌─────────────────────────────────────┐
│ HTTPS (TLS/SSL)                     │
├─────────────────────────────────────┤
│ CORS 필터 (WebConfig)               │
├─────────────────────────────────────┤
│ JWT 인증 필터                       │
├─────────────────────────────────────┤
│ 비밀번호 해싱 (PBKDF2)              │
├─────────────────────────────────────┤
│ 환경변수 분리 (.env)                │
├─────────────────────────────────────┤
│ 데이터베이스 암호화                 │
└─────────────────────────────────────┘
```

---

**마지막 업데이트**: 2026-06-09
