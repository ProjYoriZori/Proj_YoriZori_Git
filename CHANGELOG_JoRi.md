# 요리조리 JoRi 브랜치 작업 내역

> 작업일: 2026-05-19  
> 브랜치: `JoRi`

---

## 1. 백엔드 실행 환경 설정

- `BackEnd/.env` 파일 생성 (Cloud SQL 연결 정보)
- Cloud SQL Auth Proxy (`cloud-sql-proxy.exe`) 로 Google Cloud SQL 연결
- `yorizori-495708:asia-northeast3:yorizori-db` 인스턴스 사용
- Windows 방화벽 8080 포트 오픈 (아이폰 접근용)

---

## 2. 백엔드 버그 수정

### `AppFeatureController.java` / `AppFeatureService.java`
- `deleteShoppingItem` 메서드 중복 정의 오류 제거 (컴파일 에러 수정)

---

## 3. 프론트엔드 — Safe Area / 레이아웃

### 탭바 (App.js)
- `position: absolute` 플로팅 탭바가 아이폰 홈 인디케이터에 가려지는 문제 수정
- `BottomTabBar` 컴포넌트에 `insets={{ bottom: 0 }}` 전달해 내부 이중 패딩 제거
- `useSafeAreaInsets`로 탭바 위치를 `bottom: 12 + insets.bottom`으로 동적 조정

### 콘텐츠 패딩 (theme.js)
- `content.paddingBottom` 조정 — 플로팅 탭바에 가려지지 않도록

### 모달 키보드 가림 방지
- `FridgeScreen`, `ShoppingScreen`, `NutritionScreen` 모달에 `KeyboardAvoidingView` 적용
- iOS에서 텍스트 입력 시 모달이 키보드 위로 자동 이동

### Safe Area 대응 (모달 시트)
- 모달 하단 `paddingBottom`에 `insets.bottom` 반영
- `FridgeScreen` FAB 버튼 위치 `bottom: 22 + insets.bottom` 적용
- `RecipeDetailScreen` 하단 액션바 `paddingBottom` 동적 처리

---

## 4. 인증 시스템 추가

### AuthScreen.js (신규)
- 로그인 / 회원가입 탭 전환 UI
- 이메일 + 비밀번호 (8자 이상) + 닉네임 입력
- 로그인 성공 시 JWT `accessToken` 저장 후 메인 진입
- 비인증 상태에서 메인 콘텐츠 접근 불가

### OnboardingScreen.js (신규)
- 회원가입 직후 프로필 설정 화면
- 성별, 나이, 키, 체중, 목표(다이어트/유지/벌크업), 활동량(낮음/보통/높음) 입력
- "건너뛰기" 버튼으로 나중에 마이페이지에서 수정 가능
- 입력 완료 시 `/api/v1/me` PATCH로 DB 저장

### App.js 인증 흐름
```
앱 시작
  → 미인증: AuthScreen
  → 회원가입: OnboardingScreen → 메인
  → 로그인: 바로 메인
```

---

## 5. 마이페이지 개편 (MyPageScreen.js)

- **읽기 모드 (기본)**: 성별·나이·키·체중·목표·활동량을 깔끔한 목록으로 표시
- **수정 모드**: ✏️ 버튼 클릭 시 편집 폼 전환, 저장/취소 버튼 포함
- **목표 칼로리**: 단백질·탄수화물 박스 제거, kcal만 크게 표시
- `MALE/FEMALE`, `MAINTAIN/DIET/BULK` 등 영어 값 → 한글 변환 표시

---

## 6. 레시피 데이터 정제 (client.js)

### 재료명 정제 (`cleanIngredientName`)
| 원본 | 정제 후 |
|------|---------|
| `주재료 > 아몬드가루` | `아몬드가루` |
| `무가당 코코아가루①` | `무가당 코코아가루` |
| `초코필링 > 무가당 코코아가루②` | `무가당 코코아가루` |
| `그릭요거트 토핑 > 그릭요거트` | `그릭요거트` |

- 같은 이름으로 정제된 재료 중복 제거
- 장보기 아이템 이름에도 동일 적용 (`normalizeShoppingItem`)

### 조리 단계 정제 (`cleanInstruction`)
- 조리 단계 텍스트에서도 `①②③...` 제거
- 예: `"코코아가루①을 체 쳐서"` → `"코코아가루을 체 쳐서"`

---

## 7. 레시피 화면 개선 (RecipesScreen.js)

