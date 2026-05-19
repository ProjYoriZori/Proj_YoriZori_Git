import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card, Chip, EmptyState, Field, IconButton, PrimaryButton, SectionHeader } from '../components/ui';
import { useAppData } from '../context/AppDataContext';
import { colors, globalStyles } from '../theme';

const categories = ['채소', '과일', '육류', '해산물', '유제품', '계란', '두부/콩류', '양념/소스', '냉동식품', '기타'];

function AddPantryModal({ visible, onClose, onSubmit, bottomInset = 0 }) {
  const [form, setForm] = useState({ name: '', quantity: '', unit: '', category: '채소' });

  const submit = async () => {
    if (!form.name.trim()) return;
    await onSubmit(form);
    setForm({ name: '', quantity: '', unit: '', category: '채소' });
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
            <View style={styles.formRow}>
              <Field value={form.quantity} onChangeText={(quantity) => setForm((current) => ({ ...current, quantity }))} placeholder="수량" style={{ flex: 1 }} />
              <Field value={form.unit} onChangeText={(unit) => setForm((current) => ({ ...current, unit }))} placeholder="단위" style={{ width: 92 }} />
            </View>
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
    const items = pantryItems.filter((item) => (item.category || '기타') === category);
    if (items.length) acc.push({ category, items });
    return acc;
  }, []), [pantryItems]);

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

        {grouped.map(({ category, items }) => (
          <Card key={category} style={styles.groupCard}>
            <SectionHeader title={category} icon="food-variant" />
            {items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Pressable onPress={() => togglePantrySelection(item.id)} style={[styles.checkbox, item.isSelected && styles.checkboxActive]}>
                  <MaterialCommunityIcons name={item.isSelected ? 'check-bold' : 'plus'} size={17} color={item.isSelected ? colors.surface : colors.muted} />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>{[item.quantity, item.unit].filter(Boolean).join(' ') || '수량 미입력'}</Text>
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
  itemName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
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
