# 문제 해결 가이드 (Troubleshooting)

> **YoriZori 개발 중 자주 발생하는 문제와 해결 방법을 정리합니다.**

---

## 🔧 BackEnd 문제

### 1. BackEnd 서버 시작 실패

#### 문제: `Port 8080 already in use`

**원인**: 다른 프로세스가 포트 8080 사용 중

**해결책**:

```powershell
# 포트 사용 프로세스 확인
netstat -ano | findstr :8080

# 프로세스 ID 확인 후 종료
taskkill /PID <PID> /F

# 또는 다른 포트 사용
.\gradlew.bat bootRun --args='--server.port=8081 --spring.profiles.active=local'
```

---

#### 문제: `Database connection failed`

**원인**: MySQL 미실행 또는 연결 설정 오류

**확인 사항**:

```powershell
# 1. MySQL 서비스 상태 확인
net start MySQL80

# 2. MySQL 접속 테스트
mysql -h 127.0.0.1 -u root -p

# 3. 데이터베이스 존재 확인
SHOW DATABASES;

# 4. .env 파일 확인
cat BackEnd\.env
# 확인 항목: DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD
```

**해결책**:

```env
# BackEnd/.env 수정
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=yorizori_DB
DB_USERNAME=root
DB_PASSWORD=your-password
```

**또는 전체 JDBC URL 사용**:

```env
DB_URL=jdbc:mysql://127.0.0.1:3306/yorizori_DB?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul
```

---

#### 문제: `Property 'JWT_SECRET' not set`

**원인**: 환경변수 미설정

**해결책**:

```env
# BackEnd/.env에 추가
JWT_SECRET=dev-secret-key-change-in-production
```

**또는 환경변수 직접 설정**:

```powershell
$env:JWT_SECRET="dev-secret-key"
.\gradlew.bat bootRun --args='--spring.profiles.active=local'
```

---

#### 문제: `Liquibase migration failed` 또는 스키마 생성 실패

**원인**: 데이터베이스 권한 부족 또는 테이블 충돌

**해결책**:

```powershell
# 1. MySQL에 접속하여 데이터베이스 확인
mysql -u root -p yorizori_DB
SHOW TABLES;
EXIT;

# 2. 기존 테이블 모두 삭제 (개발환경에서만!)
DROP DATABASE yorizori_DB;
CREATE DATABASE yorizori_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 3. BackEnd 재시작
.\gradlew.bat bootRun --args='--spring.profiles.active=local'
```

---

#### 문제: `Gradle build failed` 또는 의존성 오류

**원인**: Gradle 캐시 손상 또는 네트워크 오류

**해결책**:

```powershell
# 1. Gradle 캐시 삭제
rm -r ~/.gradle/caches

# 2. 프로젝트 클린빌드
cd BackEnd
.\gradlew.bat clean build

# 3. 여전히 실패하면 명시적 의존성 갱신
.\gradlew.bat build --refresh-dependencies
```

---

#### 문제: `Swagger UI 404 Not Found`

**원인**: Swagger 라이브러리 미포함 (현재 설정에서 예상)

**해결책**: Swagger는 현재 설정에 포함되지 않을 수 있습니다. API 테스트는 cURL 또는 Postman 사용:

```powershell
# 예: 레시피 조회
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/v1/recipes
```

---

### 2. API 호출 오류

#### 문제: `401 Unauthorized`

**원인**: 토큰 미제공, 만료, 또는 유효하지 않은 토큰

**해결책**:

```powershell
# 1. 로그인하여 토큰 획득
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 2. 응답에서 accessToken 추출
# 3. 이후 모든 요청에 Bearer 토큰 추가
curl -H "Authorization: Bearer <accessToken>" \
  http://localhost:8080/api/v1/recipes
```

---

#### 문제: `403 Forbidden` 또는 `403 Access Denied`

**원인**: 권한 부족 (예: 관리자 기능을 일반 사용자가 호출)

