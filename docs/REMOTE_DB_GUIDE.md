# 원격 서버 연결 가이드

> **아키텍처**: 백엔드 서버(Spring Boot + MySQL)는 **서버 PC 한 곳**에서만 실행합니다.
> 다른 PC는 프론트엔드만 실행하고, **API 엔드포인트(port 8080)에만 접속**합니다.
> MySQL(3306)은 외부에 노출되지 않습니다.

```
[다른 PC: 프론트엔드]  →  HTTP :8080  →  [서버 PC: Spring Boot + MySQL(내부)]
```

---

## 서버 PC 정보

| 항목 | 값 |
|------|----|
| 서버 IP | `172.30.122.174` |
| API 포트 | `8080` |
| MySQL | 서버 PC 내부 전용 (외부 미노출) |
| 방화벽 | 8080 포트 개방 필요 (아래 참조) |

---

## [서버 PC] 사전 설정

### 1. 방화벽 포트 8080 열기

Windows 검색 → **"Windows Defender 방화벽"** → 고급 설정 → 인바운드 규칙 → 새 규칙

| 항목 | 값 |
|------|----|
| 규칙 종류 | 포트 |
| 프로토콜 | TCP |
| 포트 번호 | `8080` |
| 작업 | 연결 허용 |
| 이름 | `YoriZori Backend API` |

### 2. MySQL 실행 확인

MySQL 서비스가 실행 중인지 확인합니다:
```powershell
Get-Service -Name MySQL*
# 상태가 Running이어야 합니다
```

### 3. 백엔드 서버 실행

```powershell
cd BackEnd
.\gradlew.bat bootRun --args="--spring.profiles.active=local"
```

정상 기동 로그:
```
HikariPool-1 - Start completed.       ← DB 연결 성공
Started YoriZoriApplication in X seconds  ← 서버 준비 완료
```

서버가 실행 중인 동안 다른 PC에서 API 접속이 가능합니다.

### 4. 서버 동작 확인

```powershell
curl http://localhost:8080/api/v1/recipes
# 레시피 JSON이 반환되면 성공
```

---

## [다른 PC] 프론트엔드 연결

다른 PC에서는 **백엔드를 설치하지 않아도 됩니다.**
프론트엔드만 설정해서 서버 PC의 API를 호출합니다.

### Step 1. 코드 받기

```powershell
git clone <리포지토리 URL>
cd Proj_YoriZori_Git
```

### Step 2. 프론트엔드 .env 설정

`FrontEnd/` 폴더에 `.env` 파일을 생성합니다:

```powershell
Copy-Item FrontEnd\.env.remote.example FrontEnd\.env
```

`.env` 파일 내용:
```env
EXPO_PUBLIC_API_BASE_URL=http://172.30.122.174:8080
```

### Step 3. 프론트엔드 실행

```powershell
cd FrontEnd
npm install
npm start
```

이후 Expo 앱에서 서버 PC의 API(`172.30.122.174:8080`)를 호출합니다.

### Step 4. 연결 확인

```powershell
curl http://172.30.122.174:8080/api/v1/recipes
# 레시피 목록 JSON이 반환되면 성공
```

---

## 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| `connect ECONNREFUSED 172.30.122.174:8080` | 서버 PC 백엔드 미실행 or 방화벽 | 서버 PC에서 `.\gradlew.bat bootRun` 확인; 방화벽 8080 포트 개방 확인 |
| `connect ETIMEDOUT` | 다른 Wi-Fi 네트워크 | 서버 PC와 동일한 공유기에 연결 필요 |
| 레시피 로딩 안 됨 | `.env` 설정 오류 | `FrontEnd/.env`의 `EXPO_PUBLIC_API_BASE_URL` 값 확인 |
| `Network request failed` | HTTP(S) 차이 | `http://` 로 시작하는지 확인 (HTTPS 아님) |

---

## 참조

- 전체 환경 설정: [SETUP_AND_RUN.md](SETUP_AND_RUN.md)
- API 스펙: [API_ENDPOINTS.md](API_ENDPOINTS.md)
- 백엔드 가이드: [BACKEND_GUIDE.md](BACKEND_GUIDE.md)

---

**마지막 업데이트**: 2026-06-09
