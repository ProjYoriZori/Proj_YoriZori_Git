import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card, Chip, Field, PrimaryButton, SectionHeader } from '../components/ui';
import { useAppData } from '../context/AppDataContext';
import { colors, globalStyles } from '../theme';
import { calculateDRI } from '../utils/nutrition';

const goals = ['다이어트', '유지', '벌크업'];
const activities = ['낮음', '보통', '높음'];

function ProfileForm({ profile, onSave }) {
  const [form, setForm] = useState({
    nickname: profile?.nickname || '요리조리',
    email: profile?.email || '',
    gender: profile?.gender || '남성',
    age: profile?.age || '',
    height: profile?.height || '',
    weight: profile?.weight || '',
    goal: profile?.goal || '유지',
    activityLevel: profile?.activityLevel || '보통',
  });

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <View style={styles.formGap}>
      <Field value={form.nickname} onChangeText={(value) => set('nickname', value)} placeholder="닉네임" />
      <Field value={form.email} onChangeText={(value) => set('email', value)} placeholder="이메일" keyboardType="email-address" />

      <Text style={styles.label}>성별</Text>
      <View style={styles.chipRow}>
        {['남성', '여성'].map((gender) => (
          <Chip key={gender} label={gender} active={form.gender === gender} onPress={() => set('gender', gender)} icon="account-outline" />
        ))}
      </View>

      <View style={styles.formRow}>
        <Field value={form.age} onChangeText={(value) => set('age', value)} placeholder={"나이\n"} keyboardType="number-pad" style={{ flex: 1 }} multiline={true} />
        <Field value={form.height} onChangeText={(value) => set('height', value)} placeholder={"키\ncm"} keyboardType="decimal-pad" style={{ flex: 1 }} multiline={true} />
        <Field value={form.weight} onChangeText={(value) => set('weight', value)} placeholder={"체중\nkg"} keyboardType="decimal-pad" style={{ flex: 1 }} multiline={true} />
      </View>

      <Text style={styles.label}>목표</Text>
      <View style={styles.chipRow}>
        {goals.map((goal) => (
          <Chip key={goal} label={goal} active={form.goal === goal} onPress={() => set('goal', goal)} icon="target" />
        ))}
      </View>

      <Text style={styles.label}>활동량</Text>
      <View style={styles.chipRow}>
        {activities.map((activity) => (
          <Chip key={activity} label={activity} active={form.activityLevel === activity} onPress={() => set('activityLevel', activity)} icon="run" />
        ))}
      </View>

      <PrimaryButton
        label="저장하기"
        icon="content-save-outline"
        onPress={() => onSave({
          ...form,
          age: Number(form.age) || '',
          height: Number(form.height) || '',
          weight: Number(form.weight) || '',
        })}
      />
    </View>
  );
}

export default function MyPageScreen() {
  const { profile, saveProfile } = useAppData();
  const dri = useMemo(() => calculateDRI(profile), [profile]);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={globalStyles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={34} color={colors.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile?.nickname || '사용자'}</Text>
            <Text style={globalStyles.subtitle}>{profile?.email || '프로필 정보를 입력해 주세요'}</Text>
          </View>
        </View>

        <View style={styles.targetGrid}>
          <View style={styles.targetBox}>
            <Text style={styles.targetValue}>{dri.calories}</Text>
            <Text style={styles.targetLabel}>목표 kcal</Text>
          </View>
          <View style={styles.targetBox}>
            <Text style={styles.targetValue}>{dri.protein}g</Text>
            <Text style={styles.targetLabel}>단백질</Text>
          </View>
          <View style={styles.targetBox}>
            <Text style={styles.targetValue}>{dri.carbs}g</Text>
            <Text style={styles.targetLabel}>탄수화물</Text>
          </View>
        </View>

        <Card>
          <SectionHeader title="프로필 설정" icon="account-edit-outline" />
          <ProfileForm profile={profile} onSave={saveProfile} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 8,
    paddingBottom: 16,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  targetGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  targetBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
  },
  targetValue: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: '900',
  },
  targetLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  formGap: {
    gap: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '900',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
});