**해결책**:

- 관리자 권한이 필요한 엔드포인트 확인
- 관리자 계정으로 로그인
- 또는 관리자 권한 부여 필요

```sql
-- 사용자에게 관리자 역할 추가 (DB에서 직접)
UPDATE users SET role = 'ADMIN' WHERE id = 1;
```

---

#### 문제: `404 Not Found`

**원인**: 잘못된 엔드포인트 또는 존재하지 않는 리소스

**해결책**:

- API 엔드포인트 경로 재확인: [API_ENDPOINTS.md](API_ENDPOINTS.md)
- 대소문자 구분 확인
- URL 슬래시 위치 확인

---

#### 문제: `CORS error` 또는 `No 'Access-Control-Allow-Origin' header`

**원인**: FrontEnd와 BackEnd의 도메인이 다름

**해결책**:

```java
// BackEnd: src/main/java/com/yorizori/config/WebConfig.java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOrigins(
                "http://localhost:5173",    // Vite
                "http://localhost:3000",    // React
                "http://localhost:19000"    // Expo
            )
            .allowedMethods("*")
            .allowCredentials(true);
    }
}
```

**FrontEnd에서 CORS 테스트**:

```javascript
fetch("http://localhost:8080/api/v1/recipes", {
  headers: {
    Authorization: "Bearer <token>",
  },
}).catch((err) => console.error("CORS Error:", err));
```

---

### 3. 데이터 관련 문제

#### 문제: `레시피 데이터가 비어있음` 또는 `No recipes found`

**원인**: 데이터 미수집

**해결책**:

```powershell
# 1. 식약처 API에서 레시피 데이터 수집
curl -X POST "http://localhost:8080/api/v1/admin/ingest/recipes?startIdx=1&endIdx=100" \
  -H "Authorization: Bearer <adminToken>"

# 2. 수집 진행 상황 모니터링
# 로그에서 "Ingested X recipes" 확인

# 3. 데이터베이스에서 확인
mysql -u root -p yorizori_DB
SELECT COUNT(*) FROM recipes;
EXIT;
```

---

#### 문제: `Duplicate entry` 또는 UNIQUE constraint violation

**원인**: 중복된 데이터 추가 시도

**해결책**:

```sql
-- 1. 중복 확인
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;

-- 2. 중복 데이터 삭제 (조심스럽게!)
DELETE FROM users WHERE id IN (
  SELECT id FROM users WHERE email = 'duplicate@example.com' LIMIT 1
);

-- 3. 데이터 정리 후 재추가
```

---

## 💻 FrontEnd 문제

### 1. FrontEnd 서버 시작 실패

#### 문제: `npm install error` 또는 `node_modules 오류`

**원인**: 의존성 설치 실패 또는 캐시 손상

**해결책**:

```powershell
cd FrontEnd

# 1. npm 캐시 초기화
npm cache clean --force

# 2. node_modules 삭제 후 재설치
rm -r node_modules
rm package-lock.json

# 3. 재설치
npm install

# 4. 여전히 실패하면 npm 버전 확인
npm --version  # 9.0 이상 권장
node --version # 18 이상 필수
```

---

#### 문제: `Port 5173 already in use` (Vite)

**원인**: 다른 프로세스가 포트 사용 중 또는 이전 개발 서버 미종료

**해결책**:

```powershell
# 1. 포트 사용 프로세스 확인
netstat -ano | findstr :5173

# 2. 프로세스 종료
taskkill /PID <PID> /F

# 3. 다른 포트로 실행
npm run web -- --port 5174
```

---

#### 문제: `Expo port conflict` 또는 `Port 19000 already in use`

**원인**: 이전 Expo 세션이 종료되지 않음

**해결책**:

```powershell
# 1. 모든 Node 프로세스 확인
tasklist | findstr node

# 2. Node 프로세스 종료
taskkill /F /IM node.exe

# 3. Expo 재시작
npm run start
```

