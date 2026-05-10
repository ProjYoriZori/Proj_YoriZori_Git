import React, { useMemo, useRef } from 'react';
import { ScrollView, Text, View, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import Screen from '@/src/components/common/Screen';
import SoftCard from '@/src/components/common/SoftCard';
import SoftButton from '@/src/components/common/SoftButton';
import Chip from '@/src/components/common/Chip';
import SectionHeader from '@/src/components/common/SectionHeader';
import StepCard from '@/src/components/recipe/StepCard';
import { RECIPES } from '@/src/mocks/recipes';
import { useCartStore, useFridgeStore, useMealStore, useTimerStore } from '@/src/store';

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const recipe = useMemo(() => RECIPES.find((r) => r.id === id) || RECIPES[0], [id]);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const { items } = useFridgeStore();
  const { addItem } = useCartStore();
  const { addMeal } = useMealStore();
  const { start } = useTimerStore();

  const fridgeNames = useMemo(() => new Set(items.map((i) => i.name)), [items]);
  const matched = recipe.ingredients.filter((i) => fridgeNames.has(i.name));
  const missing = recipe.ingredients.filter((i) => !fridgeNames.has(i.name));

  const onAddToCart = () => {
    missing.forEach((m) => addItem(m.name));
    bottomSheetRef.current?.dismiss();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-extrabold text-text mb-3">{recipe.title}</Text>
        <Image source={{ uri: recipe.image }} className="w-full h-44 rounded-3xl" />

        <View className="flex-row justify-between mt-3">
          <Text className="text-sm text-muted">{recipe.calories} kcal</Text>
          <Text className="text-sm text-muted">{recipe.method}</Text>
          <Text className="text-sm text-muted">{recipe.category}</Text>
        </View>

        <View className="mt-5">
          <SectionHeader title="영양 정보" />
          <SoftCard>
            <Text className="text-sm text-text">칼로리 {recipe.nutrition.kcal} kcal</Text>
            <Text className="text-sm text-text mt-1">탄수화물 {recipe.nutrition.carbs} g</Text>
            <Text className="text-sm text-text mt-1">단백질 {recipe.nutrition.protein} g</Text>
            <Text className="text-sm text-text mt-1">지방 {recipe.nutrition.fat} g</Text>
            <Text className="text-sm text-text mt-1">나트륨 {recipe.nutrition.sodium} mg</Text>
          </SoftCard>
        </View>

        <View className="mt-5">
          <SectionHeader title="재료" />
          <SoftCard>
            <Text className="text-xs text-muted mb-2">내가 가진 재료</Text>
            <View className="flex-row flex-wrap mb-3">
              {matched.length ? matched.map((m) => <Chip key={m.name} label={`${m.name} ${m.amount}`} />) : <Text className="text-sm text-muted">없음</Text>}
            </View>
            <Text className="text-xs text-muted mb-2">부족한 재료</Text>
            <View className="flex-row flex-wrap">
              {missing.map((m) => <Chip key={m.name} label={`${m.name} ${m.amount}`} />)}
            </View>
          </SoftCard>
        </View>

        <View className="mt-5">
          <SectionHeader title="조리 단계" />
          {recipe.steps.map((step, idx) => (
            <StepCard key={idx} index={idx + 1} text={step} onTimer={() => start(`${recipe.title} 타이머`, 300)} />
          ))}
        </View>

        <View className="mt-6">
          <SoftButton label="먹은 음식으로 기록하기" variant="secondary" onPress={() => { addMeal(recipe); router.back(); }} />
          <View className="h-3" />
          <SoftButton label="부족 재료 장보기에 추가" onPress={() => bottomSheetRef.current?.present()} />
        </View>
      </ScrollView>

      <BottomSheetModal ref={bottomSheetRef} snapPoints={['40%']} backgroundStyle={{ borderRadius: 24 }}>
        <BottomSheetView style={{ padding: 20 }}>
          <Text className="text-lg font-bold text-text mb-3">부족 재료</Text>
          <View className="flex-row flex-wrap">
            {missing.map((m) => (
              <Chip key={m.name} label={`${m.name} ${m.amount}`} />
            ))}
          </View>
          <View className="mt-4">
            <SoftButton label="장보기 추가" onPress={onAddToCart} />
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </Screen>
  );
}
