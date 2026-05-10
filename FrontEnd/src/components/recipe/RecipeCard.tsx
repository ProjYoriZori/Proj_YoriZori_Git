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
        {recipe.image ? (
          <Image source={{ uri: recipe.image }} className="w-full h-36 rounded-2xl" />
        ) : (
          <View className="w-full h-36 rounded-2xl bg-[#F3E8DD] items-center justify-center">
            <Text className="text-xs text-muted">No DB image</Text>
          </View>
        )}
        <View className="mt-3">
          <Text className="text-lg font-extrabold text-text">{recipe.title}</Text>
          <Text className="text-sm text-muted mt-1">
            {recipe.calories} kcal - missing {missingCount}
          </Text>
        </View>
        <View className="flex-row flex-wrap mt-3">
          <Chip label={`match ${matchCount}`} />
          {recipe.tags?.slice(0, 2).map((tag) => (
            <Chip key={tag} label={tag} />
          ))}
        </View>
        {matchedNames?.length ? (
          <View className="mt-2">
            <Text className="text-xs text-muted mb-1">Matched ingredients</Text>
            <View className="flex-row flex-wrap">
              {matchedNames.slice(0, 4).map((name) => (
                <Chip key={name} label={name} />
              ))}
            </View>
          </View>
        ) : null}
        {missingNames?.length ? (
          <View className="mt-2">
            <Text className="text-xs text-muted mb-1">Missing ingredients</Text>
            <View className="flex-row flex-wrap">
              {missingNames.slice(0, 4).map((name) => (
                <Chip key={name} label={name} />
              ))}
            </View>
          </View>
        ) : null}
      </SoftCard>
    </Pressable>
  );
}
