import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '@/src/components/common/Screen';
import SoftInput from '@/src/components/common/SoftInput';
import SectionHeader from '@/src/components/common/SectionHeader';
import Chip from '@/src/components/common/Chip';
import RecipeCard from '@/src/components/recipe/RecipeCard';
import { useFridgeStore } from '@/src/store';
import { useRecipes } from '@/src/hooks/useRecipes';

export default function RecipeScreen() {
  const router = useRouter();
  const { items } = useFridgeStore();
  const [query, setQuery] = useState('');
  const { recipes, isLoading, error } = useRecipes(query);

  const fridgeNames = useMemo(() => new Set(items.map((item) => item.name)), [items]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-extrabold text-text mb-3">Recipes</Text>
        <SoftInput placeholder="Search by recipe or ingredient" value={query} onChangeText={setQuery} />

        <View className="mt-4">
          <SectionHeader title="Quick search from fridge" />
          <View className="flex-row flex-wrap">
            {items.slice(0, 6).map((item) => (
              <Chip key={item.id} label={item.name} onPress={() => setQuery(item.name)} />
            ))}
          </View>
        </View>

        <View className="mt-4">
          <SectionHeader title="Recipes from your ingredients" />
          {error ? <Text className="text-xs text-muted mb-3">Backend recipe data is unavailable.</Text> : null}
          {isLoading ? <Text className="text-sm text-muted mb-3">Loading recipes...</Text> : null}
          {!isLoading && !recipes.length ? (
            <Text className="text-sm text-muted">No DB recipes loaded.</Text>
          ) : null}
          {recipes.map((recipe) => {
            const matchNames = recipe.ingredients
              .filter((ingredient) => fridgeNames.has(ingredient.name))
              .map((ingredient) => ingredient.name);
            const missingNames = recipe.ingredients
              .filter((ingredient) => !fridgeNames.has(ingredient.name))
              .map((ingredient) => ingredient.name);
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
