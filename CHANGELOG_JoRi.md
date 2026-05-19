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