- **"0분" 제거**: `cookingTime`이 0이면 조리 시간 미표시
- **10개씩 페이지네이션**: 1200개 전체 → 페이지당 10개, `◀ 1 / 115 ▶` 이동
- **페이지 이동 시 자동 스크롤**: 다음 페이지로 넘어가면 화면 최상단으로 이동
- 검색어·모드 변경 시 자동으로 1페이지 복귀

---

## 8. 조리 타이머 개선 (RecipeDetailScreen.js)

### 이동 방식
- 화면 내 자유 이동 → **화면 테두리(상·하·좌·우)에만** 이동하도록 변경
- 드래그 후 손 떼면 가장 가까운 테두리에 자동 스냅

### 시간 표시
- 타이머 미설정: 시계 아이콘 표시
- 타이머 설정 후: 버튼에 `MM:SS` 남은 시간 실시간 표시

### 분·초 설정
- 기존: 분만 입력 가능
- 변경: **분 + 초 각각 입력** 가능
- 빠른 선택 칩: 1분, 3분, 5분, 10분, **30초** 추가

### 완료 알람
- `assets/ding.wav` — 1047Hz + 1319Hz 화음 벨 소리 (로컬 파일 생성)
- `expo-haptics` 진동 피드백
- `expo-av` 사운드 재생 (무음 모드에서도 울림)
- "⏰ 띠링~! 타이머가 완료됐어요!" 알림 팝업

---

## 9. 장보기 화면 개선 (ShoppingScreen.js)

### 레시피별 그룹핑
- 기존: `recipeName` 필드 없어 전부 "직접 추가"로 표시
- 수정: `recipeId`로 로컬 recipes 목록에서 레시피명 조회 후 그룹핑
- 같은 레시피에서 추가된 재료끼리 카드로 묶여 표시

### 직접 추가 모달
- 기존: 재료명 + 수량 + 단위 입력
- 수정: **재료명만 입력** (수량·단위 제거)

### 구매하기 버튼
- 각 재료 행에 🛒 **구매하기** 버튼 추가
- 누르면 쿠팡에서 해당 재료명으로 바로 검색
- URL: `https://www.coupang.com/np/search?q={재료명}`

---

## 10. 장보기 버그 수정 (AppDataContext.js)

| 기능 | 기존 문제 | 수정 |
|------|----------|------|
| 항목 체크 | `nextChecked` 미정의 → 앱 크래시 | 올바르게 재작성 |
| 항목 삭제 | UI에서만 삭제, DB에 남음 | `api.deleteShoppingItem()` 호출 추가 |
| 완료 항목 일괄 삭제 | UI만 삭제, DB 미반영 | `Promise.all` 일괄 API 삭제 추가 |

---

## 11. Toast 알림 컴포넌트 추가 (ui.js)

- `useToast()` 훅 — 어느 화면에서든 재사용 가능
- `showToast("메시지")` 호출 시 하단에서 올라오는 토스트 표시
- 2.5초 후 자동 페이드아웃
- 현재 적용: 레시피 상세 → 장보기 추가 시 `"N개 재료가 장보기에 추가됐어요"` 표시

---

> 작업일: 2026-05-20  
> 브랜치: `JoRi`

---

## 12. 탭바 완전 재작성 (App.js)

### CustomTabBar 컴포넌트 신규 작성
- `@react-navigation/bottom-tabs`의 `BottomTabBar` 제거 → 커스텀 `CustomTabBar`로 교체
- `TAB_ROUTES` 배열로 탭 라우트 선언적 통합 (기존 `screenOptions` 내 분기문 제거)
- `Animated.spring`으로 탭 전환 시 슬라이딩 초록 pill 애니메이션 구현
- `useWindowDimensions`로 탭 너비를 화면 크기 기준 동적 계산
- 탭바 스타일: 기존 플로팅 둥근 카드 → **하단 고정형 전체 너비** (테두리 선 디자인)
- Safe Area: `insets.bottom`을 탭바 height에 반영해 홈 인디케이터 겹침 방지
- 임포트 변경: `Animated`, `Pressable`, `useWindowDimensions` 추가 / `BottomTabBar` 제거

---

## 13. 냉장고 화면 개선 (FridgeScreen.js)

### 카테고리 이모지 추가
- `categoryEmoji` 매핑 객체 추가 (채소🥬 과일🍎 육류🥩 해산물🦐 유제품🥛 계란🥚 두부/콩류🫘 양념/소스🧂 냉동식품🧊 기타🍽️)
- 재료 목록 행에 카테고리 이모지를 이름 왼쪽에 표시

