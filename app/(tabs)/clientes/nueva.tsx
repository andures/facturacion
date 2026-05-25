import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { createCliente } from '@/src/db/clientes';
import { LabeledInput } from '@/src/components/LabeledInput';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { COLORS, FONT, RADIUS, SPACING } from '@/constants/theme';

export default function NuevoClienteScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    direccion: '',
  });
  const [saving, setSaving] = useState(false);

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canSave = form.nombre.trim().length > 0;

  const handleSave = () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      createCliente({
        id: crypto.randomUUID(),
        nombre: form.nombre.trim(),
        empresa: form.empresa.trim() || null,
        email: form.email.trim() || null,
        telefono: form.telefono.trim() || null,
        direccion: form.direccion.trim() || null,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el cliente.');
      setSaving(false);
    }
  };

  return (
    <>
      <ScreenHeader />
      <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <LabeledInput label="Nombre *" value={form.nombre} onChangeText={update('nombre')} placeholder="Ej: María García" />
        <LabeledInput label="Empresa" value={form.empresa} onChangeText={update('empresa')} placeholder="Ej: Tech SL" />
        <LabeledInput label="Email" value={form.email} onChangeText={update('email')} placeholder="correo@ejemplo.com" keyboardType="email-address" autoCapitalize="none" />
        <LabeledInput label="Teléfono" value={form.telefono} onChangeText={update('telefono')} placeholder="+34 600 000 000" keyboardType="phone-pad" />
        <LabeledInput label="Dirección" value={form.direccion} onChangeText={update('direccion')} placeholder="Calle, número, ciudad..." multiline />
      </View>

      <Pressable
        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!canSave || saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar cliente'}</Text>
      </Pressable>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderCurve: 'continuous',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    borderCurve: 'continuous',
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { fontSize: 16, fontWeight: FONT.semibold, color: '#fff' },
});
