import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Dimensions, FlatList, Modal, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

const SCREEN_H = Dimensions.get('window').height;
import { getAllProductos } from '@/src/db/productos';
import { getClienteById } from '@/src/db/clientes';
import { createFactura, updateFactura, getFacturaById, getLineasByFactura } from '@/src/db/facturas';
import { useSettingsStore } from '@/src/store/settings';
import { calcInvoiceTotals } from '@/src/utils/totals';
import { generateInvoiceNumber } from '@/src/utils/invoice-number';
import type { Cliente, Factura, Producto } from '@/src/types';
import { COLORS, FONT, RADIUS, SPACING } from '@/constants/theme';

interface LineaItem {
  key: string;
  descripcion: string;
  cantidad: number;
  precio: number;
  iva: number;
}

// Fixed light-mode colors for the white invoice document (always paper-like)
const DOC = {
  text:     '#111827',
  textSub:  '#374151',
  textMuted:'#6B7280',
  border:   '#E5E7EB',
  primary:  '#1D4ED8',
  danger:   '#EF4444',
  dangerBg: '#FEE2E2',
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function CrearFacturaScreen() {
  const { clienteId, facturaId } = useLocalSearchParams<{ clienteId: string; facturaId?: string }>();
  const isEditing = !!facturaId;
  const router = useRouter();
  const {
    businessName, taxId, address, currency,
    logoUri, invoicePrefix, nextInvoiceNumber, incrementInvoiceNumber,
  } = useSettingsStore();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [existingFactura, setExistingFactura] = useState<Factura | null>(null);
  const [lineas, setLineas] = useState<LineaItem[]>([]);
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  // Picker modal
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'catalogo' | 'manual'>('catalogo');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoSearch, setProductoSearch] = useState('');

  // Manual entry form
  const [manualDesc, setManualDesc] = useState('');
  const [manualPrecio, setManualPrecio] = useState('');
  const [manualCant, setManualCant] = useState('1');
  const [manualIva, setManualIva] = useState('15');

  const today = useMemo(() => Date.now(), []);
  const newInvoiceNumber = generateInvoiceNumber(invoicePrefix, nextInvoiceNumber);
  const invoiceNumber = existingFactura?.numero ?? newInvoiceNumber;
  const invoiceDate = existingFactura?.fecha ?? today;

  useEffect(() => {
    try {
      const c = getClienteById(clienteId);
      if (!c) { router.back(); return; }
      setCliente(c);
    } catch { router.back(); }
    try { setProductos(getAllProductos()); } catch { /* */ }

    if (facturaId) {
      try {
        const f = getFacturaById(facturaId);
        if (!f) { router.back(); return; }
        setExistingFactura(f);
        setNotas(f.notas ?? '');
        const existingLineas = getLineasByFactura(facturaId);
        setLineas(existingLineas.map((l) => ({
          key: l.id,
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precio: l.precio,
          iva: l.iva,
        })));
      } catch { router.back(); }
    }
  }, [clienteId, facturaId]);

  const productosFiltrados = useMemo(
    () =>
      productoSearch.trim()
        ? productos.filter((p) =>
            p.nombre.toLowerCase().includes(productoSearch.toLowerCase())
          )
        : productos,
    [productos, productoSearch]
  );

  const totals = useMemo(() => calcInvoiceTotals(lineas), [lineas]);

  const closePicker = () => {
    setShowPicker(false);
    setProductoSearch('');
    setManualDesc('');
    setManualPrecio('');
    setManualCant('1');
    setManualIva('15');
  };

  const addFromProducto = (p: Producto) => {
    setLineas((prev) => [...prev, {
      key: crypto.randomUUID(),
      descripcion: p.nombre,
      cantidad: 1,
      precio: p.precio,
      iva: p.iva,
    }]);
    closePicker();
  };

  const addManual = () => {
    const precio = parseFloat(manualPrecio.replace(',', '.'));
    const cantidad = parseFloat(manualCant.replace(',', '.'));
    const iva = parseFloat(manualIva.replace(',', '.'));
    if (!manualDesc.trim() || isNaN(precio) || precio <= 0) {
      Alert.alert('Datos incompletos', 'Escribe al menos una descripción y un precio válido.');
      return;
    }
    setLineas((prev) => [...prev, {
      key: crypto.randomUUID(),
      descripcion: manualDesc.trim(),
      cantidad: isNaN(cantidad) || cantidad <= 0 ? 1 : cantidad,
      precio,
      iva: isNaN(iva) || iva < 0 ? 15 : iva,
    }]);
    closePicker();
  };

  const removeLinea = (key: string) =>
    setLineas((prev) => prev.filter((l) => l.key !== key));

  const handleSave = () => {
    if (lineas.length === 0 || !cliente || saving) return;
    setSaving(true);
    try {
      const mappedLineas = lineas.map((l, i) => ({
        id: crypto.randomUUID(),
        descripcion: l.descripcion,
        precio: l.precio,
        cantidad: l.cantidad,
        iva: l.iva,
        orden: i,
      }));

      if (isEditing && existingFactura) {
        updateFactura(
          { id: existingFactura.id, cliente_id: clienteId, fecha: existingFactura.fecha, notas: notas.trim() || null },
          mappedLineas
        );
        router.back();
      } else {
        const newId = crypto.randomUUID();
        createFactura({
          id: newId,
          numero: newInvoiceNumber,
          cliente_id: clienteId,
          fecha: today,
          estado: 'borrador',
          notas: notas.trim() || null,
          lineas: mappedLineas,
        });
        incrementInvoiceNumber();
        router.replace({ pathname: '/(tabs)/facturas/[id]', params: { id: newId } });
      }
    } catch {
      Alert.alert('Error', 'No se pudo guardar la factura.');
      setSaving(false);
    }
  };

  if (!cliente) return null;

  return (
    <>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.document}>
            {/* Business header */}
            <View style={styles.docHeader}>
              <View style={styles.docHeaderLeft}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.logo} contentFit="contain" />
                ) : null}
                <View style={styles.flex}>
                  <Text style={styles.businessName} numberOfLines={2}>
                    {businessName || 'Mi Empresa'}
                  </Text>
                  {taxId ? <Text style={styles.businessDetail}>{taxId}</Text> : null}
                  {address ? <Text style={styles.businessDetail} numberOfLines={2}>{address}</Text> : null}
                </View>
              </View>
              <View style={styles.docHeaderRight}>
                <Text style={styles.facturaLabel}>FACTURA</Text>
                <Text style={styles.facturaNumero}>{invoiceNumber}</Text>
                <Text style={styles.facturaFecha}>{formatDate(invoiceDate)}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Client */}
            <View style={styles.clienteSection}>
              <Text style={styles.sectionLabel}>FACTURAR A</Text>
              <Text style={styles.clienteNombre}>{cliente.nombre}</Text>
              {cliente.empresa ? <Text style={styles.clienteDetail}>{cliente.empresa}</Text> : null}
              {cliente.email ? <Text style={styles.clienteDetail}>{cliente.email}</Text> : null}
              {cliente.telefono ? <Text style={styles.clienteDetail}>{cliente.telefono}</Text> : null}
              {cliente.direccion ? <Text style={styles.clienteDetail}>{cliente.direccion}</Text> : null}
            </View>

            <View style={styles.divider} />

            {/* Lines */}
            {lineas.length === 0 ? (
              <View style={styles.lineasEmpty}>
                <Text style={styles.lineasEmptyText}>
                  Toca + para agregar{'\n'}productos o servicios
                </Text>
              </View>
            ) : (
              <View style={styles.lineasSection}>
                {/* Table header */}
                <View style={styles.tableHead}>
                  <Text style={[styles.thCell, styles.thDesc]}>DESCRIPCIÓN</Text>
                  <Text style={[styles.thCell, styles.thQty]}>CANT.</Text>
                  <Text style={[styles.thCell, styles.thPrice]}>PRECIO</Text>
                  <Text style={[styles.thCell, styles.thTotal]}>TOTAL</Text>
                  <View style={styles.thDel} />
                </View>
                {lineas.map((l, idx) => {
                  const lineTotal = l.precio * l.cantidad * (1 + l.iva / 100);
                  return (
                    <View key={l.key} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowStripe]}>
                      <View style={styles.thDesc}>
                        <Text style={styles.lineaDesc} numberOfLines={2}>{l.descripcion}</Text>
                        {l.iva > 0 ? <Text style={styles.lineaIsv}>ISV {l.iva}%</Text> : null}
                      </View>
                      <Text style={[styles.tdCell, styles.thQty]}>{l.cantidad}</Text>
                      <Text style={[styles.tdCell, styles.thPrice]}>{currency} {l.precio.toFixed(2)}</Text>
                      <Text style={[styles.tdCell, styles.thTotal, styles.tdBold]}>
                        {currency} {lineTotal.toFixed(2)}
                      </Text>
                      <Pressable style={[styles.thDel, styles.lineaDelete]} onPress={() => removeLinea(l.key)}>
                        <Text style={styles.lineaDeleteText}>✕</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            {lineas.length > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.totalesSection}>
                  <View style={styles.totalesRow}>
                    <Text style={styles.totalesLabel}>Subtotal</Text>
                    <Text style={styles.totalesValue}>
                      {currency} {totals.subtotal.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.totalesRow}>
                    <Text style={styles.totalesLabel}>ISV</Text>
                    <Text style={styles.totalesValue}>
                      {currency} {totals.totalVat.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.totalesDivider} />
                  <View style={styles.totalesRow}>
                    <Text style={styles.totalLabel}>TOTAL</Text>
                    <Text style={styles.totalValue}>
                      {currency} {totals.total.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.divider} />

            {/* Notes */}
            <View style={styles.notasSection}>
              <Text style={styles.sectionLabel}>NOTAS</Text>
              <TextInput
                style={styles.notasInput}
                value={notas}
                onChangeText={setNotas}
                placeholder="Condiciones de pago, observaciones..."
                placeholderTextColor={COLORS.textTertiary}
                multiline
              />
            </View>
          </View>
        </ScrollView>

        {/* Bottom action bar */}
        <View style={styles.bottomBar}>
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.addBtnIcon}>+</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              lineas.length === 0 && styles.saveBtnDisabled,
              pressed && lineas.length > 0 && { opacity: 0.85 },
            ]}
            onPress={handleSave}
            disabled={lineas.length === 0 || saving}
          >
            <Text style={[styles.saveBtnText, lineas.length === 0 && styles.saveBtnTextDisabled]}>
              {saving ? 'Guardando…' : isEditing ? 'Actualizar' : 'Guardar'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Product picker bottom sheet */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={closePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Agregar producto</Text>
              <Pressable onPress={closePicker} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, pickerTab === 'catalogo' && styles.tabActive]}
                onPress={() => setPickerTab('catalogo')}
              >
                <Text style={[styles.tabText, pickerTab === 'catalogo' && styles.tabTextActive]}>
                  📦 Catálogo
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, pickerTab === 'manual' && styles.tabActive]}
                onPress={() => setPickerTab('manual')}
              >
                <Text style={[styles.tabText, pickerTab === 'manual' && styles.tabTextActive]}>
                  ✏️ Manual
                </Text>
              </Pressable>
            </View>

            {pickerTab === 'catalogo' ? (
              <>
                <TextInput
                  style={styles.pickerSearch}
                  placeholder="Buscar en catálogo..."
                  placeholderTextColor={COLORS.textTertiary}
                  value={productoSearch}
                  onChangeText={setProductoSearch}
                />
                <FlatList
                  data={productosFiltrados}
                  keyExtractor={(p) => p.id}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item: p }) => (
                    <Pressable
                      style={({ pressed }) => [styles.productoItem, pressed && { opacity: 0.7 }]}
                      onPress={() => addFromProducto(p)}
                    >
                      <View style={styles.flex}>
                        <Text style={styles.productoNombre}>{p.nombre}</Text>
                        {p.descripcion ? (
                          <Text style={styles.productoDesc} numberOfLines={1}>{p.descripcion}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.productoPrecio}>
                        {currency} {p.precio.toFixed(2)}
                      </Text>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.pickerEmpty}>
                      {productos.length === 0
                        ? 'No hay productos en el catálogo aún.'
                        : 'Sin resultados.'}
                    </Text>
                  }
                />
              </>
            ) : (
              <ScrollView
                contentContainerStyle={styles.manualForm}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.manualField}>
                  <Text style={styles.manualLabel}>Descripción *</Text>
                  <TextInput
                    style={styles.manualInput}
                    value={manualDesc}
                    onChangeText={setManualDesc}
                    placeholder="Nombre del producto o servicio"
                    placeholderTextColor={COLORS.textTertiary}
                    autoFocus
                  />
                </View>
                <View style={styles.manualRowFields}>
                  <View style={[styles.manualField, styles.flex]}>
                    <Text style={styles.manualLabel}>Precio *</Text>
                    <TextInput
                      style={styles.manualInput}
                      value={manualPrecio}
                      onChangeText={setManualPrecio}
                      placeholder="0.00"
                      placeholderTextColor={COLORS.textTertiary}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={[styles.manualField, styles.manualFieldSm]}>
                    <Text style={styles.manualLabel}>Cant.</Text>
                    <TextInput
                      style={styles.manualInput}
                      value={manualCant}
                      onChangeText={setManualCant}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={[styles.manualField, styles.manualFieldSm]}>
                    <Text style={styles.manualLabel}>IVA %</Text>
                    <TextInput
                      style={styles.manualInput}
                      value={manualIva}
                      onChangeText={setManualIva}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
                <Pressable style={styles.manualAddBtn} onPress={addManual}>
                  <Text style={styles.manualAddBtnText}>Agregar a la factura</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 6, paddingBottom: 180 },
  flex: { flex: 1 },

  // Document "paper"
  document: {
    minHeight: SCREEN_H - 182,  // fills screen down to just above the action bar
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
  },

  docHeader: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  docHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  logo: { width: 44, height: 44, borderRadius: RADIUS.sm },
  businessName: { fontSize: 15, fontWeight: FONT.bold, color: DOC.text },
  businessDetail: { fontSize: 12, color: DOC.textSub, marginTop: 1 },
  docHeaderRight: { alignItems: 'flex-end', minWidth: 110 },
  facturaLabel: { fontSize: 12, fontWeight: FONT.bold, color: DOC.primary, letterSpacing: 1.2 },
  facturaNumero: { fontSize: 14, fontWeight: FONT.semibold, color: DOC.text, marginTop: 2 },
  facturaFecha: { fontSize: 12, color: DOC.textSub, marginTop: 2 },

  divider: { height: 1, backgroundColor: DOC.border },
  sectionLabel: { fontSize: 11, fontWeight: FONT.bold, color: DOC.textMuted, letterSpacing: 0.8 },

  clienteSection: { padding: SPACING.md, gap: 4 },
  clienteNombre: { fontSize: 16, fontWeight: FONT.bold, color: DOC.text, marginTop: 4 },
  clienteDetail: { fontSize: 13, color: DOC.textSub },

  // Lines (empty)
  lineasEmpty: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  lineasEmptyText: {
    fontSize: 14,
    color: DOC.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Lines (filled)
  lineasSection: { gap: 0 },

  // Table header
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5FF',
    paddingVertical: 7,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1.5,
    borderBottomColor: '#BFDBFE',
    marginHorizontal: -SPACING.md,
  },
  thCell: { fontSize: 10, fontWeight: FONT.bold, color: DOC.textSub, letterSpacing: 0.5 },
  thDesc: { flex: 1 },
  thQty:   { width: 30, textAlign: 'center' as const },
  thPrice: { width: 60, textAlign: 'right' as const },
  thTotal: { width: 82, textAlign: 'right' as const },
  thDel:   { width: 32 },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: DOC.border,
    marginHorizontal: -SPACING.md,
    gap: 2,
  },
  tableRowStripe: { backgroundColor: '#FAFBFF' },
  tdCell: { fontSize: 13, color: DOC.textSub, textAlign: 'center' as const },
  tdBold: { fontSize: 14, fontWeight: FONT.bold, color: DOC.text, textAlign: 'right' as const },

  lineaDesc: { fontSize: 14, fontWeight: FONT.semibold, color: DOC.text },
  lineaIsv:  { fontSize: 11, color: DOC.textMuted, marginTop: 2 },
  lineaDelete: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: DOC.dangerBg,
    alignSelf: 'center',
  },
  lineaDeleteText: { fontSize: 12, color: DOC.danger },

  // Totals
  totalesSection: { padding: SPACING.md, gap: 6, alignItems: 'flex-end' },
  totalesRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200 },
  totalesLabel: { fontSize: 14, color: DOC.textSub },
  totalesValue: { fontSize: 14, color: DOC.text },
  totalesDivider: { width: 200, height: 1, backgroundColor: DOC.border, marginVertical: 2 },
  totalLabel: { fontSize: 15, fontWeight: FONT.bold, color: DOC.text },
  totalValue: { fontSize: 17, fontWeight: FONT.bold, color: DOC.primary },

  // Notes
  notasSection: { padding: SPACING.md, gap: 6 },
  notasInput: {
    fontSize: 14,
    color: DOC.text,
    minHeight: 56,
    textAlignVertical: 'top',
    paddingTop: 4,
  },

  // Bottom action bar
  bottomBar: {
    position: 'absolute',
    bottom: 112,
    left: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: RADIUS.md,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: FONT.medium, color: '#374151' },
  addBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(37,99,235,0.45)',
  },
  addBtnPressed: { transform: [{ scale: 0.93 }] },
  addBtnIcon: { fontSize: 30, color: '#fff', lineHeight: 34, fontWeight: FONT.regular },
  saveBtn: {
    flex: 1,
    height: 50,
    borderRadius: RADIUS.md,
    borderCurve: 'continuous',
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(37,99,235,0.38)',
  },
  saveBtnDisabled: {
    backgroundColor: COLORS.surfaceRaised,
    boxShadow: 'none',
  },
  saveBtnText: { fontSize: 15, fontWeight: FONT.semibold, color: '#fff' },
  saveBtnTextDisabled: { color: COLORS.textTertiary },

  // Modal bottom sheet
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.42)' },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '78%',
    paddingBottom: SPACING.xl,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  modalTitle: { fontSize: 16, fontWeight: FONT.semibold, color: COLORS.text },
  modalCloseBtn: { padding: SPACING.xs },
  modalCloseText: { fontSize: 17, color: COLORS.textSecondary },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    padding: 3,
    gap: 3,
  },
  tab: { flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm - 2, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: FONT.medium, color: COLORS.textSecondary },
  tabTextActive: { color: '#fff' },

  pickerSearch: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
    color: COLORS.text,
  },
  productoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  productoNombre: { fontSize: 15, fontWeight: FONT.medium, color: COLORS.text },
  productoDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  productoPrecio: { fontSize: 14, fontWeight: FONT.semibold, color: COLORS.primary },
  pickerEmpty: { padding: SPACING.lg, textAlign: 'center', color: COLORS.textSecondary, fontSize: 14 },

  manualForm: { padding: SPACING.md, gap: SPACING.md },
  manualField: { gap: 4 },
  manualFieldSm: { width: 72 },
  manualLabel: { fontSize: 12, fontWeight: FONT.medium, color: COLORS.textSecondary },
  manualInput: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: 14,
    color: COLORS.text,
  },
  manualRowFields: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-end' },
  manualAddBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    borderCurve: 'continuous',
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  manualAddBtnText: { fontSize: 15, fontWeight: FONT.semibold, color: '#fff' },
});
