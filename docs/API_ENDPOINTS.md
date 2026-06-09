# API 엔드포인트 레퍼런스

> **YoriZori BackEnd REST API 전체 엔드포인트 목록 및 사용법입니다.**

---

## 📡 기본 정보

### Base URL

```
http://localhost:8080/api/v1
```

### 인증

모든 엔드포인트 (회원가입, 로그인 제외)는 Bearer Token 필요:

```
Authorization: Bearer <accessToken>
```

### 응답 포맷

**성공 (200 OK)**

```json
{
  "success": true,
  "data": {
    /* 응답 데이터 */
  }
}
```

**에러 (4xx, 5xx)**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

---

## 🔐 인증 (Auth)

### 회원가입

```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "사용자이름"
}
```

**응답**

```json
{
  "userId": 1,
  "email": "user@example.com",
  "name": "사용자이름",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900
}
```

**에러**

- `400`: 잘못된 입력 (이메일 형식, 비밀번호 길이)
- `409`: 이미 가입된 이메일

---

### 로그인

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**응답**

```json
{
  "userId": 1,
  "email": "user@example.com",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900
}
```

**에러**

- `401`: 이메일 또는 비밀번호 오류
- `404`: 가입되지 않은 사용자

---

### 토큰 갱신

```http
POST /auth/refresh
Content-Type: application/json
Authorization: Bearer <refreshToken>

{
  "refreshToken": "eyJhbGc..."
}
```

**응답**

```json
{
  "accessToken": "eyJhbGc...",
  "expiresIn": 900
}
```

**에러**

- `401`: 무효한 Refresh Token
- `403`: 토큰 만료

---

### 프로필 조회

```http
GET /me
Authorization: Bearer <accessToken>
```

**응답**

```json
{
  "userId": 1,
  "email": "user@example.com",
  "name": "사용자이름",
  "createdAt": "2026-06-01T10:00:00Z"
}
```

---

### 프로필 수정

```http
PATCH /me
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "name": "새로운이름"
}
```

---

## 🍽️ 레시피 (Recipe)

### 레시피 목록 조회

```http
GET /recipes?limit=50&offset=0&query=파스타&ingredients=토마토,마늘
Authorization: Bearer <accessToken>
```

**쿼리 파라미터**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `limit` | int | 페이지 크기 (기본값: 50) |
| `offset` | int | 오프셋 (기본값: 0) |
| `query` | string | 검색 키워드 |
| `ingredients` | string | 식재료 (쉼표로 구분) |

**응답**

