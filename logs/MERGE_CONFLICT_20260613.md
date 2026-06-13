# Merge Conflict Report — 2026-06-13

**병합 대상:** `yori` → `main`
**병합 커밋:** `bb4eac1`
**기준 커밋 (병합 전 main):** `cd55b52`
**병합 소스 커밋 (yori):** `6eb3965` (Update backend and frontend changes)

---

## 충돌 발생 파일 목록

| # | 파일 경로 | 파일 유형 | 충돌 원인 | 해결 방법 |
|---|-----------|-----------|-----------|-----------|
| 1 | `BackEnd/bin/main/com/yorizori/recipe/repository/RecipeQueryRepository$RecipeRow.class` | 바이너리 (.class) | 양쪽 브랜치에서 동일 파일 수정 | yori 버전 채택 |
| 2 | `BackEnd/bin/main/com/yorizori/recipe/repository/RecipeQueryRepository.class` | 바이너리 (.class) | 양쪽 브랜치에서 동일 파일 수정 | yori 버전 채택 |
| 3 | `FrontEnd/src/screens/RecipeDetailScreen.js` | JavaScript | 양쪽 브랜치에서 같은 코드 영역 수정 | **자동 병합 성공** (충돌 없음) |

---

## 파일별 상세 수정 내용

### 1. `RecipeQueryRepository$RecipeRow.class` / `RecipeQueryRepository.class`

> 컴파일된 Java 바이트코드 파일 (바이너리). git이 자동 병합 불가.

**충돌 원인:** `RecipeQueryRepository.java` 소스가 양쪽 브랜치에서 모두 수정됨에 따라 재컴파일된 `.class` 파일도 양쪽이 달라짐.

| 파일 | main 크기 | yori 크기 | 해결 |
|------|-----------|-----------|------|
| `RecipeQueryRepository$RecipeRow.class` | 2,721 bytes | 2,721 bytes | yori 채택 |
| `RecipeQueryRepository.class` | 23,589 bytes | 19,076 bytes | yori 채택 |

**yori 채택 이유:** yori 브랜치의 `RecipeQueryRepository.java`가 더 최신 상태이며, 재료 데이터 구조를 `recipe_ingredients` 테이블 직접 조회 방식으로 단순화한 변경이 반영되어 있음. `.class` 크기가 줄어든 것도 코드 단순화의 결과.

---

### 2. `FrontEnd/src/screens/RecipeDetailScreen.js` (자동 병합)

충돌 마커 없이 자동 병합되었으나, 아래와 같이 main의 기존 내용이 yori 변경으로 대체됨.

#### 2-1. 타이머 입력 UI 스타일명 변경

| 구분 | 기존 main 코드 | 변경 후 (yori) |
|------|----------------|----------------|
| 스타일명 | `styles.inputWrap` | `styles.inputGroup` |
| 레이아웃 | `flex: 1` (유동 너비) | 고정 너비 + gap 조정 |
| `timerInputField` | `flex: 1, textAlign: 'center'` | `width: 76, height: 52, fontSize: 22, fontWeight: '800', borderWidth: 0, borderRadius: 12` |
| `inputColon` | `fontSize: 22, fontWeight: '700'` | `fontSize: 26, fontWeight: '700', paddingHorizontal: 2` |

```js
// 기존 main
<View style={styles.inputWrap}>
  ...
</View>

// 변경 후 (yori)
<View style={styles.inputGroup}>
  ...
</View>
```

#### 2-2. 빠른 타이머 버튼 레이아웃 변경

기존 main의 `View`(줄바꿈 flex) → yori의 `ScrollView`(가로 스크롤)로 교체.

```js
// 기존 main
<View style={styles.quickTimer}>
  {[...].map((t) => <Chip ... />)}
</View>

// 변경 후 (yori)
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.quickTimerList}
>
  {[...].map((t) => <Chip ... />)}
</ScrollView>
```

