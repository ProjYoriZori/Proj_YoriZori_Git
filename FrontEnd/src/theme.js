import { Platform, StyleSheet } from 'react-native';

export const colors = {
  background: '#f7fbf6',
  surface: '#ffffff',
  surfaceAlt: '#eef8f1',
  primary: '#47c978',
  primaryDark: '#15834f',
  secondary: '#ff8f70',
  warning: '#f2ad3f',
  danger: '#e55d5d',
  text: '#23342b',
  textSoft: '#65746b',
  muted: '#9cad9f',
  border: '#dfece2',
  chip: '#edf8ef',
};

export const shadow = Platform.select({
  ios: {
    shadowColor: '#1c3327',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  android: {
    elevation: 3,
  },
  default: {
    shadowColor: '#1c3327',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
});

export const globalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  detailContent: {
    paddingHorizontal: 18,
    paddingBottom: 148,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    ...shadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  small: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
});
