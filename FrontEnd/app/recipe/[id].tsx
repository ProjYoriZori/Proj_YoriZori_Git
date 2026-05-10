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
import { useCartStore, useFridgeStore, useMealStore, useTimerStore } from '@/src/store';
import { useRecipe } from '@/src/hooks/useRecipes';

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { recipe, isLoading, error } = useRecipe(id);

  const { items } = useFridgeStore();
  const { addItem } = useCartStore();
  const { addMeal } = useMealStore();
  const { start } = useTimerStore();

  const fridgeNames = useMemo(() => new Set(items.map((item) => item.name)), [items]);
  const matched = recipe?.ingredients.filter((ingredient) => fridgeNames.has(ingredient.name)) ?? [];
  const missing = recipe?.ingredients.filter((ingredient) => !fridgeNames.has(ingredient.name)) ?? [];

  const onAddToCart = () => {
    missing.forEach((ingredient) => addItem(ingredient.name));
    bottomSheetRef.current?.dismiss();
  };

  if (!recipe) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-base text-muted">
            {isLoading ? 'Loading recipe details...' : error ? 'Backend recipe data is unavailable.' : 'Recipe not found.'}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-extrabold text-text mb-3">{recipe.title}</Text>
        {error ? <Text className="text-xs text-muted mb-3">Backend recipe data is unavailable.</Text> : null}
        {isLoading ? <Text className="text-xs text-muted mb-3">Loading recipe details...</Text> : null}
        {recipe.image ? (
          <Image source={{ uri: recipe.image }} className="w-full h-44 rounded-3xl" />
        ) : (
          <View className="w-full h-44 rounded-3xl bg-[#F3E8DD] items-center justify-center">
            <Text className="text-sm text-muted">No DB image</Text>
          </View>
        )}

        <View className="flex-row justify-between mt-3">
          <Text className="text-sm text-muted">{recipe.calories} kcal</Text>
          <Text className="text-sm text-muted">{recipe.method}</Text>
          <Text className="text-sm text-muted">{recipe.category}</Text>
        </View>

        <View className="mt-5">
          <SectionHeader title="Nutrition" />
          <SoftCard>
            <Text className="text-sm text-text">Calories {recipe.nutrition.kcal} kcal</Text>
            <Text className="text-sm text-text mt-1">Carbs {recipe.nutrition.carbs} g</Text>
            <Text className="text-sm text-text mt-1">Protein {recipe.nutrition.protein} g</Text>
            <Text className="text-sm text-text mt-1">Fat {recipe.nutrition.fat} g</Text>
            <Text className="text-sm text-text mt-1">Sodium {recipe.nutrition.sodium} mg</Text>
          </SoftCard>
        </View>

        <View className="mt-5">
          <SectionHeader title="Ingredients" />
          <SoftCard>
            <Text className="text-xs text-muted mb-2">In your fridge</Text>
            <View className="flex-row flex-wrap mb-3">
              {matched.length ? (
                matched.map((ingredient) => <Chip key={ingredient.name} label={`${ingredient.name} ${ingredient.amount}`} />)
              ) : (
                <Text className="text-sm text-muted">None</Text>
              )}
            </View>
            <Text className="text-xs text-muted mb-2">Missing</Text>
            <View className="flex-row flex-wrap">
              {missing.length ? (
                missing.map((ingredient) => <Chip key={ingredient.name} label={`${ingredient.name} ${ingredient.amount}`} />)
              ) : (
                <Text className="text-sm text-muted">None</Text>
              )}
            </View>
          </SoftCard>
        </View>

        <View className="mt-5">
          <SectionHeader title="Steps" />
          {recipe.steps.length ? (
            recipe.steps.map((step, index) => (
              <StepCard key={`${recipe.id}-${index}`} index={index + 1} text={step} onTimer={() => start(`${recipe.title} timer`, 300)} />
            ))
          ) : (
            <Text className="text-sm text-muted">No cooking steps registered.</Text>
          )}
        </View>

        <View className="mt-6">
          <SoftButton label="Log as eaten" variant="secondary" onPress={() => { addMeal(recipe); router.back(); }} />
          <View className="h-3" />
          <SoftButton label="Add missing ingredients to cart" onPress={() => bottomSheetRef.current?.present()} />
        </View>
      </ScrollView>

      <BottomSheetModal ref={bottomSheetRef} snapPoints={['40%']} backgroundStyle={{ borderRadius: 24 }}>
        <BottomSheetView style={{ padding: 20 }}>
          <Text className="text-lg font-bold text-text mb-3">Missing ingredients</Text>
          <View className="flex-row flex-wrap">
            {missing.map((ingredient) => (
              <Chip key={ingredient.name} label={`${ingredient.name} ${ingredient.amount}`} />
            ))}
          </View>
          <View className="mt-4">
            <SoftButton label="Add to cart" onPress={onAddToCart} />
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </Screen>
  );
}
