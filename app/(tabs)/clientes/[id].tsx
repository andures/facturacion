import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LegendList } from '@legendapp/list';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { getClienteById, deleteCliente } from '@/src/db/clientes';
import { getFacturasByCliente } from '@/src/db/facturas';
import { useSettingsStore } from '@/src/store/settings';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import type { Cliente, FacturaConCliente } from '@/src/types';
import { COLORS, FONT, RADIUS, SPACING } from '@/constants/theme';

type Filter = 'todas' | 'borrador' | 'enviada' | 'pagada';

const FILTER_LABELS: Record<Filter, string> = {
  todas: 'Todas', borrador: 'Borrador', enviada: 'Enviada', pagada: 'Pagada',
};
const ESTADO_COLOR: Record<string, string> = {
  borrador: COLORS.estadoBorrador,
  enviada: COLORS.estadoEnviada,
  pagada: COLORS.estadoPagada,
};
const AVATAR_BG   = ['#1e3a5f','#3b1f5e','#1f3a2b','#3a2b1f','#3a1f1f','#1f363a'];
const AVATAR_TEXT = ['#60a5fa','#a78bfa','#4ade80','#fbbf24','#f87171','#22d3ee'];

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function MiniFacturaCard({ item }: { item: FacturaConCliente }) {
  const router = useRouter();
  const currency = useSettingsStore((s) => s.currency);
  const color = ESTADO_COLOR[item.estado] ?? COLORS.textSecondary;
  return (
    <Pressable
      style={({ pressed }) => [styles.fCard, pressed && styles.fCardPressed]}
      onPress={() => router.push({ pathname: '/(tabs)/facturas/[id]', params: { id: item.id } })}
    >
      <View style={[styles.fStrip, { backgroundColor: color }]} />
      <View style={styles.fBody}>
        <View style={styles.fTop}>
          <Text style={styles.fNumero}>{item.numero}</Text>
          <Text style={styles.fTotal}>{currency} {item.total.toFixed(2)}</Text>
        </View>
        <View style={styles.fBottom}>
          <Text style={styles.fFecha}>{formatDate(item.fecha)}</Text>
          <View style={[styles.fBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
            <Text style={[styles.fBadgeText, { color }]}>{item.estado.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const FILTERS: Filter[] = ['todas', 'borrador', 'enviada', 'pagada'];

export default function ClientePerfilScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [facturas, setFacturas] = useState<FacturaConCliente[]>([]);
  const [filter, setFilter] = useState<Filter>('todas');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useFocusEffect(
    useCallback(() => {
      try {
        const c = getClienteById(id);
        if (!c) { router.back(); return; }
        setCliente(c);
        setFacturas(getFacturasByCliente(id));
      } catch {
        router.back();
      }
    }, [id])
  );

  const filtered = useMemo(
    () => filter === 'todas' ? facturas : facturas.filter((f) => f.estado === filter),
    [facturas, filter]
  );

  const doDelete = () => {
    try {
      deleteCliente(id);
      router.navigate('/(tabs)/clientes');
    } catch {
      setConfirmDelete(false);
    }
  };

  if (!cliente) return null;

  const idx = cliente.nombre.charCodeAt(0) % AVATAR_BG.length;

  return (
    <>
      <ScreenHeader
        right={
          <Pressable
            onPress={() => router.push({ pathname: '/(tabs)/clientes/editar', params: { id } })}
            style={styles.editBtn}
          >
            <Text style={styles.editBtnText}>Editar</Text>
          </Pressable>
        }
      />

      <LegendList
        data={filtered}
        keyExtractor={(f) => f.id}
        estimatedItemSize={72}
        renderItem={({ item }) => <MiniFacturaCard item={item} />}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            {/* ── Perfil ─────────────────────────── */}
            <View style={styles.profileCard}>
              <View style={[styles.profileAvatar, { backgroundColor: AVATAR_BG[idx] }]}>
                <Text style={[styles.profileAvatarText, { color: AVATAR_TEXT[idx] }]}>
                  {initials(cliente.nombre)}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{cliente.nombre}</Text>
                {cliente.empresa ? <Text style={styles.profileSub}>{cliente.empresa}</Text> : null}
                <View style={styles.profileMeta}>
                  {cliente.email ? (
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipText}>✉ {cliente.email}</Text>
                    </View>
                  ) : null}
                  {cliente.telefono ? (
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipText}>✆ {cliente.telefono}</Text>
                    </View>
                  ) : null}
                </View>
                {cliente.direccion ? (
                  <Text style={styles.profileDir} numberOfLines={2}>{cliente.direccion}</Text>
                ) : null}
              </View>
            </View>

            {/* ── Nueva factura ──────────────────── */}
            <Pressable
              style={({ pressed }) => [styles.newInvoiceBtn, pressed && { opacity: 0.8 }]}
              onPress={() =>
                router.push({ pathname: '/(tabs)/facturas/crear', params: { clienteId: id } })
              }
            >
              <Text style={styles.newInvoiceIcon}>＋</Text>
              <Text style={styles.newInvoiceText}>Nueva factura</Text>
            </Pressable>

            {/* ── Sección facturas ───────────────── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Facturas</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{facturas.length}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {FILTERS.map((f) => {
                const active = filter === f;
                const color = f === 'todas' ? COLORS.primary : (ESTADO_COLOR[f] ?? COLORS.primary);
                return (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[styles.chip, active && { backgroundColor: color + '22', borderColor: color }]}
                  >
                    <Text style={[styles.chipText, active && { color }]}>
                      {FILTER_LABELS[f]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {facturas.length === 0
                ? 'Aún no hay facturas para este cliente.'
                : `No hay facturas con estado "${FILTER_LABELS[filter]}".`}
            </Text>
          </View>
        }
        ListFooterComponent={
          confirmDelete ? (
            <View style={styles.confirmRow}>
              <Pressable style={[styles.confirmBtn, styles.confirmYes]} onPress={doDelete}>
                <Text style={styles.confirmYesText}>Sí, eliminar</Text>
              </Pressable>
              <Pressable style={[styles.confirmBtn, styles.confirmNo]} onPress={() => setConfirmDelete(false)}>
                <Text style={styles.confirmNoText}>Cancelar</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.deleteBtn} onPress={() => setConfirmDelete(true)}>
              <Text style={styles.deleteBtnText}>Eliminar cliente</Text>
            </Pressable>
          )
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: 120 },

  editBtn: { paddingHorizontal: 4 },
  editBtnText: { fontSize: 15, fontWeight: FONT.medium, color: COLORS.primary },

  // Profile card
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  profileAvatarText: { fontSize: 20, fontWeight: FONT.bold },
  profileInfo: { flex: 1, gap: SPACING.xs },
  profileName: { fontSize: 18, fontWeight: FONT.bold, color: COLORS.text },
  profileSub: { fontSize: 14, color: COLORS.textSecondary },
  profileMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  metaChip: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaChipText: { fontSize: 12, color: COLORS.textSecondary },
  profileDir: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2, lineHeight: 17 },

  // Nueva factura button
  newInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
    paddingVertical: SPACING.md,
  },
  newInvoiceIcon: { fontSize: 18, color: COLORS.primary },
  newInvoiceText: { fontSize: 15, fontWeight: FONT.semibold, color: COLORS.primary },

  // Section
  section: { gap: SPACING.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  sectionTitle: { fontSize: 20, fontWeight: FONT.bold, color: COLORS.text, letterSpacing: -0.3 },
  countBadge: { backgroundColor: COLORS.surfaceRaised, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { fontSize: 12, fontWeight: FONT.semibold, color: COLORS.textSecondary },

  chips: { gap: SPACING.xs, paddingBottom: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: { fontSize: 13, fontWeight: FONT.medium, color: COLORS.textSecondary },

  empty: { padding: SPACING.lg, alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.textTertiary, textAlign: 'center', lineHeight: 20 },

  deleteBtn: {
    borderRadius: RADIUS.md,
    borderCurve: 'continuous',
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.danger + '66',
    marginTop: SPACING.sm,
  },
  deleteBtnText: { fontSize: 15, fontWeight: FONT.medium, color: COLORS.danger },

  confirmRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  confirmBtn: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderCurve: 'continuous',
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  confirmYes: { backgroundColor: COLORS.danger },
  confirmYesText: { fontSize: 15, fontWeight: FONT.semibold, color: '#fff' },
  confirmNo: { backgroundColor: COLORS.surfaceRaised, borderWidth: 1, borderColor: COLORS.border },
  confirmNoText: { fontSize: 15, fontWeight: FONT.medium, color: COLORS.textSecondary },

  // Mini factura card
  fCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  fCardPressed: { opacity: 0.7, transform: [{ scale: 0.985 }] },
  fStrip: { width: 4, flexShrink: 0 },
  fBody: { flex: 1, padding: SPACING.sm + 4, gap: 4 },
  fTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fNumero: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.primary },
  fTotal: { fontSize: 15, fontWeight: FONT.bold, color: COLORS.text },
  fFecha: { fontSize: 12, color: COLORS.textTertiary },
  fBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  fBadgeText: { fontSize: 10, fontWeight: FONT.bold, letterSpacing: 0.4 },
});
