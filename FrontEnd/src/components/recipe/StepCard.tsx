import React from 'react';
import { View, Text, Pressable } from 'react-native';
import SoftCard from '../common/SoftCard';

type Props = {
  index: number;
  text: string;
  onTimer?: () => void;
};

export default function StepCard({ index, text, onTimer }: Props) {
  return (
    <SoftCard className="mb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-8 h-8 rounded-full bg-[#FFE8D1] items-center justify-center mr-3">
            <Text className="font-bold text-text">{index}</Text>
          </View>
          <Text className="text-sm text-text flex-1">{text}</Text>
        </View>
        <Pressable onPress={onTimer} className="px-3 py-2 rounded-full bg-[#F8F1FF] ml-2">
          <Text className="text-xs font-semibold text-[#7C5DFA]">Timer</Text>
        </Pressable>
      </View>
    </SoftCard>
  );
}
