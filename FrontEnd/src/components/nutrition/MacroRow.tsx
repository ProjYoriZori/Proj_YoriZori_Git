import React from 'react';
import { View, Text } from 'react-native';

type Props = {
  carbs: number;
  protein: number;
  fat: number;
};

export default function MacroRow({ carbs, protein, fat }: Props) {
  return (
    <View className="flex-row justify-between mt-4">
      <View className="bg-white rounded-3xl px-4 py-3 flex-1 mr-2 items-center">
        <Text className="text-base font-bold text-text">{carbs}g</Text>
        <Text className="text-xs text-muted mt-1">Carbs</Text>
      </View>
      <View className="bg-white rounded-3xl px-4 py-3 flex-1 mr-2 items-center">
        <Text className="text-base font-bold text-text">{protein}g</Text>
        <Text className="text-xs text-muted mt-1">Protein</Text>
      </View>
      <View className="bg-white rounded-3xl px-4 py-3 flex-1 items-center">
        <Text className="text-base font-bold text-text">{fat}g</Text>
        <Text className="text-xs text-muted mt-1">Fat</Text>
      </View>
    </View>
  );
}
