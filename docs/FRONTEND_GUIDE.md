# FrontEnd 개발 가이드

> **React/Expo 기반 YoriZori FrontEnd 개발 관련 정보입니다.**

---

## 📋 프로젝트 구조

```
FrontEnd/
├── src/
│   ├── api/
│   │   └── client.js              # API 클라이언트 (Fetch API)
│   ├── components/
│   │   └── ui.js                  # 재사용 가능한 UI 컴포넌트
│   ├── screens/
│   │   ├── AuthScreen.js          # 인증 (회원가입/로그인)
│   │   ├── HomeScreen.js          # 홈 / 레시피 목록
│   │   ├── RecipeDetailScreen.js  # 레시피 상세
│   │   ├── FridgeScreen.js        # 냉장고 / 식재료 관리
│   │   ├── RecipesScreen.js       # 레시피 검색/추천
│   │   ├── ShoppingScreen.js      # 장보기 목록
│   │   ├── NutritionScreen.js     # 영양 로깅
│   │   ├── MyPageScreen.js        # 마이페이지 / 설정
│   │   └── OnboardingScreen.js    # 온보딩
│   ├── context/
│   │   └── AppDataContext.js      # 전역 상태 관리 (Context API)
│   ├── data/
│   │   └── mockData.js            # 개발용 더미 데이터
│   ├── utils/
│   │   ├── nutrition.js           # 영양 관련 유틸리티
│   │   └── recipes.js             # 레시피 관련 유틸리티
│   ├── theme.js                   # 테마 / 스타일 정의
│   ├── App.js                     # 메인 앱 컴포넌트
│   └── index.js                   # 엔트리 포인트
├── package.json                   # 의존성
├── vite.config.js                 # Vite 번들러 설정
├── tailwind.config.js             # Tailwind CSS 설정
├── tsconfig.json                  # TypeScript 설정 (선택)
├── eslint.config.js               # ESLint 설정
└── babel.config.js                # Babel 설정
```

---

## 🛠️ 개발 환경 설정

### 1단계: IDE 설정

**VS Code (권장)**

```
1. Extension 설치:
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - ESLint
   - Tailwind CSS IntelliSense

2. 워크스페이스 설정:
   .vscode/settings.json 생성
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode"
   }
```

### 2단계: 의존성 확인

```powershell
npm list

# 주요 패키지:
# - expo
# - react
# - react-native
# - tailwindcss
# - vite
```

### 3단계: 환경변수 설정

`.env.local` (또는 `.env`) 파일 생성:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080

# 또는 다른 환경
# EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080  # Android 에뮬레이터
```

---

## 📱 주요 화면 (Screens) 개발 가이드

### 화면 구조

각 화면은 다음 구조를 따릅니다:

```javascript
// src/screens/ExampleScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import { useAppData } from "../context/AppDataContext";
import { apiClient } from "../api/client";

export const ExampleScreen = () => {
  const { state, dispatch } = useAppData();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 컴포넌트 마운트 시 데이터 로드
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await apiClient.get("/endpoint");
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <ScrollView className="flex-1 bg-white">{/* 화면 내용 */}</ScrollView>;
};
```

### 주요 화면별 기능

#### 1. AuthScreen (인증)

```javascript
// 회원가입 / 로그인
- 이메일 입력
- 비밀번호 입력
- 이름 입력 (회원가입)
- 토큰 저장 (Context)
```

#### 2. HomeScreen (홈)

```javascript
// 인기 레시피 & 추천 제철 식재료
- 인기 레시피 목록
- 제철 식재료 배너
- 빠른 액세스 버튼 (냉장고, 레시피, 영양)
```

#### 3. RecipesScreen (레시피 검색)

```javascript
// 레시피 목록 & 추천
- 검색 바 (키워드 / 재료)
- 필터 (난이도, 조리시간 등)
- 추천 레시피 섹션
- 무한 스크롤 / 페이지네이션
```

#### 4. FridgeScreen (냉장고)

```javascript
// 식재료 관리
- 보유 식재료 목록
- 식재료 추가 / 제거
- 유효기간 관리
- 기피 재료 설정
```

#### 5. NutritionScreen (영양)

```javascript
// 영양 로깅
- 일일 영양 요약 (칼로리, 단백질, 지방, 탄수화물)
- 섭취 음식 기록
- 날짜별 조회
- 그래프 시각화
```

#### 6. ShoppingScreen (장보기)

```javascript
// 부족 재료 감지 & 장보기 목록
- AI 기반 부족 재료 제안
- 체크리스트 형식
- 메모 추가
- 구매 완료 마크
```

---

## 🔗 API 클라이언트 (client.js)

### 구조

```javascript
// src/api/client.js
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

