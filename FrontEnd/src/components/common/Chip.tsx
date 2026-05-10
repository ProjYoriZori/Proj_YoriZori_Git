import React from 'react';
import { Pressable, Text, PressableProps } from 'react-native';

type Props = PressableProps & {
  label: string;
  selected?: boolean;
};

export default function Chip({ label, selected, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      className={`px-4 py-2 rounded-2xl mr-2 mb-2 border ${selected ? 'bg-primary-orange border-primary-orange' : 'bg-white border-[#F2E6D8]'}`}
    >
      <Text className={`font-semibold ${selected ? 'text-white' : 'text-text'}`}>{label}</Text>
    </Pressable>
  );
}
