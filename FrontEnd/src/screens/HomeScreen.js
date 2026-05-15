import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  Card,
  Chip,
  LoadingState,
  PrimaryButton,
  SectionHeader,
} from "../components/ui";
import { useAppData } from "../context/AppDataContext";
import { colors, globalStyles } from "../theme";
import { dateKey, sumNutrition } from "../utils/nutrition";
import { getMatchInfo, recommendedRecipes } from "../utils/recipes";

function StatBox({ icon, label, value, color }) {
  return (
    <View style={styles.statBox}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RecipeTile({ recipe, pantryItems, onPress }) {
  const match = getMatchInfo(recipe, pantryItems);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.recipeTile, pressed && { opacity: 0.86 }]}
    >
      <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} />
      <View style={styles.recipeBody}>
        <Text style={styles.recipeName} numberOfLines={1}>
          {recipe.name}
        </Text>
        <Text style={styles.recipeMeta}>
          {recipe.calories}kcal · {recipe.method}
        </Text>
        <View style={styles.recipeMatch}>
          <MaterialCommunityIcons
            name="fridge-outline"
            size={13}
            color={colors.primaryDark}
          />
          <Text style={styles.recipeMatchText}>
            {match.matched.length}개 보유
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const {
    loading,
    backendOnline,
    recipes,
    pantryItems,
    nutritionLogs,
    seasonalIngredients,
  } = useAppData();
  const [selectedSeasonal, setSelectedSeasonal] = useState(null);

  const month = new Date().getMonth() + 1;
  const selectedPantry = pantryItems.filter((item) => item.isSelected);
  const todayLogs = nutritionLogs.filter(
    (log) => log.date === dateKey(new Date()),
  );
  const todayNutrition = sumNutrition(todayLogs);

  const homeRecipes = useMemo(
    () =>
      recommendedRecipes(
        recipes,
        selectedPantry.length ? selectedPantry : pantryItems,
        4,
      ),
    [recipes, pantryItems, selectedPantry],
  );
  const seasonalRecipes = useMemo(() => {
    if (!selectedSeasonal) return [];
    const selectedItem = seasonalIngredients.find(
      (item) => item.name === selectedSeasonal,
    );
    return selectedItem?.recipes || [];
  }, [seasonalIngredients, selectedSeasonal]);

  if (loading) return <LoadingState />;

  return (
    <SafeAreaView style={globalStyles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={globalStyles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.kicker}>오늘 뭐 먹을까요?</Text>
              <Text style={globalStyles.title}>요리조리</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                backendOnline ? styles.online : styles.offline,
              ]}
            >
              <MaterialCommunityIcons
                name={
                  backendOnline
                    ? "cloud-check-outline"
                    : "database-clock-outline"
                }
                size={15}
                color={backendOnline ? colors.primaryDark : colors.warning}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: backendOnline ? colors.primaryDark : colors.warning,
                  },
                ]}
              >
                {backendOnline ? "백엔드 연결" : "목업 모드"}
              </Text>
            </View>
          </View>
          <Text style={styles.heroCopy}>
            냉장고 재료를 고르면 만들기 쉬운 레시피부터 보여드릴게요.
          </Text>
          <View style={styles.quickStats}>
            <StatBox
              icon="fridge-outline"
              label="보유 재료"
              value={`${pantryItems.length}개`}
              color={colors.primaryDark}
            />
            <StatBox
              icon="checkbox-marked-circle-outline"
              label="선택 재료"
              value={`${selectedPantry.length}개`}
              color={colors.secondary}
            />
            <StatBox
              icon="silverware-fork-knife"
              label="식사 기록"
              value={`${todayLogs.length}끼`}
              color={colors.warning}
            />
          </View>
        </View>

        <Card style={styles.seasonalCard}>
          <SectionHeader title={`${month}월 제철 식재료`} icon="leaf" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipList}
          >
            {seasonalIngredients.length ? (
              seasonalIngredients.map((item) => (
                <Chip
                  key={`${item.month}-${item.name}`}
                  label={item.name}
                  active={selectedSeasonal === item.name}
                  onPress={() =>
                    setSelectedSeasonal(
                      selectedSeasonal === item.name ? null : item.name,
                    )
                  }
                  icon="sprout"
                />
              ))
            ) : (
              <Text style={globalStyles.small}>
                제철 식재료 정보를 불러오지 못했어요.
              </Text>
            )}
          </ScrollView>
          {selectedSeasonal ? (
            <View style={styles.seasonalResult}>
              <Text style={styles.miniTitle}>
                {selectedSeasonal} 관련 레시피
              </Text>
              {seasonalRecipes.length ? (
                seasonalRecipes.slice(0, 2).map((recipe) => (
                  <Pressable
                    key={recipe.id}
                    onPress={() =>
                      navigation.navigate("RecipeDetail", {
                        recipeId: recipe.id,
                      })
                    }
                    style={styles.compactRecipe}
                  >
                    <Text style={styles.compactRecipeName}>{recipe.name}</Text>
                    <Text style={styles.compactRecipeMeta}>
                      {recipe.calories}kcal · {recipe.category}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text style={globalStyles.small}>
                  아직 연결된 레시피가 없어요.
                </Text>
              )}
            </View>
          ) : null}
        </Card>

        <Card>
          <SectionHeader
            title="내 냉장고"
            icon="fridge-outline"
            actionLabel="보기"
            onAction={() => navigation.navigate("Fridge")}
          />
          {selectedPantry.length ? (
            <View style={styles.selectedWrap}>
              {selectedPantry.map((item) => (
                <View key={item.id} style={styles.selectedIngredient}>
                  <Text style={styles.selectedIngredientText}>{item.name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View>
              <Text style={globalStyles.subtitle}>
                냉장고에서 요리할 재료를 선택해 주세요.
              </Text>
              <PrimaryButton
                label="재료 선택하기"
                icon="fridge-outline"
                onPress={() => navigation.navigate("Fridge")}
                style={{ marginTop: 12 }}
              />
            </View>
          )}
        </Card>

        <Card>
          <SectionHeader
            title="오늘 섭취 요약"
            icon="chart-donut"
            actionLabel="자세히"
            onAction={() => navigation.navigate("Nutrition")}
          />
          <View style={styles.nutritionGrid}>
            <StatBox
              icon="fire"
              label="칼로리"
              value={`${Math.round(todayNutrition.calories)}`}
              color={colors.secondary}
            />
            <StatBox
              icon="barley"
              label="탄수화물"
              value={`${Math.round(todayNutrition.carbs)}g`}
              color={colors.warning}
            />
            <StatBox
              icon="food-steak"
              label="단백질"
              value={`${Math.round(todayNutrition.protein)}g`}
              color={colors.danger}
            />
            <StatBox
              icon="shaker-outline"
              label="나트륨"
              value={`${Math.round(todayNutrition.sodium)}`}
              color="#4b8fd9"
            />
          </View>
        </Card>

        <Card>
          <SectionHeader
            title={selectedPantry.length ? "내 재료 추천" : "오늘의 추천"}
            icon="chef-hat"
            actionLabel="더보기"
            onAction={() => navigation.navigate("Recipes")}
          />
          <View style={styles.recipeGrid}>
            {homeRecipes.map((recipe) => (
              <RecipeTile
                key={recipe.id}
                recipe={recipe}
                pantryItems={pantryItems}
                onPress={() =>
                  navigation.navigate("RecipeDetail", { recipeId: recipe.id })
                }
              />
            ))}
          </View>
        </Card>

        <PrimaryButton
          label="레시피 확인하기"
          icon="magnify"
          onPress={() => navigation.navigate("Recipes", { sortByPantry: true })}
          style={styles.mainCta}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 8,
    paddingBottom: 18,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  kicker: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 4,
  },
  heroCopy: {
    marginTop: 8,
    color: colors.textSoft,
    fontWeight: "700",
    lineHeight: 20,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
  },
  online: {
    backgroundColor: "#e8f7ed",
    borderColor: "#cbead4",
  },
  offline: {
    backgroundColor: "#fff7e8",
    borderColor: "#f7ddb1",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
  },
  quickStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    minHeight: 82,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  statValue: {
    marginTop: 5,
    fontSize: 17,
    fontWeight: "900",
  },
  statLabel: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  seasonalCard: {
    marginTop: 2,
  },
  chipList: {
    gap: 8,
    paddingRight: 4,
  },
  seasonalResult: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  miniTitle: {
    color: colors.text,
    fontWeight: "900",
    marginBottom: 8,
  },
  compactRecipe: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  compactRecipeName: {
    color: colors.text,
    fontWeight: "900",
  },
  compactRecipeMeta: {
    marginTop: 2,
    color: colors.textSoft,
    fontWeight: "700",
    fontSize: 12,
  },
  selectedWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedIngredient: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedIngredientText: {
    color: colors.primaryDark,
    fontWeight: "900",
  },
  nutritionGrid: {
    flexDirection: "row",
    gap: 8,
  },
  recipeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  recipeTile: {
    width: "48%",
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  recipeImage: {
    width: "100%",
    height: 104,
    backgroundColor: colors.surfaceAlt,
  },
  recipeBody: {
    padding: 10,
  },
  recipeName: {
    color: colors.text,
    fontWeight: "900",
  },
  recipeMeta: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  recipeMatch: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recipeMatchText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },
  mainCta: {
    marginTop: 2,
    marginBottom: 6,
  },
});
