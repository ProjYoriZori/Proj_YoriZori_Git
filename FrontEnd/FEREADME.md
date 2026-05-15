# YoriZori FrontEnd

YoriZori 프론트엔드는 Expo Router 기반 React Native 앱입니다. 홈, 레시피, 냉장고, 장보기, 영양, 마이페이지 화면을 중심으로 백엔드 API와 연동하는 구조입니다.

## Stack

- React Native + Expo
- Expo Router
- NativeWind
- Zustand
- lucide-react-native
- react-native-reanimated
- react-native-gesture-handler

## Structure

```text
FrontEnd/
  app/
    (tabs)/
      index.tsx       # 홈
      recipe.tsx      # 레시피 검색/목록
      fridge.tsx      # 내 냉장고
      cart.tsx        # 장보기
      nutrition.tsx   # 영양
      mypage.tsx      # 마이페이지
    recipe/[id].tsx   # 레시피 상세
  src/
    api/              # 백엔드 API 클라이언트
    components/       # 공통/레시피/영양/타이머 컴포넌트
    constants/        # 색상, 레이아웃
    hooks/            # 데이터 훅
    mocks/            # 임시 데이터
    store/            # Zustand 상태
    types/            # 타입 정의
```

## Run

```powershell
cd FrontEnd
npm install
npm run start
```

플랫폼별 실행:

```powershell
npm run android
npm run ios
npm run web
```

## Backend Connection

기본 백엔드 주소는 플랫폼별로 자동 결정됩니다.

- Android Emulator: `http://10.0.2.2:8080`
- Web: 현재 호스트의 `:8080`, `localhost:8080`, `127.0.0.1:8080`
- 기타: `http://localhost:8080`

명시적으로 지정하려면 `.env` 또는 실행 환경에 값을 둡니다.

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

## Implemented Screens

- 홈: 제철 재료 배너, 냉장고 카드, 보유 재료 기반 추천 진입
- 레시피: 메뉴명 검색, 레시피 카드 목록, 영양 요약
- 레시피 상세: 이미지, 재료, 조리 과정, 영양 정보, 플로팅 타이머
- 냉장고: 재료 CRUD UI
- 장보기: 체크리스트 UI
- 영양: 날짜별 섭취 요약 UI
- 마이페이지: 사용자 정보와 목표 관리 UI

## Backend API Targets

프론트에서 연결할 주요 백엔드 API입니다.

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET /api/v1/recipes`
- `GET /api/v1/recipes/{id}`
- `GET /api/v1/pantry-items`
- `POST /api/v1/recommend`
- `POST /api/v1/shopping-items/generate`
- `GET /api/v1/shopping-items`
- `POST /api/v1/nutrition-logs`
- `GET /api/v1/nutrition/daily-summary`
- `GET /api/v1/seasonal-ingredients`
- `POST /api/v1/ocr/ingredients`
- `POST /api/v1/barcode/lookup`

## Verification

```powershell
cd FrontEnd
npm run lint
npx tsc --noEmit
```

## Notes

- 현재 일부 화면은 Zustand mock 상태를 사용합니다.
- 백엔드 인증 API와 연결할 때는 로그인 응답의 `accessToken`을 `Authorization: Bearer <token>`으로 전달합니다.
- OCR과 바코드는 모바일 라이브러리 연결 후 백엔드의 편집 플로우용 API에 결과를 전송하는 방식으로 확장합니다.
