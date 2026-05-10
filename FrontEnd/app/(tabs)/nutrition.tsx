import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Screen from '@/src/components/common/Screen';
import SectionHeader from '@/src/components/common/SectionHeader';
import Chip from '@/src/components/common/Chip';
import SoftCard from '@/src/components/common/SoftCard';
import SoftInput from '@/src/components/common/SoftInput';
import NutritionRing from '@/src/components/nutrition/NutritionRing';
import MacroRow from '@/src/components/nutrition/MacroRow';
import { useMealStore } from '@/src/store';
import { getTodayKey, getYesterdayKey } from '@/src/utils/date';

const RECOMMENDED = { kcal: 2000, carbs: 260, protein: 60, fat: 55 };

type DateMode = 'today' | 'yesterday' | 'custom';

export default function NutritionScreen() {
  const [mode, setMode] = useState<DateMode>('today');
  const [customDate, setCustomDate] = useState('');
  const getSummaryByDate = useMealStore((s) => s.getSummaryByDate);
  const getMealsByDate = useMealStore((s) => s.getMealsByDate);

  const dateKey = useMemo(() => {
    if (mode === 'yesterday') return getYesterdayKey();
    if (mode === 'custom' && customDate) return customDate;
    return getTodayKey();
  }, [mode, customDate]);

  const summary = getSummaryByDate(dateKey);
  const meals = getMealsByDate(dateKey);

  const pct = {
    kcal: Math.round((summary.kcal / RECOMMENDED.kcal) * 100),
    carbs: Math.round((summary.carbs / RECOMMENDED.carbs) * 100),
    protein: Math.round((summary.protein / RECOMMENDED.protein) * 100),
    fat: Math.round((summary.fat / RECOMMENDED.fat) * 100),
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-extrabold text-text mb-3">영양</Text>

        <SectionHeader title="날짜 선택" />
        <View className="flex-row flex-wrap mb-3">
          <Chip label="오늘" selected={mode === 'today'} onPress={() => setMode('today')} />
          <Chip label="어제" selected={mode === 'yesterday'} onPress={() => setMode('yesterday')} />
          <Chip label="날짜" selected={mode === 'custom'} onPress={() => setMode('custom')} />
        </View>
        {mode === 'custom' ? (
          <SoftInput placeholder="YYYY-MM-DD" value={customDate} onChangeText={setCustomDate} />
        ) : null}

        <View className="mt-6">
          <SectionHeader title="섭취 요약" />
          <SoftCard>
            <NutritionRing
              calories={summary.kcal}
              carbs={summary.carbs}
              protein={summary.protein}
              fat={summary.fat}
            />
            <MacroRow carbs={summary.carbs} protein={summary.protein} fat={summary.fat} />
          </SoftCard>
        </View>

        <View className="mt-6">
          <SectionHeader title="권장 섭취량 대비" />
          <SoftCard>
            <Text className="text-sm text-muted">칼로리 {pct.kcal}%</Text>
            <Text className="text-sm text-muted mt-1">탄수화물 {pct.carbs}%</Text>
            <Text className="text-sm text-muted mt-1">단백질 {pct.protein}%</Text>
            <Text className="text-sm text-muted mt-1">지방 {pct.fat}%</Text>
          </SoftCard>
        </View>

        <View className="mt-6">
          <SectionHeader title="먹은 음식 목록" />
          {meals.length === 0 ? (
            <Text className="text-sm text-muted">아직 기록된 음식이 없어요</Text>
          ) : (
            meals.map((meal) => (
              <SoftCard key={meal.id} className="mb-3">
                <Text className="text-base font-bold text-text">{meal.title}</Text>
                <Text className="text-xs text-muted mt-1">{meal.nutrition.kcal} kcal</Text>
              </SoftCard>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
