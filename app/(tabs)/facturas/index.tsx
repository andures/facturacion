import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LegendList } from '@legendapp/list';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllFacturas } from '@/src/db/facturas';
import { EmptyState } from '@/src/components/EmptyState';
import { FAB } from '@/src/components/FAB';
import type { FacturaConCliente } from '@/src/types';
import { useSettingsStore } from '@/src/store/settings';
import { COLORS, FONT, RADIUS, SPACING } from '@/constants/theme';

type EstadoFilter = 'todas' | 'borrador' | 'enviada' | 'pagada';

const ESTADO_LABELS: Record<EstadoFilter, string> = {
  todas: 'Todas', borrador: 'Borrador', enviada: 'Enviada', pagada: 'Pagada',
};

const ESTADO_COLOR: Record<string, string> = {
  borrador: COLORS.estadoBorrador,
  enviada: COLORS.estadoEnviada,
  pagada: COLORS.estadoPagada,
};

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function FacturaCard({ item }: { item: FacturaConCliente }) {
  const router = useRouter();
  const currency = useSettingsStore((s) => s.currency);
  const color = ESTADO_COLOR[item.estado] ?? COLORS.textSecondary;
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push({ pathname: '/(tabs)/facturas/[id]', params: { id: item.id } })}
    >
      <View style={[styles.strip, { backgroundColor: color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardNumero}>{item.numero}</Text>
          <Text style={styles.cardTotal}>{currency} {item.total.toFixed(2)}</Text>
        </View>
        <View style={styles.cardMid}>
          <Text style={styles.cardCliente} numberOfLines={1}>{item.cliente_nombre}</Text>
          <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
            <Text style={[styles.badgeText, { color }]}>{item.estado.toUpperCase()}</Text>
          </View>
        </View>
        {item.cliente_empresa ? (
          <Text style={styles.cardEmpresa} numberOfLines={1}>{item.cliente_empresa}</Text>
        ) : null}
        <Text style={styles.cardFecha}>{formatDate(item.fecha)}</Text>
      </View>
    </Pressable>
  );
}

const renderItem = ({ item }: { item: FacturaConCliente }) => <FacturaCard item={item} />;
const keyExtractor = (item: FacturaConCliente) => item.id;
const FILTERS: EstadoFilter[] = ['todas','borrador','enviada','pagada'];

export default function FacturasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [facturas, setFacturas] = useState<FacturaConCliente[]>([]);
  const [filter, setFilter] = useState<EstadoFilter>('todas');

  useFocusEffect(
    useCallback(() => {
      try { setFacturas(getAllFacturas()); } catch { setFacturas([]); }
    }, [])
  );

  const filtered = useMemo(
    () => filter === 'todas' ? facturas : facturas.filter((f) => f.estado === filter),
    [facturas, filter]
  );

  const listHeader = (
    <View style={styles.listHeader}>
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
                {ESTADO_LABELS[f]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {facturas.length === 0 ? (
        <>
          {listHeader}
          <EmptyState
            icon="🧾"
            title="Sin facturas aún"
            description="Crea tu primera factura para gestionar tus cobros."
            actionLabel="Nueva factura"
            onAction={() => router.push('/(tabs)/facturas/nueva')}
          />
        </>
      ) : (
        <LegendList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={96}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <EmptyState
              icon="🔍"
              title="Sin resultados"
              description={`No hay facturas con estado "${ESTADO_LABELS[filter]}".`}
            />
          }
          contentContainerStyle={styles.list}
        />
      )}
      <FAB onPress={() => router.push('/(tabs)/facturas/nueva')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingHorizontal: SPACING.md, paddingBottom: 120 },

  listHeader: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },

  chips: { gap: SPACING.xs, paddingBottom: 2 },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: { fontSize: 13, fontWeight: FONT.medium, color: COLORS.textSecondary },

  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.7, transform: [{ scale: 0.985 }] },
  strip: { width: 4, flexShrink: 0 },
  cardBody: { flex: 1, padding: SPACING.md, gap: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumero: { fontSize: 12, fontWeight: FONT.semibold, color: COLORS.primary, letterSpacing: 0.3 },
  cardTotal: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.text },
  cardCliente: { fontSize: 15, fontWeight: FONT.semibold, color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  cardEmpresa: { fontSize: 12, color: COLORS.textSecondary },
  cardFecha: { fontSize: 12, color: COLORS.textTertiary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: FONT.bold, letterSpacing: 0.5 },
});
