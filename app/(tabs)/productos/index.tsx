import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LegendList } from '@legendapp/list';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllProductos } from '@/src/db/productos';
import { EmptyState } from '@/src/components/EmptyState';
import { SearchBar } from '@/src/components/SearchBar';
import { FAB } from '@/src/components/FAB';
import type { Producto } from '@/src/types';
import { useSettingsStore } from '@/src/store/settings';
import { COLORS, FONT, RADIUS, SPACING } from '@/constants/theme';

function ProductoCard({ item }: { item: Producto }) {
  const router = useRouter();
  const currency = useSettingsStore((s) => s.currency);
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push({ pathname: '/(tabs)/productos/[id]', params: { id: item.id } })}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.iconEmoji}>📦</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{item.nombre}</Text>
        {item.descripcion ? (
          <Text style={styles.cardDesc} numberOfLines={1}>{item.descripcion}</Text>
        ) : null}
        <View style={styles.cardMeta}>
          <View style={styles.ivaBadge}>
            <Text style={styles.ivaText}>ISV {item.iva}%</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardPrice}>{currency} {item.precio.toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}

const renderItem = ({ item }: { item: Producto }) => <ProductoCard item={item} />;
const keyExtractor = (item: Producto) => item.id;

export default function ProductosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      try { setProductos(getAllProductos()); } catch { setProductos([]); }
    }, [])
  );

  const filtered = useMemo(
    () => search.trim()
      ? productos.filter((p) =>
          p.nombre.toLowerCase().includes(search.toLowerCase()) ||
          (p.descripcion?.toLowerCase().includes(search.toLowerCase()) ?? false)
        )
      : productos,
    [productos, search]
  );

  const listHeader = (
    <View style={styles.listHeader}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar producto…" />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {productos.length === 0 && !search ? (
        <>
          {listHeader}
          <EmptyState
            icon="📦"
            title="Sin productos aún"
            description="Agrega los servicios o productos que facturas."
            actionLabel="Nuevo producto"
            onAction={() => router.push('/(tabs)/productos/nuevo')}
          />
        </>
      ) : (
        <LegendList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={80}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <EmptyState
              icon="🔍"
              title="Sin resultados"
              description={`No hay productos que coincidan con "${search}".`}
            />
          }
          contentContainerStyle={styles.list}
        />
      )}
      <FAB onPress={() => router.push('/(tabs)/productos/nuevo')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingHorizontal: SPACING.md, paddingBottom: 120 },

  listHeader: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: COLORS.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: { fontSize: 20 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  cardPressed: { opacity: 0.7, transform: [{ scale: 0.985 }] },
  cardBody: { flex: 1, gap: 3 },
  cardName: { fontSize: 16, fontWeight: FONT.semibold, color: COLORS.text },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary },
  cardMeta: { flexDirection: 'row', gap: SPACING.xs },
  ivaBadge: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  ivaText: { fontSize: 11, fontWeight: FONT.medium, color: COLORS.textTertiary },
  cardRight: { alignItems: 'flex-end' },
  cardPrice: { fontSize: 18, fontWeight: FONT.bold, color: COLORS.primary },
  cardCurrency: { fontSize: 11, color: COLORS.textTertiary, marginTop: 1 },
});
