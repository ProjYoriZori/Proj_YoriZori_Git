import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card, Chip, EmptyState, Field, IconButton, PrimaryButton, SectionHeader } from '../components/ui';
import { useAppData } from '../context/AppDataContext';
import { colors, globalStyles, type } from '../theme';
import { getIngredientEmoji } from '../utils/ingredientEmoji';

const categories = ['채소', '과일', '육류', '해산물', '유제품', '계란', '두부/콩류', '양념/소스', '냉동식품', '기타'];

const expiryPresets = [
  { label: '3일', days: 3 },
  { label: '1주', days: 7 },
  { label: '2주', days: 14 },
  { label: '1개월', days: 30 },
];

function expiryPresetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function ExpiryBadge({ item }) {
  if (!item.expiryDate) return null;
  const days = item.expiresInDays;
  const expired = typeof days === 'number' && days < 0;
  const dueToday = days === 0;
  const label = expired ? '기한 지남' : dueToday ? '오늘까지' : typeof days === 'number' ? `D-${days}` : item.expiryDate;
  const tone = expired || dueToday ? colors.danger : item.expiringSoon ? colors.warning : colors.textSoft;
  return (
    <View style={[styles.expiryBadge, { borderColor: tone }]}>
      <MaterialCommunityIcons name="clock-alert-outline" size={12} color={tone} />
      <Text style={[styles.expiryBadgeText, { color: tone }]}>{label}</Text>
    </View>
  );
}

function AddPantryModal({ visible, onClose, onSubmit, bottomInset = 0 }) {
  const [form, setForm] = useState({ name: '', category: '채소', expiryDate: '' });

  const submit = async () => {
    if (!form.name.trim()) return;
    const expiryDate = form.expiryDate.trim();
    await onSubmit({ name: form.name, category: form.category, expiryDate: expiryDate || null });
    setForm({ name: '', category: '채소', expiryDate: '' });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: 28 + bottomInset }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.modalTitle}>재료 추가</Text>
          <View style={styles.formGap}>
            <Field value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} placeholder="재료명" />
            <View style={styles.categoryWrap}>
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  active={form.category === category}
                  onPress={() => setForm((current) => ({ ...current, category }))}
                />
              ))}
            </View>
            <View style={styles.expirySection}>
              <Text style={type.label}>유통기한 (선택)</Text>
              <View style={styles.categoryWrap}>
                {expiryPresets.map((preset) => {
                  const value = expiryPresetDate(preset.days);
                  return (
                    <Chip
                      key={preset.label}
                      label={preset.label}
                      active={form.expiryDate === value}
                      onPress={() => setForm((current) => ({ ...current, expiryDate: value }))}
                    />
                  );
                })}
              </View>
              <Field
                value={form.expiryDate}
                onChangeText={(expiryDate) => setForm((current) => ({ ...current, expiryDate }))}
                placeholder="예: 2026-06-20"
              />
            </View>
            <PrimaryButton label="추가하기" icon="plus" onPress={submit} disabled={!form.name.trim()} />
          </View>
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function FridgeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    pantryItems,
    addPantryItem,
    togglePantrySelection,
    deletePantryItem,
  } = useAppData();
  const [modalVisible, setModalVisible] = useState(false);

  const grouped = useMemo(() => categories.reduce((acc, category) => {
    const items = pantryItems
      .filter((item) => (item.category || '기타') === category)
      .sort((a, b) => {
        const aDays = typeof a.expiresInDays === 'number' ? a.expiresInDays : Infinity;
        const bDays = typeof b.expiresInDays === 'number' ? b.expiresInDays : Infinity;
        return aDays - bDays;
      });
    if (items.length) acc.push({ category, items });
    return acc;
  }, []), [pantryItems]);

  const expiringSoonItems = useMemo(
    () => pantryItems.filter((item) => item.expiringSoon),
    [pantryItems],
  );

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>내 냉장고</Text>
          <Text style={globalStyles.small}>{pantryItems.length}가지 재료 보관 중</Text>
        </View>
        <IconButton icon="plus" color={colors.surface} backgroundColor={colors.primaryDark} onPress={() => setModalVisible(true)} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={globalStyles.row}>
            <MaterialCommunityIcons name="information-outline" size={20} color={colors.primaryDark} />
            <Text style={styles.helpText}>체크한 재료는 홈과 레시피 추천에 우선 반영됩니다.</Text>
          </View>
        </Card>

        {expiringSoonItems.length ? (
          <Card flat style={styles.expiryBanner}>
            <Text style={styles.expiryBannerText}>🔔 3일 내 소비기한 임박 재료 {expiringSoonItems.length}개</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.expiryBannerChips}>
              {expiringSoonItems.map((item) => (
                <View key={item.id} style={styles.expiryBannerChip}>
                  <Text style={styles.expiryBannerChipText}>{item.name}</Text>
                </View>
              ))}
            </ScrollView>
          </Card>
        ) : null}

        {grouped.map(({ category, items }) => (
          <Card key={category} style={styles.groupCard}>
            <SectionHeader title={category} icon="food-variant" />
            {items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Pressable onPress={() => togglePantrySelection(item.id)} style={[styles.checkbox, item.isSelected && styles.checkboxActive]}>
                  <MaterialCommunityIcons name={item.isSelected ? 'check-bold' : 'plus'} size={17} color={item.isSelected ? colors.surface : colors.muted} />
                </Pressable>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.categoryEmoji}>{getIngredientEmoji(item.name, item.category)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <ExpiryBadge item={item} />
                  </View>
                </View>
                <IconButton icon="trash-can-outline" size={36} color={colors.danger} backgroundColor="#fff0ef" onPress={() => deletePantryItem(item.id)} />
              </View>
            ))}
          </Card>
        ))}

        {!pantryItems.length ? (
          <EmptyState icon="fridge-off-outline" title="냉장고가 비었어요" body="재료를 추가하면 추천 레시피가 더 정확해집니다." />
        ) : null}
      </ScrollView>

      <PrimaryButton
        label="재료 추가"
        icon="plus"
        onPress={() => setModalVisible(true)}
        style={[styles.fab, { bottom: 22 + insets.bottom }]}
      />

      <AddPantryModal visible={modalVisible} onClose={() => setModalVisible(false)} onSubmit={addPantryItem} bottomInset={insets.bottom} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 120,
    gap: 12,
  },
  helpText: {
    flex: 1,
    marginLeft: 8,
    color: colors.textSoft,
    fontWeight: '700',
    lineHeight: 20,
  },
  expiryBanner: {
    backgroundColor: '#faf0df',
    gap: 10,
  },
  expiryBannerText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 14,
  },
  expiryBannerChips: {
    flexDirection: 'row',
    gap: 8,
  },
  expiryBannerChip: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  expiryBannerChipText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  groupCard: {
    paddingBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
  },
  checkbox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkboxActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  itemName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  expiryBadge: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  expiryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemMeta: {
    marginTop: 2,
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    width: 132,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,35,27,0.42)',
    justifyContent: 'flex-end',
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
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 14,
  },
  formGap: {
    gap: 12,
  },
  expirySection: {
    gap: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
