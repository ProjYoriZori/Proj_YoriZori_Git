import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useTimerStore } from '../../store';

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function FloatingTimer() {
  const { label, remainingSec, isRunning, isVisible, pause, resume, stop, tick } = useTimerStore();
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [isRunning, tick]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      startX.value = offsetX.value;
      startY.value = offsetY.value;
    })
    .onUpdate((e) => {
      offsetX.value = startX.value + e.translationX;
      offsetY.value = startY.value + e.translationY;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }, { translateY: offsetY.value }],
  }));

  if (!isVisible) return null;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View className="absolute right-5 bottom-24" style={animatedStyle}>
        <View className="bg-white rounded-full px-4 py-3 flex-row items-center shadow">
          <View className="mr-3">
            <Text className="text-xs text-muted">{label}</Text>
            <Text className="text-base font-bold text-text">{formatTime(remainingSec)}</Text>
          </View>
          <Pressable onPress={isRunning ? pause : resume} className="px-3 py-2 rounded-full bg-[#F8F1FF]">
            <Text className="text-xs font-semibold text-[#7C5DFA]">{isRunning ? '일시정지' : '재개'}</Text>
          </Pressable>
          <Pressable onPress={stop} className="ml-2 px-3 py-2 rounded-full bg-[#FFE9E9]">
            <Text className="text-xs font-semibold text-warn">닫기</Text>
          </Pressable>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
