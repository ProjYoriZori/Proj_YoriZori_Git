# 데이터베이스 가이드

> **YoriZori의 데이터베이스 구조, 스키마, 관계도를 설명합니다.**

---

## 🏗️ 데이터베이스 개요

### 환경

- **DBMS**: MySQL 8.x
- **인코딩**: UTF-8MB4
- **Driver**: MySQL JDBC Driver
- **접근**: Spring JDBC (JdbcTemplate)
- **마이그레이션**: SchemaMigrationRunner (자동)

### 데이터베이스명

```
yorizori_DB
```

---

## 📊 핵심 테이블

### 1. `users` - 사용자

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

| 컬럼            | 타입         | 설명                   |
| --------------- | ------------ | ---------------------- |
| `id`            | BIGINT       | 사용자 ID (PK)         |
| `email`         | VARCHAR(255) | 이메일 (UNIQUE)        |
| `name`          | VARCHAR(255) | 사용자명               |
| `password_hash` | VARCHAR(255) | PBKDF2 해시된 비밀번호 |
| `created_at`    | TIMESTAMP    | 생성 일시              |
| `updated_at`    | TIMESTAMP    | 수정 일시              |

### 2. `recipes` - 레시피

```sql
CREATE TABLE recipes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  image_url VARCHAR(500),
  description TEXT,
  serving_size INT,
  cook_time INT,
  difficulty VARCHAR(50),
  nutrition_info JSON,
  source VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| 컬럼             | 타입         | 설명                                       |
| ---------------- | ------------ | ------------------------------------------ |
| `id`             | BIGINT       | 레시피 ID (PK)                             |
| `name`           | VARCHAR(255) | 레시피 이름                                |
| `image_url`      | VARCHAR(500) | 레시피 이미지 URL                          |
| `description`    | TEXT         | 설명                                       |
| `serving_size`   | INT          | 기본 인분                                  |
| `cook_time`      | INT          | 조리 시간 (분)                             |
| `difficulty`     | VARCHAR(50)  | 난이도 (상/중/하)                          |
| `nutrition_info` | JSON         | 영양정보 ({calories, protein, fat, carbs}) |
| `source`         | VARCHAR(255) | 출처 (식약처, 사용자 등)                   |
| `created_at`     | TIMESTAMP    | 생성 일시                                  |

### 3. `ingredients` - 식재료

```sql
CREATE TABLE ingredients (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| 컬럼         | 타입         | 설명                           |
| ------------ | ------------ | ------------------------------ |
| `id`         | BIGINT       | 식재료 ID (PK)                 |
| `name`       | VARCHAR(255) | 식재료명 (UNIQUE)              |
| `category`   | VARCHAR(100) | 카테고리 (야채, 과일, 육류 등) |
| `image_url`  | VARCHAR(500) | 이미지 URL                     |
| `created_at` | TIMESTAMP    | 생성 일시                      |

### 4. `recipe_ingredients` - 레시피-재료 매핑

```sql
CREATE TABLE recipe_ingredients (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  recipe_id BIGINT NOT NULL,
  ingredient_id BIGINT NOT NULL,
  quantity VARCHAR(100),
  unit VARCHAR(50),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
  UNIQUE KEY unique_recipe_ingredient (recipe_id, ingredient_id)
);
```

| 컬럼            | 타입         | 설명                          |
| --------------- | ------------ | ----------------------------- |
| `id`            | BIGINT       | ID (PK)                       |
| `recipe_id`     | BIGINT       | 레시피 ID (FK)                |
| `ingredient_id` | BIGINT       | 식재료 ID (FK)                |
| `quantity`      | VARCHAR(100) | 수량 (예: "2", "1/2")         |
| `unit`          | VARCHAR(50)  | 단위 (예: "개", "컵", "스푼") |

### 5. `recipe_steps` - 조리 단계

```sql
CREATE TABLE recipe_steps (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  recipe_id BIGINT NOT NULL,
  step_order INT NOT NULL,
  instruction TEXT NOT NULL,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);
```

| 컬럼          | 타입         | 설명            |
| ------------- | ------------ | --------------- |
| `id`          | BIGINT       | ID (PK)         |
| `recipe_id`   | BIGINT       | 레시피 ID (FK)  |
| `step_order`  | INT          | 단계 순서       |
| `instruction` | TEXT         | 조리 지침       |
| `image_url`   | VARCHAR(500) | 단계 이미지 URL |
| `created_at`  | TIMESTAMP    | 생성 일시       |

---

## 🛒 기능 테이블

### 6. `pantry_items` - 냉장고 식재료

```sql
CREATE TABLE pantry_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  ingredient_id BIGINT NOT NULL,
  quantity INT,
  unit VARCHAR(50),
  expiry_date DATE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);
```

| 컬럼            | 타입        | 설명           |
| --------------- | ----------- | -------------- |
| `user_id`       | BIGINT      | 사용자 ID (FK) |
| `ingredient_id` | BIGINT      | 식재료 ID (FK) |
| `quantity`      | INT         | 수량           |
| `unit`          | VARCHAR(50) | 단위           |
| `expiry_date`   | DATE        | 유효기간       |
| `added_at`      | TIMESTAMP   | 추가 일시      |

### 7. `avoid_ingredients` - 기피 재료

```sql
CREATE TABLE avoid_ingredients (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  ingredient_id BIGINT NOT NULL,
  reason VARCHAR(255),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_avoid_ingredient (user_id, ingredient_id)
);
```

| 컬럼            | 타입         | 설명                            |
| --------------- | ------------ | ------------------------------- |
| `user_id`       | BIGINT       | 사용자 ID (FK)                  |
| `ingredient_id` | BIGINT       | 기피 재료 ID (FK)               |
| `reason`        | VARCHAR(255) | 기피 사유 (알레르기, 싫어함 등) |
| `added_at`      | TIMESTAMP    | 추가 일시                       |

### 8. `nutrition_logs` - 영양 로그

```sql
CREATE TABLE nutrition_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  recipe_id BIGINT,
  log_date DATE NOT NULL,
  serving_size DECIMAL(5,2),
  calories INT,
  protein INT,
  fat INT,
  carbs INT,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);
```

| 컬럼           | 타입      | 설명                                     |
| -------------- | --------- | ---------------------------------------- |
| `user_id`      | BIGINT    | 사용자 ID (FK)                           |
| `recipe_id`    | BIGINT    | 레시피 ID (FK) (NULL 가능 - 커스텀 음식) |
| `log_date`     | DATE      | 섭취 날짜                                |
| `serving_size` | DECIMAL   | 인분 (예: 1.5)                           |
| `calories`     | INT       | 칼로리                                   |
| `protein`      | INT       | 단백질 (g)                               |
| `fat`          | INT       | 지방 (g)                                 |
| `carbs`        | INT       | 탄수화물 (g)                             |
| `logged_at`    | TIMESTAMP | 기록 일시                                |

### 9. `shopping_items` - 장보기 목록

```sql
CREATE TABLE shopping_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  ingredient_id BIGINT NOT NULL,
  quantity INT,
  unit VARCHAR(50),
  is_purchased BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  purchased_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);
```

| 컬럼            | 타입        | 설명           |
| --------------- | ----------- | -------------- |
| `user_id`       | BIGINT      | 사용자 ID (FK) |
| `ingredient_id` | BIGINT      | 식재료 ID (FK) |
| `quantity`      | INT         | 수량           |
| `unit`          | VARCHAR(50) | 단위           |
| `is_purchased`  | BOOLEAN     | 구매 여부      |
| `created_at`    | TIMESTAMP   | 생성 일시      |
| `purchased_at`  | TIMESTAMP   | 구매 일시      |

### 10. `favorites` - 즐겨찾기

```sql
CREATE TABLE favorites (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  recipe_id BIGINT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_recipe (user_id, recipe_id)
);
```

### 11. `seasonal_ingredients` - 제철 식재료

```sql
CREATE TABLE seasonal_ingredients (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ingredient_id BIGINT NOT NULL,
  month_start INT NOT NULL,      -- 1-12
  month_end INT NOT NULL,        -- 1-12
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);
```

### 12. `custom_foods` - 커스텀 음식

```sql
CREATE TABLE custom_foods (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  calories INT,
  protein INT,
  fat INT,
  carbs INT,
  serving_size INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔗 관계도 (Entity Relationship Diagram)

```
users (1)
  ├─ (N) pantry_items ─ (N) ingredients
  ├─ (N) avoid_ingredients ─ (N) ingredients
  ├─ (N) nutrition_logs ─ (N) recipes
  ├─ (N) shopping_items ─ (N) ingredients
  ├─ (N) favorites ─ (N) recipes
  └─ (N) custom_foods

recipes (1)
  ├─ (N) recipe_ingredients ─ (N) ingredients
  └─ (N) recipe_steps

ingredients (1)
  ├─ (N) recipe_ingredients ─ (N) recipes
  ├─ (N) pantry_items ─ (N) users
  ├─ (N) avoid_ingredients ─ (N) users
  ├─ (N) shopping_items ─ (N) users
  └─ (N) seasonal_ingredients
```

---

## 📈 인덱싱 전략

### 기본 인덱스

```sql
-- 사용자 조회
CREATE INDEX idx_users_email ON users(email);

-- 레시피 검색
CREATE INDEX idx_recipes_name ON recipes(name);

-- 식재료 조회
CREATE INDEX idx_ingredients_name ON ingredients(name);

-- 냉장고 조회 (사용자별)
CREATE INDEX idx_pantry_items_user_id ON pantry_items(user_id);

-- 영양 로그 (사용자 + 날짜)
CREATE INDEX idx_nutrition_logs_user_date ON nutrition_logs(user_id, log_date);

-- 즐겨찾기 (사용자별)
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
```

### 복합 인덱스 (성능 최적화)

```sql
-- 냉장고 + 식재료 조회
CREATE INDEX idx_pantry_ingredient ON pantry_items(user_id, ingredient_id);

-- 기피 재료 조회
CREATE INDEX idx_avoid_ingredient ON avoid_ingredients(user_id, ingredient_id);

-- 조리 단계 정렬
CREATE INDEX idx_recipe_steps_order ON recipe_steps(recipe_id, step_order);
```

---

## 🔄 트랜잭션 처리

### 추천 레시피 쿼리

사용자 냉장고의 식재료로 만들 수 있는 레시피를 추천합니다.

```sql
-- 1단계: 사용자 냉장고의 식재료 조회
SELECT ingredient_id FROM pantry_items
WHERE user_id = ? AND expiry_date > NOW();

-- 2단계: 해당 식재료로 만들 수 있는 레시피 조회
SELECT DISTINCT r.* FROM recipes r
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
WHERE ri.ingredient_id IN (...)  -- 1단계 결과
ORDER BY r.created_at DESC
LIMIT 20;
```

### 영양 일일 요약

```sql
-- 특정 날짜의 일일 영양 요약
SELECT
  SUM(calories) as total_calories,
  SUM(protein) as total_protein,
  SUM(fat) as total_fat,
  SUM(carbs) as total_carbs
FROM nutrition_logs
WHERE user_id = ? AND log_date = ?;
```

### 장보기 목록 생성

```sql
-- 1단계: 냉장고의 식재료로 만들 수 있는 레시피 중 상위 10개 추천
SELECT DISTINCT ri.ingredient_id
FROM recipes r
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
WHERE r.id IN (
  -- 추천 레시피 ID 리스트
)
AND ri.ingredient_id NOT IN (
  SELECT ingredient_id FROM pantry_items WHERE user_id = ?
)
AND ri.ingredient_id NOT IN (
  SELECT ingredient_id FROM avoid_ingredients WHERE user_id = ?
);

-- 2단계: 위 식재료들을 shopping_items에 추가
INSERT INTO shopping_items (user_id, ingredient_id, quantity, unit)
VALUES (?, ?, 1, '개');
```

---

## 🔒 데이터 보안

### 비밀번호 저장 (PBKDF2)

```
password_hash VARCHAR(255) NOT NULL
```

- 평문 저장 금지 ❌
- PBKDF2-HMAC-SHA256 사용 ✅
- Salt 포함 ✅

### 민감한 데이터

```sql
-- JWT 토큰은 DB에 저장하지 않음 (stateless)
-- .env 파일의 환경변수로 관리
-- 프로덕션에서는 AWS Secrets Manager, GCP Secret Manager 사용
```

---

## 📝 마이그레이션 (SchemaMigrationRunner)

### 자동 마이그레이션 프로세스

```java
// BackEnd 시작 시 자동 실행
@Component
public class SchemaMigrationRunner {
    public void run() {
        // 1. 핵심 테이블 존재 확인
        if (!tableExists("recipes")) {
            // 레시피 테이블 생성
        }

        // 2. 기능 테이블 확인 & 생성
        if (!tableExists("pantry_items")) {
            // 냉장고 테이블 생성
        }

        // 3. 인덱스 생성
        createIndexIfNotExists(...);
    }
}
```

### 수동 마이그레이션

```powershell
mysql -u root -p yorizori_DB < db/schema.sql
```

---

## 📊 쿼리 성능 최적화

### 분석 쿼리 (EXPLAIN)

```sql
-- 쿼리 실행 계획 확인
EXPLAIN SELECT * FROM recipes WHERE name LIKE '%파스타%';

-- 인덱스 효율성 확인
EXPLAIN SELECT * FROM pantry_items WHERE user_id = 1;
```

### 느린 쿼리 로깅

```sql
-- MySQL 설정
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
```

---

## 🔍 데이터베이스 관리 명령어

### MySQL 접속

```powershell
mysql -h localhost -u root -p yorizori_DB
```

### 테이블 확인

```sql
SHOW TABLES;
DESC recipes;
SHOW INDEX FROM recipes;
```

### 데이터 조회

```sql
SELECT COUNT(*) FROM recipes;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM pantry_items;
```

### 테이블 유지보수

```sql
-- 테이블 최적화
OPTIMIZE TABLE recipes;

-- 테이블 통계 업데이트
ANALYZE TABLE recipes;
```

---

## 🗑️ 데이터 삭제 정책

### 종속 데이터 자동 삭제

```sql
-- ON DELETE CASCADE 설정
FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
```

**효과**:

- 사용자 삭제 → 냉장고, 영양로그, 즐겨찾기 자동 삭제
- 레시피 삭제 → 조리단계, 추천 기록 자동 삭제
- 식재료 삭제 → 냉장고, 기피재료, 장보기 자동 삭제

---

**마지막 업데이트**: 2026-06-09
