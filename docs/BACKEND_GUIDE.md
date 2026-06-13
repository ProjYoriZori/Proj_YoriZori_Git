# BackEnd 개발 가이드

> **Spring Boot 기반 YoriZori BackEnd 개발 관련 정보입니다.**

---

## 📋 프로젝트 구조

```
BackEnd/
├── src/
│   ├── main/
│   │   ├── java/com/yorizori/
│   │   │   ├── auth/                 # 인증 모듈
│   │   │   ├── config/               # 설정 모듈
│   │   │   ├── feature/              # 기능 모듈
│   │   │   ├── foodapi/              # 외부 API 연동
│   │   │   └── recipe/               # 레시피 모듈
│   │   └── resources/
│   │       ├── application-local.yml # 로컬 설정
│   │       └── db/schema.sql         # DB 스키마
│   └── test/
│       └── java/com/yorizori/
│           └── auth/                 # 테스트 코드
├── build.gradle                      # Gradle 빌드 설정
├── gradlew / gradlew.bat             # Gradle Wrapper
└── .env                              # 환경변수 (git ignore)
```

---

## 🛠️ 개발 환경 설정

### 1단계: IDE 설정

**IntelliJ IDEA (권장)**

```
1. File → Open → BackEnd/build.gradle 선택
2. Open as Project 클릭
3. Gradle 자동 빌드 수행
4. Project Structure → SDKs → Java 17 선택
```

**VS Code**

```
1. Extension 설치:
   - Extension Pack for Java
   - Gradle for Java
   - Spring Boot Extension Pack
2. build.gradle 열기 → "Load" 클릭
```

### 2단계: 환경변수 로드 확인

`.env` 파일이 생성되면 `DotenvEnvironmentPostProcessor`가 자동으로 로드합니다:

```java
// src/main/java/com/yorizori/config/DotenvEnvironmentPostProcessor.java
// Spring Environment에 .env 값 로드
```

### 3단계: 데이터베이스 자동 초기화

서버 시작 시 `SchemaMigrationRunner`가:

1. 기존 테이블 검증
2. 누락된 테이블 생성
3. 기능 테이블 추가

```java
// src/main/java/com/yorizori/config/SchemaMigrationRunner.java
@Component
public class SchemaMigrationRunner {
    public void run() {
        // SQL 마이그레이션 로직
    }
}
```

---

## 📦 주요 패키지별 개발 가이드

### `com.yorizori.auth` - 인증 모듈

#### 주요 클래스

| 클래스             | 역할                                   |
| ------------------ | -------------------------------------- |
| `AuthController`   | 회원가입, 로그인, 토큰 갱신 엔드포인트 |
| `AuthService`      | 인증 비즈니스 로직                     |
| `JwtTokenProvider` | JWT 토큰 생성/검증                     |
| `PasswordHasher`   | PBKDF2 비밀번호 해싱                   |
| `AuthSupport`      | 요청에서 사용자 ID 추출                |

#### 엔드포인트

```java
// 회원가입
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "사용자이름"
}

Response: { userId, email, name, accessToken, refreshToken }

// 로그인
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: { userId, email, accessToken, refreshToken, expiresIn }

// 토큰 갱신
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "..."
}

Response: { accessToken, expiresIn }
```

#### JWT 토큰 구조

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
.
{
  "userId": 1,
  "iat": 1234567890,
  "exp": 1234569690
}
.
HMAC-SHA256(header.payload, JWT_SECRET)
```

#### 개발 시 유의사항

```java
// ✅ 올바른 사용
@PostMapping("/signup")
public ResponseEntity<?> signup(@RequestBody SignupRequest req) {
    AuthService.signup(req.getEmail(), req.getPassword(), req.getName());
    // ...
}

// ❌ 피해야 할 것
- 비밀번호를 평문으로 저장
- 토큰 만료 시간 무시
- 환경변수 없이 시크릿 하드코딩
```

---

### `com.yorizori.recipe` - 레시피 모듈

#### 디렉토리 구조

```
recipe/
├── web/
│   ├── RecipeController         # REST 엔드포인트
│   ├── RecipeIngestController   # 관리자 API
│   └── ApiExceptionHandler      # 예외 처리
├── service/
│   ├── RecipeQueryService       # 조회 비즈니스 로직
│   └── RecipeIngestService      # 수집 비즈니스 로직
├── repository/
│   ├── RecipeQueryRepository    # 조회 데이터 접근
│   └── RecipeIngestRepository   # 저장 데이터 접근
└── dto/
    ├── RecipeDto
    ├── IngredientDto
    ├── RecipeStepDto
    └── NutritionDto
