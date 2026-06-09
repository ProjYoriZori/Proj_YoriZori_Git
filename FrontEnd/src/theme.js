import { Platform, StyleSheet } from 'react-native';

// Warm "home kitchen" palette — cream paper base with a single confident
// herb-green brand color and a terracotta accent used sparingly, instead of
// the cooler mint + rainbow-of-semantic-colors combo.
export const colors = {
  background: '#faf6ee',
  surface: '#ffffff',
  surfaceAlt: '#f3ede0',
  primary: '#5d7a52',
  primaryDark: '#3f5536',
  accent: '#c1693f',
  warning: '#bd9143',
  danger: '#b6543f',
  text: '#2c2620',
  textSoft: '#80766a',
  muted: '#aea394',
  border: '#e9e0d2',
  chip: '#f1ead9',

  // legacy alias kept so screens still referencing colors.secondary keep working
  secondary: '#c1693f',
};

export const shadow = Platform.select({
  ios: {
    shadowColor: '#2c2620',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  android: {
    elevation: 2,
  },
  default: {
    shadowColor: '#2c2620',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
});

// A real type scale: weight and size move together on purpose, so the page
// reads with hierarchy instead of every label fighting at maximum boldness.
export const type = {
  display: {
    color: '#2c2620',
    fontSize: 33,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  title: {
    color: '#2c2620',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionTitle: {
    color: '#2c2620',
    fontSize: 17,
    fontWeight: '700',
  },
  body: {
    color: '#2c2620',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
  },
  bodyStrong: {
    color: '#2c2620',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  subtitle: {
    color: '#80766a',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  label: {
    color: '#80766a',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  eyebrow: {
    color: '#3f5536',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
};

export const globalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 28,
  },
  detailContent: {
    paddingHorizontal: 20,
    paddingBottom: 148,
    gap: 26,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
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
  title: type.title,
  subtitle: type.subtitle,
  sectionTitle: type.sectionTitle,
  small: type.label,
});
