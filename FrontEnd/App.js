import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { AppDataProvider } from './src/context/AppDataContext';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import RecipesScreen from './src/screens/RecipesScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import FridgeScreen from './src/screens/FridgeScreen';
import ShoppingScreen from './src/screens/ShoppingScreen';
import NutritionScreen from './src/screens/NutritionScreen';
import MyPageScreen from './src/screens/MyPageScreen';
import { colors } from './src/theme';

enableScreens();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    primary: colors.primary,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

const linking = {
  prefixes: [],
  config: {
    screens: {
      MainTabs: {
        path: '',
        screens: {
          Home: '',
          Recipes: 'recipes',
          Shopping: 'shopping',
          Nutrition: 'nutrition',
          MyPage: 'mypage',
        },
      },
      RecipeDetail: 'recipes/:recipeId',
      Fridge: 'fridge',
    },
  },
};


const TAB_ROUTES = [
  { name: 'Home',      title: '홈',    icon: (f) => <Ionicons name={f ? 'home' : 'home-outline'} size={24} color={f ? colors.primaryDark : colors.muted} /> },
  { name: 'Recipes',   title: '레시피', icon: (f) => <MaterialCommunityIcons name={f ? 'silverware-fork-knife' : 'silverware'} size={24} color={f ? colors.primaryDark : colors.muted} /> },
  { name: 'Shopping',  title: '장보기', icon: (f) => <Ionicons name={f ? 'basket' : 'basket-outline'} size={24} color={f ? colors.primaryDark : colors.muted} /> },
  { name: 'Nutrition', title: '영양',  icon: (f) => <MaterialCommunityIcons name={f ? 'chart-donut' : 'chart-donut-variant'} size={24} color={f ? colors.primaryDark : colors.muted} /> },
  { name: 'MyPage',    title: '마이',  icon: (f) => <Ionicons name={f ? 'person' : 'person-outline'} size={24} color={f ? colors.primaryDark : colors.muted} /> },
];

function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const TAB_COUNT = TAB_ROUTES.length;
  const BAR_H = 54;
  const H_PAD = 5;
  const tabWidth = screenWidth / TAB_COUNT;
  const pillWidth = tabWidth - 16;

  const slideAnim = useRef(new Animated.Value(state.index * tabWidth)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      tension: 72,
      friction: 11,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <Animated.View style={[tabBarStyles.bar, {
      bottom: 0,
      height: BAR_H + insets.bottom,
    }]}>
      {/* 슬라이딩 초록 배경 — BAR_H 영역 안에만 위치 */}
      <Animated.View style={[tabBarStyles.pill, {
        width: pillWidth,
        height: BAR_H - H_PAD * 2,
        top: H_PAD,
        left: (tabWidth - pillWidth) / 2,
        transform: [{ translateX: slideAnim }],
      }]} />

      {TAB_ROUTES.map((route, index) => {
        const focused = state.index === index;
        return (
          <Pressable
            key={route.name}
            onPress={() => navigation.navigate(route.name)}
            style={[tabBarStyles.tab, { width: tabWidth, height: BAR_H }]}
          >
            {route.icon(focused)}
            <Text style={[tabBarStyles.label, focused && tabBarStyles.labelActive]}>
              {route.title}
            </Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

const tabBarStyles = {
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    elevation: 8,
  },
  pill: {
    position: 'absolute',
    top: 6,
    borderRadius: 14,
    backgroundColor: '#e4f5ec',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  labelActive: {
    fontWeight: '800',
    color: colors.primaryDark,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈' }} />
      <Tab.Screen name="Recipes" component={RecipesScreen} options={{ title: '레시피' }} />
      <Tab.Screen name="Shopping" component={ShoppingScreen} options={{ title: '장보기' }} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} options={{ title: '영양' }} />
      <Tab.Screen name="MyPage" component={MyPageScreen} options={{ title: '마이' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [screen, setScreen] = useState('auth'); // 'auth' | 'onboarding' | 'main'

  const handleAuth = ({ isNewUser }) => {
    if (isNewUser) {
      setScreen('onboarding');
    } else {
      setScreen('main');
    }
  };

  if (screen === 'auth') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthScreen onAuth={handleAuth} />
      </SafeAreaProvider>
    );
  }

  if (screen === 'onboarding') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <OnboardingScreen onComplete={() => setScreen('main')} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppDataProvider>
        <NavigationContainer theme={navigationTheme} linking={linking}>
          <StatusBar style="dark" />
          <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
            <Stack.Screen name="Fridge" component={FridgeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppDataProvider>
    </SafeAreaProvider>
  );
}