const apiClient = {
  async get(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: this.getHeaders(),
      ...options,
    });
    return this.handleResponse(response);
  },

  async post(endpoint, data, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      ...options,
    });
    return this.handleResponse(response);
  },

  getHeaders() {
    const token = localStorage.getItem("accessToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  },

  async handleResponse(response) {
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  },
};

export { apiClient };
```

### API 호출 예시

```javascript
// 로그인
const response = await apiClient.post("/auth/login", {
  email: "user@example.com",
  password: "password123",
});

// 레시피 조회
const recipes = await apiClient.get("/recipes?limit=50&query=파스타");

// 영양 로그 저장
await apiClient.post("/nutrition-logs", {
  recipeId: 1,
  date: "2026-06-09",
  servingSize: 1,
});
```

---

## 📊 상태 관리 (Context API)

### AppDataContext 구조

```javascript
// src/context/AppDataContext.js
import React, { createContext, useReducer } from "react";

export const AppDataContext = createContext();

const initialState = {
  user: null,
  pantryItems: [],
  recipes: [],
  nutritionLogs: [],
  favorites: [],
  isLoading: false,
  error: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "ADD_PANTRY_ITEM":
      return { ...state, pantryItems: [...state.pantryItems, action.payload] };
    case "SET_RECIPES":
      return { ...state, recipes: action.payload };
    // ... 기타 액션
    default:
      return state;
  }
}

export const AppDataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppDataContext.Provider value={{ state, dispatch }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
};
```

### Context 사용 예시

```javascript
function MyComponent() {
  const { state, dispatch } = useAppData();

  const addItem = (item) => {
    dispatch({
      type: "ADD_PANTRY_ITEM",
      payload: item,
    });
  };

  return (
    <View>
      <Text>보유 식재료: {state.pantryItems.length}개</Text>
      {state.pantryItems.map((item) => (
        <Text key={item.id}>{item.name}</Text>
      ))}
    </View>
  );
}
```

---

## 🎨 스타일링 (Tailwind CSS)

### Tailwind 설정

```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B6B",
        secondary: "#4ECDC4",
      },
    },
  },
  plugins: [],
};
```

### 사용 예시

```javascript
<View className="flex-1 bg-white px-4 py-6">
  <Text className="text-2xl font-bold text-gray-800 mb-4">레시피 목록</Text>
  <View className="bg-gray-100 rounded-lg p-3 mb-2">
    <Text className="text-sm text-gray-600">{recipe.name}</Text>
  </View>
</View>
```

---

## 🧪 컴포넌트 테스트

### 컴포넌트 테스트 예시

```javascript
// __tests__/screens/HomeScreen.test.js
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { HomeScreen } from "../../src/screens/HomeScreen";

describe("HomeScreen", () => {
  test("renders home screen correctly", () => {
    render(<HomeScreen />);

    expect(screen.getByText("요리조리")).toBeTruthy();
    expect(screen.getByText("냉장고")).toBeTruthy();
  });
});
```

### 테스트 실행

```powershell
npm run test
# 또는
npm test
```

---

## 🐛 디버깅 팁

### React DevTools

```powershell
# Expo 개발 서버에서 Shift+M 누르기
# 또는 웹에서 브라우저 DevTools 사용
```

### 네트워크 디버깅

```javascript
// API 요청 로깅
const apiClient = {
  async get(endpoint, options = {}) {
    console.log(`[API] GET ${endpoint}`);
    const response = await fetch(...);
    console.log(`[API] Response:`, response);
    return response.json();
  }
};
```

### 상태 로깅

```javascript
// Context 변경 추적
function appReducer(state, action) {
  console.log(`[Redux] Action:`, action.type, action.payload);
  // ... 로직
  console.log(`[Redux] New State:`, newState);
  return newState;
}
```

---

## 📐 코딩 컨벤션

### 파일명

```javascript
// 컴포넌트
HomeScreen.js; // PascalCase
ui.js; // camelCase
useCustomHook.js; // 훅은 use 접두사

// 유틸
nutrition.js; // camelCase
recipes.js; // camelCase
```

### 컴포넌트 작성

```javascript
// ✅ 올바른 방식
const MyComponent = () => {
  const [state, setState] = useState(null);

  useEffect(() => {
    // 부작용 처리
  }, []);

  return <View>{/* JSX */}</View>;
};

// ❌ 피해야 할 것
function MyComponent() {
  // Class 컴포넌트 (가능하지만 함수형 권장)
}
```

### 주석 작성

```javascript
/**
 * 냉장고에 식재료 추가
 *
 * @param {Object} item - 식재료 정보
 * @param {string} item.id - 식재료 ID
 * @param {string} item.name - 식재료 이름
 * @returns {Promise<void>}
 */
async function addPantryItem(item) {
  // ...
}
```

---

## 🚀 빌드 & 배포

### 개발 서버 실행

```powershell
npm run start
```

### 웹 빌드

```powershell
npm run build
```

### 출력 위치

```
dist/                        # 빌드 결과
```

### 로컬 빌드 테스트

```powershell
npm run build
npm run preview            # 빌드 결과 로컬 미리보기
```

---

## 📚 참고 자료

- **React 공식 문서**: https://react.dev
- **React Native 공식 문서**: https://reactnative.dev
- **Expo 문서**: https://docs.expo.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Vite**: https://vitejs.dev

---

**마지막 업데이트**: 2026-06-09
