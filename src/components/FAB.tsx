import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT } from '@/constants/theme';

interface Props {
  onPress: () => void;
  label?: string;
}

export function FAB({ onPress, label }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        !!label && styles.fabExtended,
        pressed && styles.fabPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>+</Text>
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 104,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 26,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0px 4px 16px ${COLORS.primary}55, 0px 1px 4px ${COLORS.primary}33`,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    elevation: 8,
  },
  fabExtended: {
    borderRadius: 16,
    width: undefined,
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 8,
  },
  fabPressed: {
    transform: [{ scale: 0.92 }],
    boxShadow: `0px 2px 8px ${COLORS.primary}33`,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    color: '#0F172A',
    fontWeight: FONT.bold,
    lineHeight: 26,
    includeFontPadding: false,
  },
  label: {
    fontSize: 14,
    fontWeight: FONT.semibold,
    color: '#0F172A',
    letterSpacing: -0.2,
  },
});
