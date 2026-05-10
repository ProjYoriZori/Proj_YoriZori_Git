import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function IngredientChip({ name, small }: { name: string; small?: boolean }) {
  return (
    <View style={[styles.chip, small && styles.small]}>
      <Text style={[styles.text, small && styles.smallText]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#FFF0F6',
    borderColor: '#FFB6C1',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    marginRight: 8,
    marginBottom: 8,
  },
  text: { color: '#D6336C', fontWeight: '600' },
  small: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 14 },
  smallText: { fontSize: 12 },
});
