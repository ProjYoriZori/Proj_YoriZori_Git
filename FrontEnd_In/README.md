[프론트 실행]

이 프로젝트는 React Native + Expo SDK 54 프론트 앱으로 정리되어 있습니다. 백엔드가 아직 준비되지 않았거나 `EXPO_PUBLIC_API_BASE_URL`이 없으면 앱은 목업 데이터로 먼저 실행됩니다.

```bash
npm install
npm start
```

백엔드와 연결할 때는 `.env`에 아래처럼 API 주소를 넣습니다. `/api/v1`까지 포함해 주세요.

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

[백엔드 API 규약]
- Base URL: `EXPO_PUBLIC_API_BASE_URL` (예: http://localhost:8080/api/v1)
- 요청/응답: JSON (`Content-Type: application/json`)
- 리스트 응답: 배열 또는 `{ data | items | content: [] }` 형태 허용

[기능별 엔드포인트]
BE-A01   POST /api/v1/auth/signup               회원가입 + 프로필 생성
BE-A02   POST /api/v1/auth/login                로그인, JWT(JSON Web Token, 인증 토큰) 발급
BE-A03   POST /api/v1/auth/refresh              토큰 재발급
BE-A04   GET  /api/v1/recipes                   레시피 목록(검색·페이지네이션)
BE-A05   GET  /api/v1/recipes/{id}              레시피 상세 + (선택) 사용자 보유 재료 매칭 정보
BE-A06   GET  /api/v1/pantry-items              보유 식재료 목록
BE-A07   POST /api/v1/pantry-items              보유 식재료 추가
BE-A08   PATCH /api/v1/pantry-items/{id}        수정
BE-A09   DELETE /api/v1/pantry-items/{id}       삭제
BE-A10   GET·POST·DELETE /api/v1/avoid-ingredients   기피 식재료 CRUD
BE-A11   POST /api/v1/recommend                 보유 재료 + 기피 재료 기반 추천
BE-A12   POST /api/v1/shopping-items/generate   특정 레시피 기준 부족 재료 → 장보기 항목 생성
BE-A13   GET·PATCH /api/v1/shopping-items       장보기 목록 조회·체크 상태 변경
BE-A14   POST /api/v1/nutrition-logs            섭취 기록 추가(레시피·시간대·배수)
BE-A15   GET  /api/v1/nutrition/daily-summary   일일 영양 섭취·권장량 비교
BE-A16   GET·PATCH /api/v1/me                   프로필 조회·수정
BE-A17   POST·DELETE /api/v1/favorites          즐겨찾기 등록·해제
BE-A18   GET  /api/v1/seasonal-ingredients      제철 재료 목록
BE-A19   POST /api/v1/ocr/ingredients           이미지 → 재료명 추출
BE-A20   POST /api/v1/barcode/lookup            바코드 → 상품 정보 조회

[ 기능 사항 ]
-레시피 조회 및 열람 - 조리식품 레시피DB(기본DB) 식품의약품안전처
https://www.foodsafetykorea.go.kr/api/newUserApiAplcDtl.do?menu_grp=MENU_GRP32&menu_no=3995
-보유한 식재료 기반 레시피 서칭, 검색 키워드 기반 레시피 서칭
-1일 섭취량  확인 -보건복지부 1일 섭취량 데이터 사용 예정
성별,나이,키 / 체중, 목표(벌크업,다이어트)에 따른 유동적 제공
-내 보유 식재료/장바구니 기능 (레시피 조회 후 부족한 식재료 바탕으로 사야될 리스트 업하고 이후 쿠팡이나 온라인 결제 유도 예정)
-단계별 조리시간에 따른 타이머 (레시피 상세 페이지에 배치할거임)
-제철 식재료에 따른 레시피 추천 - 인터넷에서 데이터 끌어올 예정 (미진행)
-레시피 등록, 자주 먹는 식픔 등록 (새로운 레시피 등록 이외에도
초코바, 바나나 1개, 프로틴(3스푼+물300ml) 등
자주먹는 음식이나 식품을 영양성분과 함께 컴포넌트로 등록해놓을수 있다 
이로써 일일권장섭취량(DRI) 산정에 보다 쉽게 이바지가능)

[추가 구현하고 싶은 기능]
- 카메라를 이용한 상품의 영양성분표 분석, 영수증 분석
(Google ML Kit (Text Recognition) - OCR
expo-camera 라이브러리 사용 예정)
-커뮤니티를 살려서 당근처럼 남은 식재료를 되팔거나 나눔하는 기능 (추가 구현)
상품명, 구매일자, 구매 가격, 신선도, 사진, 희망판매가격 등의 정보와 함께 현재 내 위치정보와 함께 지도에 마킹을 한다
또한 내가 만든 음식을 다른 사람들과 나누고 즐길수도 있다
반경을 좁혀서 특정 원룸촌이나 학교 학생(학생 인증)으로 제한하면 수월해짐 




1. 홈 화면 
- 제철 식재료 추천배너
제철 식재료 배너를 클릭하면 제철 식재료 목록이 보인다. 그 식재료를 클릭하여 해당 식재료 기반 추천 레시피도 조회가능
- 보유 식재료 기반 추천 레시피 조회
(홈 화면에는 레시피 추천 기능만 있었으면 좋겠다. 이 어플의 주된  목적이 레시피 추천 / 부가기능은 다른 화면에서 보여주자) 
- 내 냉장고 카드(등록된 재료 개수 표시, 냉장고 보기 버튼으로 들어감) 아무 재료를 선택하지 않았을 때 홈 화면 문구 ‘냉장고에서 요리할 재료를 선택해 주세요’ 표시, 내 냉장고에서 재료 선택시 선택한 재료 카드를 홈 화면에 재료 카드 표시  
- 홈 화면 하단에 ‘레시피 확인하기’ 버튼으로 보유 식재료 기반 레시피 조회
- 내 보유 식재료 요약
- 오늘 섭취 영양성분 요약 (칼로리, 탄단지,나트륨)
- 하단 탭 네비게이션 -> 홈 / 2. 레시피 / 3. 장보기 / 4. 영양 / 5. 마이페이지

2. 레시피 화면
- 검색 창 (메뉴명)
- 식재료 키워드 기반 검색
- 총 칼로리 표시
- 부족 재료 개수 표시
- 일치하는 재료 표시


2.1. 레시피 상세 화면 (조회된 레시피 클릭시)
상단:
- 이미지
- 레시피명
- 칼로리/조리방법/카테고리 
영양 정보:
- 칼로리
- 탄수화물
- 단백질
- 지방
- 나트륨

재료:
- 내가 가진 재료
- 부족한 재료

조리 단계:
- 단계별 조리 과정 이미지와 함께 단계별 설명
- 조리단계 타이머 버튼: 터치로 끌어서 어디든 배치가능한 작은 동그라미 아이콘을 배치하고 그 아이콘을 눌렀을때 타이머가 나타나도록 하여 언제든 끄고 킬수 있다.

하단 버튼:
- 먹은 음식으로 기록하기
- 부족 재료 장보기에 추가


3. 장보기 화면
- 레시피 기준 부족 재료 자동 추가
- 직접 장보기 항목 추가
- 체크리스트 (체크 완료 시 냉장고에 동일 식재료가 없으면 추가하고, 이미 존재하면 중복 추가하지 않는다.)


4. 영양 화면

1) 날짜 선택 : 캘린더를 배치하여 날짜별 추적이 가능하다
   - 오늘 / 어제 / 특정 날짜

