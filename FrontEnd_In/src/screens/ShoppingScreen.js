import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card, EmptyState, Field, IconButton, PrimaryButton, SectionHeader } from '../components/ui';
import { useAppData } from '../context/AppDataContext';
import { colors, globalStyles } from '../theme';

function AddShoppingModal({ visible, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', quantity: '', unit: '' });

  const submit = async () => {
    if (!form.name.trim()) return;
    await onSubmit(form);
    setForm({ name: '', quantity: '', unit: '' });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.modalTitle}>장보기 항목 추가</Text>
          <View style={styles.formGap}>
            <Field value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} placeholder="재료명" />
            <View style={styles.formRow}>
              <Field value={form.quantity} onChangeText={(quantity) => setForm((current) => ({ ...current, quantity }))} placeholder="수량" style={{ flex: 1 }} />
              <Field value={form.unit} onChangeText={(unit) => setForm((current) => ({ ...current, unit }))} placeholder="단위" style={{ width: 92 }} />
            </View>
            <PrimaryButton label="추가하기" icon="plus" onPress={submit} disabled={!form.name.trim()} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ShoppingItemRow({ item, onToggle, onDelete }) {
  return (
    <View style={[styles.itemRow, item.isChecked && styles.checkedRow]}>
      <Pressable onPress={() => onToggle(item.id)} style={[styles.checkbox, item.isChecked && styles.checkboxActive]}>
        <MaterialCommunityIcons name={item.isChecked ? 'check-bold' : 'circle-outline'} size={18} color={item.isChecked ? colors.surface : colors.muted} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemName, item.isChecked && styles.checkedText]}>{item.name}</Text>
        <Text style={styles.itemMeta}>
          {[item.quantity, item.unit].filter(Boolean).join(' ') || '수량 미입력'}
        </Text>
      </View>
      <IconButton icon="trash-can-outline" size={36} color={colors.danger} backgroundColor="#fff0ef" onPress={() => onDelete(item.id)} />
    </View>
  );
}

export default function ShoppingScreen() {
  const {
    shoppingItems,
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    clearCheckedShoppingItems,
  } = useAppData();
  const [modalVisible, setModalVisible] = useState(false);

  const unchecked = shoppingItems.filter((item) => !item.isChecked);
  const checked = shoppingItems.filter((item) => item.isChecked);
  const grouped = useMemo(() => unchecked.reduce((acc, item) => {
    const key = item.recipeName || '직접 추가';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {}), [unchecked]);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={globalStyles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={globalStyles.title}>장보기</Text>
            <Text style={globalStyles.subtitle}>{unchecked.length}개 남음 · {checked.length}개 완료</Text>
          </View>
          <IconButton icon="plus" color={colors.surface} backgroundColor={colors.primaryDark} onPress={() => setModalVisible(true)} />
        </View>

        {checked.length ? (
          <Pressable style={styles.clearButton} onPress={clearCheckedShoppingItems}>
            <MaterialCommunityIcons name="delete-sweep-outline" size={18} color={colors.danger} />
            <Text style={styles.clearButtonText}>완료 항목 삭제</Text>
          </Pressable>
        ) : null}

        {Object.entries(grouped).map(([recipeName, items]) => (
          <Card key={recipeName}>
            <SectionHeader title={recipeName} icon={recipeName === '직접 추가' ? 'pencil-outline' : 'chef-hat'} />
            {items.map((item) => (
              <ShoppingItemRow key={item.id} item={item} onToggle={toggleShoppingItem} onDelete={deleteShoppingItem} />
            ))}
          </Card>
        ))}

        {checked.length ? (
          <Card style={{ opacity: 0.76 }}>
            <SectionHeader title={`구매 완료 ${checked.length}개`} icon="check-circle-outline" />
            {checked.map((item) => (
              <ShoppingItemRow key={item.id} item={item} onToggle={toggleShoppingItem} onDelete={deleteShoppingItem} />
            ))}
          </Card>
        ) : null}

        {!shoppingItems.length ? (
          <EmptyState icon="basket-off-outline" title="장보기 목록이 비었어요" body="레시피 상세에서 부족한 재료를 자동으로 추가할 수 있어요." />
        ) : null}

        <PrimaryButton label="항목 직접 추가" icon="plus" onPress={() => setModalVisible(true)} />
      </ScrollView>

      <AddShoppingModal visible={modalVisible} onClose={() => setModalVisible(false)} onSubmit={addShoppingItem} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff0ef',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900',
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
  checkedRow: {
    opacity: 0.75,
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
  checkedText: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  itemMeta: {
    marginTop: 2,
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
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
});
