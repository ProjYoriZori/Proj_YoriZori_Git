import React from 'react';
import { View, Text, Pressable } from 'react-native';

type Props = {
  title: string;
  actionLabel?: string;
  onPress?: () => void;
};

export default function SectionHeader({ title, actionLabel, onPress }: Props) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-lg font-bold text-text">{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onPress}>
          <Text className="text-sm font-semibold text-primary-green">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
