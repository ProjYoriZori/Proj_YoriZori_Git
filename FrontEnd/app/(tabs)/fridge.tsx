import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import Screen from '@/src/components/common/Screen';
import SoftInput from '@/src/components/common/SoftInput';
import SoftButton from '@/src/components/common/SoftButton';
import SoftCard from '@/src/components/common/SoftCard';
import SectionHeader from '@/src/components/common/SectionHeader';
import { useFridgeStore } from '@/src/store';

export default function FridgeScreen() {
  const { items, addItem, removeItem, updateItem } = useFridgeStore();
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const onAdd = () => {
    if (!text.trim()) return;
    addItem(text.trim());
    setText('');
  };

  const onEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingText(name);
  };

  const onSave = () => {
    if (!editingId || !editingText.trim()) return;
    updateItem(editingId, editingText.trim());
    setEditingId(null);
    setEditingText('');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-extrabold text-text mb-3">Fridge</Text>
        <SoftInput placeholder="Add ingredient, e.g. tomato" value={text} onChangeText={setText} />
        <View className="mt-3">
          <SoftButton label="Add" onPress={onAdd} />
        </View>

        <View className="mt-6">
          <SectionHeader title="My ingredients" />
          <View className="flex-row flex-wrap">
            {items.map((item) => (
              <SoftCard key={item.id} className="w-[48%] mr-[4%] mb-3">
                {editingId === item.id ? (
                  <View>
                    <SoftInput value={editingText} onChangeText={setEditingText} />
                    <View className="flex-row mt-2">
                      <Pressable onPress={onSave} className="px-3 py-2 rounded-full bg-primary-green mr-2">
                        <Text className="text-white font-semibold text-xs">Save</Text>
                      </Pressable>
                      <Pressable onPress={() => setEditingId(null)} className="px-3 py-2 rounded-full bg-[#F0F0F0]">
                        <Text className="text-text font-semibold text-xs">Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text className="text-base font-bold text-text">{item.name}</Text>
                    <Text className="text-xs text-muted mt-1">{item.expiresInDays} days left</Text>
                    <View className="flex-row mt-3">
                      <Pressable onPress={() => onEdit(item.id, item.name)} className="px-3 py-2 rounded-full bg-[#F8F1FF] mr-2">
                        <Text className="text-xs font-semibold text-[#7C5DFA]">Edit</Text>
                      </Pressable>
                      <Pressable onPress={() => removeItem(item.id)} className="px-3 py-2 rounded-full bg-[#FFE9E9]">
                        <Text className="text-xs font-semibold text-warn">Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </SoftCard>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
