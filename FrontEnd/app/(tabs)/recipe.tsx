import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '@/src/components/common/Screen';
import SoftInput from '@/src/components/common/SoftInput';
import SectionHeader from '@/src/components/common/SectionHeader';
import Chip from '@/src/components/common/Chip';
import RecipeCard from '@/src/components/recipe/RecipeCard';
import { useFridgeStore } from '@/src/store';
import { RECIPES } from '@/src/mocks/recipes';

export default function RecipeScreen() {
  const router = useRouter();
  const { items } = useFridgeStore();
  const [query, setQuery] = useState('');

  const fridgeNames = useMemo(() => new Set(items.map((i) => i.name)), [items]);

  const filtered = useMemo(() => {
    if (!query) return RECIPES;
    const keyword = query.trim();
    return RECIPES.filter((r) =>
      r.title.includes(keyword) || r.ingredients.some((i) => i.name.includes(keyword))
    );
  }, [query]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-extrabold text-text mb-3">레시피</Text>
        <SoftInput placeholder="식재료 키워드 검색" value={query} onChangeText={setQuery} />

        <View className="mt-4">
          <SectionHeader title="내 재료로 빠른 검색" />
          <View className="flex-row flex-wrap">
            {items.slice(0, 6).map((i) => (
              <Chip key={i.id} label={i.name} onPress={() => setQuery(i.name)} />
            ))}
          </View>
        </View>

        <View className="mt-4">
          <SectionHeader title="보유 재료 기반 추천" />
          {filtered.map((recipe) => {
            const matchNames = recipe.ingredients.filter((i) => fridgeNames.has(i.name)).map((i) => i.name);
            const missingNames = recipe.ingredients.filter((i) => !fridgeNames.has(i.name)).map((i) => i.name);
            return (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                matchCount={matchNames.length}
                missingCount={missingNames.length}
                matchedNames={matchNames}
                missingNames={missingNames}
                onPress={() => router.push(`/recipe/${recipe.id}`)}
              />
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
