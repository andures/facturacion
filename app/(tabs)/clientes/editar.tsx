import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getClienteById, updateCliente, deleteCliente } from '@/src/db/clientes';
import { LabeledInput } from '@/src/components/LabeledInput';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import type { Cliente } from '@/src/types';
import { COLORS, FONT, RADIUS, SPACING } from '@/constants/theme';

export default function EditarClienteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [form, setForm] = useState({
    nombre: '', empresa: '', email: '', telefono: '', direccion: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const data = getClienteById(id);
      if (!data) { router.back(); return; }
      setCliente(data);
      setForm({
        nombre: data.nombre,
        empresa: data.empresa ?? '',
        email: data.email ?? '',
        telefono: data.telefono ?? '',
        direccion: data.direccion ?? '',
      });
    } catch { router.back(); }
  }, [id]);

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.nombre.trim() || saving || !cliente) return;
    setSaving(true);
    try {
      updateCliente({
        id: cliente.id,
        nombre: form.nombre.trim(),
        empresa: form.empresa.trim() || null,
        email: form.email.trim() || null,
        telefono: form.telefono.trim() || null,
        direccion: form.direccion.trim() || null,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar los cambios.');
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar cliente',
      `¿Eliminar a ${cliente?.nombre}? Se perderán todas sus facturas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: () => {
            try {
              deleteCliente(id);
              router.dismissAll();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el cliente.');
            }
          },
        },
      ]
    );
  };

  if (!cliente) return null;

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
          <LabeledInput label="Empresa" value={form.empresa} onChangeText={update('empresa')} />
          <LabeledInput label="Email" value={form.email} onChangeText={update('email')} keyboardType="email-address" autoCapitalize="none" />
          <LabeledInput label="Teléfono" value={form.telefono} onChangeText={update('telefono')} keyboardType="phone-pad" />
          <LabeledInput label="Dirección" value={form.direccion} onChangeText={update('direccion')} multiline />
        </View>

        <Pressable
          style={[styles.saveBtn, !form.nombre.trim() && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!form.nombre.trim() || saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
        </Pressable>

        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Eliminar cliente</Text>
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
