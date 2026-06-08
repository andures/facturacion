import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LegendList } from '@legendapp/list';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllClientes, deleteCliente } from '@/src/db/clientes';
import { EmptyState } from '@/src/components/EmptyState';
import { SearchBar } from '@/src/components/SearchBar';
import { FAB } from '@/src/components/FAB';
import type { Cliente } from '@/src/types';
import { COLORS, FONT, RADIUS, SPACING } from '@/constants/theme';

const AVATAR_BG   = ['#1e3a5f','#3b1f5e','#1f3a2b','#3a2b1f','#3a1f1f','#1f363a'];
const AVATAR_TEXT = ['#60a5fa','#a78bfa','#4ade80','#fbbf24','#f87171','#22d3ee'];

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();
}

function Avatar({ name }: { name: string }) {
  const i = name.charCodeAt(0) % AVATAR_BG.length;
  return (
    <View style={[styles.avatar, { backgroundColor: AVATAR_BG[i] }]}>
      <Text style={[styles.avatarText, { color: AVATAR_TEXT[i] }]}>{initials(name)}</Text>
    </View>
  );
}

function ClienteCard({ item }: { item: Cliente }) {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push({ pathname: '/(tabs)/clientes/[id]', params: { id: item.id } })}
    >
      <Avatar name={item.nombre} />
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{item.nombre}</Text>
        {item.empresa ? (
          <Text style={styles.cardSub} numberOfLines={1}>{item.empresa}</Text>
        ) : null}
        {item.email ? (
          <Text style={styles.cardMeta} numberOfLines={1}>{item.email}</Text>
        ) : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const renderItem = ({ item }: { item: Cliente }) => <ClienteCard item={item} />;
const keyExtractor = (item: Cliente) => item.id;

export default function ClientesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      try { setClientes(getAllClientes()); } catch { setClientes([]); }
    }, [])
  );

  const filtered = useMemo(
    () => search.trim()
      ? clientes.filter((c) =>
          c.nombre.toLowerCase().includes(search.toLowerCase()) ||
          (c.empresa?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
          (c.email?.toLowerCase().includes(search.toLowerCase()) ?? false)
        )
      : clientes,
    [clientes, search]
  );

  const countLabel = search.trim()
    ? `${filtered.length} de ${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`
    : `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`;

  const listHeader = (
    <View style={styles.listHeader}>
      <View style={styles.searchRow}>
        <View style={styles.searchFlex}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar cliente…" />
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText} numberOfLines={1}>{countLabel}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {clientes.length === 0 && !search ? (
        <>
          {listHeader}
          <EmptyState
            icon="👥"
            title="Sin clientes aún"
            description="Agrega tu primer cliente para empezar a crear facturas."
            actionLabel="Nuevo cliente"
            onAction={() => router.push('/(tabs)/clientes/nueva')}
          />
        </>
      ) : (
        <LegendList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={76}
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
      <FAB onPress={() => router.push('/(tabs)/clientes/nueva')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingHorizontal: SPACING.md, paddingBottom: 120 },

  listHeader: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  searchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  searchFlex: { flex: 1 },
  countBadge: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm + 2,
    height: 40,
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  countText: { fontSize: 12, fontWeight: FONT.medium, color: COLORS.textSecondary },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 15, fontWeight: FONT.bold },

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
  cardBody: { flex: 1, gap: 2 },
  cardName: { fontSize: 16, fontWeight: FONT.semibold, color: COLORS.text },
  cardSub: { fontSize: 13, color: COLORS.textSecondary },
  cardMeta: { fontSize: 12, color: COLORS.textTertiary },
  chevron: { fontSize: 22, color: COLORS.border, fontWeight: FONT.regular },
});
