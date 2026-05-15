# Compact Assistant Workflow

이 문서는 Copilot CLI 또는 다른 로컬 AI 도구에 최소 컨텍스트만 전달하기 위한 절차를 정리합니다.

## Goal

- 전체 저장소를 붙여넣지 않습니다.
- `.env` 값, API Key, DB 비밀번호, JWT Secret은 공유하지 않습니다.
- 실패한 명령의 핵심 로그와 관련 파일 경로만 전달합니다.
- 질문은 한 번에 하나의 좁은 문제로 제한합니다.

## Generate Context

```powershell
.\tools\copilot-compact-context.ps1
```

스크립트는 저장소 루트에 `copilot-context.md`를 생성합니다.

포함 항목:

- 민감정보가 마스킹된 환경 변수 키
- 현재 git 상태
- 백엔드 로컬 설정 요약
- 최근 로그 tail
- 검증 명령

## Recommended Prompt Shape

```text
이 컨텍스트를 보고 가장 작은 수정 범위로 문제를 해결해줘.
목표: <한 문장>
실패 명령: <명령>
관련 파일: <파일 경로>
```

## Backend Verification Commands

```powershell
cd BackEnd
.\gradlew.bat compileJava
.\gradlew.bat test
.\gradlew.bat bootRun --args='--spring.profiles.active=local'
```

## Frontend Verification Commands

```powershell
cd FrontEnd
npm run lint
npx tsc --noEmit
```

## API Smoke Tests

```powershell
Invoke-RestMethod "http://localhost:8080/api/v1/recipes?limit=3"
Invoke-RestMethod "http://localhost:8080/api/v1/seasonal-ingredients"
```

인증 API:

```powershell
$body = @{
  email = "test@example.com"
  password = "password1234"
  nickname = "tester"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/v1/auth/signup" -ContentType "application/json" -Body $body
```

## Rules

- `.env` 원문을 보내지 않습니다.
- 긴 로그는 마지막 100~200줄만 보냅니다.
- DB 비밀번호, 식약처 API Key, JWT Secret은 `[REDACTED]`로 치환합니다.
- 기능 변경 후에는 `BackEnd/BEREADME.md`, `BackEnd/BACKEND_STRUCTURE.md`, `HOW_TO_RUN.md`도 함께 확인합니다.