```

#### 주요 엔드포인트

```java
// 레시피 목록 조회
GET /api/v1/recipes?limit=50&offset=0&query=파스타

// 레시피 상세 조회
GET /api/v1/recipes/{id}

// 레시피 검색 (재료 기반)
GET /api/v1/recipes?ingredients=토마토,마늘

// 추천 레시피
POST /api/v1/recommend
Body: { ingredients: [...] }

// 관리자 - 레시피 수집
POST /api/v1/admin/ingest/recipes?startIdx=1&endIdx=100
```

#### JdbcTemplate 활용

```java
// 예시: RecipeQueryRepository에서 검색 쿼리
public List<Recipe> findByQuery(String query) {
    String sql = "SELECT * FROM recipes WHERE name LIKE ? ORDER BY id";
    return jdbcTemplate.query(
        sql,
        new Object[]{"%" + query + "%"},
        new RecipeRowMapper()
    );
}

// RowMapper: ResultSet → DTO 변환
class RecipeRowMapper implements RowMapper<Recipe> {
    @Override
    public Recipe mapRow(ResultSet rs, int rowNum) {
        return new Recipe(
            rs.getInt("id"),
            rs.getString("name"),
            rs.getString("image_url"),
            // ...
        );
    }
}
```

#### 개발 시 유의사항

```java
// ✅ 올바른 사용
- 쿼리에 바인드 변수(?) 사용
- RowMapper로 ResultSet 매핑
- 트랜잭션 처리

// ❌ 피해야 할 것
- SQL 문자열 연결 (SQL Injection)
- 직접 ResultSet 접근
- 예외 처리 누락
```

---

### `com.yorizori.feature` - 기능 모듈 (냉장고, 추천, 영양 등)

#### 주요 기능

| 기능            | 설명                       | 엔드포인트                             |
| --------------- | -------------------------- | -------------------------------------- |
| **냉장고**      | 사용자 식재료 관리         | `GET/POST/DELETE /api/v1/pantry-items` |
| **추천**        | 냉장고 기반 레시피 추천    | `POST /api/v1/recommend`               |
| **영양**        | 섭취 음식 기록 & 영양 요약 | `GET/POST /api/v1/nutrition-logs`      |
| **장보기**      | 부족 재료 감지 & 목록 생성 | `POST /api/v1/shopping-items/generate` |
| **즐겨찾기**    | 관심 레시피 저장           | `GET/POST/DELETE /api/v1/favorites`    |
| **제철**        | 제철 식재료 추천           | `GET /api/v1/seasonal-ingredients`     |
| **커스텀 푸드** | 사용자 정의 음식           | `GET/POST /api/v1/custom-foods`        |

#### 설계 패턴

```java
// 1. 추천 엔드포인트 호출
@PostMapping("/recommend")
public List<Recipe> recommend(@RequestBody RecommendRequest req) {
    return appFeatureService.recommend(req.getIngredients());
}

// 2. Service에서 비즈니스 로직 처리
public List<Recipe> recommend(List<String> ingredients) {
    // 1) 재료별 가능한 레시피 조회
    List<Recipe> candidates = repository.findByIngredients(ingredients);

    // 2) 점수 계산 & 정렬
    return candidates.stream()
        .sorted((a, b) -> calculateScore(b) - calculateScore(a))
        .limit(20)
        .collect(Collectors.toList());
}

// 3) Repository에서 데이터 접근
public List<Recipe> findByIngredients(List<String> ingredients) {
    String placeholders = String.join(",",
        Collections.nCopies(ingredients.size(), "?"));
    String sql = "SELECT DISTINCT r.* FROM recipes r " +
        "JOIN recipe_ingredients ri ON r.id = ri.recipe_id " +
        "WHERE ri.ingredient_id IN (" + placeholders + ")";
    return jdbcTemplate.query(sql, ingredients.toArray(), new RecipeRowMapper());
}
```

---

### `com.yorizori.foodapi` - 외부 API 연동

#### 식품의약품안전처 OpenAPI 연동

```java
// FoodApiClient: HTTP 요청
public FoodApiFetchResult fetch(int startIdx, int endIdx) {
    String url = "http://openapi.foodsafetykorea.go.kr/api/";
    // HTTP 요청 실행
    // XML 파싱
    return new FoodApiFetchResult(rawResponse, parsedData);
}