---

### 2. 백엔드 연결 문제

#### 문제: `Cannot GET /api/v1/recipes` 또는 API 응답 없음

**원인**: BackEnd가 실행 중이지 않거나 API_BASE_URL 오류

**확인 사항**:

```powershell
# 1. BackEnd 실행 확인
curl http://localhost:8080

# 2. FrontEnd .env 확인
cat FrontEnd\.env
# EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 확인

# 3. 네트워크 요청 로깅
# 브라우저 DevTools → Network 탭 확인
```

**해결책**:

```env
# FrontEnd/.env 수정
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

**FrontEnd에서 API 호출 테스트**:

```javascript
fetch("http://localhost:8080/api/v1/recipes", {
  headers: {
    Authorization: "Bearer <token>",
  },
})
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err));
```

---

#### 문제: `ECONNREFUSED` 또는 `Connection refused`

**원인**: BackEnd 서버 미실행

**해결책**:

```powershell
# 1. BackEnd 서버 상태 확인
curl -v http://localhost:8080

# 2. BackEnd 시작
cd BackEnd
.\gradlew.bat bootRun --args='--spring.profiles.active=local'

# 3. "Started Application in X seconds" 메시지 확인
```

---

#### 문제: 로그인 후 토큰이 저장되지 않음

**원인**: localStorage 오류 또는 Context 동기화 실패

**해결책**:

```javascript
// 토큰 저장 디버깅
console.log("Token:", localStorage.getItem("accessToken"));
console.log("Storage keys:", Object.keys(localStorage));

// 토큰 수동 설정 테스트
localStorage.setItem("testToken", "value");
console.log(localStorage.getItem("testToken")); // 'value' 출력 확인
```

---

### 3. 렌더링 문제

#### 문제: `Blank screen` 또는 빈 화면

**원인**: 컴포넌트 렌더링 오류 또는 에러 경계 미설정

**해결책**:

```javascript
// 1. 브라우저 콘솔 확인 (F12)
// 에러 메시지 확인

// 2. 개발 서버 로그 확인
// "npm run start" 터미널에서 에러 메시지 확인

// 3. 간단한 테스트
// App.js를 가장 간단한 형태로 변경:
export default function App() {
  return <Text>Hello, World!</Text>;
}

// 4. 점진적으로 기능 추가
```

---

#### 문제: `Cannot read property 'map' of undefined`

**원인**: 상태가 배열이 아니라 undefined

**해결책**:

```javascript
// ❌ 잘못된 코드
const recipes = state.recipes;
return recipes.map(r => <Text key={r.id}>{r.name}</Text>);

// ✅ 올바른 코드
const recipes = state.recipes || [];
return recipes.map(r => <Text key={r.id}>{r.name}</Text>);

// 또는
if (!Array.isArray(recipes)) return <Text>No recipes</Text>;
return recipes.map(...);
```

---

#### 문제: 무한 로딩 또는 `Loading spinner가 계속 표시됨`

**원인**: useEffect 의존성 배열 누락 또는 API 오류

**해결책**:

```javascript
// ❌ 잘못된 코드 - 무한 루프
useEffect(() => {
  fetchData();
  // 의존성 배열 없음!
});

// ✅ 올바른 코드
useEffect(() => {
  fetchData();
}, []); // 마운트 시 한 번만 실행

// API 오류 처리
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get("/endpoint");
      setData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

---

## 🗄️ 데이터베이스 문제

### 1. MySQL 연결 실패

#### 문제: `Connection timeout` 또는 `Cannot connect to MySQL`

**원인**: MySQL 서비스 미실행 또는 포트 오류

**해결책**:

```powershell
# 1. MySQL 서비스 상태 확인
Get-Service MySQL80

# 2. MySQL 서비스 시작
net start MySQL80

# 3. MySQL 포트 확인 (기본값: 3306)
netstat -ano | findstr :3306

# 4. 방화벽 설정 확인
netsh advfirewall firewall show rule name=MySQL80
```

