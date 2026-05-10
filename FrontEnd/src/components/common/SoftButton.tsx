import React from 'react';
import { Pressable, Text, PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  className?: string;
};

const variantClass: Record<Variant, string> = {
  primary: 'bg-primary-orange',
  secondary: 'bg-primary-green',
  ghost: 'bg-white border border-[#F2E6D8]',
};

export default function SoftButton({ label, variant = 'primary', className = '', ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      className={`rounded-full px-5 py-3 items-center ${variantClass[variant]} ${className}`}
    >
      <Text className={`font-bold ${variant === 'ghost' ? 'text-text' : 'text-white'}`}>{label}</Text>
    </Pressable>
  );
}
