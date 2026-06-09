# 환경 설정 및 실행 가이드

> **로컬 개발 환경을 설정하고 YoriZori 애플리케이션을 실행하는 단계별 가이드입니다.**

---

## 📋 필수 요구사항

### 공통

- **Git**: https://git-scm.com/
- **GitHub 계정**: 리포지토리 접근

### BackEnd

- **Java 17 JDK**: https://www.oracle.com/java/technologies/javase-downloads.html
  ```powershell
  java -version  # 확인
  ```
- **MySQL 8.x**: https://dev.mysql.com/downloads/mysql/
  - 또는 **Google Cloud SQL + Cloud SQL Auth Proxy** (선택)
- **Gradle Wrapper**: 프로젝트에 포함됨 ✅

### FrontEnd

- **Node.js 18+**: https://nodejs.org/
  ```powershell
  node --version   # 확인
  npm --version    # 확인
  ```
- **npm 또는 yarn**: Node.js에 포함됨
- **(선택) Expo CLI**: `npm install -g expo-cli`

---

## 🗂️ 1단계: 프로젝트 클론

```powershell
# 리포지토리 클론
git clone https://github.com/yourorg/yorizori.git
cd yorizori

# 브랜치 확인
git branch -a
```

---

## 🔧 2단계: BackEnd 환경 설정

### 2.1 환경 변수 파일 생성

`BackEnd/.env` 파일을 생성하고 아래 값을 입력합니다:

```env
# 데이터베이스 설정 (로컬 MySQL)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=yorizori_DB
DB_USERNAME=root
DB_PASSWORD=your-password

# 또는 전체 JDBC URL (우선순위 높음)
DB_URL=jdbc:mysql://127.0.0.1:3306/yorizori_DB?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul&characterEncoding=UTF-8

# API 키
FOOD_API_KEY=your-food-api-key-from-食品의약품안전처

# JWT 시크릿 (개발용)
JWT_SECRET=dev-secret-change-in-production

# Cloud SQL (선택)
CLOUD_SQL_CONNECTION_NAME=project-id:region:instance-name
```

**⚠️ 중요**: `.env` 파일을 `.gitignore`에 추가하여 커밋 방지

```
# BackEnd/.gitignore에 추가
.env
.env.local
```

### 2.2 MySQL 로컬 설정

#### 옵션 A: 로컬 MySQL 설치

```powershell
# MySQL 서버 시작 (Windows)
net start MySQL80

# MySQL 클라이언트 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE yorizori_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 (선택)
CREATE USER 'testAccount'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON yorizori_DB.* TO 'testAccount'@'localhost';
FLUSH PRIVILEGES;

# 확인
SHOW DATABASES;
EXIT;
```

#### 옵션 B: Cloud SQL + Auth Proxy (선택)

```powershell
# Cloud SQL Auth Proxy 다운로드
# https://cloud.google.com/sql/docs/mysql/sql-proxy

# 실행
cloud-sql-proxy.exe --port=3307 "project-id:region:instance-name"

# .env에서 포트 설정
DB_PORT=3307
```

### 2.3 BackEnd 빌드 & 실행

```powershell
cd BackEnd

# 의존성 확인 (첫 실행 시만 필요)
.\gradlew.bat --version

# 프로젝트 빌드
.\gradlew.bat build

# 개발 서버 실행
.\gradlew.bat bootRun --args='--spring.profiles.active=local'
```

**예상 출력**:

```
...
Started Application in XX.XXX seconds (JVM running for XX.XXX)
```

**서버 확인**:

```powershell
curl http://localhost:8080/api/v1/health
# 또는 브라우저: http://localhost:8080
```

### 2.4 데이터베이스 초기화

서버 시작 시 `SchemaMigrationRunner`가 자동으로:

- 기존 테이블 스키마 검증
- 누락된 테이블 생성
- 기능 테이블 추가

수동으로 확인하려면:

```powershell
mysql -u root -p yorizori_DB
SHOW TABLES;
EXIT;
```

---

## 💻 3단계: FrontEnd 환경 설정

### 3.1 의존성 설치

```powershell
cd FrontEnd

# npm 모듈 설치
npm install

# 또는 yarn
yarn install
```

### 3.2 환경 변수 설정

`.env.local` 파일 생성 (또는 `.env`):

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

**참고**:

- 웹: `http://localhost:8080`
- Android 에뮬레이터: `http://10.0.2.2:8080`
- iOS 시뮬레이터: `http://localhost:8080`

### 3.3 개발 서버 실행

#### 웹 전용

```powershell
npm run web
```

**예상 출력**:

```
Starting Expo server...
Listening on port 5173 (or another available port)
```

브라우저가 자동으로 열리며, `http://localhost:5173` (또는 표시된 포트)에 접속합니다.

#### Expo 개발 서버 (모든 플랫폼)

```powershell
npm run start
```

**조작**:

- `w`: 웹 열기
- `a`: Android 에뮬레이터 열기
- `i`: iOS 시뮬레이터 열기 (macOS만)
- `q`: 종료

