import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { createProducto } from '@/src/db/productos';
import { LabeledInput } from '@/src/components/LabeledInput';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { COLORS, FONT, RADIUS, SPACING } from '@/constants/theme';

export default function NuevoProductoScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    iva: '15',
  });
  const [saving, setSaving] = useState(false);

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const precio = parseFloat(form.precio.replace(',', '.'));
  const iva = parseFloat(form.iva.replace(',', '.'));
  const canSave = form.nombre.trim().length > 0 && !isNaN(precio) && precio > 0 && !isNaN(iva);

  const handleSave = () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      createProducto({
        id: crypto.randomUUID(),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio,
        iva,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el producto.');
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
        <LabeledInput label="Nombre *" value={form.nombre} onChangeText={update('nombre')} placeholder="Ej: Diseño web" />
        <LabeledInput label="Descripción" value={form.descripcion} onChangeText={update('descripcion')} placeholder="Breve descripción del servicio..." multiline />
        <View style={styles.row}>
          <View style={styles.flex}>
            <LabeledInput
              label="Precio *"
              value={form.precio}
              onChangeText={update('precio')}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.ivaCol}>
            <LabeledInput
              label="IVA %"
              value={form.iva}
              onChangeText={update('iva')}
              placeholder="15"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </View>

      <Pressable
        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!canSave || saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar producto'}</Text>
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
  row: { flexDirection: 'row', gap: SPACING.sm },
  flex: { flex: 1 },
  ivaCol: { width: 90 },
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
