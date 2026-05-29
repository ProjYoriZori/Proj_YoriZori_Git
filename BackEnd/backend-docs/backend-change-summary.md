# Backend Change Summary

## 개요
이 문서는 YoriZori 백엔드에 반영된 수정 사항을 정리한 내용입니다. 사용자 요청에 따라 백엔드 관련 변경만 적용되었으며, 빌드 확인까지 수행했습니다.

## 반영된 주요 백엔드 변경 사항

### 1. 회원가입 이메일 검증 강화
- `AuthService`에 이메일 형식 정규식 검사 추가
- `signup`과 `login`에서 이메일을 소문자화하고 공백 제거 후 검증
- 잘못된 이메일 형식에 대해 `Invalid email format.` 예외 처리

### 2. 탈퇴 회원 처리(Soft Delete)
- `users` 테이블에 `is_deleted`와 `deleted_at` 컬럼 추가
- `SchemaMigrationRunner`에서 해당 컬럼을 생성 및 보장하도록 업데이트
- `AuthService`에서 탈퇴한 사용자에 대한 로그인 / 조회 차단
- `AppFeatureService`에 `deleteMe` 서비스 추가
- `AppFeatureController`에 `DELETE /api/v1/users/me` 엔드포인트 추가

### 3. 로그아웃 및 UI 진입점 처리
- `AuthController`에 `POST /api/v1/auth/logout` 유지
- 프론트엔드에서 사용할 수 있는 placeholder 엔드포인트 추가
  - `POST /api/v1/auth/find-email`
  - `POST /api/v1/auth/forgot-password`
- 두 엔드포인트는 현재 미구현 상태이며, UI 진입점으로 사용 가능

### 4. 추천 및 검색 로직 개선
- `RecipeQueryRepository`에서 검색어와 재료명을 공백 제거 버전으로도 매칭
- 토큰 길이가 짧을 경우 과도한 부분 매칭을 제한하여 오추천 감소
- `recommendRecipes`에서 추천 결과가 없으면 랜덤/최신 레시피로 fallback 반환
- 검색 시 `ing.name`과 `ri.original_name`을 모두 검사하도록 확장

### 5. 재료명 정규화 및 동의어 처리 기본 지원
- 간단한 재료 동의어 매핑을 `RecipeQueryRepository.normalize`에 추가
  - `계란` / `달걀` 통합
  - `대파` → `파`
  - `방울토마토` / `방울토마토소박이` 통합
- 검색어와 재료명 모두 공백 제거 후 비교

### 6. 상세 레시피 응답 확장
- `RecipeIngredientResponse`에 `unit` 및 `note` 필드 추가
- 현재 값은 기본적으로 빈 문자열로 설정되며, 향후 데이터 정제 작업에서 채워질 수 있음

## 검증 결과
- `BackEnd` 디렉터리에서 `./gradlew.bat clean build` 실행
- 결과: `BUILD SUCCESSFUL`
- 백엔드 주요 소스 파일 대상 컴파일 에러 없음

## 변경된 주요 파일
- `BackEnd/src/main/java/com/yorizori/auth/AuthService.java`
- `BackEnd/src/main/java/com/yorizori/auth/AuthController.java`
- `BackEnd/src/main/java/com/yorizori/config/SchemaMigrationRunner.java`
- `BackEnd/src/main/java/com/yorizori/feature/AppFeatureController.java`
- `BackEnd/src/main/java/com/yorizori/feature/AppFeatureService.java`
- `BackEnd/src/main/java/com/yorizori/feature/AppFeatureRepository.java`
- `BackEnd/src/main/java/com/yorizori/recipe/dto/RecipeIngredientResponse.java`
- `BackEnd/src/main/java/com/yorizori/recipe/repository/RecipeQueryRepository.java`

## 비고
- 회원탈퇴는 안전한 Soft Delete 방식으로 처리되었습니다.
- 비밀번호 찾기 / 이메일 찾기는 현재 UI 진입점만 지원하며, 실제 인증 로직은 추후 구현 필요합니다.
- 추가로 필요한 경우, DB 동의어 테이블 및 상세 재료 파서 개선 작업을 이어서 진행할 수 있습니다.
