import { Tabs } from 'expo-router';
import { Home, Utensils, Snowflake, ShoppingCart, PieChart, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFB067',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: { paddingBottom: 10, paddingTop: 8, height: 70, borderTopWidth: 0, backgroundColor: '#FFFDF9' },
      }}>
      {/* 1. 홈 화면 (index.tsx와 연결됨) */}
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      {/* 2. 레시피 화면 */}
      <Tabs.Screen
        name="recipe"
        options={{
          title: '레시피',
          tabBarIcon: ({ color, focused }) => (
            <Utensils size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      {/* 3. 냉장고 화면 */}
      <Tabs.Screen
        name="fridge"
        options={{
          title: '냉장고',
          tabBarIcon: ({ color, focused }) => (
            <Snowflake size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      {/* 4. 장보기 화면 */}
      <Tabs.Screen
        name="cart"
        options={{
          title: '장보기',
          tabBarIcon: ({ color, focused }) => (
            <ShoppingCart size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      {/* 5. 영양 화면 */}
      <Tabs.Screen
        name="nutrition"
        options={{
          title: '영양',
          tabBarIcon: ({ color, focused }) => (
            <PieChart size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      {/* 6. 마이페이지 */}
      <Tabs.Screen
        name="mypage"
        options={{
          title: '마이',
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}