// FoodApiProperties: 설정 바인딩
@ConfigurationProperties(prefix = "food.api")
public class FoodApiProperties {
    private String key;
    private String endpoint;
    // getter/setter
}
```

#### 환경변수 설정

```env
FOOD_API_KEY=your-actual-key-from-식품의약품안전처
# application-local.yml에서 참조:
# food:
#   api:
#     key: ${FOOD_API_KEY}
```

---

## 🧪 테스트 작성 가이드

### 테스트 구조

```
src/test/java/com/yorizori/
├── auth/
│   ├── JwtTokenProviderTest
│   └── PasswordHasherTest
├── recipe/
│   └── RecipeServiceTest (작성 권장)
└── feature/
    └── AppFeatureServiceTest (작성 권장)
```

### 테스트 예시

```java
@SpringBootTest
public class JwtTokenProviderTest {

    @Autowired
    private JwtTokenProvider provider;

    @Test
    public void testGenerateAndValidateToken() {
        // Arrange
        long userId = 123L;

        // Act
        String token = provider.generateAccessToken(userId);
        long extractedUserId = provider.extractUserId(token);

        // Assert
        assertEquals(userId, extractedUserId);
    }

    @Test
    public void testExpiredToken() {
        // 만료된 토큰 검증
        assertThrows(TokenExpiredException.class, () -> {
            provider.validateToken(expiredToken);
        });
    }
}
```

### 테스트 실행

```powershell
# 모든 테스트
.\gradlew.bat test

# 특정 클래스
.\gradlew.bat test --tests JwtTokenProviderTest

# 테스트 리포트 확인
# build/reports/tests/test/index.html 열기
```

---

## 🐛 디버깅 팁

### 로깅 설정

```yaml
# application-local.yml
logging:
  level:
    com.yorizori: DEBUG
    org.springframework: INFO
    org.springframework.web: DEBUG
```

### 디버거 실행

```powershell
# IDE에서 Debug 모드 실행
# 또는 수동으로
.\gradlew.bat bootRun --debug
```

### 데이터베이스 쿼리 로깅

```yaml
# application-local.yml
logging:
  level:
    org.springframework.jdbc: DEBUG
    org.springframework.jdbc.core: DEBUG
```

---

## 📐 코딩 컨벤션

### 네이밍

```java
// 클래스
public class RecipeService { }           // PascalCase
public class JwtTokenProvider { }        // 두 글자 약자도 PascalCase

// 메서드
public void findRecipeById(Long id) { }  // camelCase
public void updateRecipe(...) { }        // 동작 동사 사용

// 상수
private static final String JWT_HEADER = "Authorization";  // UPPER_SNAKE_CASE
```

### 주석 작성

```java
/**
 * 냉장고 기반 레시피 추천
 *
 * @param ingredients 사용자의 냉장고 식재료 목록
 * @return 추천된 레시피 리스트
 * @throws InvalidIngredientException 유효하지 않은 식재료 입력 시
 */
public List<Recipe> recommend(List<String> ingredients) {
    // ...
}
```

---

## 🚀 빌드 & 배포

### JAR 빌드

```powershell
.\gradlew.bat build

# 생성 위치: build/libs/app.jar
```

### 로컬 JAR 실행

```powershell
java -jar build/libs/app.jar --spring.profiles.active=local
```

### 도커 이미지 빌드 (참고)

```dockerfile
FROM openjdk:17-jdk
COPY build/libs/app.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
```

---

## 📚 참고 자료

- **Spring Boot 공식 문서**: https://spring.io/projects/spring-boot
- **Spring JDBC**: https://docs.spring.io/spring-framework/reference/data-access/jdbc/
- **식품의약품안전처 OpenAPI**: https://www.foodsafetykorea.go.kr/
- **JWT**: https://jwt.io/

---

**마지막 업데이트**: 2026-06-09