---

#### 문제: `Access denied for user 'root'@'localhost'`

**원인**: 사용자명 또는 비밀번호 오류

**해결책**:

```powershell
# 1. MySQL 직접 접속 테스트
mysql -h 127.0.0.1 -u root -p
# 비밀번호 입력 (설정할 때 입력한 비밀번호)

# 2. .env 파일의 DB_USERNAME, DB_PASSWORD 확인
cat BackEnd\.env

# 3. 비밀번호 재설정 (Windows)
# MySQL 중지
net stop MySQL80

# --skip-grant-tables로 시작
# (관리자 권한 필요)
```

---

#### 문제: `Unknown database 'yorizori_DB'`

**원인**: 데이터베이스 미생성

**해결책**:

```powershell
# 1. MySQL 접속
mysql -u root -p

# 2. 데이터베이스 생성
CREATE DATABASE yorizori_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 3. 확인
SHOW DATABASES;
EXIT;

# 4. BackEnd 재시작
cd BackEnd
.\gradlew.bat bootRun --args='--spring.profiles.active=local'
```

---

### 2. 데이터 불일치

#### 문제: `데이터가 저장되지 않거나 조회되지 않음`

**원인**: 트랜잭션 미커밋 또는 쿼리 오류

**해결책**:

```sql
-- MySQL 직접 확인
SELECT * FROM recipes LIMIT 5;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM pantry_items WHERE user_id = 1;

-- 데이터 수동 확인
DESCRIBE recipes;
SHOW INDEX FROM recipes;

-- 쿼리 실행 계획 확인
EXPLAIN SELECT * FROM recipes WHERE name LIKE '%파스타%';
```

---

## 🔍 일반 디버깅 팁

### 1. 로그 레벨 설정

**BackEnd**:

```yaml
# application-local.yml
logging:
  level:
    root: INFO
    com.yorizori: DEBUG
    org.springframework: INFO
    org.springframework.web: DEBUG
    org.springframework.jdbc: DEBUG
```

**FrontEnd**:

```javascript
// src/index.js
if (process.env.NODE_ENV === "development") {
  console.log("Development mode enabled");
  console.log("API Base URL:", process.env.EXPO_PUBLIC_API_BASE_URL);
}
```

---

### 2. 네트워크 디버깅

**BackEnd**:

```powershell
# 서버 상태 확인
curl -v http://localhost:8080

# 특정 엔드포인트 테스트
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/v1/recipes
```

**FrontEnd**:

```javascript
// 네트워크 요청 인터셉터
const originalFetch = window.fetch;
window.fetch = function (...args) {
  console.log("[FETCH]", args[0], args[1]);
  return originalFetch.apply(this, args).then((res) => {
    console.log("[RESPONSE]", res.status, res.statusText);
    return res;
  });
};
```

---

### 3. 상태 디버깅

```javascript
// Redux DevTools 또는 Context 로깅
function appReducer(state, action) {
  console.log('[ACTION]', action.type, action.payload);
  const newState = /* ... */;
  console.log('[STATE]', newState);
  return newState;
}
```

---

## 📞 추가 도움말

### 공식 문서 확인

- [프로젝트 개요](PROJECT_OVERVIEW.md)
- [환경 설정](SETUP_AND_RUN.md)
- [API 엔드포인트](API_ENDPOINTS.md)
- [데이터베이스](DATABASE.md)

### 로그 파일 확인

```powershell
# BackEnd 로그
# build/reports/tests/test/index.html

# ErrorLog.md 확인
cat ErrorLog.md
```

### 커뮤니티 질문

- [Stack Overflow](https://stackoverflow.com/)
- [Spring Boot 문서](https://spring.io/projects/spring-boot)
- [React 문서](https://react.dev)
- [MySQL 문서](https://dev.mysql.com/doc/)

---

**마지막 업데이트**: 2026-06-09
