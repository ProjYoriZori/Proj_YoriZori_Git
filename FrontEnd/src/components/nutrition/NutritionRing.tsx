import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

type Props = {
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
};

export default function NutritionRing({ carbs, protein, fat, calories }: Props) {
  const data = [
    { value: carbs, color: '#FFB067' },
    { value: protein, color: '#86D3A5' },
    { value: fat, color: '#FFD93D' },
  ];

  return (
    <View className="items-center">
      <PieChart
        donut
        radius={70}
        innerRadius={45}
        data={data}
        focusOnPress
        centerLabelComponent={() => (
          <View className="items-center">
            <Text className="text-lg font-bold text-text">{calories}</Text>
            <Text className="text-xs text-muted">kcal</Text>
          </View>
        )}
      />
      <View className="flex-row mt-4">
        <Text className="text-xs text-muted mr-3">Carbs</Text>
        <Text className="text-xs text-muted mr-3">Protein</Text>
        <Text className="text-xs text-muted">Fat</Text>
      </View>
    </View>
  );
}
