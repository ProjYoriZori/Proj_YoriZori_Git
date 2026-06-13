import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  Card,
  Chip,
  useToast,
  EmptyState,
  Field,
  IconButton,
  PrimaryButton,
  SectionHeader,
} from "../components/ui";
import { api } from "../api/client";
import { useAppData } from "../context/AppDataContext";
import { colors, globalStyles, shadow } from "../theme";
import { getMatchInfo } from "../utils/recipes";

const mealTypes = ["아침", "점심", "저녁", "간식"];

function extractAmountSuffix(name, amount) {
  if (!amount || !name) return null;
  const suffix = amount.startsWith(name) ? amount.slice(name.length).trim() : amount.trim();
  return suffix || null;
}

function NutritionStat({ label, value, unit, last }) {
  return (
    <View style={[styles.nutritionStat, !last && styles.nutritionDivider]}>
      <Text style={styles.nutritionName} numberOfLines={1}>{label}</Text>
      <Text style={styles.nutritionValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {Math.round(Number(value || 0))}
      </Text>
      <Text style={styles.nutritionUnit} numberOfLines={1}>{unit}</Text>
    </View>
  );
}

function TimerModal({
  visible,
  onClose,
  seconds,
  setSeconds,
  running,
  setRunning,
}) {
  const [inputMin, setInputMin] = useState("5");
  const [inputSec, setInputSec] = useState("0");
  const displayMin = String(Math.floor(seconds / 60)).padStart(2, "0");
  const displaySec = String(seconds % 60).padStart(2, "0");

  const start = (min, sec = 0) => {
    const total = Number(min || 0) * 60 + Number(sec || 0);
    if (total <= 0) return;
    setSeconds(total);
    setRunning(true);
  };

  const isIdle = !running && seconds === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.timerCard}>
          <View style={globalStyles.between}>
            <Text style={styles.modalTitle}>조리 타이머</Text>
            <IconButton icon="close" size={34} onPress={onClose} />
          </View>

          <View style={styles.timerDisplay}>
            <Text style={styles.timerText}>
              {displayMin}:{displaySec}
            </Text>
          </View>

          {isIdle ? (
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Field
                  value={inputMin}
                  onChangeText={setInputMin}
                  keyboardType="number-pad"
                  placeholder="0"
                  style={styles.timerInputField}
                />
                <Text style={styles.inputUnit}>분</Text>
              </View>
              <Text style={styles.inputColon}>:</Text>
              <View style={styles.inputGroup}>
                <Field
                  value={inputSec}
                  onChangeText={(v) => {
                    const n = Number(v);
                    if (n >= 0 && n <= 59) setInputSec(v);
                  }}
                  keyboardType="number-pad"
                  placeholder="0"
                  style={styles.timerInputField}
                />
                <Text style={styles.inputUnit}>초</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.timerActions}>
            {isIdle ? (
              <PrimaryButton
                label="시작"
                icon="play"
                onPress={() => start(inputMin, inputSec)}
                style={{ flex: 1 }}
              />
            ) : (
              <>
                <PrimaryButton
                  label={running ? "일시정지" : "재개"}
                  icon={running ? "pause" : "play"}
                  onPress={() => setRunning(!running)}
                  style={{ flex: 1 }}
                />
                <IconButton
                  icon="restart"
                  size={48}
                  onPress={() => { setRunning(false); setSeconds(0); }}
                />
              </>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickTimerList}
          >
            {[{ min: 1, sec: 0 }, { min: 3, sec: 0 }, { min: 5, sec: 0 }, { min: 10, sec: 0 }, { min: 0, sec: 30 }].map((t) => (
              <Chip
                key={`${t.min}:${t.sec}`}
                label={t.min > 0 ? `${t.min}분` : `${t.sec}초`}
                onPress={() => start(t.min, t.sec)}
                icon="timer-outline"
              />
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function RecipeDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const {
    recipes,
    pantryItems,
    addMissingIngredientsToShopping,
    addNutritionLogFromRecipe,
  } = useAppData();
  const recipeId = String(route.params?.recipeId || "");
  const [recipe, setRecipe] = useState(
    () => recipes.find((item) => item.id === recipeId) || null,
  );
  const { showToast, ToastContainer } = useToast();
  const [mealType, setMealType] = useState("점심");
  const [logVisible, setLogVisible] = useState(false);
  const [timerVisible, setTimerVisible] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const { width } = useWindowDimensions();
  const heroHeight = Math.max(240, Math.min(420, Math.round(width * 0.68)));

  useEffect(() => {
    const initialRecipe = recipes.find((item) => item.id === recipeId) || null;
    if (!initialRecipe) return;

    setRecipe((current) => {
      if (!current) return initialRecipe;
      if (current.id !== recipeId) return initialRecipe;
      if (!current.steps?.length && initialRecipe.steps?.length)
        return initialRecipe;
      return current;
    });
  }, [recipeId, recipes]);

  useEffect(() => {
    let cancelled = false;

    if (!recipeId) return undefined;

    const loadRecipeDetail = async () => {
      try {
        const fetchedRecipe = await api.getRecipe(recipeId);
        if (!cancelled && fetchedRecipe) {
          setRecipe(fetchedRecipe);
        }
      } catch {
        // Keep the list snapshot if the detail request fails.
      }
    };

    loadRecipeDetail();

    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  const playDing = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/ding.wav"),
        { shouldPlay: true, volume: 1.0 },
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) sound.unloadAsync();
      });
    } catch {
      Vibration.vibrate([0, 200, 100, 200, 100, 400]);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert("⏰ 띠링~!", "타이머가 완료됐어요!", [{ text: "확인", style: "default" }]);
  };

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const TIMER_SIZE = 58;
  const insetsRef = useRef(insets);
  useEffect(() => { insetsRef.current = insets; }, [insets]);

  function snapToEdge(rawX, rawY) {
    const ins = insetsRef.current;
    const minX = 12;
    const maxX = screenWidth - TIMER_SIZE - 12;
    const minY = (ins.top || 50) + 12;
    const maxY = screenHeight - TIMER_SIZE - (ins.bottom || 34) - 90;
    const clampX = v => Math.max(minX, Math.min(maxX, v));
    const clampY = v => Math.max(minY, Math.min(maxY, v));
    const cx = rawX + TIMER_SIZE / 2;
    const cy = rawY + TIMER_SIZE / 2;
    const dLeft = cx;
    const dRight = screenWidth - cx;
    const dTop = cy - (ins.top || 50);
    const dBottom = screenHeight - (ins.bottom || 34) - 90 - cy;
    const min = Math.min(dLeft, dRight, dTop, dBottom);
    if (min === dLeft)  return { x: minX, y: clampY(rawY), edge: 'left' };
    if (min === dRight) return { x: maxX, y: clampY(rawY), edge: 'right' };
    if (min === dTop)   return { x: clampX(rawX), y: minY, edge: 'top' };
    return { x: clampX(rawX), y: maxY, edge: 'bottom' };
  }

  function constrainToEdge(rawX, rawY, edge) {
    const ins = insetsRef.current;
    const minX = 12;
    const maxX = screenWidth - TIMER_SIZE - 12;
    const minY = (ins.top || 50) + 12;
    const maxY = screenHeight - TIMER_SIZE - (ins.bottom || 34) - 90;
    const clampX = v => Math.max(minX, Math.min(maxX, v));
    const clampY = v => Math.max(minY, Math.min(maxY, v));
    if (edge === 'left')   return { x: minX, y: clampY(rawY) };
    if (edge === 'right')  return { x: maxX, y: clampY(rawY) };
    if (edge === 'top')    return { x: clampX(rawX), y: minY };
    return { x: clampX(rawX), y: maxY };
  }

  const startPosition = { x: screenWidth - TIMER_SIZE - 12, y: screenHeight / 2 - TIMER_SIZE / 2 };
  const pan = useRef(new Animated.ValueXY(startPosition)).current;
  const origin = useRef(startPosition);
  const moved = useRef(false);
  const currentEdge = useRef('right');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        moved.current = false;
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5) moved.current = true;
        const rawX = origin.current.x + gesture.dx;
        const rawY = origin.current.y + gesture.dy;
        const pos = constrainToEdge(rawX, rawY, currentEdge.current);
        pan.setValue(pos);
      },
      onPanResponderRelease: (_, gesture) => {
        const rawX = origin.current.x + gesture.dx;
        const rawY = origin.current.y + gesture.dy;
        const snapped = snapToEdge(rawX, rawY);
        currentEdge.current = snapped.edge;
        origin.current = { x: snapped.x, y: snapped.y };
        pan.setValue(origin.current);
        if (!moved.current) setTimerVisible(true);
      },
    }),
  ).current;

  useEffect(() => {
    if (!running) return undefined;
    const interval = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setRunning(false);
          playDing();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const match = useMemo(
    () =>
      recipe ? getMatchInfo(recipe, pantryItems) : { matched: [], missing: [] },
    [recipe, pantryItems],
  );

  const matchedSet = useMemo(() => new Set(match.matched), [match.matched]);

  const sectionedIngredients = useMemo(() => {
    if (!recipe) return [];
    const sections = [];
    const sectionMap = new Map();
    for (const ingredient of recipe.ingredients) {
      const key = ingredient.section || "";
      if (!sectionMap.has(key)) {
        const group = { section: ingredient.section || null, ingredients: [] };
        sectionMap.set(key, group);
        sections.push(group);
      }
      sectionMap.get(key).ingredients.push(ingredient);
    }
    return sections;
  }, [recipe]);

  if (!recipe) {
    return (
      <SafeAreaView style={globalStyles.screen}>
        <View style={styles.backRow}>
          <IconButton
            icon="arrow-left"
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          />
        </View>
        <EmptyState
          icon="book-remove-outline"
          title="레시피를 찾을 수 없어요"
        />
      </SafeAreaView>
    );
  }

  const logMeal = async () => {
    await addNutritionLogFromRecipe(recipe, mealType);
    setLogVisible(false);
  };

  return (
    <View style={globalStyles.screen}>
      <ScrollView
        contentContainerStyle={globalStyles.detailContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: recipe.imageUrl }}
            style={[styles.heroImage, { height: heroHeight }]}
            resizeMode="contain"
          />
          <View style={styles.imageOverlay} />
          {/* back button moved out to fixed overlay so it stays visible while scrolling */}
          <View style={styles.titleBlock}>
            <Text style={styles.detailTitle}>{recipe.name}</Text>
            <Text style={styles.detailMeta}>
              {recipe.method || "조리"} · {recipe.category || "레시피"} · {recipe.calories}kcal
            </Text>
          </View>
        </View>

        <Card style={styles.firstCard}>
          <SectionHeader title="영양 정보" icon="chart-box-outline" />
          <View style={styles.nutritionRow}>
            <NutritionStat label="칼로리" value={recipe.calories} unit="kcal" />
            <NutritionStat label="탄수" value={recipe.carbs} unit="g" />
            <NutritionStat label="단백질" value={recipe.protein} unit="g" />
            <NutritionStat label="지방" value={recipe.fat} unit="g" />
            <NutritionStat label="나트륨" value={recipe.sodium} unit="mg" last />
          </View>
        </Card>

        <Card>
          <SectionHeader
            title={`재료 ${recipe.ingredients.length}가지`}
            icon="food-apple-outline"
          />
          {sectionedIngredients.map(({ section, ingredients }) => (
            <View key={section || "__none__"} style={styles.ingredientSection}>
              {section ? (
                <Text style={styles.ingredientTitle}>{section}</Text>
              ) : null}
              <View style={styles.ingredientWrap}>
                {ingredients.map((ingredient) => {
                  const has = matchedSet.has(ingredient.name);
                  const amountLabel = extractAmountSuffix(ingredient.name, ingredient.amount);
                  return (
                    <Chip
                      key={ingredient.name}
                      label={ingredient.name}
                      amount={amountLabel}
                      active={has}
                      icon={has ? "check" : "basket-plus-outline"}
                      tone={has ? undefined : "warning"}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </Card>

        <Card>
          <SectionHeader title="조리 단계" icon="pot-steam-outline" />
          <View style={styles.steps}>
            {recipe.steps.map((step) => (
              <View key={step.stepNo} style={styles.stepRow}>
                <View style={styles.stepNo}>
                  <Text style={styles.stepNoText}>{step.stepNo}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {step.imageUrl ? (
                    <Image
                      source={{ uri: step.imageUrl }}
                      style={styles.stepImage}
                    />
                  ) : null}
                  <Text style={styles.stepText}>{step.instruction}</Text>
                  {step.durationMin ? (
                    <Text style={styles.stepTime}>
                      {step.durationMin}분 예상
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>

      {/* Fixed back button: stays visible while scrolling and has safer top offset */}
      <SafeAreaView
        pointerEvents="box-none"
        style={[styles.fixedBack, { top: insets.top + 10, left: 12 }]}
      >
        <IconButton
          icon="arrow-left"
          backgroundColor="rgba(255,255,255,0.98)"
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
        />
      </SafeAreaView>

      <View style={[styles.bottomActions, { paddingBottom: 16 + insets.bottom }]}>
        <PrimaryButton
          label="식사 기록"
          icon="playlist-plus"
          onPress={() => setLogVisible(true)}
          style={{ flex: 1 }}
        />
        <PrimaryButton
          label="장보기 추가"
          icon="basket-plus-outline"
          tone="secondary"
          disabled={!match.missing.length}
          onPress={() => {
            addMissingIngredientsToShopping(recipe, match.missing);
            showToast(`${match.missing.length}개 재료가 장보기에 추가됐어요`);
          }}
          style={{ flex: 1 }}
        />
      </View>

      {ToastContainer}

      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.floatingTimer, pan.getLayout()]}
      >
        {seconds > 0 ? (
          <Text style={styles.floatingTimerText}>
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
          </Text>
        ) : (
          <MaterialCommunityIcons name="timer-outline" size={28} color={colors.surface} />
        )}
      </Animated.View>

      <TimerModal
        visible={timerVisible}
        onClose={() => setTimerVisible(false)}
        seconds={seconds}
        setSeconds={setSeconds}
        running={running}
        setRunning={setRunning}
      />

      <Modal
        visible={logVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLogVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLogVisible(false)}
        >
          <Pressable style={[styles.sheet, { paddingBottom: 28 + insets.bottom }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>먹은 음식으로 기록</Text>
            <Text style={globalStyles.subtitle}>
              {recipe.name} · {recipe.calories}kcal
            </Text>
            <View style={styles.mealGrid}>
              {mealTypes.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  active={mealType === type}
                  onPress={() => setMealType(type)}
                  icon="silverware-fork-knife"
                />
              ))}
            </View>
            <PrimaryButton label="기록하기" icon="check" onPress={logMeal} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    marginHorizontal: -18,
    marginBottom: 16,
  },
  heroImage: {
    width: "100%",
    minHeight: 240,
    backgroundColor: colors.surfaceAlt,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  imageSafe: {
    position: "absolute",
    top: 0,
    left: 18,
  },
  titleBlock: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 22,
  },
  detailTitle: {
    color: colors.surface,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  detailMeta: {
    marginTop: 7,
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "600",
  },
  firstCard: {
    marginTop: -2,
  },
  nutritionRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  nutritionStat: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  nutritionDivider: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  stepImage: {
    width: "100%",
    aspectRatio: 1.6,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: colors.surfaceAlt,
  },
  nutritionName: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "600",
  },
  nutritionValue: {
    marginTop: 6,
    width: "100%",
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  nutritionUnit: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  ingredientSection: {
    marginTop: 2,
    marginBottom: 12,
  },
  ingredientTitle: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  ingredientWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  steps: {
    gap: 16,
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
  },
  stepNo: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNoText: {
    color: colors.surface,
    fontWeight: "700",
  },
  stepText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  stepTime: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  bottomActions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  floatingTimer: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  floatingTimerText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20,35,27,0.42)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  timerCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: colors.surface,
    padding: 18,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  timerDisplay: {
    marginTop: 18,
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 24,
    alignItems: "center",
  },
  timerText: {
    color: colors.text,
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 0,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 14,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timerInputField: {
    width: 76,
    height: 52,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    borderWidth: 0,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
  },
  inputUnit: {
    color: colors.textSoft,
    fontSize: 15,
    fontWeight: "800",
    width: 18,
  },
  inputColon: {
    color: colors.muted,
    fontSize: 26,
    fontWeight: "700",
    paddingHorizontal: 2,
  },
  timerActions: {
    flexDirection: "row",
    gap: 10,
  },
  quickTimerList: {
    gap: 8,
    paddingTop: 12,
    paddingBottom: 2,
  },
  sheet: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    marginTop: "auto",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: colors.surface,
    padding: 18,
    paddingBottom: 28,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  mealGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 18,
  },
  backRow: {
    padding: 18,
  },
  fixedBack: {
    position: "absolute",
    zIndex: 40,
    // left/top are provided inline to account for safe-area insets
  },
});
