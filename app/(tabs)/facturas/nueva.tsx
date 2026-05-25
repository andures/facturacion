import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LegendList } from '@legendapp/list';
import { useFocusEffect, useRouter } from 'expo-router';
import { getAllClientes } from '@/src/db/clientes';
import { EmptyState } from '@/src/components/EmptyState';
import { SearchBar } from '@/src/components/SearchBar';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import type { Cliente } from '@/src/types';
import { COLORS, FONT, RADIUS, SPACING } from '@/constants/theme';

function ClienteItem({ item }: { item: Cliente }) {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      onPress={() =>
        router.push({ pathname: '/(tabs)/facturas/crear', params: { clienteId: item.id } })
      }
    >
      <View style={styles.itemBody}>
        <Text style={styles.itemName} numberOfLines={1}>{item.nombre}</Text>
        {item.empresa ? <Text style={styles.itemSub} numberOfLines={1}>{item.empresa}</Text> : null}
        {item.email ? <Text style={styles.itemDetail} numberOfLines={1}>{item.email}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const renderItem = ({ item }: { item: Cliente }) => <ClienteItem item={item} />;
const keyExtractor = (item: Cliente) => item.id;

export default function SeleccionarClienteScreen() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      try { setClientes(getAllClientes()); } catch { setClientes([]); }
    }, [])
  );

  const filtered = useMemo(
    () =>
      search.trim()
        ? clientes.filter(
            (c) =>
              c.nombre.toLowerCase().includes(search.toLowerCase()) ||
              (c.empresa?.toLowerCase().includes(search.toLowerCase()) ?? false)
          )
        : clientes,
    [clientes, search]
  );

  const listHeader = (
    <View style={styles.header}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar cliente..." />
      <Text style={styles.count}>
        {filtered.length} {filtered.length === 1 ? 'cliente' : 'clientes'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader />
      {clientes.length === 0 ? (
        <EmptyState
          icon="👤"
          title="Sin clientes"
          description="Agrega clientes desde la pestaña Clientes para poder facturarles."
          actionLabel="Ir a Clientes"
          onAction={() => router.navigate('/(tabs)/clientes')}
        />
      ) : (
        <LegendList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={72}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <EmptyState
              icon="🔍"
              title="Sin resultados"
              description={`No hay clientes que coincidan con "${search}".`}
            />
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, paddingBottom: SPACING.xl },
  header: { gap: SPACING.xs, marginBottom: SPACING.xs },
  count: { fontSize: 12, color: COLORS.textSecondary, paddingHorizontal: 2 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderCurve: 'continuous',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  itemPressed: { opacity: 0.75 },
  itemBody: { flex: 1, gap: 2 },
  itemName: { fontSize: 16, fontWeight: FONT.semibold, color: COLORS.text },
  itemSub: { fontSize: 13, color: COLORS.textSecondary },
  itemDetail: { fontSize: 12, color: COLORS.textTertiary },
  chevron: { fontSize: 22, color: COLORS.textTertiary },
});
