import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card, Chip, EmptyState, Field, IconButton, PrimaryButton, SectionHeader } from '../components/ui';
import { useAppData } from '../context/AppDataContext';
import { colors, globalStyles } from '../theme';

const categories = ['채소', '과일', '육류', '해산물', '유제품', '계란', '두부/콩류', '양념/소스', '냉동식품', '기타'];

const categoryEmoji = {
  '채소': '🥬',
  '과일': '🍎',
  '육류': '🥩',
  '해산물': '🦐',
  '유제품': '🥛',
  '계란': '🥚',
  '두부/콩류': '🫘',
  '양념/소스': '🧂',
  '냉동식품': '🧊',
  '기타': '🍽️',
};

const ingredientEmoji = {
  // 채소
  '양파': '🧅', '적양파': '🧅', '다진 양파': '🧅', '다진양파': '🧅',
  '마늘': '🧄', '다진 마늘': '🧄', '다진마늘': '🧄', '마늘다진것': '🧄',
  '생강': '🫚', '생강즙': '🫚', '생강청': '🫚',
  '당근': '🥕',
  '감자': '🥔',
  '고구마': '🍠',
  '대파': '🌿', '파': '🌿', '쪽파': '🌿', '실파': '🌿', '다진 파': '🌿', '다진파': '🌿', '다진 대파': '🌿',
  '시금치': '🥬', '청경채': '🥬', '양배추': '🥬', '배추': '🥬', '양상추': '🥬',
  '깻잎': '🍃', '미나리': '🍃', '부추': '🍃', '쑥갓': '🍃', '어린잎': '🍃',
  '브로콜리': '🥦', '브로컬리': '🥦',
  '오이': '🥒',
  '가지': '🍆',
  '토마토': '🍅', '방울토마토': '🍅',
  '파프리카': '🫑', '홍피망': '🫑', '청피망': '🫑', '피망': '🫑',
  '홍고추': '🌶️', '청양고추': '🌶️', '청고추': '🌶️', '붉은 고추': '🌶️', '붉은고추': '🌶️',
  '무': '🧅', '단무지': '🧅',
  '연근': '🌸',
  '애호박': '🥒', '단호박': '🎃', '늙은호박': '🎃',
  '비트': '🫐',
  '아스파라거스': '🥦',
  '샐러리': '🥬',
  '콩나물': '🌱', '숙주': '🌱', '숙주나물': '🌱',
  '표고버섯': '🍄', '새송이버섯': '🍄', '양송이버섯': '🍄', '양송이': '🍄',
  '팽이버섯': '🍄', '느타리버섯': '🍄', '다시마버섯': '🍄', '목이버섯': '🍄',
  // 과일
  '사과': '🍎', '풋사과': '🍏',
  '배': '🍐',
  '바나나': '🍌',
  '오렌지': '🍊', '귤': '🍊', '자몽': '🍊',
  '레몬': '🍋', '유자': '🍋',
  '포도': '🍇', '청포도': '🍇',
  '딸기': '🍓',
  '복숭아': '🍑',
  '수박': '🍉',
  '참외': '🍈', '멜론': '🍈',
  '파인애플': '🍍',
  '망고': '🥭',
  '키위': '🥝',
  '블루베리': '🫐',
  '체리': '🍒', '대추': '🍒',
  '아보카도': '🥑',
  // 육류
  '소고기': '🥩', '쇠고기': '🥩', '한우': '🥩',
  '돼지고기': '🥩', '삼겹살': '🥩', '목살': '🥩', '앞다리살': '🥩', '뒷다리살': '🥩',
  '닭고기': '🍗', '닭 가슴살': '🍗', '닭가슴살': '🍗', '닭 다리': '🍗', '닭다리': '🍗',
  '닭육수': '🍗', '닭볶음탕용': '🍗',
  '베이컨': '🥓', '햄': '🥓', '소시지': '🥓',
  // 해산물
  '새우': '🦐', '칵테일새우': '🦐',
  '오징어': '🦑', '낙지': '🦑', '문어': '🦑',
  '꽃게': '🦀', '게': '🦀',
  '전복': '🦪', '바지락': '🦪', '조개': '🦪', '굴': '🦪',
  '참치': '🐟', '연어': '🐟', '고등어': '🐟', '멸치': '🐟', '북어': '🐟',
  '미역': '🌊', '다시마': '🌊', '김': '🌊',
  // 유제품
  '우유': '🥛', '두유': '🥛', '생크림': '🥛',
  '버터': '🧈',
  '치즈': '🧀', '모짜렐라치즈': '🧀', '파마산치즈': '🧀', '크림치즈': '🧀',
  '요거트': '🥛', '요구르트': '🥛', '플레인요거트': '🥛',
  '아이스크림': '🍦',
  // 계란
  '달걀': '🥚', '계란': '🥚', '메추리알': '🥚',
  // 두부/콩류
  '두부': '🫘', '순두부': '🫘',
  '콩': '🫘', '검은콩': '🫘', '서리태': '🫘', '완두콩': '🫛', '땅콩': '🥜',
  '아몬드': '🌰', '호두': '🌰', '잣': '🌰', '밤': '🌰', '캐슈넛': '🌰',
  // 양념/소스
  '소금': '🧂', '굵은소금': '🧂',
  '간장': '🫙', '저염간장': '🫙', '국간장': '🫙', '맛간장': '🫙',
  '된장': '🫙', '고추장': '🫙', '쌈장': '🫙',
  '식초': '🫙', '발사믹식초': '🫙',
  '올리브오일': '🫒', '올리브유': '🫒',
  '참기름': '🫙', '들기름': '🫙', '식용유': '🫙', '튀김기름': '🫙', '포도씨유': '🫙',
  '꿀': '🍯', '올리고당': '🍯', '물엿': '🍯',
  '설탕': '🍬', '흑설탕': '🍬',
  '후춧가루': '🌶️', '후추': '🌶️', '흰후추': '🌶️', '통후추': '🌶️',
  '고춧가루': '🌶️',
  '밀가루': '🌾', '강력분': '🌾', '박력분': '🌾', '빵가루': '🍞', '전분': '🌾', '녹말가루': '🌾',
  '찹쌀가루': '🌾', '쌀가루': '🌾',
  '마요네즈': '🫙', '케첩': '🍅', '머스타드': '🫙',
  '카레가루': '🍛', '카레': '🍛',
  '매실액': '🫙', '매실청': '🫙',
  '맛술': '🍶', '청주': '🍶', '정종': '🍶',
  '참깨': '🌾', '통깨': '🌾', '깨소금': '🌾', '흑임자': '🌾',
  '파슬리가루': '🌿', '파슬리': '🌿',
  '로즈마리': '🌿', '바질': '🌿', '타임': '🌿',
  '유자청': '🍋',
  '레몬즙': '🍋',
  '고추기름': '🌶️', '두반장': '🫙',
  // 곡물/기타
  '쌀': '🍚', '밥': '🍚', '현미': '🍚', '찹쌀': '🌾',
  '물': '💧', '육수': '💧', '닭국물': '💧',
  '빵': '🍞', '식빵': '🍞',
  '파스타': '🍝', '면': '🍝', '당면': '🍝', '소면': '🍝', '라면': '🍜',
};

