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
import { colors, globalStyles, type } from "../theme";
import { dateKey, sumNutrition } from "../utils/nutrition";
import {
  buildPreferredIngredientWeights,
  filterRecipes,
  getMatchInfo,
  recommendedRecipes,
} from "../utils/recipes";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function Stat({ value, label, last }) {
  return (
    <View style={[styles.stat, !last && styles.statDivider]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function NutrientBar({ label, value, unit, ratio, color }) {
  return (
    <View style={styles.nutrientRow}>
      <Text style={styles.nutrientLabel}>{label}</Text>
      <View style={styles.nutrientTrack}>
        <View style={[styles.nutrientFill, { width: `${Math.min(100, ratio * 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.nutrientValue}>
        {value}
        <Text style={styles.nutrientUnit}>{unit}</Text>
      </Text>
    </View>
  );
}

function FeaturedRecipe({ recipe, onPress }) {
  if (!recipe) return null;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.featured, pressed && { opacity: 0.92 }]}>
      <Image source={{ uri: recipe.imageUrl }} style={styles.featuredImage} resizeMode="cover" />
      <View style={styles.featuredScrim} />
      <View style={styles.featuredBody}>
        <Text style={styles.featuredEyebrow}>오늘 만들어 볼까요</Text>
        <Text style={styles.featuredName} numberOfLines={2}>{recipe.name}</Text>
        <Text style={styles.featuredMeta}>{recipe.method || "조리"} · {recipe.calories}kcal</Text>
      </View>
    </Pressable>
  );
}

function CarouselTile({ recipe, pantryItems, onPress }) {
  const match = getMatchInfo(recipe, pantryItems);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.86 }]}>
      <Image source={{ uri: recipe.imageUrl }} style={styles.tileImage} resizeMode="contain" />
      <Text style={styles.tileName} numberOfLines={1}>{recipe.name}</Text>
      <View style={styles.tileMetaRow}>
        <Text style={styles.tileMeta}>{recipe.calories}kcal</Text>
        <View style={styles.tileDot} />
        <MaterialCommunityIcons name="fridge-outline" size={12} color={colors.primaryDark} />
        <Text style={styles.tileMatch}>{match.matched.length}개 보유</Text>
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
    avoidIngredients,
  } = useAppData();
  const [selectedSeasonal, setSelectedSeasonal] = useState(null);

  const now = new Date();
  const month = now.getMonth() + 1;
  const dateLabel = `${month}월 ${now.getDate()}일 ${WEEKDAYS[now.getDay()]}요일`;
  const selectedPantry = pantryItems.filter((item) => item.isSelected);
  const todayLogs = nutritionLogs.filter(
    (log) => log.date === dateKey(new Date()),
  );
  const todayNutrition = sumNutrition(todayLogs);

  const preferredWeights = useMemo(
    () => buildPreferredIngredientWeights(nutritionLogs, recipes),
    [nutritionLogs, recipes],
  );
  const homeRecipes = useMemo(
    () =>
      recommendedRecipes(
        recipes,
        selectedPantry.length ? selectedPantry : pantryItems,
        7,
        { avoidIngredients, preferredWeights },
      ),
    [recipes, pantryItems, selectedPantry, avoidIngredients, preferredWeights],
  );
  const [featuredRecipe, ...carouselRecipes] = homeRecipes;

  const seasonalRecipes = useMemo(() => {
    if (!selectedSeasonal) return [];
    const selectedItem = seasonalIngredients.find(
      (item) => item.name === selectedSeasonal,
    );
    return selectedItem?.recipes || [];
  }, [seasonalIngredients, selectedSeasonal]);

  const expiringSoonItems = useMemo(
    () => pantryItems.filter((item) => item.expiringSoon),
    [pantryItems],
  );
  const expiringRecipes = useMemo(() => {
    if (!expiringSoonItems.length) return [];
    return filterRecipes(recipes, {
      pantryItems: expiringSoonItems,
      sortByPantry: true,
      avoidIngredients,
      preferredWeights,
    })
      .filter((recipe) => getMatchInfo(recipe, expiringSoonItems).matched.length > 0)
      .slice(0, 3);
  }, [recipes, expiringSoonItems, avoidIngredients, preferredWeights]);

  if (loading) return <LoadingState />;

  return (
    <SafeAreaView style={globalStyles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={globalStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Masthead: typographic, no boxed stat grid up top */}
        <View style={styles.masthead}>
          <View style={styles.mastheadTop}>
            <Text style={styles.dateLabel}>{dateLabel}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: backendOnline ? colors.primary : colors.warning }]} />
              <Text style={styles.statusLabel}>{backendOnline ? "백엔드 연결됨" : "목업 데이터"}</Text>
            </View>
          </View>
          <Text style={type.display}>오늘 뭐 먹지?</Text>
          <Text style={styles.mastheadCopy}>
            냉장고 속 재료를 고르면, 그 재료로 바로 만들 수 있는 메뉴부터 보여드려요.
          </Text>
        </View>

        {/* Featured pick: one large editorial card instead of starting with a stat grid */}
        <FeaturedRecipe
          recipe={featuredRecipe}
          onPress={() => featuredRecipe && navigation.navigate("RecipeDetail", { recipeId: featuredRecipe.id })}
        />

        {/* Inline numeric strip — same data the old 3-box grid showed, but reads as one line */}
        <View style={styles.statRow}>
          <Stat value={pantryItems.length} label="보유 재료" />
          <Stat value={selectedPantry.length} label="선택한 재료" />
          <Stat value={todayLogs.length} label="오늘 식사 기록" last />
        </View>

        {/* Seasonal strip: flat band, no card border, horizontal scroll */}
        <View>
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
              <Text style={type.label}>제철 식재료 정보를 불러오지 못했어요.</Text>
            )}
          </ScrollView>
          {selectedSeasonal ? (
            <View style={styles.seasonalResult}>
              <Text style={styles.miniTitle}>{selectedSeasonal}로 만들 수 있는 메뉴</Text>
              {seasonalRecipes.length ? (
                seasonalRecipes.slice(0, 2).map((recipe) => (
                  <Pressable
                    key={recipe.id}
                    onPress={() => navigation.navigate("RecipeDetail", { recipeId: recipe.id })}
                    style={({ pressed }) => [styles.compactRecipe, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={styles.compactRecipeName}>{recipe.name}</Text>
                    <Text style={styles.compactRecipeMeta}>{recipe.calories}kcal · {recipe.category}</Text>
                  </Pressable>
                ))
              ) : (
                <Text style={type.label}>아직 연결된 레시피가 없어요.</Text>
              )}
            </View>
          ) : null}
        </View>

        {/* Pantry: light flat card, content as inline tags rather than a boxed grid */}
        <Card flat>
          <SectionHeader
            title="내 냉장고"
            icon="fridge-outline"
            actionLabel="전체 보기"
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
              <Text style={type.body}>냉장고에서 오늘 요리할 재료를 골라보세요.</Text>
              <PrimaryButton
                label="재료 선택하기"
                icon="fridge-outline"
                onPress={() => navigation.navigate("Fridge")}
                style={{ marginTop: 14 }}
              />
            </View>
          )}
        </Card>

        {/* Expiring-soon tie-in: surfaces the differentiation feature only when relevant */}
        {expiringSoonItems.length ? (
          <View>
            <SectionHeader title="유통기한이 다가와요 · 이걸로 만들어보세요" icon="clock-alert-outline" />
            <Text style={styles.expiryHint}>
              {expiringSoonItems.slice(0, 3).map((item) => item.name).join(", ")}
              {expiringSoonItems.length > 3 ? ` 외 ${expiringSoonItems.length - 3}개` : ""}의 소비기한이 얼마 남지 않았어요.
            </Text>
            {expiringRecipes.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carousel}
              >
                {expiringRecipes.map((recipe) => (
                  <CarouselTile
                    key={recipe.id}
                    recipe={recipe}
                    pantryItems={pantryItems}
                    onPress={() => navigation.navigate("RecipeDetail", { recipeId: recipe.id })}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text style={type.label}>아직 추천할 레시피를 찾지 못했어요.</Text>
            )}
          </View>
        ) : null}

        {/* Nutrition: horizontal bars instead of four identical icon boxes */}
        <Card>
          <SectionHeader
            title="오늘 섭취 요약"
            icon="chart-donut"
            actionLabel="자세히"
            onAction={() => navigation.navigate("Nutrition")}
          />
          <Text style={styles.caloriesHeadline}>
            {Math.round(todayNutrition.calories)}
            <Text style={styles.caloriesUnit}> kcal</Text>
          </Text>
          <View style={styles.nutrientList}>
            <NutrientBar label="탄수화물" value={Math.round(todayNutrition.carbs)} unit="g" ratio={todayNutrition.carbs / 300} color={colors.warning} />
            <NutrientBar label="단백질" value={Math.round(todayNutrition.protein)} unit="g" ratio={todayNutrition.protein / 120} color={colors.danger} />
            <NutrientBar label="나트륨" value={Math.round(todayNutrition.sodium)} unit="mg" ratio={todayNutrition.sodium / 2000} color={colors.primary} />
          </View>
        </Card>

        {/* Recommended recipes: horizontal carousel for a different rhythm than the wrapped grid in Recipes */}
        <View>
          <SectionHeader
            title={selectedPantry.length ? "내 재료로 만들 수 있는 메뉴" : "오늘의 추천"}
            icon="chef-hat"
            actionLabel="더보기"
            onAction={() => navigation.navigate("Recipes")}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {carouselRecipes.map((recipe) => (
              <CarouselTile
                key={recipe.id}
                recipe={recipe}
                pantryItems={pantryItems}
                onPress={() => navigation.navigate("RecipeDetail", { recipeId: recipe.id })}
              />
            ))}
          </ScrollView>
        </View>

        <PrimaryButton
          label="레시피 둘러보기"
          icon="magnify"
          onPress={() => navigation.navigate("Recipes", { sortByPantry: true })}
          style={styles.mainCta}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  masthead: {
    paddingTop: 6,
    gap: 10,
  },
  mastheadTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateLabel: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "600",
  },
  mastheadCopy: {
    color: colors.textSoft,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    maxWidth: 320,
  },

  featured: {
    height: 200,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(33,26,20,0.38)",
  },
  featuredBody: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 18,
  },
  featuredEyebrow: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  featuredName: {
    color: colors.surface,
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  featuredMeta: {
    marginTop: 5,
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "600",
  },

  statRow: {
    flexDirection: "row",
  },
  stat: {
    flex: 1,
    paddingRight: 14,
  },
  statDivider: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
    marginRight: 14,
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  statLabel: {
    marginTop: 2,
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "500",
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
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 14,
  },
  compactRecipe: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  compactRecipeName: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  compactRecipeMeta: {
    marginTop: 2,
    color: colors.textSoft,
    fontWeight: "500",
    fontSize: 12,
  },

  expiryHint: {
    marginTop: -2,
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
  },

  selectedWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedIngredient: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedIngredientText: {
    color: colors.primaryDark,
    fontWeight: "700",
    fontSize: 13,
  },

  caloriesHeadline: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: -4,
  },
  caloriesUnit: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSoft,
  },
  nutrientList: {
    marginTop: 16,
    gap: 12,
  },
  nutrientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nutrientLabel: {
    width: 56,
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "600",
  },
  nutrientTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  nutrientFill: {
    height: "100%",
    borderRadius: 3,
  },
  nutrientValue: {
    width: 56,
    textAlign: "right",
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  nutrientUnit: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
  },

  carousel: {
    gap: 12,
    paddingRight: 8,
  },
  tile: {
    width: 152,
  },
  tileImage: {
    width: 152,
    height: 152,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
  },
  tileName: {
    marginTop: 9,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  tileMetaRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tileMeta: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "500",
  },
  tileDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.muted,
  },
  tileMatch: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
  },

  mainCta: {
    marginTop: 4,
    marginBottom: 6,
  },
});
