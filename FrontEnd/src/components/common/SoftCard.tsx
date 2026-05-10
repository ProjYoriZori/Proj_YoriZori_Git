import React from 'react';
import { View, ViewProps } from 'react-native';
import { SHADOW } from '../../constants/layout';

type Props = ViewProps & { className?: string };

export default function SoftCard({ className = '', style, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[SHADOW.soft, style]}
      className={`bg-surface rounded-3xl p-4 ${className}`}
    />
  );
}
