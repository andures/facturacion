import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, SPACING } from '@/constants/theme';

interface Props {
  right?: React.ReactNode;
  onBack?: () => void;
}

export function ScreenHeader({ right, onBack }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable
        style={({ pressed }) => [styles.back, pressed && { opacity: 0.55 }]}
        onPress={onBack ?? (() => router.back())}
        hitSlop={12}
      >
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>
      <View style={styles.flex} />
      {right ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  backIcon: {
    fontSize: 32,
    color: COLORS.text,
    lineHeight: 36,
    fontWeight: FONT.regular,
    marginTop: -2,
  },
  flex: { flex: 1 },
});
