import React from 'react';
import { View, Text } from 'react-native';

type Props = {
  label: string;
  value: string;
  accent?: 'warn' | 'banana' | 'green';
};

const accentClass: Record<NonNullable<Props['accent']>, string> = {
  warn: 'text-warn',
  banana: 'text-banana',
  green: 'text-primary-green',
};

export default function StatPill({ label, value, accent = 'green' }: Props) {
  return (
    <View className="bg-[#FFF6EC] rounded-2xl px-4 py-3">
      <Text className={`text-xl font-extrabold ${accentClass[accent]}`}>{value}</Text>
      <Text className="text-xs font-semibold text-muted mt-1">{label}</Text>
    </View>
  );
}
