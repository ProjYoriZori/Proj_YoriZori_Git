import React, { useState } from 'react';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
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

function TabLabel({ focused, children }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: focused ? '800' : '700',
        color: focused ? colors.primaryDark : colors.muted,
      }}
    >
      {children}
    </Text>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      tabBar={(props) => (
        <BottomTabBar {...props} insets={{ ...props.insets, bottom: 0 }} />
      )}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 12 + insets.bottom,
          height: 68,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          shadowColor: '#1c3327',
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        },
        tabBarItemStyle: { paddingTop: 8, paddingBottom: 8 },
        tabBarIcon: ({ focused, color }) => {
          const iconColor = focused ? colors.primaryDark : color;
          const iconSize = 23;
          if (route.name === 'Home') {
            return <Ionicons name={focused ? 'home' : 'home-outline'} size={iconSize} color={iconColor} />;
          }
          if (route.name === 'Recipes') {
            return <MaterialCommunityIcons name={focused ? 'silverware-fork-knife' : 'silverware'} size={iconSize} color={iconColor} />;
          }
          if (route.name === 'Shopping') {
            return <Ionicons name={focused ? 'basket' : 'basket-outline'} size={iconSize} color={iconColor} />;
          }
          if (route.name === 'Nutrition') {
            return <MaterialCommunityIcons name={focused ? 'chart-donut' : 'chart-donut-variant'} size={iconSize} color={iconColor} />;
          }
          return <Ionicons name={focused ? 'person' : 'person-outline'} size={iconSize} color={iconColor} />;
        },
        tabBarLabel: ({ focused, children }) => <TabLabel focused={focused}>{children}</TabLabel>,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.muted,
      })}
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
