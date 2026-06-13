import React, { useEffect, useMemo, useState } from "react";
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
import * as Location from "expo-location";

import { fetchCurrentWeather, weatherDescription } from "../api/weather";

import {
  Card,
  Chip,
  LoadingState,
  PrimaryButton,
  SectionHeader,
} from "../components/ui";
import { useAppData } from "../context/AppDataContext";
import { colors, globalStyles, shadow, type } from "../theme";
import { dateKey, sumNutrition } from "../utils/nutrition";
import {
  buildPreferredIngredientWeights,
  filterRecipes,
  getMatchInfo,
  recommendedRecipes,
} from "../utils/recipes";


function WeatherCard({ weather, loading }) {
  if (!loading && !weather) return null;

  if (loading) {
    return (
      <View style={styles.weatherCard}>
        <View style={styles.weatherSkeleton} />
      </View>
    );
  }

  const { label, icon } = weatherDescription(weather.skyCode, weather.ptyCode);
  const hasRange = weather.tmn != null && weather.tmx != null;

  return (
    <View style={styles.weatherCard}>
      <View style={styles.weatherLeft}>
        <MaterialCommunityIcons name={icon} size={44} color={colors.primary} />
        <View style={styles.weatherTempBlock}>
          <Text style={styles.weatherTemp}>{weather.temp}°</Text>
          <Text style={styles.weatherLabel}>{label}</Text>
        </View>
      </View>
      <View style={styles.weatherRight}>
        {hasRange && (
          <Text style={styles.weatherRange}>
            최저 {Math.round(weather.tmn)}° · 최고 {Math.round(weather.tmx)}°
          </Text>
        )}
        {weather.humidity != null && (
          <Text style={styles.weatherHumidity}>습도 {weather.humidity}%</Text>
        )}
      </View>
    </View>
  );
}

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
        {recipe.category ? (
          <View style={styles.featuredTag}>
            <Text style={styles.featuredTagText}>{recipe.category}</Text>
          </View>
        ) : null}
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
    recipes,
    pantryItems,
    nutritionLogs,
    seasonalIngredients,
    avoidIngredients,
  } = useAppData();
  const [selectedSeasonal, setSelectedSeasonal] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { setWeatherLoading(false); return; }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const data = await fetchCurrentWeather(loc.coords.latitude, loc.coords.longitude);
        setWeather(data);
      } catch {
        // 날씨 로드 실패 시 카드를 조용히 숨김
      } finally {
        setWeatherLoading(false);
      }
    })();
  }, []);

  const month = new Date().getMonth() + 1;
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
        {/* App Header */}
        <View style={styles.appHeader}>
          <View style={styles.logoRow}>
            <MaterialCommunityIcons name="chef-hat" size={28} color={colors.primary} />
            <Text style={styles.logoText}>
              요리<Text style={styles.logoAccent}>조리</Text>
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate("Recipes")}
            style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.65 }]}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="magnify" size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* Weather */}
        <WeatherCard weather={weather} loading={weatherLoading} />

        {/* Featured */}
        <FeaturedRecipe
          recipe={featuredRecipe}
          onPress={() => featuredRecipe && navigation.navigate("RecipeDetail", { recipeId: featuredRecipe.id })}
        />

        {/* Stats */}
        <Card flat style={styles.statRow}>
          <Stat value={pantryItems.length} label="보유 재료" />
          <Stat value={selectedPantry.length} label="선택한 재료" />
          <Stat value={todayLogs.length} label="오늘 식사 기록" last />
        </Card>

        {/* 내 냉장고 */}
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

        {/* 오늘의 추천 — 냉장고 바로 아래 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <SectionHeader
              title={selectedPantry.length ? "내 재료로 만들 수 있는 메뉴" : "오늘의 추천"}
              icon="chef-hat"
              actionLabel="더보기"
              onAction={() => navigation.navigate("Recipes")}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectionCarousel}
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

        {/* 제철 식재료 */}
        <Card flat>
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
                  onPress={() => setSelectedSeasonal(selectedSeasonal === item.name ? null : item.name)}
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
        </Card>

        {/* 유통기한 임박 */}
        {expiringSoonItems.length ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHead}>
              <SectionHeader title="유통기한이 다가와요" icon="clock-alert-outline" />
              <Text style={styles.expiryHint}>
                {expiringSoonItems.slice(0, 3).map((item) => item.name).join(", ")}
                {expiringSoonItems.length > 3 ? ` 외 ${expiringSoonItems.length - 3}개` : ""}의 소비기한이 얼마 남지 않았어요.
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sectionCarousel}
            >
              {expiringRecipes.length ? (
                expiringRecipes.map((recipe) => (
                  <CarouselTile
                    key={recipe.id}
                    recipe={recipe}
                    pantryItems={pantryItems}
                    onPress={() => navigation.navigate("RecipeDetail", { recipeId: recipe.id })}
                  />
                ))
              ) : (
                <Text style={[type.label, { paddingBottom: 18 }]}>아직 추천할 레시피를 찾지 못했어요.</Text>
              )}
            </ScrollView>
          </View>
        ) : null}

        {/* 오늘 섭취 요약 */}
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
  weatherCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weatherSkeleton: {
    flex: 1,
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  weatherLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  weatherTempBlock: {
    gap: 2,
  },
  weatherTemp: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  weatherLabel: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "600",
  },
  weatherRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  weatherRange: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  weatherHumidity: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "600",
  },

  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingBottom: 2,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
  },
  logoAccent: {
    color: colors.primary,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
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
  featuredTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  featuredTagText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
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

  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
    ...shadow,
  },
  sectionHead: {
    padding: 18,
    paddingBottom: 4,
  },
  sectionCarousel: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 12,
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
