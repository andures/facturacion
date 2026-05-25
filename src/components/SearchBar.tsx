import { StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '@/constants/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Buscar...' }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        clearButtonMode="while-editing"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm + 2,
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  icon: {
    fontSize: 14,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: FONT.regular,
  },
});
