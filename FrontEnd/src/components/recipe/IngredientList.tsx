import React from 'react';
import { View, Text } from 'react-native';
import type { RecipeIngredient } from '../../types';
import Chip from '../common/Chip';

type Props = {
  title: string;
  items: RecipeIngredient[];
};

export default function IngredientList({ title, items }: Props) {
  return (
    <View className="mb-4">
      <Text className="font-bold text-text mb-2">{title}</Text>
      <View className="flex-row flex-wrap">
        {items.map((item) => (
          <Chip key={item.name} label={`${item.name} ${item.amount}`} />
        ))}
      </View>
    </View>
  );
}
