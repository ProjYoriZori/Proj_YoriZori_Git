import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import type { Recipe } from '../../types';
import SoftCard from '../common/SoftCard';
import Chip from '../common/Chip';

type Props = {
  recipe: Recipe;
  matchCount: number;
  missingCount: number;
  matchedNames?: string[];
  missingNames?: string[];
  onPress?: () => void;
};

export default function RecipeCard({ recipe, matchCount, missingCount, matchedNames, missingNames, onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <SoftCard className="mb-4">
        <Image source={{ uri: recipe.image }} className="w-full h-36 rounded-2xl" />
        <View className="mt-3">
          <Text className="text-lg font-extrabold text-text">{recipe.title}</Text>
          <Text className="text-sm text-muted mt-1">
            {recipe.calories} kcal • 부족 {missingCount}개
          </Text>
        </View>
        <View className="flex-row flex-wrap mt-3">
          <Chip label={`일치 ${matchCount}`} />
          {recipe.tags?.slice(0, 2).map((t) => (
            <Chip key={t} label={t} />
          ))}
        </View>
        {matchedNames?.length ? (
          <View className="mt-2">
            <Text className="text-xs text-muted mb-1">일치 재료</Text>
            <View className="flex-row flex-wrap">
              {matchedNames.slice(0, 4).map((m) => (
                <Chip key={m} label={m} />
              ))}
            </View>
          </View>
        ) : null}
        {missingNames?.length ? (
          <View className="mt-2">
            <Text className="text-xs text-muted mb-1">부족 재료</Text>
            <View className="flex-row flex-wrap">
              {missingNames.slice(0, 4).map((m) => (
                <Chip key={m} label={m} />
              ))}
            </View>
          </View>
        ) : null}
      </SoftCard>
    </Pressable>
  );
}
