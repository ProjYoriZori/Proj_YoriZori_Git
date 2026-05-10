import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import Screen from '@/src/components/common/Screen';
import SoftInput from '@/src/components/common/SoftInput';
import SoftButton from '@/src/components/common/SoftButton';
import SoftCard from '@/src/components/common/SoftCard';
import SectionHeader from '@/src/components/common/SectionHeader';
import { useCartStore, useFridgeStore } from '@/src/store';
import { RECIPES } from '@/src/mocks/recipes';

export default function CartScreen() {
  const { items, addItem, toggleItem, removeChecked } = useCartStore();
  const { hasItem, addItem: addFridgeItem } = useFridgeStore();
  const [text, setText] = useState('');

  const onAdd = () => {
    if (!text.trim()) return;
    addItem(text.trim());
    setText('');
  };

  const onToggle = (id: string, name: string, checked: boolean) => {
    toggleItem(id);
    if (!checked && !hasItem(name)) addFridgeItem(name, 6);
  };

  const onAutoAdd = () => {
    const recipe = RECIPES[0];
    recipe.ingredients.forEach((i) => {
      if (!hasItem(i.name)) addItem(i.name);
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-extrabold text-text mb-3">장보기</Text>
        <SoftInput placeholder="장보기 항목 추가" value={text} onChangeText={setText} />
        <View className="mt-3">
          <SoftButton label="항목 추가" variant="secondary" onPress={onAdd} />
        </View>

        <View className="mt-6">
          <SectionHeader title="체크리스트" actionLabel="완료 항목 제거" onPress={removeChecked} />
          {items.length === 0 ? (
            <Text className="text-sm text-muted">장보기 항목이 비어있어요</Text>
          ) : (
            items.map((item) => (
              <SoftCard key={item.id} className="mb-3">
                <Pressable onPress={() => onToggle(item.id, item.name, item.checked)} className="flex-row items-center">
                  <View className={`w-5 h-5 rounded-md border mr-3 ${item.checked ? 'bg-primary-green border-primary-green' : 'border-[#E6DCD2]'}`} />
                  <Text className={`text-base ${item.checked ? 'line-through text-muted' : 'text-text'} font-semibold`}>
                    {item.name}
                  </Text>
                </Pressable>
              </SoftCard>
            ))
          )}
        </View>

        <View className="mt-5">
          <SoftButton label="레시피 부족 재료 자동 추가" onPress={onAutoAdd} />
        </View>
      </ScrollView>
    </Screen>
  );
}
