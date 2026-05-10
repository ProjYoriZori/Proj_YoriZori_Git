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
import { RECIPES } from '@/src/mocks/recipes';
import { SEASONAL_INGREDIENTS } from '@/src/mocks/seasonal';
import { getTodayKey } from '@/src/utils/date';

export default function HomeScreen() {
  const router = useRouter();
  const { items } = useFridgeStore();
  const todayKey = getTodayKey();
  const summary = useMealStore((s) => s.getSummaryByDate(todayKey));
  const [selectedSeasonal, setSelectedSeasonal] = useState<string | null>(null);

  const fridgeNames = useMemo(() => new Set(items.map((i) => i.name)), [items]);
  const expiringCount = items.filter((i) => i.expiresInDays <= 2).length;

  const progress = Math.min(1, summary.kcal / 2000);

  const recommended = useMemo(() => {
    return RECIPES.map((r) => {
      const matchNames = r.ingredients.filter((i) => fridgeNames.has(i.name)).map((i) => i.name);
      const missingNames = r.ingredients.filter((i) => !fridgeNames.has(i.name)).map((i) => i.name);
      const seasonalScore = selectedSeasonal && r.ingredients.some((i) => i.name === selectedSeasonal) ? 1 : 0;
      return { recipe: r, matchNames, missingNames, seasonalScore };
    })
      .sort((a, b) => b.seasonalScore - a.seasonalScore || b.matchNames.length - a.matchNames.length)
      .slice(0, 3);
  }, [fridgeNames, selectedSeasonal]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="flex-row items-center justify-between mb-5">
          <View>
            <Text className="text-xs text-muted">오늘도 즐겁게 요리해요</Text>
            <Text className="text-2xl font-extrabold text-text mt-1">안녕, 요리 친구!</Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-[#FFE8D1] items-center justify-center">
            <Text className="text-xl">🐰</Text>
          </View>
        </View>

        <SectionHeader title="내 냉장고 요약" />
        <SoftCard>
          <View className="flex-row justify-between">
            <StatPill label="보유 식재료" value={`${items.length}개`} />
            <StatPill label="소비기한 임박" value={`${expiringCount}개`} accent="warn" />
          </View>
        </SoftCard>

        <View className="h-4" />

        <SectionHeader title="오늘 섭취 칼로리" />
        <SoftCard>
          <Text className="text-2xl font-extrabold text-text">{summary.kcal} kcal</Text>
          <Text className="text-xs text-muted mt-1">목표 2,000 kcal</Text>
          <View className="h-3 rounded-full bg-[#F3E8DD] mt-3 overflow-hidden">
            <View style={{ width: `${Math.round(progress * 100)}%` }} className="h-3 bg-primary-orange" />
          </View>
        </SoftCard>

        <View className="h-4" />

        <SectionHeader title="5월 제철 식재료 추천" />
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
        <Text className="text-xs text-muted mb-4">선택한 제철 재료가 포함된 레시피를 먼저 추천해요</Text>

        <SectionHeader title="추천 레시피" actionLabel="더보기" onPress={() => router.push('/recipe')} />
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

        <SoftButton label="내 레시피 더 찾기" variant="secondary" onPress={() => router.push('/recipe')} />
      </ScrollView>
    </Screen>
  );
}
