# How to run — ProjYoriZori

이 문서는 로컬에서 프로젝트(BackEnd + FrontEnd)를 실행하기 위한 최소 명령어 모음입니다.

---

**Backend (Spring Boot)**

Prerequisites:

- Java 17 설치
- (Windows) PowerShell 사용 권장

환경 변수: 루트 `BackEnd` 폴더에 `.env` 파일을 두고 아래 값을 채웁니다.

```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_PASSWORD=your-db-password
FOOD_API_KEY=your-food-api-key
CLOUD_SQL_CONNECTION_NAME=project-id:region:instance-name
```

Cloud SQL Auth Proxy (로컬에서 Cloud SQL 연결 시):

```powershell
# 프로젝트 루트에서 proxy 실행 파일이 있을 경우
.\tools\cloud-sql-proxy.exe <CLOUD_SQL_CONNECTION_NAME> --port 3307
# 연결 확인
Test-NetConnection 127.0.0.1 -Port 3307
```

빌드 및 실행 (PowerShell):

```powershell
# 프로젝트 루트에서
cd BackEnd
# 1) Gradle로 빌드
.\gradlew.bat build
# 2) 배포용 JAR 실행 (local profile 사용)
java -jar build\libs\yorizori-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=local

# 또는 개발용으로 바로 실행
.\gradlew.bat bootRun --args='--spring.profiles.active=local'
```

기본 포트: `http://localhost:8080`

관리자 레시피 수집 예시:

```powershell
curl -X POST "http://localhost:8080/api/v1/admin/ingest/recipes?startIdx=1&endIdx=20"
```

---

**Frontend (Expo / React Native)**

Prerequisites:

- Node.js (LTS 권장)
- npm
- Android Studio (Android 에뮬레이터) 또는 Xcode (macOS, iOS 시뮬레이터)

설치 및 실행:

```bash
# FrontEnd 디렉터리로 이동
cd FrontEnd
# 의존성 설치
npm install
# 개발 서버 시작 (Metro / Expo)
npm run start
# 안드로이드 에뮬레이터에서 직접 실행
npm run android
# iOS 시뮬레이터 (macOS 전용)
npm run ios
# 웹으로 열기
npm run web
```

프로젝트 초기화(리셋):

```bash
npm run reset-project
```

Expo 관련: `npx expo start` 또는 `npm run start` 후 Expo DevTools에서 Expo Go 또는 시뮬레이터를 선택합니다.

---

**동시 실행(개발 예시)**

- 터미널 A: 백엔드
  - `cd BackEnd` → `.\gradlew.bat bootRun` 또는 `java -jar ...`
- 터미널 B: 프론트엔드
  - `cd FrontEnd` → `npm run start`

---

문제 발생 시 체크리스트:

- `.env` 값이 정확한지 확인
- `.\gradlew.bat bootRun --args='--spring.profiles.active=local'` 실행 전 Cloud SQL Proxy가 실행 중인지 확인 (127.0.0.1:3307)
- `Connection refused` 또는 `Communications link failure`가 나오면 빌드 문제가 아니라 DB 포트가 닫힌 상태입니다.
- 백엔드 로그에 DB 연결 예외가 없는지 확인
- 프론트엔드: Expo CLI 출력에 에러가 없는지 확인

---

파일 위치: 리포 루트의 `BackEnd` 및 `FrontEnd` 폴더를 기준으로 작성되었습니다.
