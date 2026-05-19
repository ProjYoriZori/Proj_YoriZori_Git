import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Chip, Field, PrimaryButton } from '../components/ui';
import { api } from '../api/client';
import { colors, globalStyles } from '../theme';

const goals = ['다이어트', '유지', '벌크업'];
const activities = ['낮음', '보통', '높음'];

export default function OnboardingScreen({ onComplete }) {
  const [gender, setGender] = useState('남성');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('유지');
  const [activityLevel, setActivityLevel] = useState('보통');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.saveProfile({ gender, age, height, weight, goal, activityLevel });
    } catch {
      // 실패해도 메인으로 진행 (마이페이지에서 수정 가능)
    } finally {
      setLoading(false);
      onComplete();
    }
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>마지막 단계</Text>
            </View>
            <Text style={globalStyles.title}>내 프로필 설정</Text>
            <Text style={[globalStyles.subtitle, { marginTop: 6 }]}>
              정확한 영양 목표 계산을 위해 입력해 주세요.{'\n'}나중에 마이페이지에서 수정할 수 있어요.
            </Text>
          </View>

          {/* 성별 */}
          <View style={styles.section}>
            <View style={styles.sectionLabel}>
              <MaterialCommunityIcons name="account-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.label}>성별</Text>
            </View>
            <View style={styles.chipRow}>
              {['남성', '여성'].map((g) => (
                <Chip key={g} label={g} active={gender === g} onPress={() => setGender(g)} icon="account-outline" />
              ))}
            </View>
          </View>

          {/* 나이·키·체중 */}
          <View style={styles.section}>
            <View style={styles.sectionLabel}>
              <MaterialCommunityIcons name="human" size={18} color={colors.primaryDark} />
              <Text style={styles.label}>신체 정보</Text>
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldWrap}>
                <Field
                  value={age}
                  onChangeText={setAge}
                  placeholder="나이"
                  keyboardType="number-pad"
                />
                <Text style={styles.unit}>세</Text>
              </View>
              <View style={styles.fieldWrap}>
                <Field
                  value={height}
                  onChangeText={setHeight}
                  placeholder="키"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.unit}>cm</Text>
              </View>
              <View style={styles.fieldWrap}>
                <Field
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="체중"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.unit}>kg</Text>
              </View>
            </View>
          </View>

          {/* 목표 */}
          <View style={styles.section}>
            <View style={styles.sectionLabel}>
              <MaterialCommunityIcons name="target" size={18} color={colors.primaryDark} />
              <Text style={styles.label}>목표</Text>
            </View>
            <View style={styles.chipRow}>
              {goals.map((g) => (
                <Chip key={g} label={g} active={goal === g} onPress={() => setGoal(g)} icon="target" />
              ))}
            </View>
          </View>

          {/* 활동량 */}
          <View style={styles.section}>
            <View style={styles.sectionLabel}>
              <MaterialCommunityIcons name="run" size={18} color={colors.primaryDark} />
              <Text style={styles.label}>활동량</Text>
            </View>
            <View style={styles.chipRow}>
              {activities.map((a) => (
                <Chip key={a} label={a} active={activityLevel === a} onPress={() => setActivityLevel(a)} icon="run" />
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label={loading ? '저장 중...' : '완료'}
              icon="check-circle-outline"
              onPress={submit}
              disabled={loading}
            />
            <Text style={styles.skip} onPress={onComplete}>건너뛰기</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  stepText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldWrap: {
    flex: 1,
    gap: 4,
  },
  unit: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
    paddingRight: 4,
  },
  actions: {
    gap: 14,
    marginTop: 8,
  },
  skip: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
});