function getIngredientEmoji(name, category) {
  if (!name) return categoryEmoji[category] || '🍽️';
  if (ingredientEmoji[name]) return ingredientEmoji[name];
  // 키워드 패턴 매칭
  if (name.includes('버섯')) return '🍄';
  if (name.includes('고추') && !name.includes('장')) return '🌶️';
  if (name.includes('마늘')) return '🧄';
  if (name.includes('파')) return '🌿';
  if (name.includes('배추') || name.includes('양배추')) return '🥬';
  if (name.includes('호박')) return '🥒';
  if (name.includes('닭')) return '🍗';
  if (name.includes('돼지') || name.includes('삼겹')) return '🥩';
  if (name.includes('소고기') || name.includes('쇠고기') || name.includes('한우')) return '🥩';
  if (name.includes('새우')) return '🦐';
  if (name.includes('오징어') || name.includes('낙지') || name.includes('문어')) return '🦑';
  if (name.includes('조개') || name.includes('바지락') || name.includes('굴') || name.includes('전복')) return '🦪';
  if (name.includes('생선') || name.includes('고등어') || name.includes('연어') || name.includes('참치') || name.includes('멸치')) return '🐟';
  if (name.includes('미역') || name.includes('다시마') || name.includes('김')) return '🌊';
  if (name.includes('치즈')) return '🧀';
  if (name.includes('요거트') || name.includes('요구르트')) return '🥛';
  if (name.includes('두부') || name.includes('순두부')) return '🫘';
  if (name.includes('콩')) return '🫘';
  if (name.includes('견과') || name.includes('아몬드') || name.includes('호두') || name.includes('잣') || name.includes('밤')) return '🌰';
  if (name.includes('간장')) return '🫙';
  if (name.includes('된장') || name.includes('고추장') || name.includes('쌈장')) return '🫙';
  if (name.includes('가루')) return '🌾';
  if (name.includes('기름')) return '🫙';
  if (name.includes('식초')) return '🫙';
  if (name.includes('설탕') || name.includes('흑설탕')) return '🍬';
  if (name.includes('꿀') || name.includes('올리고당')) return '🍯';
  if (name.includes('카레')) return '🍛';
  if (name.includes('토마토')) return '🍅';
  if (name.includes('사과')) return '🍎';
  if (name.includes('배')) return '🍐';
  if (name.includes('레몬') || name.includes('유자')) return '🍋';
  if (name.includes('귤') || name.includes('오렌지')) return '🍊';
  if (name.includes('달걀') || name.includes('계란')) return '🥚';
  if (name.includes('면') || name.includes('파스타')) return '🍝';
  if (name.includes('밥') || name.includes('쌀')) return '🍚';
  if (name.includes('빵')) return '🍞';
  return categoryEmoji[category] || '🍽️';
}

function AddPantryModal({ visible, onClose, onSubmit, bottomInset = 0 }) {
  const [form, setForm] = useState({ name: '', category: '채소' });

  const submit = async () => {
    if (!form.name.trim()) return;
    await onSubmit(form);
    setForm({ name: '', category: '채소' });
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
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.categoryEmoji}>{getIngredientEmoji(item.name, item.category)}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
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
  categoryEmoji: {
    fontSize: 18,
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
