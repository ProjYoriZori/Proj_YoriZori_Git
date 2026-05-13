# YORIJORI MVP

귀엽고 둥글둥글한 감성의 레시피 추천 & 영양 관리 앱 (Expo Router 기반).

## Stack

- React Native + Expo (SDK 54, Expo Go 호환)
- Expo Router v3 (File-based routing)
- NativeWind v4 (Tailwind for RN)
- Zustand (전역 상태)
- @gorhom/bottom-sheet, react-native-reanimated, react-native-gesture-handler
- lucide-react-native, react-native-gifted-charts

## Structure

```
app/
   (tabs)/        # 홈, 레시피, 냉장고, 장보기, 영양, 마이페이지
   recipe/[id].tsx
src/
   components/    # 공통/레시피/영양/타이머 UI
   store/         # Zustand 상태
   mocks/         # Mock data
   constants/     # 디자인 토큰
   types/
```

## Run

```bash
npm install
npm run start
```

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
