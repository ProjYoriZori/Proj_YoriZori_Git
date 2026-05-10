import React from 'react';
import { ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = ViewProps & { className?: string };

export default function Screen({ className = '', style, ...rest }: Props) {
  return (
    <SafeAreaView
      {...rest}
      style={[{ flex: 1, backgroundColor: '#FFFDF9' }, style]}
      className={`flex-1 bg-bg ${className}`}
    />
  );
}
