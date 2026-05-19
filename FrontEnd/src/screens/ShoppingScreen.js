import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card, EmptyState, Field, IconButton, PrimaryButton, SectionHeader } from '../components/ui';
import { useAppData } from '../context/AppDataContext';
import { colors, globalStyles } from '../theme';

function AddShoppingModal({ visible, onClose, onSubmit, bottomInset = 0 }) {
  const [name, setName] = useState('');

  const submit = async () => {
    if (!name.trim()) return;
    await onSubmit({ name });
    setName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: 28 + bottomInset }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.modalTitle}>장보기 항목 추가</Text>
          <View style={styles.formGap}>
            <Field value={name} onChangeText={setName} placeholder="재료명을 입력하세요" autoFocus />
            <PrimaryButton label="추가하기" icon="plus" onPress={submit} disabled={!name.trim()} />
          </View>
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ShoppingItemRow({ item, onToggle, onDelete }) {
  const openCoupang = () => {
    const query = encodeURIComponent(item.name);
    Linking.openURL(`https://www.coupang.com/np/search?q=${query}`);
  };

  return (
    <View style={[styles.itemRow, item.isChecked && styles.checkedRow]}>
      <Pressable onPress={() => onToggle(item.id)} style={[styles.checkbox, item.isChecked && styles.checkboxActive]}>
        <MaterialCommunityIcons name={item.isChecked ? 'check-bold' : 'circle-outline'} size={18} color={item.isChecked ? colors.surface : colors.muted} />
      </Pressable>
      <Text style={[styles.itemName, { flex: 1 }, item.isChecked && styles.checkedText]}>{item.name}</Text>
      <Pressable onPress={openCoupang} style={styles.buyButton}>
        <MaterialCommunityIcons name="cart-outline" size={13} color={colors.primaryDark} />
        <Text style={styles.buyButtonText}>구매하기</Text>
      </Pressable>
      <IconButton icon="trash-can-outline" size={36} color={colors.danger} backgroundColor="#fff0ef" onPress={() => onDelete(item.id)} />
    </View>
  );
}

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const {
    shoppingItems,
    recipes,
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    clearCheckedShoppingItems,
  } = useAppData();
  const [modalVisible, setModalVisible] = useState(false);

  const recipeNameById = useMemo(() => {
    const map = {};
    recipes.forEach((r) => { map[String(r.id)] = r.name; });
    return map;
  }, [recipes]);

  const unchecked = shoppingItems.filter((item) => !item.isChecked);
  const checked = shoppingItems.filter((item) => item.isChecked);

  const grouped = useMemo(() => unchecked.reduce((acc, item) => {
    const key = item.recipeId
      ? (recipeNameById[String(item.recipeId)] || item.recipeName || '레시피')
      : (item.recipeName || '직접 추가');
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {}), [unchecked, recipeNameById]);

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

      <AddShoppingModal visible={modalVisible} onClose={() => setModalVisible(false)} onSubmit={addShoppingItem} bottomInset={insets.bottom} />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 20,
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
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  buyButtonText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '900',
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
