import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card, EmptyState, Field, IconButton, PrimaryButton, SectionHeader } from '../components/ui';
import { useAppData } from '../context/AppDataContext';
import { colors, globalStyles, type } from '../theme';
import { getIngredientEmoji } from '../utils/ingredientEmoji';

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

  const amount = [item.quantity, item.unit].filter(Boolean).join(' ');

  return (
    <View style={[styles.itemRow, item.isChecked && styles.checkedRow]}>
      <Pressable onPress={() => onToggle(item.id)} style={[styles.checkbox, item.isChecked && styles.checkboxActive]}>
        <MaterialCommunityIcons name={item.isChecked ? 'check-bold' : 'circle-outline'} size={16} color={item.isChecked ? colors.surface : colors.muted} />
      </Pressable>

      <View style={[styles.emojiBadge, item.isChecked && styles.emojiBadgeChecked]}>
        <Text style={styles.emoji}>{getIngredientEmoji(item.name)}</Text>
      </View>

      <View style={styles.itemTextWrap}>
        <Text style={[styles.itemName, item.isChecked && styles.checkedText]} numberOfLines={1}>{item.name}</Text>
        {amount ? <Text style={styles.itemAmount} numberOfLines={1}>{amount}</Text> : null}
      </View>

      <Pressable onPress={openCoupang} style={({ pressed }) => [styles.buyButton, pressed && { opacity: 0.6 }]}>
        <MaterialCommunityIcons name="cart-outline" size={14} color={colors.primaryDark} />
        <Text style={styles.buyButtonText}>구매</Text>
      </Pressable>
      <IconButton icon="trash-can-outline" size={36} color={colors.danger} backgroundColor="#f7e9e6" onPress={() => onDelete(item.id)} />
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
  const total = shoppingItems.length;
  const progress = total ? checked.length / total : 0;

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
          <View style={globalStyles.between}>
            <Text style={type.title}>장보기</Text>
            <IconButton icon="plus" color={colors.surface} backgroundColor={colors.primaryDark} onPress={() => setModalVisible(true)} />
          </View>

          {total ? (
            <View style={styles.progressBlock}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>
                  <Text style={styles.progressCount}>{checked.length}</Text> / {total}개 구매 완료
                </Text>
                {checked.length ? (
                  <Pressable onPress={clearCheckedShoppingItems} hitSlop={6}>
                    <Text style={styles.clearLabel}>완료 항목 비우기</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : (
            <Text style={type.subtitle}>레시피 상세에서 부족한 재료를 자동으로 담거나, 직접 추가해보세요.</Text>
          )}
        </View>

        {Object.entries(grouped).map(([recipeName, items]) => (
          <Card key={recipeName} flat>
            <SectionHeader
              title={recipeName}
              icon={recipeName === '직접 추가' ? 'pencil-outline' : 'chef-hat'}
              actionLabel={`${items.length}개`}
            />
            <View style={styles.itemList}>
              {items.map((item) => (
                <ShoppingItemRow key={item.id} item={item} onToggle={toggleShoppingItem} onDelete={deleteShoppingItem} />
              ))}
            </View>
          </Card>
        ))}

        {checked.length ? (
          <Card flat style={styles.doneCard}>
            <SectionHeader title="구매 완료" icon="check-circle-outline" actionLabel={`${checked.length}개`} />
            <View style={styles.itemList}>
              {checked.map((item) => (
                <ShoppingItemRow key={item.id} item={item} onToggle={toggleShoppingItem} onDelete={deleteShoppingItem} />
              ))}
            </View>
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
    paddingTop: 6,
    gap: 16,
  },
  progressBlock: {
    gap: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },
  progressCount: {
    color: colors.text,
    fontWeight: '800',
  },
  clearLabel: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  doneCard: {
    opacity: 0.7,
  },
  itemList: {
    gap: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    minHeight: 60,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkedRow: {
    opacity: 0.6,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkboxActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  emojiBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emojiBadgeChecked: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.surfaceAlt,
  },
  emoji: {
    fontSize: 18,
  },
  itemTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  itemAmount: {
    marginTop: 2,
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '500',
  },
  checkedText: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  buyButtonText: {
    color: colors.primaryDark,
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
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  formGap: {
    gap: 12,
  },
});