| 스타일 키 | 기존 main | 변경 후 (yori) |
|-----------|-----------|----------------|
| `quickTimer` | `flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12` | 제거됨 |
| `quickTimerList` | 없음 | `gap: 8, paddingTop: 12, paddingBottom: 2` (신규) |

#### 2-3. 재료 섹션 데이터 구조 변경

`recipe.groups` (그룹 기반) → `recipe.ingredients` 직접 섹션 구성 방식으로 변경.

```js
// 기존 main — groups 기반
const sectionedIngredients = useMemo(() => recipe?.groups ?? [], [recipe]);

// 변경 후 (yori) — ingredients 직접 파싱
const sectionedIngredients = useMemo(() => {
  if (!recipe) return [];
  const sections = [];
  const sectionMap = new Map();
  for (const ingredient of recipe.ingredients) {
    const key = ingredient.section || "";
    if (!sectionMap.has(key)) {
      const group = { section: ingredient.section || null, ingredients: [] };
      sectionMap.set(key, group);
      sections.push(group);
    }
    sectionMap.get(key).ingredients.push(ingredient);
  }
  return sections;
}, [recipe]);
```

#### 2-4. 재료 렌더링 필드명 변경

| 용도 | 기존 main | 변경 후 (yori) |
|------|-----------|----------------|
| 그룹 키 | `group.groupId ?? "__none__"` | `section \|\| "__none__"` |
| 그룹 이름 | `group.groupName` | `section` |
| 재료 목록 | `group.items` | `ingredients` |
| 재료 이름 | `item.originalName` | `ingredient.name` |
| 재료 수량 | `item.amountText` | `ingredient.amount` |
| Chip key | `item.ingredientId` | `ingredient.name` |

#### 2-5. 재료 개수 표시 변경

```js
// 기존 main
title={`재료 ${recipe.totalIngredientCount ?? recipe.ingredients.length}가지`}

// 변경 후 (yori)
title={`재료 ${recipe.ingredients.length}가지`}
```

`totalIngredientCount` 필드 의존성 제거, `ingredients.length` 직접 사용.

---

## 자동 병합된 주요 파일 (충돌 없음)

아래 파일들은 충돌 없이 자동 병합되었으며, yori 변경이 main에 추가됨.

| 파일 | 변경 요약 |
|------|-----------|
| `BackEnd/src/main/java/com/yorizori/config/SchemaMigrationRunner.java` | `Logger` 추가, `run()` 메서드에 `try-catch(DataAccessException)` 추가 (DB 연결 불가 시 graceful skip) |
| `BackEnd/build.gradle` | 의존성 업데이트 |
| `FrontEnd/src/api/weather.js` | 날씨 API 클라이언트 신규 추가 |
| `FrontEnd/src/utils/weatherGrid.js` | 기상청 격자 좌표 변환 유틸 신규 추가 |
| `FrontEnd/src/screens/HomeScreen.js` | 날씨 연동 및 UI 개편 |
| `FrontEnd/src/screens/RecipesScreen.js` | 레시피 목록 화면 개선 |
| `FrontEnd/app.json` | 앱 설정 업데이트 |
| `FrontEnd/package.json` / `package-lock.json` | 패키지 추가 |
| `FrontEnd/.env.example` | 환경변수 예시 업데이트 |
| `BackEnd/bin/main/**/*.class` (충돌 외 14개) | 재컴파일된 클래스 파일 자동 병합 |

---

## 참고: SchemaMigrationRunner.java 핵심 변경

```java
// 기존 main — DB 오류 시 앱 시작 중단 가능
@Override
public void run(ApplicationArguments args) {
    createFeatureTables();
    ensureUsersColumns();
    // ...
}

// 변경 후 (yori) — DB 연결 불가 시 경고 로그 후 계속 진행
private static final Logger log = LoggerFactory.getLogger(SchemaMigrationRunner.class);

@Override
public void run(ApplicationArguments args) {
    try {
        createFeatureTables();
        ensureUsersColumns();
        // ...
    } catch (DataAccessException ex) {
        log.warn("Skipping schema migration because the database is unavailable: {}", ex.getMessage());
    }
}
```
