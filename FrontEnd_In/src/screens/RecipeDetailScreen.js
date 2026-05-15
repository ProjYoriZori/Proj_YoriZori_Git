import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card, Chip, EmptyState, Field, IconButton, PrimaryButton, SectionHeader } from '../components/ui';
import { useAppData } from '../context/AppDataContext';
import { colors, globalStyles, shadow } from '../theme';
import { getMatchInfo } from '../utils/recipes';

const mealTypes = ['아침', '점심', '저녁', '간식'];

function NutritionStat({ icon, label, value, unit, color }) {
  return (
    <View style={styles.nutritionStat}>
      <MaterialCommunityIcons name={icon} size={19} color={color} />
      <Text style={[styles.nutritionValue, { color }]}>{Math.round(Number(value || 0))}</Text>
      <Text style={styles.nutritionLabel}>{unit}</Text>
      <Text style={styles.nutritionName}>{label}</Text>
    </View>
  );
}

function TimerModal({ visible, onClose, seconds, setSeconds, running, setRunning }) {
  const [inputMin, setInputMin] = useState('5');
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainSeconds = String(seconds % 60).padStart(2, '0');

  const start = (min) => {
    const next = Math.max(1, Number(min || 1)) * 60;
    setSeconds(next);
    setRunning(true);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.timerCard}>
          <View style={globalStyles.between}>
            <Text style={styles.modalTitle}>조리 타이머</Text>
            <IconButton icon="close" size={34} onPress={onClose} />
          </View>
          <View style={styles.timerDisplay}>
            <Text style={styles.timerText}>{minutes}:{remainSeconds}</Text>
          </View>
          {!running && seconds === 0 ? (
            <Field value={inputMin} onChangeText={setInputMin} keyboardType="number-pad" placeholder="분" style={styles.timerInput} />
          ) : null}
          <View style={styles.timerActions}>
            {!running && seconds === 0 ? (
              <PrimaryButton label="시작" icon="play" onPress={() => start(inputMin)} style={{ flex: 1 }} />
            ) : (
              <>
                <PrimaryButton label={running ? '일시정지' : '재개'} icon={running ? 'pause' : 'play'} onPress={() => setRunning(!running)} style={{ flex: 1 }} />
                <IconButton icon="restart" size={48} onPress={() => { setRunning(false); setSeconds(0); }} />
              </>
            )}
          </View>
          <View style={styles.quickTimer}>
            {[1, 3, 5, 10].map((min) => (
              <Chip key={min} label={`${min}분`} onPress={() => start(min)} icon="timer-outline" />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function RecipeDetailScreen({ navigation, route }) {
  const {
    recipes,
    pantryItems,
    addMissingIngredientsToShopping,
    addNutritionLogFromRecipe,
  } = useAppData();
  const recipe = recipes.find((item) => item.id === String(route.params?.recipeId));
  const [mealType, setMealType] = useState('점심');
  const [logVisible, setLogVisible] = useState(false);
  const [timerVisible, setTimerVisible] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  const { width, height } = Dimensions.get('window');
  const startPosition = { x: width - 78, y: height - 220 };
  const pan = useRef(new Animated.ValueXY(startPosition)).current;
  const origin = useRef(startPosition);
  const moved = useRef(false);
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      moved.current = false;
    },
    onPanResponderMove: (_, gesture) => {
      if (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5) moved.current = true;
      const next = {
        x: Math.min(Math.max(12, origin.current.x + gesture.dx), width - 68),
        y: Math.min(Math.max(92, origin.current.y + gesture.dy), height - 96),
      };
      pan.setValue(next);
    },
    onPanResponderRelease: (_, gesture) => {
      origin.current = {
        x: Math.min(Math.max(12, origin.current.x + gesture.dx), width - 68),
        y: Math.min(Math.max(92, origin.current.y + gesture.dy), height - 96),
      };
      pan.setValue(origin.current);
      if (!moved.current) setTimerVisible(true);
    },
  })).current;

  useEffect(() => {
    if (!running) return undefined;
    const interval = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const match = useMemo(() => (recipe ? getMatchInfo(recipe, pantryItems) : { matched: [], missing: [] }), [recipe, pantryItems]);

  if (!recipe) {
    return (
      <SafeAreaView style={globalStyles.screen}>
        <View style={styles.backRow}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        </View>
        <EmptyState icon="book-remove-outline" title="레시피를 찾을 수 없어요" />
      </SafeAreaView>
    );
  }

  const logMeal = async () => {
    await addNutritionLogFromRecipe(recipe, mealType);
    setLogVisible(false);
  };

  return (
    <View style={globalStyles.screen}>
      <ScrollView contentContainerStyle={globalStyles.detailContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: recipe.imageUrl }} style={styles.heroImage} />
          <View style={styles.imageOverlay} />
          <SafeAreaView style={styles.imageSafe} edges={['top']}>
            <IconButton icon="arrow-left" backgroundColor="rgba(255,255,255,0.88)" onPress={() => navigation.goBack()} />
          </SafeAreaView>
          <View style={styles.titleBlock}>
            <Text style={styles.detailTitle}>{recipe.name}</Text>
            <View style={styles.detailBadges}>
              <Text style={styles.detailBadge}>{recipe.method || '조리'}</Text>
              <Text style={styles.detailBadge}>{recipe.category || '레시피'}</Text>
              <Text style={styles.detailBadge}>{recipe.calories}kcal</Text>
            </View>
          </View>
        </View>

        <Card style={styles.firstCard}>
          <SectionHeader title="영양 정보" icon="chart-box-outline" />
          <View style={styles.nutritionRow}>
            <NutritionStat icon="fire" label="칼로리" value={recipe.calories} unit="kcal" color={colors.secondary} />
            <NutritionStat icon="barley" label="탄수" value={recipe.carbs} unit="g" color={colors.warning} />
            <NutritionStat icon="food-steak" label="단백질" value={recipe.protein} unit="g" color={colors.danger} />
            <NutritionStat icon="oil" label="지방" value={recipe.fat} unit="g" color="#8a68d8" />
            <NutritionStat icon="shaker-outline" label="나트륨" value={recipe.sodium} unit="mg" color="#4b8fd9" />
          </View>
        </Card>

        <Card>
          <SectionHeader title={`재료 ${recipe.ingredients.length}가지`} icon="food-apple-outline" />
          {match.matched.length ? (
            <View style={styles.ingredientSection}>
              <Text style={styles.ingredientTitle}>내가 가진 재료</Text>
              <View style={styles.ingredientWrap}>
                {match.matched.map((name) => <Chip key={name} label={name} active icon="check" />)}
              </View>
            </View>
          ) : null}
          {match.missing.length ? (
            <View style={styles.ingredientSection}>
              <Text style={[styles.ingredientTitle, { color: colors.warning }]}>부족한 재료</Text>
              <View style={styles.ingredientWrap}>
                {match.missing.map((name) => <Chip key={name} label={name} icon="basket-plus-outline" tone="warning" />)}
              </View>
            </View>
          ) : null}
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
                  <Text style={styles.stepText}>{step.instruction}</Text>
                  {step.durationMin ? (
                    <Text style={styles.stepTime}>{step.durationMin}분 예상</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>

      <View style={styles.bottomActions}>
        <PrimaryButton label="식사 기록" icon="playlist-plus" onPress={() => setLogVisible(true)} style={{ flex: 1 }} />
        <PrimaryButton
          label="장보기 추가"
          icon="basket-plus-outline"
          tone="secondary"
          disabled={!match.missing.length}
          onPress={() => addMissingIngredientsToShopping(recipe, match.missing)}
          style={{ flex: 1 }}
        />
      </View>

      <Animated.View {...panResponder.panHandlers} style={[styles.floatingTimer, pan.getLayout()]}>
        <MaterialCommunityIcons name="timer-outline" size={28} color={colors.surface} />
      </Animated.View>

      <TimerModal
        visible={timerVisible}
        onClose={() => setTimerVisible(false)}
        seconds={seconds}
        setSeconds={setSeconds}
        running={running}
        setRunning={setRunning}
      />

      <Modal visible={logVisible} transparent animationType="slide" onRequestClose={() => setLogVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setLogVisible(false)}>
          <Pressable style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>먹은 음식으로 기록</Text>
            <Text style={globalStyles.subtitle}>{recipe.name} · {recipe.calories}kcal</Text>
            <View style={styles.mealGrid}>
              {mealTypes.map((type) => (
                <Chip key={type} label={type} active={mealType === type} onPress={() => setMealType(type)} icon="silverware-fork-knife" />
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
    height: 310,
    marginHorizontal: -18,
    marginBottom: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceAlt,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  imageSafe: {
    position: 'absolute',
    top: 0,
    left: 18,
  },
  titleBlock: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 22,
  },
  detailTitle: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
  },
  detailBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  detailBadge: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  firstCard: {
    marginTop: -2,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: 7,
  },
  nutritionStat: {
    flex: 1,
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  nutritionValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '900',
  },
  nutritionLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  nutritionName: {
    marginTop: 2,
    color: colors.textSoft,
    fontSize: 10,
    fontWeight: '800',
  },
  ingredientSection: {
    marginTop: 2,
    marginBottom: 12,
  },
  ingredientTitle: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
  },
  ingredientWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  steps: {
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNo: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNoText: {
    color: colors.surface,
    fontWeight: '900',
  },
  stepText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  stepTime: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  bottomActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  floatingTimer: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,35,27,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  timerCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: colors.surface,
    padding: 18,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  timerDisplay: {
    marginTop: 18,
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 24,
    alignItems: 'center',
  },
  timerText: {
    color: colors.text,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 0,
  },
  timerInput: {
    textAlign: 'center',
    marginBottom: 12,
  },
  timerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickTimer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    marginTop: 'auto',
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
    alignSelf: 'center',
    marginBottom: 16,
  },
  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 18,
  },
  backRow: {
    padding: 18,
  },
});
