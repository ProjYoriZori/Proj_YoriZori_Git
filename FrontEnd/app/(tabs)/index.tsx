import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '@/src/components/common/Screen';
import SectionHeader from '@/src/components/common/SectionHeader';
import SoftCard from '@/src/components/common/SoftCard';
import StatPill from '@/src/components/common/StatPill';
import Chip from '@/src/components/common/Chip';
import SoftButton from '@/src/components/common/SoftButton';
import RecipeCard from '@/src/components/recipe/RecipeCard';
import { useFridgeStore, useMealStore } from '@/src/store';
import { SEASONAL_INGREDIENTS } from '@/src/mocks/seasonal';
import { getTodayKey } from '@/src/utils/date';
import { useRecipes } from '@/src/hooks/useRecipes';

export default function HomeScreen() {
  const router = useRouter();
  const { items } = useFridgeStore();
  const todayKey = getTodayKey();
  const summary = useMealStore((state) => state.getSummaryByDate(todayKey));
  const [selectedSeasonal, setSelectedSeasonal] = useState<string | null>(null);
  const { recipes, error } = useRecipes(selectedSeasonal ?? undefined);

  const fridgeNames = useMemo(() => new Set(items.map((item) => item.name)), [items]);
  const expiringCount = items.filter((item) => item.expiresInDays <= 2).length;
  const progress = Math.min(1, summary.kcal / 2000);

  const recommended = useMemo(() => {
    return recipes
      .map((recipe) => {
        const matchNames = recipe.ingredients
          .filter((ingredient) => fridgeNames.has(ingredient.name))
          .map((ingredient) => ingredient.name);
        const missingNames = recipe.ingredients
          .filter((ingredient) => !fridgeNames.has(ingredient.name))
          .map((ingredient) => ingredient.name);
        const seasonalScore = selectedSeasonal && recipe.ingredients.some((ingredient) => ingredient.name === selectedSeasonal) ? 1 : 0;
        return { recipe, matchNames, missingNames, seasonalScore };
      })
      .sort((a, b) => b.seasonalScore - a.seasonalScore || b.matchNames.length - a.matchNames.length)
      .slice(0, 3);
  }, [fridgeNames, recipes, selectedSeasonal]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="flex-row items-center justify-between mb-5">
          <View>
            <Text className="text-xs text-muted">Cook something good today</Text>
            <Text className="text-2xl font-extrabold text-text mt-1">Hi, YoriZori user</Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-[#FFE8D1] items-center justify-center">
            <Text className="text-xl">YZ</Text>
          </View>
        </View>

        <SectionHeader title="Fridge summary" />
        <SoftCard>
          <View className="flex-row justify-between">
            <StatPill label="Ingredients" value={`${items.length}`} />
            <StatPill label="Expiring soon" value={`${expiringCount}`} accent="warn" />
          </View>
        </SoftCard>

        <View className="h-4" />

        <SectionHeader title="Today calories" />
        <SoftCard>
          <Text className="text-2xl font-extrabold text-text">{summary.kcal} kcal</Text>
          <Text className="text-xs text-muted mt-1">Goal 2,000 kcal</Text>
          <View className="h-3 rounded-full bg-[#F3E8DD] mt-3 overflow-hidden">
            <View style={{ width: `${Math.round(progress * 100)}%` }} className="h-3 bg-primary-orange" />
          </View>
        </SoftCard>

        <View className="h-4" />

        <SectionHeader title="Seasonal picks" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          {SEASONAL_INGREDIENTS.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={selectedSeasonal === item}
              onPress={() => setSelectedSeasonal((prev) => (prev === item ? null : item))}
            />
          ))}
        </ScrollView>
        <Text className="text-xs text-muted mb-4">Recipes with the selected ingredient are shown first.</Text>
        {error ? <Text className="text-xs text-muted mb-3">Backend recipe data is unavailable.</Text> : null}

        <SectionHeader title="Recommended recipes" actionLabel="More" onPress={() => router.push('/recipe')} />
        {!recommended.length ? (
          <Text className="text-sm text-muted mb-4">No DB recipes loaded.</Text>
        ) : null}
        {recommended.map(({ recipe, matchNames, missingNames }) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            matchCount={matchNames.length}
            missingCount={missingNames.length}
            matchedNames={matchNames}
            missingNames={missingNames}
            onPress={() => router.push(`/recipe/${recipe.id}`)}
          />
        ))}

        <SoftButton label="Find all recipes" variant="secondary" onPress={() => router.push('/recipe')} />
      </ScrollView>
    </Screen>
  );
}
