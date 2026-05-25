import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS } from '@/constants/theme';

interface Props {
  onPress: () => void;
  label?: string;
}

export function FAB({ onPress, label }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      onPress={onPress}
    >
      <Text style={styles.icon}>+</Text>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    minWidth: 56,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 6,
    boxShadow: `0px 4px 8px ${COLORS.primary}59`,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  icon: {
    fontSize: 26,
    color: '#fff',
    lineHeight: 30,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
