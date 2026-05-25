import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { COLORS, FONT, RADIUS, SPACING } from '@/constants/theme';

type SymbolName = SymbolViewProps['name'];

const ICONS_ACTIVE: Record<string, SymbolName> = {
  clientes:  { ios: 'person.2.fill',    android: 'group',        web: 'group' },
  facturas:  { ios: 'doc.text.fill',    android: 'receipt_long', web: 'receipt_long' },
  productos: { ios: 'shippingbox.fill', android: 'inventory_2',  web: 'inventory_2' },
  ajustes:   { ios: 'gearshape.fill',   android: 'settings',     web: 'settings' },
} as Record<string, SymbolName>;

const ICONS_IDLE: Record<string, SymbolName> = {
  clientes:  { ios: 'person.2',    android: 'group',        web: 'group' },
  facturas:  { ios: 'doc.text',    android: 'receipt_long', web: 'receipt_long' },
  productos: { ios: 'shippingbox', android: 'inventory_2',  web: 'inventory_2' },
  ajustes:   { ios: 'gearshape',   android: 'settings',     web: 'settings' },
} as Record<string, SymbolName>;

interface Props {
  state: any;
  descriptors: any;
  navigation: any;
}

export function TabBar({ state, descriptors, navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom + 8, 20), pointerEvents: 'box-none' }]}>
      <View style={styles.bar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const icons = isFocused ? ICONS_ACTIVE : ICONS_IDLE;
          const icon = icons[route.name] ?? { ios: 'circle', android: 'circle', web: 'circle' };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.75}
              style={styles.tab}
            >
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <SymbolView
                  name={icon}
                  tintColor={isFocused ? COLORS.primary : COLORS.textTertiary}
                  size={21}
                />
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]} numberOfLines={1}>
                {String(options.title ?? route.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 6,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 52,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  iconWrapActive: {
    backgroundColor: COLORS.primaryLight,
  },
  label: {
    fontSize: 10,
    fontWeight: FONT.medium,
    color: COLORS.textTertiary,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: COLORS.primary,
    fontWeight: FONT.semibold,
  },
});
