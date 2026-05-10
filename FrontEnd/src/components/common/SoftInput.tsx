import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

type Props = TextInputProps & { className?: string };

export default function SoftInput({ className = '', ...rest }: Props) {
  return (
    <TextInput
      {...rest}
      className={`bg-white rounded-2xl px-4 py-3 text-text border border-[#F2E6D8] ${className}`}
      placeholderTextColor="#9CA3AF"
    />
  );
}