### 3.4 의존성 검증

```powershell
npm run doctor

# 또는 수동 검증
npm list  # 설치된 패키지 확인
```

---

## 🧪 4단계: 통합 테스트

### 4.1 BackEnd 테스트

```powershell
cd BackEnd

# 모든 테스트 실행
.\gradlew.bat test

# 특정 테스트 실행
.\gradlew.bat test --tests com.yorizori.auth.JwtTokenProviderTest

# 테스트 결과 확인
# build/reports/tests/test/index.html 열기
```

### 4.2 FrontEnd 테스트

```powershell
cd FrontEnd

# 문법 검사
npm run lint

# 타입 검사 (TypeScript)
npm run type-check

# 빌드 검증
npm run build
```

---

## 📊 5단계: 초기 데이터 로드

### 레시피 데이터 수집

BackEnd가 실행 중일 때 관리자 API를 호출합니다:

```powershell
# curl
curl -X POST "http://localhost:8080/api/v1/admin/ingest/recipes?startIdx=1&endIdx=100"

# PowerShell
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/admin/ingest/recipes?startIdx=1&endIdx=100" -Method Post

# Python
python -m http.client
```

**참고**:

- `startIdx`: 시작 인덱스 (1부터)
- `endIdx`: 끝 인덱스 (포함)
- 첫 100개 레시피 로드 권장 (테스트 목적)

### 진행 상황 확인

```powershell
mysql -u root -p yorizori_DB
SELECT COUNT(*) FROM recipes;
SELECT COUNT(*) FROM ingredients;
EXIT;
```

---

## ✅ 6단계: 애플리케이션 접속 테스트

### 6.1 회원가입 & 로그인

```powershell
# 회원가입
curl -X POST "http://localhost:8080/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"테스트유저"}'

# 로그인
curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 6.2 레시피 조회

```powershell
curl "http://localhost:8080/api/v1/recipes?limit=10"
```

### 6.3 FrontEnd에서 테스트

웹 앱(`http://localhost:5173`)에서:

1. 회원가입 / 로그인
2. 홈 화면 - 레시피 목록 조회
3. 냉장고 - 식재료 추가
4. 추천 - 매칭된 레시피 확인

---

## 🐛 문제 해결

### BackEnd 이슈

| 문제                         | 원인                         | 해결책                                           |
| ---------------------------- | ---------------------------- | ------------------------------------------------ |
| `Port 8080 already in use`   | 다른 프로세스가 포트 사용 중 | `netstat -ano \| findstr :8080` 후 프로세스 종료 |
| `Database connection failed` | MySQL 미실행 또는 설정 오류  | `DB_HOST`, `DB_PORT`, 자격증명 확인              |
| `JWT_SECRET not found`       | 환경변수 미설정              | `.env` 파일 확인                                 |
| `FOOD_API_KEY error`         | API 키 오류                  | 식품의약품안전처 API 키 재발급                   |

### FrontEnd 이슈

| 문제                        | 원인                         | 해결책                                |
| --------------------------- | ---------------------------- | ------------------------------------- |
| `npm ERR! not ok code 1`    | 의존성 설치 실패             | `npm cache clean --force` 후 재설치   |
| `Expo port conflict`        | 포트 충돌                    | 다른 포트 사용 또는 프로세스 종료     |
| `API_BASE_URL not defined`  | 환경변수 미설정              | `.env.local` 확인                     |
| `Cannot connect to backend` | 백엔드 미실행 또는 CORS 오류 | 백엔드 상태 확인, WebConfig CORS 설정 |

### 데이터베이스 이슈

| 문제               | 원인                 | 해결책                                     |
| ------------------ | -------------------- | ------------------------------------------ |
| `Access denied`    | 사용자/비밀번호 오류 | MySQL 자격증명 확인                        |
| `Unknown database` | DB 미생성            | MySQL에서 데이터베이스 생성                |
| `JDBC URL error`   | URL 형식 오류        | URL 포맷 확인: `jdbc:mysql://host:port/db` |

---

## 🚀 완전한 실행 예시 (Windows PowerShell)

```powershell
# 1. 프로젝트 클론
git clone https://github.com/yourorg/yorizori.git
cd yorizori

# 2. BackEnd 실행 (터미널 1)
cd BackEnd
.\gradlew.bat bootRun --args='--spring.profiles.active=local'

# 3. 데이터 로드 (터미널 2)
curl -X POST "http://localhost:8080/api/v1/admin/ingest/recipes?startIdx=1&endIdx=100"

# 4. FrontEnd 실행 (터미널 3)
cd FrontEnd
npm install
npm run web
```

---

## 📦 프로덕션 배포 (참고)

배포는 별도 가이드를 참고하세요. 일반적인 흐름:

1. **BackEnd**: Google Cloud Run 배포
2. **FrontEnd**: Firebase Hosting 배포
3. **Database**: Google Cloud SQL

---

**마지막 업데이트**: 2026-06-09