2) 해당 날짜 섭취 요약
   - 총 칼로리
   - 탄수화물
   - 단백질
   - 지방
   - 나트륨

3) 권장 섭취량 대비 비율
   - 칼로리 %
   - 탄수화물 %
   - 단백질 %
   - 지방 %
   - 나트륨 %

4) 해당 날짜 먹은 음식 목록

5. 마이페이지 / 프로필 화면 
 5.1 사용자 개인 정보
 5.2 사용자 신체 정보
- 성별
- 나이
- 키
- 체중
- 목표: 다이어트 / 유지 / 벌크업
- 활동량: 낮음 / 보통 / 높음
 

일정 



[레시피 db 응답 파라미터] 
1	RCP_SEQ	일련번호
2	RCP_NM	메뉴명
3	RCP_WAY2	조리방법
4	RCP_PAT2	요리종류
5	INFO_WGT	중량(1인분)
6	INFO_ENG	열량
7	INFO_CAR	탄수화물
8	INFO_PRO	단백질
9	INFO_FAT	지방
10	INFO_NA	나트륨
11	HASH_TAG	해쉬태그
12	ATT_FILE_NO_MAIN	이미지경로(소)
13	ATT_FILE_NO_MK	이미지경로(대)
14	RCP_PARTS_DTLS	재료정보
15	MANUAL01	만드는법_01




