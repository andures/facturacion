import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LabeledInput } from '@/src/components/LabeledInput';
import { useSettingsStore } from '@/src/store/settings';
import { COLORS, FONT, RADIUS, SPACING } from '@/constants/theme';

export default function AjustesScreen() {
  const insets = useSafeAreaInsets();
  const {
    businessName, setBusinessName,
    taxId, setTaxId,
    address, setAddress,
    invoicePrefix, setInvoicePrefix,
    nextInvoiceNumber,
    logoUri, setLogoUri,
  } = useSettingsStore();

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const dest = `${FileSystem.documentDirectory}logo_${Date.now()}.jpg`;
    if (logoUri) await FileSystem.deleteAsync(logoUri, { idempotent: true });
    await FileSystem.copyAsync({ from: result.assets[0].uri, to: dest });
    setLogoUri(dest);
  };

  const nextNumber = `${invoicePrefix}${new Date().getFullYear()}-${String(nextInvoiceNumber).padStart(3, '0')}`;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.md }]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Logo ─────────────────────────── */}
      <TouchableOpacity style={styles.logoHero} onPress={pickLogo} activeOpacity={0.8}>
        <View style={styles.logoWrap}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logoImg} contentFit="contain" />
          ) : (
            <Text style={styles.logoEmoji}>🏢</Text>
          )}
        </View>
        <View style={styles.logoInfo}>
          <Text style={styles.logoTitle}>{logoUri ? 'Logo del negocio' : 'Sin logo'}</Text>
          <Text style={styles.logoHint}>Toca para {logoUri ? 'cambiar' : 'subir'} · aparece en tus facturas</Text>
        </View>
        <View style={styles.logoEditChip}>
          <Text style={styles.logoEditChipText}>{logoUri ? 'Cambiar' : 'Subir'}</Text>
        </View>
      </TouchableOpacity>

      {/* ── Empresa ──────────────────────── */}
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Empresa</Text>
        <View style={styles.groupCard}>
          <LabeledInput
            label="Nombre / Razón social"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Ej: Mi Empresa SL"
          />
          <View style={styles.divider} />
          <LabeledInput
            label="NIF / CIF"
            value={taxId}
            onChangeText={setTaxId}
            placeholder="Ej: B12345678"
            autoCapitalize="characters"
          />
          <View style={styles.divider} />
          <LabeledInput
            label="Dirección fiscal"
            value={address}
            onChangeText={setAddress}
            placeholder="Calle, número, ciudad, CP"
            multiline
          />
        </View>
      </View>

      {/* ── Facturación ──────────────────── */}
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Facturación</Text>
        <View style={styles.groupCard}>
          <LabeledInput
            label="Prefijo de factura"
            value={invoicePrefix}
            onChangeText={setInvoicePrefix}
            placeholder="Ej: F-"
            autoCapitalize="characters"
          />
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View>
              <Text style={styles.infoRowLabel}>Próximo número</Text>
              <Text style={styles.infoRowHint}>Se asigna al guardar la factura</Text>
            </View>
            <View style={styles.numberBadge}>
              <Text style={styles.numberBadgeText}>{nextNumber}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.md, gap: SPACING.md, paddingBottom: 120 },

  // Logo hero
  logoHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    borderCurve: 'continuous',
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  logoImg: { width: '100%', height: '100%' },
  logoEmoji: { fontSize: 26 },
  logoInfo: { flex: 1, gap: 3 },
  logoTitle: { fontSize: 15, fontWeight: FONT.semibold, color: COLORS.text },
  logoHint: { fontSize: 12, color: COLORS.textTertiary, lineHeight: 17 },
  logoEditChip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoEditChipText: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.primary },

  // Groups
  group: { gap: 6 },
  groupLabel: {
    fontSize: 13,
    fontWeight: FONT.semibold,
    color: COLORS.textSecondary,
    paddingHorizontal: 4,
  },
  groupCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: -SPACING.md,
  },

  // Info row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoRowLabel: { fontSize: 14, fontWeight: FONT.medium, color: COLORS.text },
  infoRowHint: { fontSize: 11, color: COLORS.textTertiary, marginTop: 2 },
  numberBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  numberBadgeText: { fontSize: 13, fontWeight: FONT.bold, color: COLORS.primary },

});
