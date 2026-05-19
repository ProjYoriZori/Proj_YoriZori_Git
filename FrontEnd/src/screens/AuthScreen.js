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
import { api, setAuthToken } from '../api/client';
import { colors, globalStyles } from '../theme';

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const submit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (mode === 'signup' && !nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    setLoading(true);
    try {
      const result = mode === 'login'
        ? await api.login({ email: email.trim(), password })
        : await api.signup({ email: email.trim(), password, nickname: nickname.trim() });
      const token = result?.accessToken || result?.token || result?.access_token;
      if (token) setAuthToken(token);
      onAuth({ token, user: result?.user, isNewUser: mode === 'signup' });
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('401') || msg.includes('400')) {
        setError(mode === 'login' ? '이메일 또는 비밀번호가 틀렸어요.' : '이미 사용 중인 이메일이에요.');
      } else {
        setError('오류가 발생했어요. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
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
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <MaterialCommunityIcons name="chef-hat" size={44} color={colors.primaryDark} />
            </View>
            <Text style={styles.appName}>요리조리</Text>
            <Text style={styles.tagline}>냉장고 재료로 만드는 레시피</Text>
          </View>

          <View style={styles.modeRow}>
            <Chip label="로그인" active={mode === 'login'} onPress={() => switchMode('login')} icon="login" />
            <Chip label="회원가입" active={mode === 'signup'} onPress={() => switchMode('signup')} icon="account-plus-outline" />
          </View>

          <View style={styles.form}>
            {mode === 'signup' && (
              <Field
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임"
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
            <Field
              value={email}
              onChangeText={setEmail}
              placeholder="이메일"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Field
              value={password}
              onChangeText={setPassword}
              placeholder={mode === 'signup' ? '비밀번호 (8자 이상)' : '비밀번호'}
              secureTextEntry
              autoCapitalize="none"
            />
            {error ? (
              <View style={styles.errorWrap}>
                <MaterialCommunityIcons name="alert-circle-outline" size={15} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            <PrimaryButton
              label={loading ? '잠시만요...' : mode === 'login' ? '로그인' : '회원가입'}
              icon={mode === 'login' ? 'login' : 'account-plus-outline'}
              onPress={submit}
              disabled={loading}
            />
          </View>

          <Text style={styles.hint}>
            {mode === 'login' ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
            <Text style={styles.hintLink} onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? '회원가입' : '로그인'}
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  appName: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.text,
  },
  tagline: {
    marginTop: 6,
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: '700',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  form: {
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 20,
  },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  hint: {
    textAlign: 'center',
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '700',
  },
  hintLink: {
    color: colors.primaryDark,
    fontWeight: '900',
  },
});
