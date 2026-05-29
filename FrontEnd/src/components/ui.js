import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, globalStyles } from '../theme';

export function Card({ children, style }) {
  return <View style={[globalStyles.card, style]}>{children}</View>;
}

export function SectionHeader({ title, actionLabel, onAction, icon }) {
  return (
    <View style={[globalStyles.between, styles.sectionHeader]}>
      <View style={globalStyles.row}>
        {icon ? <MaterialCommunityIcons name={icon} size={20} color={colors.primaryDark} style={{ marginRight: 8 }} /> : null}
        <Text style={globalStyles.sectionTitle}>{title}</Text>
      </View>
      {actionLabel ? (
        <Pressable onPress={onAction} style={styles.textButton}>
          <Text style={styles.textButtonLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chip({ label, amount, active, onPress, icon, tone = 'primary' }) {
  const activeColor = tone === 'warning' ? colors.warning : colors.primaryDark;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: activeColor, borderColor: activeColor }]}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={14} color={active ? colors.surface : activeColor} /> : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      {amount ? <Text style={[styles.chipAmount, active && styles.chipAmountActive]}>{amount}</Text> : null}
    </Pressable>
  );
}

export function PrimaryButton({ label, onPress, icon, disabled, tone = 'primary', style }) {
  const backgroundColor = tone === 'danger' ? colors.danger : tone === 'secondary' ? colors.secondary : colors.primaryDark;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor, opacity: disabled ? 0.45 : pressed ? 0.86 : 1 },
        style,
      ]}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={18} color={colors.surface} /> : null}
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, color = colors.text, backgroundColor = colors.surfaceAlt, size = 40 }) {
  return (
    <Pressable onPress={onPress} style={[styles.iconButton, { width: size, height: size, backgroundColor }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </Pressable>
  );
}

// 수정된 부분: ...props를 추가하여 외부에서 전달하는 multiline 등의 속성을 받도록 처리
export function Field({ value, onChangeText, placeholder, keyboardType = 'default', style, ...props }) {
  return (
    <TextInput
      value={String(value ?? '')}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      keyboardType={keyboardType}
      style={[styles.field, style]}
      {...props}
    />
  );
}

export function EmptyState({ icon = 'information-outline', title, body }) {
  return (
    <View style={styles.empty}>
      <MaterialCommunityIcons name={icon} size={42} color={colors.muted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
    </View>
  );
}

export function LoadingState() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primaryDark} />
      <Text style={styles.loadingText}>데이터를 준비하고 있어요</Text>
    </View>
  );
}

function ToastView({ message }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]),
      Animated.delay(1800),
      Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
      <MaterialCommunityIcons name="check-circle-outline" size={17} color={colors.surface} />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  const ToastContainer = toasts.length > 0 ? (
    <View style={styles.toastContainer} pointerEvents="none">
      {toasts.map((t) => <ToastView key={t.id} message={t.message} />)}
    </View>
  ) : null;

  return { showToast, ToastContainer };
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginBottom: 16,
  },
  textButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
  },
  textButtonLabel: {
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: {
    color: colors.textSoft,
    fontWeight: '800',
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.surface,
  },
  chipAmount: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  chipAmountActive: {
    color: colors.surface,
    opacity: 0.75,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '900',
  },
  iconButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 14,
    textAlignVertical: 'center', // 추가된 부분: 안드로이드에서 multiline 사용 시 텍스트 가운데 정렬
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    marginTop: 10,
    color: colors.textSoft,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 19,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSoft,
    fontWeight: '700',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 110,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.text,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  toastText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
});