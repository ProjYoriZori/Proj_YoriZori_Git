import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import Screen from '@/src/components/common/Screen';
import SoftInput from '@/src/components/common/SoftInput';
import SoftButton from '@/src/components/common/SoftButton';
import SoftCard from '@/src/components/common/SoftCard';
import SectionHeader from '@/src/components/common/SectionHeader';
import { useCartStore, useFridgeStore } from '@/src/store';
import { useRecipes } from '@/src/hooks/useRecipes';

export default function CartScreen() {
  const { items, addItem, toggleItem, removeChecked } = useCartStore();
  const { hasItem, addItem: addFridgeItem } = useFridgeStore();
  const { recipes } = useRecipes();
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
    const recipe = recipes[0];
    recipe?.ingredients.forEach((ingredient) => {
      if (!hasItem(ingredient.name)) addItem(ingredient.name);
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-extrabold text-text mb-3">Cart</Text>
        <SoftInput placeholder="Add grocery item" value={text} onChangeText={setText} />
        <View className="mt-3">
          <SoftButton label="Add item" variant="secondary" onPress={onAdd} />
        </View>

        <View className="mt-6">
          <SectionHeader title="Checklist" actionLabel="Clear done" onPress={removeChecked} />
          {items.length === 0 ? (
            <Text className="text-sm text-muted">Your cart is empty.</Text>
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
          <SoftButton label="Auto-add missing ingredients" onPress={onAutoAdd} />
        </View>
      </ScrollView>
    </Screen>
  );
}
