import React, { useEffect, useMemo, useRef, useState } from "react";
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

import { Card, Chip, EmptyState, Field, IconButton, LoadingState } from "../components/ui";
import { useAppData } from "../context/AppDataContext";
import { colors, globalStyles, type } from "../theme";
import {
  buildPreferredIngredientWeights,
  filterRecipes,
  getMatchInfo,
} from "../utils/recipes";

function RecipeRow({ recipe, pantryItems, onPress }) {
  const match = getMatchInfo(recipe, pantryItems);
  const total = match.matched.length + match.missing.length;
  const ratio = total ? match.matched.length / total : 0;
  const { width } = useWindowDimensions();
  const imageSize = Math.max(72, Math.min(108, Math.round(width * 0.17)));
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.recipeRow, pressed && { opacity: 0.8 }]}
    >
      <Image
        source={{ uri: recipe.imageUrl }}
        style={[styles.image, { width: imageSize, height: imageSize }]}
        resizeMode="contain"
      />
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName} numberOfLines={1}>{recipe.name}</Text>
        <Text style={styles.recipeMeta}>
          {recipe.method || "조리"} · {recipe.category || "레시피"}
          {recipe.cookingTime ? ` · ${recipe.cookingTime}분` : ""} · {recipe.calories}kcal
        </Text>
        {total ? (
          <View style={styles.matchRow}>
            <View style={styles.matchTrack}>
              <View style={[styles.matchFill, { width: `${ratio * 100}%` }]} />
            </View>
            <Text style={styles.matchText}>
              재료 {match.matched.length}/{total}
            </Text>
          </View>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
    </Pressable>
  );
}

export default function RecipesScreen({ navigation, route }) {
  const {
    loading,
    recipes,
    pantryItems,
    recipeError,
    loadRecipes,
    nutritionLogs,
    avoidIngredients,
  } = useAppData();
  const [keyword, setKeyword] = useState("");
  const [ingredient, setIngredient] = useState("");
  const [mode, setMode] = useState(
    route?.params?.sortByPantry ? "pantry" : "all",
  );
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const scrollRef = useRef(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      loadRecipes({ query: keyword, ingredient, limit: 1200, sort: "latest" });
    }, 350);
    return () => clearTimeout(handle);
  }, [keyword, ingredient, loadRecipes]);

  useEffect(() => { setPage(0); }, [keyword, ingredient, mode]);
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: true }); }, [page]);

  const preferredWeights = useMemo(
    () => buildPreferredIngredientWeights(nutritionLogs, recipes),
    [nutritionLogs, recipes],
  );

  const visibleRecipes = useMemo(() => filterRecipes(recipes, {
    keyword,
    ingredient,
    pantryItems,
    sortByPantry: mode === "pantry",
    avoidIngredients,
    preferredWeights,
  }), [recipes, keyword, ingredient, pantryItems, mode, avoidIngredients, preferredWeights]);

  const totalPages = Math.ceil(visibleRecipes.length / PAGE_SIZE);
  const pageRecipes = visibleRecipes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) return <LoadingState />;

  return (
    <SafeAreaView style={globalStyles.screen} edges={["top"]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={globalStyles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={globalStyles.between}>
            <Text style={type.title}>레시피</Text>
            <Text style={styles.countText}>총 {visibleRecipes.length.toLocaleString()}개</Text>
          </View>
          <Text style={type.subtitle}>메뉴명이나 재료로 DB에 저장된 레시피를 검색해보세요.</Text>
        </View>

        <Card>
          <View style={styles.fieldWrap}>
            <MaterialCommunityIcons name="magnify" size={19} color={colors.muted} />
            <Field
              value={keyword}
              onChangeText={setKeyword}
              placeholder="메뉴명으로 검색"
              style={styles.searchField}
            />
          </View>
          <View style={[styles.fieldWrap, { marginTop: 10 }]}>
            <MaterialCommunityIcons name="carrot" size={19} color={colors.muted} />
            <Field
              value={ingredient}
              onChangeText={setIngredient}
              placeholder="재료로 검색 (예: 계란, 두부)"
              style={styles.searchField}
            />
          </View>
          <View style={styles.modeRow}>
            <Chip label="전체" active={mode === "all"} onPress={() => setMode("all")} />
            <Chip
              label="내 재료로 만들 수 있는 것 먼저"
              active={mode === "pantry"}
              onPress={() => setMode("pantry")}
              icon="fridge-outline"
            />
          </View>
        </Card>

        <Card style={styles.listCard}>
          {pageRecipes.map((recipe) => (
            <RecipeRow
              key={recipe.id}
              recipe={recipe}
              pantryItems={pantryItems}
              onPress={() => navigation.navigate("RecipeDetail", { recipeId: recipe.id })}
            />
          ))}
          {!visibleRecipes.length ? (
            <EmptyState
              icon={recipeError ? "database-alert-outline" : "magnify-close"}
              title={recipeError ? "레시피 API 연결 실패" : "검색 결과가 없어요"}
              body={recipeError || "DB에 저장된 레시피가 없거나 검색어와 일치하는 레시피가 없습니다."}
            />
          ) : null}
          {totalPages > 1 ? (
            <View style={styles.pagination}>
              <IconButton
                icon="chevron-left"
                onPress={() => setPage((p) => Math.max(0, p - 1))}
                backgroundColor={page === 0 ? colors.border : colors.surfaceAlt}
                color={page === 0 ? colors.muted : colors.text}
              />
              <Text style={styles.pageText}>{page + 1} / {totalPages}</Text>
              <IconButton
                icon="chevron-right"
                onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                backgroundColor={page === totalPages - 1 ? colors.border : colors.surfaceAlt}
                color={page === totalPages - 1 ? colors.muted : colors.text}
              />
            </View>
          ) : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 6,
    gap: 6,
  },
  countText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "600",
  },
  fieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingLeft: 14,
  },
  searchField: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  listCard: {
    padding: 0,
    overflow: "hidden",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pageText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    minWidth: 60,
    textAlign: "center",
  },
  list: {
    gap: 4,
  },
  recipeRow: {
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  image: {
    flexShrink: 0,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  recipeMeta: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  matchRow: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matchTrack: {
    width: 64,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  matchFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  matchText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
  },
});