### 재료 추가 폼 단순화
- `quantity`(수량), `unit`(단위) 입력 필드 제거 → **재료명 + 카테고리만** 입력
- 기존 "수량 미입력" 보조 텍스트 제거

---

## 14. 스타일 미세 조정

### theme.js
- `content`, `detailContent` 전역 스타일에 `gap: 16` 추가 (섹션 간 세로 간격 통일)
- `card` padding: `16` → `18`

### ui.js
- `sectionHeader` `marginBottom`: `12` → `16`

### NutritionScreen.js
- `summaryBox` `minHeight`: `104` → `100` (박스 높이 미세 조정)

### ShoppingScreen.js
- 헤더 `paddingBottom`: `16` → `20`

---

## 설치된 패키지

| 패키지 | 용도 |
|--------|------|
| `expo-av ~16.0.8` | 타이머 완료 소리 재생 |
| `expo-haptics ~15.0.8` | 타이머 완료 진동 피드백 |

---

## 파일 변경 목록

| 파일 | 구분 |
|------|------|
| `BackEnd/.../AppFeatureController.java` | 수정 |
| `BackEnd/.../AppFeatureService.java` | 수정 |
| `FrontEnd/App.js` | 수정 |
| `FrontEnd/package.json` | 수정 |
| `FrontEnd/assets/ding.wav` | **신규** |
| `FrontEnd/src/api/client.js` | 수정 |
| `FrontEnd/src/components/ui.js` | 수정 |
| `FrontEnd/src/context/AppDataContext.js` | 수정 |
| `FrontEnd/src/screens/AuthScreen.js` | **신규** |
| `FrontEnd/src/screens/OnboardingScreen.js` | **신규** |
| `FrontEnd/src/screens/FridgeScreen.js` | 수정 |
| `FrontEnd/src/screens/MyPageScreen.js` | 수정 |
| `FrontEnd/src/screens/NutritionScreen.js` | 수정 |
| `FrontEnd/src/screens/RecipeDetailScreen.js` | 수정 |
| `FrontEnd/src/screens/RecipesScreen.js` | 수정 |
| `FrontEnd/src/screens/ShoppingScreen.js` | 수정 |
| `FrontEnd/src/theme.js` | 수정 |

### 2026-05-20 추가

| 파일 | 구분 |
|------|------|
| `FrontEnd/App.js` | 수정 (탭바 재작성) |
| `FrontEnd/src/components/ui.js` | 수정 |
| `FrontEnd/src/screens/FridgeScreen.js` | 수정 |
| `FrontEnd/src/screens/NutritionScreen.js` | 수정 |
| `FrontEnd/src/screens/ShoppingScreen.js` | 수정 |
| `FrontEnd/src/theme.js` | 수정 |
| `BackEnd/.../SchemaMigrationRunner.java` | 수정 (category 컬럼 추가) |
| `BackEnd/.../FeatureDtos.java` | 수정 (category 필드 추가) |
| `BackEnd/.../AppFeatureRepository.java` | 수정 (category 쿼리 반영) |
| `FrontEnd/src/api/client.js` | 수정 (category 전송 추가) |

---

## 15. 냉장고 카테고리 저장 버그 수정

### 원인
- `client.js`의 `toPantryRequest` 함수에 `category` 필드가 누락 → 서버에 카테고리 미전송
- 백엔드 `PantryItemRequest` / `PantryItemResponse` DTO에 `category` 없음
- DB `pantry_items` 테이블에 `category` 컬럼 없음
- 결과: 카테고리 선택과 무관하게 항상 "기타"로 저장

### 수정 내용

**BackEnd**
- `SchemaMigrationRunner.java`: `pantry_items` CREATE TABLE에 `category VARCHAR(60) NULL` 추가, `ensureColumn` 호출 추가 (기존 DB 자동 마이그레이션)
- `FeatureDtos.java`: `PantryItemRequest`, `PantryItemResponse` 레코드에 `category` 필드 추가
- `AppFeatureRepository.java`: 모든 SELECT/INSERT/UPDATE 쿼리에 `category` 반영, `toPantryItem` 헬퍼 메서드 시그니처 업데이트

**FrontEnd**
- `client.js`: `toPantryRequest`에 `category: body.category || null` 추가

---

## 16. 냉장고 재료별 이모지 (FridgeScreen.js)

### 변경 전
- 카테고리 단위 이모지 (채소 전체 🥬, 육류 전체 🥩 등)

