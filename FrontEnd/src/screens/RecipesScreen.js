import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Chip, EmptyState, Field, LoadingState } from "../components/ui";
import { useAppData } from "../context/AppDataContext";
import { colors, globalStyles } from "../theme";
import { filterRecipes, getMatchInfo } from "../utils/recipes";

function RecipeRow({ recipe, pantryItems, onPress }) {
  const match = getMatchInfo(recipe, pantryItems);
  const { width } = useWindowDimensions();
  const imageSize = Math.max(72, Math.min(112, Math.round(width * 0.18)));
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.recipeRow, pressed && { opacity: 0.85 }]}
    >
      <Image
        source={{ uri: recipe.imageUrl }}
        style={[styles.image, { width: imageSize, height: imageSize }]}
        resizeMode="contain"
      />
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName}>{recipe.name}</Text>
        <Text style={styles.recipeMeta}>
          {recipe.method || "조리"} · {recipe.category || "레시피"} ·{" "}
          {recipe.cookingTime || 0}분
        </Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: "#fff2ea" }]}>
            <MaterialCommunityIcons
              name="fire"
              size={13}
              color={colors.secondary}
            />
            <Text style={[styles.badgeText, { color: colors.secondary }]}>
              {recipe.calories}kcal
            </Text>
          </View>
          <View style={styles.badge}>
            <MaterialCommunityIcons
              name="fridge-outline"
              size={13}
              color={colors.primaryDark}
            />
            <Text style={styles.badgeText}>{match.matched.length}개 보유</Text>
          </View>
          {match.missing.length ? (
            <View style={[styles.badge, { backgroundColor: "#fff8e9" }]}>
              <MaterialCommunityIcons
                name="basket-outline"
                size={13}
                color={colors.warning}
              />
              <Text style={[styles.badgeText, { color: colors.warning }]}>
                {match.missing.length}개 필요
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={colors.muted}
      />
    </Pressable>
  );
}

export default function RecipesScreen({ navigation, route }) {
  const { loading, recipes, pantryItems, recipeError, loadRecipes } =
    useAppData();
  const [keyword, setKeyword] = useState("");
  const [ingredient, setIngredient] = useState("");
  const [mode, setMode] = useState(
    route?.params?.sortByPantry ? "pantry" : "all",
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      loadRecipes({
        query: keyword,
        ingredient,
        limit: 1200,
        sort: "latest",
      });
    }, 350);
    return () => clearTimeout(handle);
  }, [keyword, ingredient, loadRecipes]);

  const visibleRecipes = useMemo(
    () =>
      filterRecipes(recipes, {
        keyword,
        ingredient,
        pantryItems,
        sortByPantry: mode === "pantry",
      }),
    [recipes, keyword, ingredient, pantryItems, mode],
  );

  if (loading) return <LoadingState />;

  return (
    <SafeAreaView style={globalStyles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={globalStyles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={globalStyles.title}>레시피</Text>
          <Text style={globalStyles.subtitle}>
            DB에 저장된 레시피를 메뉴명이나 재료로 검색합니다.
          </Text>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.fieldWrap}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={colors.muted}
            />
            <Field
              value={keyword}
              onChangeText={setKeyword}
              placeholder="메뉴명 검색"
              style={styles.searchField}
            />
          </View>
          <View style={styles.fieldWrap}>
            <MaterialCommunityIcons
              name="carrot"
              size={20}
              color={colors.muted}
            />
            <Field
              value={ingredient}
              onChangeText={setIngredient}
              placeholder="재료 검색: 계란, 두부..."
              style={styles.searchField}
            />
          </View>
          <View style={styles.modeRow}>
            <Chip
              label="전체"
              active={mode === "all"}
              onPress={() => setMode("all")}
              icon="format-list-bulleted"
            />
            <Chip
              label="내 재료 우선"
              active={mode === "pantry"}
              onPress={() => setMode("pantry")}
              icon="fridge-outline"
            />
          </View>
        </View>

        <View style={styles.countRow}>
          <Text style={styles.countText}>
            총 {visibleRecipes.length}개의 레시피
          </Text>
        </View>

        <View style={styles.list}>
          {visibleRecipes.map((recipe) => (
            <RecipeRow
              key={recipe.id}
              recipe={recipe}
              pantryItems={pantryItems}
              onPress={() =>
                navigation.navigate("RecipeDetail", { recipeId: recipe.id })
              }
            />
          ))}
        </View>

        {!visibleRecipes.length ? (
          <EmptyState
            icon={recipeError ? "database-alert-outline" : "magnify-close"}
            title={recipeError ? "레시피 API 연결 실패" : "검색 결과가 없어요"}
            body={
              recipeError ||
              "DB에 저장된 레시피가 없거나 검색어와 일치하는 레시피가 없습니다."
            }
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  searchCard: {
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  fieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingLeft: 12,
  },
  searchField: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  countRow: {
    marginTop: 18,
    marginBottom: 8,
  },
  countText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "800",
  },
  list: {
    gap: 12,
  },
  recipeRow: {
    minHeight: 104,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  image: {
    flexShrink: 0,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  recipeMeta: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "900",
  },
});
