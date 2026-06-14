import React, { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  Card,
  Chip,
  EmptyState,
  Field,
  IconButton,
  LoadingState,
  PrimaryButton,
  SectionHeader,
} from "../components/ui";
import { useAppData } from "../context/AppDataContext";
import { api, normalizeNutritionLog } from "../api/client";
import { colors, globalStyles } from "../theme";
import {
  addDays,
  calculateDRI,
  dateKey,
  formatKoreanDate,
  progress,
  sumNutrition,
} from "../utils/nutrition";

const nutritionRows = [
  {
    key: "calories",
    label: "칼로리",
    unit: "kcal",
    icon: "fire",
    color: colors.secondary,
  },
  {
    key: "carbs",
    label: "탄수화물",
    unit: "g",
    icon: "barley",
    color: colors.warning,
  },
  {
    key: "protein",
    label: "단백질",
    unit: "g",
    icon: "food-steak",
    color: colors.danger,
  },
  { key: "fat", label: "지방", unit: "g", icon: "oil", color: "#8a68d8" },
  {
    key: "sodium",
    label: "나트륨",
    unit: "mg",
    icon: "shaker-outline",
    color: "#4b8fd9",
  },
];

function ProgressRow({ row, current, target }) {
  const pct = progress(current, target);
  return (
    <View style={styles.progressRow}>
      <View style={globalStyles.between}>
        <View style={globalStyles.row}>
          <MaterialCommunityIcons
            name={row.icon}
            size={18}
            color={row.color}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.progressLabel}>{row.label}</Text>
        </View>
        <Text style={styles.progressValue}>
          {Math.round(current)}
          {row.unit} / {target}
          {row.unit}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${pct}%`,
              backgroundColor: pct >= 100 ? colors.danger : row.color,
            },
          ]}
        />
      </View>
      <Text style={styles.progressPct}>{pct}%</Text>
    </View>
  );
}

function MealLog({ log, onDelete }) {
  return (
    <View style={styles.logRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.logName}>{log.foodName}</Text>
        <Text style={styles.logMeta}>
          {log.mealType} · {Math.round(log.calories)}kcal · 단백질{" "}
          {Math.round(log.protein)}g
        </Text>
      </View>
      <IconButton
        icon="trash-can-outline"
        size={36}
        color={colors.danger}
        backgroundColor="#fff0ef"
        onPress={() => onDelete(log.id)}
      />
    </View>
  );
}

const MEAL_TYPES = ["아침", "점심", "저녁", "간식"];

function MealTypePickerModal({ food, onClose, onConfirm, bottomInset = 0 }) {
  const [mealType, setMealType] = useState("점심");

  return (
    <Modal visible={!!food} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: 28 + bottomInset }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.modalTitle}>식사 시간 선택</Text>
          <Text style={styles.mealPickerSub}>{food?.name}</Text>
          <View style={styles.mealTypeRow}>
            {MEAL_TYPES.map((type) => (
              <Chip
                key={type}
                label={type}
                active={mealType === type}
                onPress={() => setMealType(type)}
              />
            ))}
          </View>
          <PrimaryButton
            label="기록하기"
            icon="check"
            onPress={() => { onConfirm(food, mealType); onClose(); }}
            style={{ marginTop: 8 }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const EMPTY_FORM = {
  name: "",
  servingSize: "",
  calories: "",
  carbs: "",
  protein: "",
  fat: "",
  sodium: "",
};

function EditFoodModal({ food, onClose, onSave, onDelete, bottomInset = 0 }) {
  const [form, setForm] = useState({
    name: "", servingSize: "", calories: "", carbs: "", protein: "", fat: "", sodium: "",
  });
  const set = (key, value) => setForm((cur) => ({ ...cur, [key]: value }));

  React.useEffect(() => {
    if (food) {
      setForm({
        name: food.name || "",
        servingSize: food.servingSize || "",
        calories: food.calories != null ? String(food.calories) : "",
        carbs: food.carbs != null ? String(food.carbs) : "",
        protein: food.protein != null ? String(food.protein) : "",
        fat: food.fat != null ? String(food.fat) : "",
        sodium: food.sodium != null ? String(food.sodium) : "",
      });
    }
  }, [food]);

  const save = async () => {
    if (!form.name.trim()) return;
    await onSave(food.id, form);
    onClose();
  };

  const remove = async () => {
    await onDelete(food.id);
    onClose();
  };

  return (
    <Modal visible={!!food} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={[styles.sheet, { paddingBottom: 28 + bottomInset }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.modalTitle, { marginBottom: 16 }]}>음식 수정</Text>
            <View style={styles.formGap}>
              <Field value={form.name} onChangeText={(v) => set("name", v)} placeholder="음식명" />
              <Field value={form.servingSize} onChangeText={(v) => set("servingSize", v)} placeholder="1회 제공량: 300ml, 1개..." />
              <View style={styles.formRow}>
                <View style={styles.labeledField}>
                  <Field value={form.calories} onChangeText={(v) => set("calories", v)} placeholder="0" keyboardType="decimal-pad" />
                  <Text style={styles.fieldLabel}>칼로리 (kcal)</Text>
                </View>
                <View style={styles.labeledField}>
                  <Field value={form.carbs} onChangeText={(v) => set("carbs", v)} placeholder="0" keyboardType="decimal-pad" />
                  <Text style={styles.fieldLabel}>탄수화물 (g)</Text>
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={styles.labeledField}>
                  <Field value={form.protein} onChangeText={(v) => set("protein", v)} placeholder="0" keyboardType="decimal-pad" />
                  <Text style={styles.fieldLabel}>단백질 (g)</Text>
                </View>
                <View style={styles.labeledField}>
                  <Field value={form.fat} onChangeText={(v) => set("fat", v)} placeholder="0" keyboardType="decimal-pad" />
                  <Text style={styles.fieldLabel}>지방 (g)</Text>
                </View>
                <View style={styles.labeledField}>
                  <Field value={form.sodium} onChangeText={(v) => set("sodium", v)} placeholder="0" keyboardType="decimal-pad" />
                  <Text style={styles.fieldLabel}>나트륨 (mg)</Text>
                </View>
              </View>
              <PrimaryButton label="저장하기" icon="check" onPress={save} disabled={!form.name.trim()} />
              <Pressable style={styles.deleteBtn} onPress={remove}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                <Text style={styles.deleteBtnText}>삭제하기</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AddFoodModal({ visible, onClose, onSubmit, bottomInset = 0 }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrMessage, setOcrMessage] = useState("");
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!form.name.trim()) return;
    await onSubmit(form);
    setForm(EMPTY_FORM);
    setOcrMessage("");
    onClose();
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setOcrMessage("카메라 권한이 필요해요.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "Images",
      quality: 0.85,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;

    setOcrLoading(true);
    setOcrMessage("");
    try {
      const asset = result.assets[0];
      const data = await api.extractNutritionFromImage({
        imageBase64: asset.base64,
        mediaType: asset.mimeType || "image/jpeg",
      });
      setForm((prev) => ({
        name: data.name || prev.name,
        servingSize: data.servingSize || prev.servingSize,
        calories: data.calories != null ? String(data.calories) : prev.calories,
        carbs: data.carbs != null ? String(data.carbs) : prev.carbs,
        protein: data.protein != null ? String(data.protein) : prev.protein,
        fat: data.fat != null ? String(data.fat) : prev.fat,
        sodium: data.sodium != null ? String(data.sodium) : prev.sodium,
      }));
      setOcrMessage(data.message || "");
    } catch {
      setOcrMessage("인식에 실패했어요. 직접 입력해주세요.");
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: 28 + bottomInset }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>자주 먹는 음식 추가</Text>
            <Pressable
              style={[styles.cameraBtn, ocrLoading && styles.cameraBtnDisabled]}
              onPress={handleCamera}
              disabled={ocrLoading}
            >
              {ocrLoading ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <MaterialCommunityIcons name="camera" size={20} color={colors.surface} />
              )}
              <Text style={styles.cameraBtnText}>
                {ocrLoading ? "인식 중..." : "사진 인식"}
              </Text>
            </Pressable>
          </View>
          {ocrMessage ? (
            <Text style={styles.ocrMessage}>{ocrMessage}</Text>
          ) : null}
          <View style={styles.formGap}>
            <Field
              value={form.name}
              onChangeText={(value) => set("name", value)}
              placeholder="음식명"
            />
            <Field
              value={form.servingSize}
              onChangeText={(value) => set("servingSize", value)}
              placeholder="1회 제공량: 300ml, 1개..."
            />
            <View style={styles.formRow}>
              <View style={styles.labeledField}>
                <Field
                  value={form.calories}
                  onChangeText={(value) => set("calories", value)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.fieldLabel}>칼로리 (kcal)</Text>
              </View>
              <View style={styles.labeledField}>
                <Field
                  value={form.carbs}
                  onChangeText={(value) => set("carbs", value)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.fieldLabel}>탄수화물 (g)</Text>
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={styles.labeledField}>
                <Field
                  value={form.protein}
                  onChangeText={(value) => set("protein", value)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.fieldLabel}>단백질 (g)</Text>
              </View>
              <View style={styles.labeledField}>
                <Field
                  value={form.fat}
                  onChangeText={(value) => set("fat", value)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.fieldLabel}>지방 (g)</Text>
              </View>
              <View style={styles.labeledField}>
                <Field
                  value={form.sodium}
                  onChangeText={(value) => set("sodium", value)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.fieldLabel}>나트륨 (mg)</Text>
              </View>
            </View>
            <PrimaryButton
              label="추가하기"
              icon="plus"
              onPress={submit}
              disabled={!form.name.trim()}
            />
          </View>
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const {
    loading,
    profile,
    customFoods,
    addCustomFood,
    deleteCustomFood,
  } = useAppData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateLogs, setDateLogs] = useState([]);
  const [dateLoading, setDateLoading] = useState(false);
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [mealPickerFood, setMealPickerFood] = useState(null);
  const selectedKey = dateKey(selectedDate);

  const refreshDateLogs = useCallback(async (date) => {
    setDateLoading(true);
    setDateLogs([]);
    try {
      const payload = await api.getDailyNutritionSummary({ date: dateKey(date) });
      const meals = Array.isArray(payload?.meals) ? payload.meals : [];
      setDateLogs(meals.map(normalizeNutritionLog));
    } catch {
      setDateLogs([]);
    } finally {
      setDateLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshDateLogs(selectedDate);
    }, [selectedDate, refreshDateLogs]),
  );

  const handleDeleteLog = useCallback(async (id) => {
    setDateLogs((logs) => logs.filter((log) => log.id !== id));
    try {
      await api.deleteNutritionLog(id);
    } catch {
      refreshDateLogs(selectedDate);
    }
  }, [selectedDate, refreshDateLogs]);

  const handleAddFromCustomFood = useCallback(async (food, mealType) => {
    try {
      const created = await api.createNutritionLog({
        customFoodName: food.name,
        mealDate: dateKey(selectedDate),
        mealTime: mealType,
        multiplier: 1,
        calories: food.calories,
        carbs: food.carbs,
        protein: food.protein,
        fat: food.fat,
        sodium: food.sodium,
      });
      setDateLogs((logs) => [created, ...logs]);
    } catch {
      refreshDateLogs(selectedDate);
    }
  }, [selectedDate, refreshDateLogs]);

  const totals = useMemo(() => sumNutrition(dateLogs), [dateLogs]);
  const dri = useMemo(() => calculateDRI(profile), [profile]);

  const grouped = useMemo(
    () =>
      dateLogs.reduce((acc, log) => {
        const key = log.mealType || "기타";
        if (!acc[key]) acc[key] = [];
        acc[key].push(log);
        return acc;
      }, {}),
    [dateLogs],
  );

  if (loading) return <LoadingState />;

  return (
    <SafeAreaView style={globalStyles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={globalStyles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={globalStyles.title}>영양 분석</Text>
          <Text style={globalStyles.subtitle}>
            날짜별 섭취량과 권장 섭취량 대비 비율을 확인합니다.
          </Text>
        </View>

        <Card>
          <View style={styles.dateControl}>
            <IconButton
              icon="chevron-left"
              onPress={() => setSelectedDate((date) => addDays(date, -1))}
            />
            <Pressable
              style={styles.dateLabel}
              onPress={() => setSelectedDate(new Date())}
            >
              <Text style={styles.dateLabelText}>
                {formatKoreanDate(selectedDate)}
              </Text>
              <Text style={styles.dateLabelSub}>{selectedKey}</Text>
            </Pressable>
            <IconButton
              icon="chevron-right"
              onPress={() => setSelectedDate((date) => addDays(date, 1))}
            />
          </View>
        </Card>

        <View style={styles.summaryGrid}>
          {nutritionRows.slice(0, 4).map((row) => (
            <View key={row.key} style={styles.summaryBox}>
              <MaterialCommunityIcons
                name={row.icon}
                size={22}
                color={row.color}
              />
              <Text style={[styles.summaryValue, { color: row.color }]}>
                {Math.round(totals[row.key])}
                <Text style={styles.summaryUnit}>{row.unit}</Text>
              </Text>
              <Text style={styles.summaryLabel}>{row.label}</Text>
            </View>
          ))}
        </View>

        <Card>
          <SectionHeader
            title="권장 섭취량 대비"
            icon="chart-timeline-variant"
          />
          {dri ? (
            nutritionRows.map((row) => (
              <ProgressRow
                key={row.key}
                row={row}
                current={totals[row.key]}
                target={dri[row.key]}
              />
            ))
          ) : (
            <EmptyState
              icon="account-edit-outline"
              title="권장 섭취량이 없어요"
              body="프로필에서 나이, 키, 체중을 입력하면 목표 섭취량을 계산할 수 있어요."
            />
          )}
        </Card>

        <Card>
          <SectionHeader
            title="자주 먹는 음식"
            icon="food-apple-outline"
            actionLabel="추가"
            onAction={() => setFoodModalVisible(true)}
          />
          {customFoods.length ? (
            customFoods.map((food) => (
              <View key={food.id} style={styles.foodRow}>
                <View style={styles.foodIcon}>
                  <MaterialCommunityIcons
                    name="nutrition"
                    size={22}
                    color={colors.primaryDark}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodMeta}>
                    {food.servingSize || "1회"} · {food.calories}kcal · 단백질{" "}
                    {food.protein}g
                  </Text>
                </View>
                <IconButton
                  icon="playlist-plus"
                  size={36}
                  color={colors.primaryDark}
                  onPress={() => setMealPickerFood(food)}
                />
                <IconButton
                  icon="pencil-outline"
                  size={36}
                  color={colors.textSoft}
                  onPress={() => setEditingFood(food)}
                />
              </View>
            ))
          ) : (
            <EmptyState
              icon="food-off-outline"
              title="등록된 음식이 없어요"
              body="자주 먹는 식품을 등록하면 영양 기록이 빨라집니다."
            />
          )}
          <PrimaryButton
            label="음식 추가하기"
            icon="plus"
            onPress={() => setFoodModalVisible(true)}
            style={{ marginTop: 8 }}
          />
        </Card>

        <Card>
          <SectionHeader title="먹은 음식 목록" icon="silverware-fork-knife" />
          {dateLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.primaryDark}
              style={{ marginVertical: 16 }}
            />
          ) : dateLogs.length ? (
            Object.entries(grouped).map(([mealType, items]) => (
              <View key={mealType} style={styles.mealGroup}>
                <Text style={styles.mealTitle}>{mealType}</Text>
                {items.map((log) => (
                  <MealLog
                    key={log.id}
                    log={log}
                    onDelete={handleDeleteLog}
                  />
                ))}
              </View>
            ))
          ) : (
            <EmptyState
              icon="playlist-remove"
              title="기록된 음식이 없어요"
              body="레시피 상세에서 먹은 음식으로 추가할 수 있습니다."
            />
          )}
        </Card>
      </ScrollView>

      <AddFoodModal
        visible={foodModalVisible}
        onClose={() => setFoodModalVisible(false)}
        onSubmit={addCustomFood}
        bottomInset={insets.bottom}
      />
      <MealTypePickerModal
        food={mealPickerFood}
        onClose={() => setMealPickerFood(null)}
        onConfirm={handleAddFromCustomFood}
        bottomInset={insets.bottom}
      />
      <EditFoodModal
        food={editingFood}
        onClose={() => setEditingFood(null)}
        onSave={async (id, form) => {
          await addCustomFood(form);
          await deleteCustomFood(id);
        }}
        onDelete={deleteCustomFood}
        bottomInset={insets.bottom}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  dateControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateLabel: {
    alignItems: "center",
  },
  dateLabelText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  dateLabelSub: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryBox: {
    width: "48.5%",
    minHeight: 100,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    justifyContent: "center",
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: "900",
  },
  summaryUnit: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  summaryLabel: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  formGap: {
    gap: 12,
  },
  formRow: {
    flexDirection: "row",
    gap: 10,
  },
  labeledField: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  progressRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressLabel: {
    color: colors.text,
    fontWeight: "900",
  },
  progressValue: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "800",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.background,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  progressPct: {
    marginTop: 4,
    textAlign: "right",
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  mealGroup: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  mealTitle: {
    color: colors.primaryDark,
    fontWeight: "900",
    marginBottom: 8,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  logName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  logMeta: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 62,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
  },
  foodIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  foodName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  foodMeta: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cameraBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  cameraBtnDisabled: {
    opacity: 0.6,
  },
  cameraBtnText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "800",
  },
  ocrMessage: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    backgroundColor: colors.surfaceAlt,
    padding: 10,
    borderRadius: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(20,35,27,0.42)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
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
  modalTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "900",
  },
  mealPickerSub: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 16,
    marginTop: 8,
  },
  mealTypeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteBtnText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "800",
  },
});
