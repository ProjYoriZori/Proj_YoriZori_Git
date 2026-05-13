# BackEnd 파일 구조 정리

이 문서는 `BackEnd` 폴더 안에 있는 주요 디렉터리와 각 폴더의 역할을 빠르게 이해할 수 있도록 정리한 자료입니다.

## 전체 구조

```text
BackEnd/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/yorizori/
│       │       ├── config/
│       │       ├── foodapi/
│       │       └── recipe/
│       └── resources/
│           ├── application-local.yml
│           ├── db/
│           └── META-INF/
├── bin/
├── build/
├── gradle/
├── chats/
├── tools/
├── build.gradle
├── settings.gradle
└── gradlew / gradlew.bat
```

## 폴더별 역할

### `src/main/java/com/yorizori`

실제 애플리케이션 로직이 들어 있는 핵심 소스 코드입니다.

### `config`

Spring 설정과 애플리케이션 시작 시 필요한 공통 설정이 들어 있습니다.

- `DotenvEnvironmentPostProcessor.java`: `.env` 파일 값을 Spring 환경 변수로 읽어들이는 역할
- `SchemaMigrationRunner.java`: 실행 시 DB 스키마 관련 작업을 돕는 초기화 코드
- `WebConfig.java`: 웹 동작과 관련된 설정을 담당

### `foodapi`

식품의약품안전처 레시피 OpenAPI와 통신하는 코드가 들어 있습니다.

- `FoodApiClient.java`: API 호출 담당
- `FoodApiProperties.java`: API 키, 엔드포인트 같은 설정값 관리
- `FoodApiFetchResult.java`: 호출 결과를 담는 데이터 구조
- `FoodApiParseException.java`: 응답 파싱 실패 시 사용하는 예외

### `recipe`

레시피 도메인과 관련된 기능이 모여 있는 영역입니다.

- `dto`: 요청/응답용 데이터 전송 객체
- `repository`: DB 조회와 저장을 담당하는 계층
- `service`: 비즈니스 로직과 처리 흐름을 담당하는 계층
- `web`: REST API 컨트롤러 등 외부 요청을 받는 계층

### `src/main/resources`

실행 시 함께 읽히는 설정 파일과 정적 리소스가 들어 있습니다.

- `application-local.yml`: 로컬 실행용 설정
- `db/`: SQL 스키마나 초기화 관련 파일
- `META-INF/`: Spring 또는 JVM 실행 시 참고하는 메타 정보

### `bin/main`

컴파일된 클래스와 리소스가 복사된 실행 산출물입니다.

이 폴더는 소스 코드의 원본이 아니라, 실행 또는 배포를 위해 생성된 결과물에 가깝습니다.

### `build`

Gradle 빌드 결과물이 생성되는 폴더입니다.

- 컴파일된 클래스
- 패키징된 JAR
- 중간 생성물

### `gradle`

Gradle Wrapper 관련 파일이 들어 있습니다.

이 폴더 덕분에 로컬에 Gradle이 없어도 프로젝트가 동일한 버전으로 빌드됩니다.

### `chats`

작업 중 기록한 대화/작업 로그 문서가 들어 있는 폴더입니다.

### `tools`

Cloud SQL Proxy 같은 실행 보조 도구를 두는 폴더입니다.

## 루트 파일 역할

- `build.gradle`: 의존성과 빌드 설정
- `settings.gradle`: 프로젝트 이름과 포함 모듈 설정
- `gradlew`, `gradlew.bat`: Gradle Wrapper 실행 스크립트

## 참고

- 실제 개발 시 수정 대상은 대부분 `src/main/java`와 `src/main/resources`입니다.
- `bin`과 `build`는 생성물이라 보통 직접 수정하지 않습니다.
