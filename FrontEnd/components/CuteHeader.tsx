import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CuteHeader({ title, emoji = '🍽️' }: { title: string; emoji?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  emoji: { fontSize: 28, marginRight: 10 },
  title: { fontSize: 22, fontWeight: '800', color: '#333' },
});