### 변경 후
- `ingredientEmoji` 객체: ~200개 재료명 → 이모지 exact match
  - 채소: 양파🧅 마늘🧄 당근🥕 감자🥔 고구마🍠 브로콜리🥦 오이🥒 가지🍆 토마토🍅 파프리카🫑 등
  - 과일: 사과🍎 바나나🍌 딸기🍓 포도🍇 레몬🍋 아보카도🥑 등
  - 육류: 소고기/쇠고기🥩 돼지고기/삼겹살🥩 닭가슴살/닭다리🍗 베이컨/햄🥓
  - 해산물: 새우🦐 오징어/낙지🦑 게/꽃게🦀 조개류🦪 생선류🐟 해조류🌊
  - 유제품: 우유🥛 버터🧈 치즈🧀 요거트🥛
  - 양념: 소금🧂 간장/된장/고추장🫙 올리브오일🫒 꿀🍯 설탕🍬 카레🍛 등
- `getIngredientEmoji(name, category)` 함수: exact match → 키워드 패턴(20개) → 카테고리 fallback → 🍽️ 순으로 처리
  - "버섯" 포함 → 🍄, "고추" 포함(장 제외) → 🌶️, "닭" 포함 → 🍗 등

---

## 17. 영양성분표 사진 인식 OCR (NutritionScreen.js)

### 기능 개요
- "자주 먹는 음식 추가" 모달에 **📷 사진 인식** 버튼 추가
- 카메라로 식품 영양성분표 촬영 → Google Vision API OCR → 폼 자동 입력

### 흐름
```
사진 인식 버튼 탭
  → 카메라 권한 요청
  → expo-image-picker 카메라 실행
  → 촬영된 이미지 base64 변환
  → POST /api/v1/ocr/nutrition
  → Google Vision API 텍스트 추출
  → 한국 영양성분표 패턴 파싱
  → 음식명·1회제공량·kcal·탄수·단백·지방·나트륨 자동 입력
  → 인식 결과 메시지 표시 (수정 후 저장 가능)
```

### 백엔드 (신규)

- `FeatureDtos.java`: `OcrNutritionRequest(imageBase64, mediaType)`, `OcrNutritionResponse(name, servingSize, calories, carbs, protein, fat, sodium, rawText, message)` 추가
- `AppFeatureController.java`: `POST /ocr/nutrition` 엔드포인트 추가
- `AppFeatureService.java`:
  - `extractNutrition()` — Google Vision API REST 호출 (languageHints: ko)
  - `callGoogleVision()` — base64 이미지 → OCR 전문 텍스트 반환
  - `parseNutritionLabel()` — 한국 영양성분표 정규식 파싱
    - 열량/탄수화물/단백질/지방/나트륨 키워드 + 후행 숫자 추출
    - 1회 제공량 `(\d+\s*(?:g|ml|...))` 패턴
    - 제품명: 영양성분 관련 키워드 제외한 첫 번째 한글 라인
- `BackEnd/.env`: `GOOGLE_VISION_API_KEY` 추가

### 프론트엔드

- `NutritionScreen.js`:
  - `expo-image-picker` import, `ActivityIndicator` 추가
  - `ocrLoading` / `ocrMessage` 상태 추가
  - 모달 헤더를 row 레이아웃으로 변경 — 제목 좌측, 사진 인식 버튼 우측
  - OCR 중 스피너 + "인식 중..." 텍스트 표시
  - 인식 완료 시 결과 메시지 박스 표시
  - `api.extractNutritionFromImage()` 호출 후 폼 자동 채우기 (기존 값 유지하며 덮어쓰기)
- `client.js`: `extractNutritionFromImage(body)` 추가
- `package.json`: `expo-image-picker` 설치

### 파일 변경 목록

| 파일 | 구분 |
|------|------|
| `BackEnd/.env` | 수정 (GOOGLE_VISION_API_KEY 추가) |
| `BackEnd/.env.example` | 수정 |
| `BackEnd/.../FeatureDtos.java` | 수정 |
| `BackEnd/.../AppFeatureController.java` | 수정 |
| `BackEnd/.../AppFeatureService.java` | 수정 |
| `FrontEnd/package.json` | 수정 (expo-image-picker 추가) |
| `FrontEnd/src/api/client.js` | 수정 |
| `FrontEnd/src/screens/NutritionScreen.js` | 수정 |

---

## 18. OCR 파싱 개선 (AppFeatureService.java)

