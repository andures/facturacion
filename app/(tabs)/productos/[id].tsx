import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getProductoById, updateProducto, deleteProducto } from '@/src/db/productos';
import { LabeledInput } from '@/src/components/LabeledInput';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import type { Producto } from '@/src/types';
import { COLORS, FONT, RADIUS, SPACING } from '@/constants/theme';

export default function EditarProductoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    iva: '15',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const data = getProductoById(id);
      if (!data) { router.back(); return; }
      setProducto(data);
      setForm({
        nombre: data.nombre,
        descripcion: data.descripcion ?? '',
        precio: String(data.precio),
        iva: String(data.iva),
      });
    } catch {
      router.back();
    }
  }, [id]);

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const precio = parseFloat(form.precio.replace(',', '.'));
  const iva = parseFloat(form.iva.replace(',', '.'));
  const canSave = form.nombre.trim().length > 0 && !isNaN(precio) && precio > 0 && !isNaN(iva);

  const handleSave = () => {
    if (!canSave || saving || !producto) return;
    setSaving(true);
    try {
      updateProducto({
        id: producto.id,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio,
        iva,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar los cambios.');
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar producto',
      `¿Eliminar "${producto?.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              deleteProducto(id);
              router.back();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el producto.');
            }
          },
        },
      ]
    );
  };

  if (!producto) return null;

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
          <LabeledInput label="Nombre *" value={form.nombre} onChangeText={update('nombre')} />
          <LabeledInput label="Descripción" value={form.descripcion} onChangeText={update('descripcion')} multiline />
          <View style={styles.row}>
            <View style={styles.flex}>
              <LabeledInput label="Precio *" value={form.precio} onChangeText={update('precio')} keyboardType="decimal-pad" />
            </View>
            <View style={styles.ivaCol}>
              <LabeledInput label="IVA %" value={form.iva} onChangeText={update('iva')} keyboardType="decimal-pad" />
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave || saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
        </Pressable>

        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Eliminar producto</Text>
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
  deleteBtn: {
    borderRadius: RADIUS.md,
    borderCurve: 'continuous',
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.danger,
  },
  deleteBtnText: { fontSize: 15, fontWeight: FONT.medium, color: COLORS.danger },
});