[backend]
Java 17
Spring Boot 3
Gradle
Spring JDBC / JdbcTemplate
MySQL 8.0
Google Cloud SQL
Cloud SQL Auth Proxy

[DB 스키마 구조]

DROP DATABASE IF EXISTS yorijori;

CREATE DATABASE yorijori
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE yorijori;

-- =========================================================
-- 1. users
-- 사용자 기본 정보
-- =========================================================

CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NULL,
    nickname VARCHAR(50) NULL,
    provider VARCHAR(30) NULL,
    provider_user_id VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_provider_user (provider, provider_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 2. user_profiles
-- 마이페이지 / 프로필 화면
-- 성별, 나이, 키, 체중, 목표, 활동량
-- =========================================================

CREATE TABLE user_profiles (
    profile_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,

    gender VARCHAR(10) NULL,
    age INT NULL,
    height_cm DECIMAL(5,2) NULL,
    weight_kg DECIMAL(5,2) NULL,

    goal_type VARCHAR(30) NULL,
    activity_level VARCHAR(20) NULL,

    target_calorie_kcal DECIMAL(8,2) NULL,
    target_carbohydrate_g DECIMAL(8,2) NULL,
    target_protein_g DECIMAL(8,2) NULL,
    target_fat_g DECIMAL(8,2) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,

    UNIQUE KEY uk_user_profiles_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 3. recipes
-- 공공데이터 기반 레시피 기본 정보
-- =========================================================

CREATE TABLE recipes (
    recipe_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    source VARCHAR(50) NOT NULL,
    source_recipe_id VARCHAR(100) NOT NULL,

    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NULL,

    cooking_time_min INT NULL,
    serving_size INT NULL,

    calorie_kcal DECIMAL(10,2) NULL,
    carbohydrate_g DECIMAL(10,2) NULL,
    protein_g DECIMAL(10,2) NULL,
    fat_g DECIMAL(10,2) NULL,
    sodium_mg DECIMAL(10,2) NULL,

    source_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_recipes_source_id (source, source_recipe_id),
    KEY idx_recipes_name (name),
    KEY idx_recipes_category (category),
    KEY idx_recipes_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 4. ingredients
-- 식재료 기본 정보 및 정규화명
-- =========================================================

CREATE TABLE ingredients (
    ingredient_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    normalized_name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NULL,
    default_unit VARCHAR(30) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_ingredients_normalized_name (normalized_name),
    KEY idx_ingredients_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 5. recipe_ingredients
-- 레시피와 식재료의 N:M 매핑 테이블
-- =========================================================

CREATE TABLE recipe_ingredients (
    recipe_ingredient_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    recipe_id BIGINT NOT NULL,
    ingredient_id BIGINT NOT NULL,

    original_name VARCHAR(150) NOT NULL,
    quantity DECIMAL(10,2) NULL,
    unit VARCHAR(30) NULL,
    amount_text VARCHAR(100) NULL,

    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_recipe_ingredients_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recipe_ingredients_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id)
        ON DELETE RESTRICT,

    UNIQUE KEY uk_recipe_ingredients_recipe_ingredient (recipe_id, ingredient_id),
    KEY idx_recipe_ingredients_recipe (recipe_id),
    KEY idx_recipe_ingredients_ingredient (ingredient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 6. recipe_steps
-- 레시피 조리 단계
-- =========================================================

CREATE TABLE recipe_steps (
    step_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    recipe_id BIGINT NOT NULL,
    step_no INT NOT NULL,
    instruction TEXT NOT NULL,

    duration_min INT NULL,
    image_url VARCHAR(500) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_recipe_steps_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
        ON DELETE CASCADE,

    UNIQUE KEY uk_recipe_steps_recipe_step (recipe_id, step_no),
    KEY idx_recipe_steps_recipe (recipe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 7. images
-- 레시피 이미지
-- =========================================================

CREATE TABLE images (
    image_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    recipe_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(30) NULL,
    sort_order INT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_images_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
        ON DELETE CASCADE,

    KEY idx_images_recipe (recipe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 8. pantry_items
-- 냉장고 / 내 보유 식재료
-- =========================================================

CREATE TABLE pantry_items (
    pantry_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,
    ingredient_id BIGINT NULL,

    ingredient_name VARCHAR(100) NOT NULL,
    normalized_name VARCHAR(100) NOT NULL,

    quantity DECIMAL(10,2) NULL,
    unit VARCHAR(30) NULL,

    expiry_date DATE NULL,
    purchase_date DATE NULL,
    storage_location VARCHAR(100) NULL,
    memo VARCHAR(255) NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_pantry_items_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_pantry_items_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id)
        ON DELETE SET NULL,

    KEY idx_pantry_items_user (user_id),
    KEY idx_pantry_items_user_ingredient (user_id, ingredient_id),
    KEY idx_pantry_items_normalized_name (normalized_name),
    KEY idx_pantry_items_expiry_date (expiry_date),
    KEY idx_pantry_items_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 9. avoid_ingredients
-- 기피 식재료 / 알레르기 / 제외 재료
-- =========================================================

CREATE TABLE avoid_ingredients (
    avoid_ingredient_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,
    ingredient_id BIGINT NULL,

    ingredient_name VARCHAR(100) NOT NULL,
    normalized_name VARCHAR(100) NOT NULL,

    reason_type VARCHAR(30) NULL,
    memo VARCHAR(255) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_avoid_ingredients_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_avoid_ingredients_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id)
        ON DELETE SET NULL,

    UNIQUE KEY uk_avoid_ingredients_user_name (user_id, normalized_name),
    KEY idx_avoid_ingredients_user (user_id),
    KEY idx_avoid_ingredients_ingredient (ingredient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 10. shopping_items
-- 장보기 목록
-- 레시피 기준 부족 재료 자동 추가 + 직접 추가
-- =========================================================

CREATE TABLE shopping_items (
    shopping_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,
    recipe_id BIGINT NULL,
    ingredient_id BIGINT NULL,

    item_name VARCHAR(100) NOT NULL,
    normalized_name VARCHAR(100) NULL,

    quantity DECIMAL(10,2) NULL,
    unit VARCHAR(30) NULL,

    is_checked BOOLEAN NOT NULL DEFAULT FALSE,
    source_type VARCHAR(30) NOT NULL DEFAULT 'RECIPE_MISSING',

    memo VARCHAR(255) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_shopping_items_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_shopping_items_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_shopping_items_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id)
        ON DELETE SET NULL,

    KEY idx_shopping_items_user (user_id),
    KEY idx_shopping_items_recipe (recipe_id),
    KEY idx_shopping_items_ingredient (ingredient_id),
    KEY idx_shopping_items_checked (is_checked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 11. nutrition_logs
-- 먹은 음식 기록 / 일일 영양 분석
-- =========================================================

CREATE TABLE nutrition_logs (
    nutrition_log_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,
    recipe_id BIGINT NULL,

    log_date DATE NOT NULL,
    meal_type VARCHAR(30) NULL,
    serving_count DECIMAL(5,2) NOT NULL DEFAULT 1.00,

    food_name VARCHAR(255) NOT NULL,

    calorie_kcal DECIMAL(10,2) NULL,
    carbohydrate_g DECIMAL(10,2) NULL,
    protein_g DECIMAL(10,2) NULL,
    fat_g DECIMAL(10,2) NULL,
    sodium_mg DECIMAL(10,2) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_nutrition_logs_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_nutrition_logs_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
        ON DELETE SET NULL,

    KEY idx_nutrition_logs_user_date (user_id, log_date),
    KEY idx_nutrition_logs_recipe (recipe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 12. nutrition_standards
-- 권장 섭취량 기준
-- 보건복지부 한국인 영양소 섭취기준 또는 공개 기준 데이터 저장
-- 실제 세부 기준 필드는 추후 데이터 확인 후 조정 가능
-- =========================================================

CREATE TABLE nutrition_standards (
    standard_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    source VARCHAR(100) NOT NULL,

    gender VARCHAR(10) NULL,
    age_min INT NULL,
    age_max INT NULL,

    goal_type VARCHAR(30) NULL,
    activity_level VARCHAR(20) NULL,

    calorie_kcal DECIMAL(10,2) NULL,
    carbohydrate_g DECIMAL(10,2) NULL,
    protein_g DECIMAL(10,2) NULL,
    fat_g DECIMAL(10,2) NULL,
    sodium_mg DECIMAL(10,2) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    KEY idx_nutrition_standards_gender_age (gender, age_min, age_max),
    KEY idx_nutrition_standards_goal (goal_type),
    KEY idx_nutrition_standards_activity (activity_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 13. seasonal_ingredients
-- 제철 식재료 추천
-- 홈 화면: 제철 식재료 추천
-- 클릭 시: 내 냉장고 식재료 + 제철 식재료로 레시피 추천
-- =========================================================

CREATE TABLE seasonal_ingredients (
    seasonal_ingredient_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    ingredient_id BIGINT NULL,

    name VARCHAR(100) NOT NULL,
    normalized_name VARCHAR(100) NOT NULL,

    season_name VARCHAR(20) NULL,
    month INT NOT NULL,

    description VARCHAR(255) NULL,
    source VARCHAR(100) NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_seasonal_ingredients_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id)
        ON DELETE SET NULL,

    UNIQUE KEY uk_seasonal_ingredients_name_month (normalized_name, month),
    KEY idx_seasonal_ingredients_month (month),
    KEY idx_seasonal_ingredients_name (normalized_name),
    KEY idx_seasonal_ingredients_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 14. feedback
-- 좋아요, 댓글, 메모장 등 확장 기능 대비
-- MVP 필수 기능은 아님
-- =========================================================

CREATE TABLE feedback (
    feedback_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,
    recipe_id BIGINT NOT NULL,

    rating INT NULL,
    is_liked BOOLEAN NOT NULL DEFAULT FALSE,

    comment TEXT NULL,
    memo TEXT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_feedback_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_feedback_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
        ON DELETE CASCADE,

    UNIQUE KEY uk_feedback_user_recipe (user_id, recipe_id),
    KEY idx_feedback_recipe (recipe_id),
    KEY idx_feedback_liked (is_liked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 15. ingest_jobs
-- OpenAPI 수집 작업 이력
-- API Key는 저장하지 않음
-- =========================================================

CREATE TABLE ingest_jobs (
    ingest_job_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    source VARCHAR(100) NOT NULL,
    job_type VARCHAR(50) NOT NULL,
    job_status VARCHAR(30) NOT NULL,

    request_endpoint VARCHAR(500) NULL,

    total_count INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    fail_count INT NOT NULL DEFAULT 0,

    started_at DATETIME NULL,
    finished_at DATETIME NULL,

    error_message TEXT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    KEY idx_ingest_jobs_source (source),
    KEY idx_ingest_jobs_status (job_status),
    KEY idx_ingest_jobs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 16. api_raw_responses
-- OpenAPI Raw JSON/XML 응답 저장
-- API Key는 저장하지 않음
-- =========================================================

CREATE TABLE api_raw_responses (
    raw_response_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    ingest_job_id BIGINT NOT NULL,

    source VARCHAR(100) NOT NULL,
    source_item_id VARCHAR(100) NULL,

    content_type VARCHAR(30) NOT NULL,
    response_body LONGTEXT NOT NULL,
    response_hash VARCHAR(64) NULL,

    fetched_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_api_raw_responses_ingest_job
        FOREIGN KEY (ingest_job_id) REFERENCES ingest_jobs(ingest_job_id)
        ON DELETE CASCADE,

    KEY idx_api_raw_responses_job (ingest_job_id),
    KEY idx_api_raw_responses_source_item (source, source_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 17. events
-- API 호출 로그, 성능 지표, 사용자 행동 로그
-- =========================================================

CREATE TABLE events (
    event_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NULL,

    event_type VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NULL,
    target_id BIGINT NULL,

    http_method VARCHAR(10) NULL,
    endpoint VARCHAR(500) NULL,
    status_code INT NULL,
    duration_ms INT NULL,

    message TEXT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_events_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE SET NULL,

    KEY idx_events_user (user_id),
    KEY idx_events_type (event_type),
    KEY idx_events_created_at (created_at),
    KEY idx_events_endpoint (endpoint)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