### 칼로리 인식 실패 수정
- 문제: `"300 kcal"` 형태(숫자 → 단위)를 못 잡음. 기존 파서는 `열량` 키워드 뒤 숫자만 탐색
- 수정: `extractCalories()` 분리
  - 1순위: `열량/칼로리` 키워드 뒤 숫자
  - 2순위: `(\d+)\s*kcal` 역방향 패턴 추가 (햇반 등 상단 표기 형식)

### 천 단위 쉼표 / g→9 OCR 오독 수정
- 문제: `1,760mg` → 쉼표를 소수점으로 처리해 `1.76`으로 파싱
- 문제: `79g` → OCR이 `g`를 `9`로 읽어 `799`로 파싱
- 수정:
  - `parseNumber()` 추가 — `\d,\d{3}` 패턴은 천 단위 쉼표로 인식해 제거, 나머지 쉼표만 소수점 변환
  - `correctGMisread()` 추가 — 탄수·단백·지방이 기준치(300/150/150g) 초과 + 끝자리 `9`면 마지막 자리 제거

### 회전 이미지 파싱 개선
- 문제: 90° 회전 촬영 시 OCR 출력 순서가 바뀌어 키워드 뒤 엉뚱한 숫자(퍼센트 등) 캡처
- 분석: 키워드 바로 옆 숫자가 정답, 퍼센트는 그보다 멀리 위치
- 수정:
  - 탐색 범위 `{0,20}` → `{0,10}` 축소
  - `(?!\s*%)` 음수 전방탐색 추가 — `6%`, `11%` 등 퍼센트 숫자 스킵

### 음식명 파싱 제거
- 회전 이미지에서 포장 안내문이 제품명으로 잘못 인식되는 문제
- `extractProductName()` 호출 제거 → 음식명 항상 빈 값으로 반환 (사용자가 직접 입력)

---

## 19. 자주 먹는 음식 개선 (NutritionScreen.js)

### 필드 라벨 고정 표시
- 숫자 입력 후 플레이스홀더가 사라져 어느 필드인지 구분 불가
- 각 숫자 필드 아래 고정 라벨 추가: **칼로리 (kcal)** / **탄수화물 (g)** / **단백질 (g)** / **지방 (g)** / **나트륨 (mg)**
- `labeledField` + `fieldLabel` 스타일 신규 추가

### 1회 제공량 DB 저장 누락 수정
- 문제: `serving_size` 컬럼이 DB에 없어 앱 재시작 시 사라짐
- 수정:
  - `SchemaMigrationRunner.java`: `custom_foods` 테이블에 `serving_size VARCHAR(60) NULL` 추가
  - `FeatureDtos.java`: `CustomFoodRequest`, `CustomFoodResponse`에 `servingSize` 필드 추가
  - `AppFeatureRepository.java`: INSERT/SELECT 쿼리에 `serving_size` 반영
  - `client.js`: `toCustomFoodRequest`에 `servingSize` 추가

### 수정 기능 추가 (삭제 버튼 이동)
- 변경 전: 목록에 🗑️ 삭제 버튼 직접 노출
- 변경 후: ✏️ 수정 버튼 → 수정 모달 내부에 삭제 버튼 배치
- `EditFoodModal` 신규:
  - 기존 값 미리 채워진 폼 (`useEffect`로 `food` prop 변경 시 갱신)
  - **저장하기**: 기존 항목 삭제 후 새로 생성 (별도 PATCH 엔드포인트 없이 처리)
  - **삭제하기**: 빨간 테두리 버튼 (모달 하단)

### 식사 시간 선택 모달 추가
- 변경 전: ▶ 버튼 탭 → "간식"으로 고정 기록
- 변경 후: ▶ 버튼 탭 → 식사 시간 선택 시트 팝업
- `MealTypePickerModal` 신규:
  - 음식명 표시
  - **아침 / 점심 / 저녁 / 간식** 칩 선택 (기본값: 점심)
  - **기록하기** 버튼으로 선택한 식사 시간으로 영양 기록

### 파일 변경 목록

| 파일 | 구분 |
|------|------|
| `BackEnd/.../SchemaMigrationRunner.java` | 수정 |
| `BackEnd/.../FeatureDtos.java` | 수정 |
| `BackEnd/.../AppFeatureRepository.java` | 수정 |
| `BackEnd/.../AppFeatureService.java` | 수정 |
| `FrontEnd/src/api/client.js` | 수정 |
| `FrontEnd/src/screens/NutritionScreen.js` | 수정 |
