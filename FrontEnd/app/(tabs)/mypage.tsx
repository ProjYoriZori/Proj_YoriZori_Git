import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Screen from '@/src/components/common/Screen';
import SectionHeader from '@/src/components/common/SectionHeader';
import SoftInput from '@/src/components/common/SoftInput';
import Chip from '@/src/components/common/Chip';
import SoftButton from '@/src/components/common/SoftButton';
import SoftCard from '@/src/components/common/SoftCard';

export default function MyPageScreen() {
  const [gender, setGender] = useState('Female');
  const [age, setAge] = useState('28');
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('60');
  const [goal, setGoal] = useState('Maintain');
  const [activity, setActivity] = useState('Normal');

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-extrabold text-text mb-3">My page</Text>

        <SoftCard>
          <SectionHeader title="Profile" />
          <View className="mt-2">
            <Text className="text-xs text-muted">Gender</Text>
            <SoftInput value={gender} onChangeText={setGender} className="mt-1" />
          </View>
          <View className="mt-3">
            <Text className="text-xs text-muted">Age</Text>
            <SoftInput value={age} onChangeText={setAge} keyboardType="numeric" className="mt-1" />
          </View>
          <View className="mt-3">
            <Text className="text-xs text-muted">Height (cm)</Text>
            <SoftInput value={height} onChangeText={setHeight} keyboardType="numeric" className="mt-1" />
          </View>
          <View className="mt-3">
            <Text className="text-xs text-muted">Weight (kg)</Text>
            <SoftInput value={weight} onChangeText={setWeight} keyboardType="numeric" className="mt-1" />
          </View>

          <View className="mt-5">
            <Text className="text-xs text-muted mb-2">Goal</Text>
            <View className="flex-row flex-wrap">
              {['Diet', 'Maintain', 'Bulk'].map((item) => (
                <Chip key={item} label={item} selected={goal === item} onPress={() => setGoal(item)} />
              ))}
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-xs text-muted mb-2">Activity</Text>
            <View className="flex-row flex-wrap">
              {['Low', 'Normal', 'High'].map((item) => (
                <Chip key={item} label={item} selected={activity === item} onPress={() => setActivity(item)} />
              ))}
            </View>
          </View>

          <View className="mt-4">
            <SoftButton label="Save" />
          </View>
        </SoftCard>
      </ScrollView>
    </Screen>
  );
}