```json
{
  "recipes": [
    {
      "id": 1,
      "name": "토마토 파스타",
      "imageUrl": "https://...",
      "servingSize": 2,
      "cookTime": 20,
      "difficulty": "중",
      "nutrition": {
        "calories": 450,
        "protein": 15,
        "fat": 10,
        "carbs": 60
      }
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

---

### 레시피 상세 조회

```http
GET /recipes/{id}
Authorization: Bearer <accessToken>
```

**응답**

```json
{
  "id": 1,
  "name": "토마토 파스타",
  "imageUrl": "https://...",
  "description": "신선한 토마토로 만든...",
  "servingSize": 2,
  "cookTime": 20,
  "difficulty": "중",
  "nutrition": {
    /* ... */
  },
  "ingredients": [
    {
      "id": 10,
      "name": "토마토",
      "quantity": 3,
      "unit": "개"
    }
  ],
  "steps": [
    {
      "stepOrder": 1,
      "instruction": "토마토를 씻어서 자른다",
      "imageUrl": "https://..."
    }
  ]
}
```

---

### 레시피 추천

```http
POST /recommend
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "ingredients": ["토마토", "마늘", "올리브유"]
}
```

**응답**

```json
{
  "recommendations": [
    {
      "id": 1,
      "name": "토마토 파스타",
      "score": 95,
      "matchedIngredients": ["토마토", "마늘", "올리브유"],
      "missingIngredients": ["파스타", "소금"]
    }
  ]
}
```

---

## ❄️ 냉장고 (Pantry)

### 냉장고 식재료 목록

```http
GET /pantry-items
Authorization: Bearer <accessToken>
```

**응답**

```json
{
  "items": [
    {
      "id": 1,
      "ingredientId": 10,
      "name": "토마토",
      "quantity": 5,
      "unit": "개",
      "expiryDate": "2026-06-15"
    }
  ]
}
```

---

### 냉장고에 식재료 추가

```http
POST /pantry-items
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "ingredientId": 10,
  "quantity": 5,
  "unit": "개",
  "expiryDate": "2026-06-15"
}
```

**또는 식재료명으로 추가**

```json
{
  "ingredientName": "토마토",
  "quantity": 5,
  "unit": "개",
  "expiryDate": "2026-06-15"
}
```

---

### 냉장고 식재료 삭제

```http
DELETE /pantry-items/{id}
Authorization: Bearer <accessToken>
```

---

### 냉장고 식재료 수량 수정

```http
PATCH /pantry-items/{id}
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "quantity": 3
}
```

---

## 🚫 기피 재료 (Avoid Ingredients)

### 기피 재료 목록

```http
GET /avoid-ingredients
Authorization: Bearer <accessToken>
```

---

### 기피 재료 추가

```http
POST /avoid-ingredients
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "ingredientId": 20,
  "reason": "알레르기"
}
```

---

### 기피 재료 삭제

```http
DELETE /avoid-ingredients/{id}
Authorization: Bearer <accessToken>
```

---

## 📊 영양 (Nutrition)

### 영양 로그 기록

```http
POST /nutrition-logs
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "recipeId": 1,
  "date": "2026-06-09",
  "servingSize": 1.5
}
```

---

### 일일 영양 요약

```http
GET /nutrition/daily-summary?date=2026-06-09
Authorization: Bearer <accessToken>
```

**응답**

```json
{
  "date": "2026-06-09",
  "meals": [
    {
      "recipeId": 1,
      "name": "토마토 파스타",
      "servingSize": 1.5,
      "nutrition": {
        "calories": 675,
        "protein": 22.5,
        "fat": 15,
        "carbs": 90
      }
    }
  ],
  "summary": {
    "totalCalories": 1800,
    "totalProtein": 55,
    "totalFat": 50,
    "totalCarbs": 220
  },
  "recommendations": {
    "caloriesRemaining": 200,
    "proteinGap": -5
  }
}
```

---

### 영양 로그 조회

```http
GET /nutrition-logs?startDate=2026-06-01&endDate=2026-06-09
Authorization: Bearer <accessToken>
```

---

## 🛒 장보기 (Shopping)

### 부족 재료 감지 & 장보기 목록 생성

```http
POST /shopping-items/generate
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "recipeIds": [1, 2, 3]  // 만들고 싶은 레시피들
}
```

**응답**

```json
{
  "shoppingItems": [
    {
      "id": 1,
      "ingredientId": 15,
      "name": "파스타",
      "quantity": 500,
      "unit": "g",
      "isPurchased": false
    }
  ],
  "summary": {
    "totalItems": 8,
    "purchasedItems": 0,
    "remainingItems": 8
  }
}
```

---

### 장보기 목록 조회

```http
GET /shopping-items
Authorization: Bearer <accessToken>
```

---

### 구매 완료 표시

```http
PATCH /shopping-items/{id}
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "isPurchased": true
}
```

---

### 장보기 항목 삭제

```http
DELETE /shopping-items/{id}
Authorization: Bearer <accessToken>
```

---

## ⭐ 즐겨찾기 (Favorites)

### 즐겨찾기 목록

```http
GET /favorites
Authorization: Bearer <accessToken>
```

---

### 즐겨찾기 추가

```http
POST /favorites/{recipeId}
Authorization: Bearer <accessToken>
```

---

### 즐겨찾기 제거

```http
DELETE /favorites/{recipeId}
Authorization: Bearer <accessToken>
```

---

## 🍃 제철 식재료 (Seasonal)

### 제철 식재료 조회

```http
GET /seasonal-ingredients?month=6
Authorization: Bearer <accessToken>
```

**쿼리 파라미터**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `month` | int | 월 (1-12, 기본값: 현재월) |

**응답**

```json
{
  "month": 6,
  "ingredients": [
    {
      "id": 5,
      "name": "오이",
      "imageUrl": "https://...",
      "category": "야채"
    }
  ]
}
```

---

## 🥘 커스텀 음식 (Custom Foods)

### 커스텀 음식 목록

```http
GET /custom-foods
Authorization: Bearer <accessToken>
```

---

### 커스텀 음식 생성

```http
POST /custom-foods
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "name": "내가 만든 카레",
  "calories": 500,
  "protein": 20,
  "fat": 15,
  "carbs": 60,
  "servingSize": 1
}
```

---

### 커스텀 음식 수정

```http
PATCH /custom-foods/{id}
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "calories": 520
}
```

---

### 커스텀 음식 삭제

```http
DELETE /custom-foods/{id}
Authorization: Bearer <accessToken>
```

---

## 👨‍💼 관리자 (Admin)

### 레시피 수집 (식약처 API)

```http
POST /admin/ingest/recipes?startIdx=1&endIdx=100
Authorization: Bearer <adminToken>
```

**쿼리 파라미터**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `startIdx` | int | 시작 인덱스 (1부터) |
| `endIdx` | int | 끝 인덱스 (포함) |

**응답**

```json
{
  "ingestJobId": "job-123",
  "status": "in_progress",
  "totalRecipes": 100,
  "ingestedRecipes": 45,
  "failedRecipes": 2,
  "startedAt": "2026-06-09T10:00:00Z"
}
```

---

## 📝 에러 코드

| 코드  | 설명                      |
| ----- | ------------------------- |
| `400` | Bad Request (잘못된 요청) |
| `401` | Unauthorized (미인증)     |
| `403` | Forbidden (권한 없음)     |
| `404` | Not Found (리소스 없음)   |
| `409` | Conflict (중복)           |
| `500` | Internal Server Error     |

---

## 🧪 cURL 예제

### 회원가입

```bash
curl -X POST http://localhost:8080/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","name":"테스트"}'
```

### 로그인

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'
```

### 인증된 요청 (레시피 조회)

```bash
curl -X GET "http://localhost:8080/api/v1/recipes?limit=10" \
  -H "Authorization: Bearer <accessToken>"
```

### 냉장고에 식재료 추가

```bash
curl -X POST http://localhost:8080/api/v1/pantry-items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"ingredientName":"토마토","quantity":5,"unit":"개","expiryDate":"2026-06-15"}'
```

---

**마지막 업데이트**: 2026-06-09
