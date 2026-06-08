import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { confirmDestructive } from '@/src/utils/confirm';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { getFacturaById, getLineasByFactura, updateEstado, deleteFactura } from '@/src/db/facturas';
import { getClienteById } from '@/src/db/clientes';
import { calcInvoiceTotals } from '@/src/utils/totals';
import { buildInvoiceHtml } from '@/src/utils/invoice-html';
import { exportInvoicePdf } from '@/src/utils/pdf';
import type { Factura, LineaFactura, Cliente } from '@/src/types';
import { useSettingsStore } from '@/src/store/settings';
import { COLORS, FONT, RADIUS, SPACING } from '@/constants/theme';

type Estado = Factura['estado'];

const ESTADO_COLOR: Record<Estado, string> = {
  borrador: '#8B9CB6',
  enviada:  '#3B82F6',
  pagada:   '#22C55E',
};
const ESTADO_LABEL: Record<Estado, string> = {
  borrador: 'Borrador',
  enviada:  'Enviada',
  pagada:   'Pagada',
};

// Fixed light-mode palette — the paper is always white
const DOC = {
  text:       '#111827',
  sub:        '#6B7280',
  muted:      '#9CA3AF',
  border:     '#E5E7EB',
  borderHeavy:'#D1D5DB',
  blue:       '#1D4ED8',
  rowStripe:  '#F8FAFF',
  notesBg:    '#F8FAFF',
  notesBar:   '#1D4ED8',
};

function fmtDate(ts: number) {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function fmtNum(n: number) {
  return n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DetalleFacturaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { businessName, taxId, address, currency } = useSettingsStore();

  const [factura, setFactura] = useState<Factura | null>(null);
  const [lineas, setLineas] = useState<LineaFactura[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [exporting, setExporting] = useState(false);

  function load() {
    try {
      const f = getFacturaById(id);
      if (!f) { router.back(); return; }
      setFactura(f);
      setLineas(getLineasByFactura(f.id));
      setCliente(getClienteById(f.cliente_id));
    } catch { router.back(); }
  }

  useEffect(() => { load(); }, [id]);

  if (!factura) return null;

  const totals = calcInvoiceTotals(lineas);
  const estadoColor = ESTADO_COLOR[factura.estado];

  const handleEstado = (next: Estado) => {
    try {
      updateEstado(factura.id, next);
      setFactura((prev) => prev ? { ...prev, estado: next } : prev);
    } catch {
      Alert.alert('Error', 'No se pudo cambiar el estado.');
    }
  };

  const handleDelete = () => {
    confirmDestructive(
      'Eliminar factura',
      `¿Eliminar ${factura.numero}? Esta acción no se puede deshacer.`,
      'Eliminar',
      () => {
        try { deleteFactura(factura.id); router.back(); } catch {
          Alert.alert('Error', 'No se pudo eliminar la factura.');
        }
      },
    );
  };

  const handleExportPdf = async () => {
    if (!cliente) return;
    setExporting(true);
    try {
      const html = buildInvoiceHtml({
        businessName, taxId, address, currency,
        numero: factura.numero, fecha: factura.fecha,
        estado: factura.estado, cliente, lineas, notas: factura.notas,
      });
      await exportInvoicePdf(html, factura.numero);
    } catch {
      Alert.alert('Error', 'No se pudo generar el PDF.');
    } finally {
      setExporting(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!cliente?.telefono) return;
    const phone = cliente.telefono.replace(/[^\d]/g, '');
    const text = encodeURIComponent(
      `Hola ${cliente.nombre}, le enviamos la factura ${factura.numero} por un total de ${currency} ${fmtNum(totals.total)}.\nFecha: ${fmtDate(factura.fecha)}`
    );
    const url = `https://wa.me/${phone}?text=${text}`;
    try { await Linking.openURL(url); } catch {
      Alert.alert('Error', 'No se pudo abrir WhatsApp.');
    }
  };

  const handleEmail = async () => {
    if (!cliente?.email) return;
    const subject = encodeURIComponent(`Factura ${factura.numero}`);
    const body = encodeURIComponent(
      `Estimado/a ${cliente.nombre},\n\nAdjunto la factura ${factura.numero} por un total de ${currency} ${fmtNum(totals.total)}.\nFecha: ${fmtDate(factura.fecha)}\n\nGracias por su preferencia.`
    );
    try { await Linking.openURL(`mailto:${cliente.email}?subject=${subject}&body=${body}`); } catch {
      Alert.alert('Error', 'No se pudo abrir la app de correo.');
    }
  };

  return (
    <>
      <ScreenHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* ── Paper document ──────────────────────────────────── */}
        <View style={styles.paper}>

          {/* Accent bar */}
          <View style={styles.accentBar} />

          <View style={styles.paperInner}>
            {/* Header row */}
            <View style={styles.docHeader}>
              <View style={styles.flex}>
                <Text style={styles.coName}>{businessName || 'Mi Empresa'}</Text>
                {taxId ? <Text style={styles.coDetail}>{taxId}</Text> : null}
                {address ? <Text style={styles.coDetail}>{address}</Text> : null}
              </View>
              <View style={styles.invBlock}>
                <Text style={styles.invTitle}>FACTURA</Text>
                <Text style={styles.invNum}>{factura.numero}</Text>
                <Text style={styles.invDate}>{fmtDate(factura.fecha)}</Text>
                <View style={[styles.statusChip, { backgroundColor: estadoColor + '18', borderColor: estadoColor }]}>
                  <Text style={[styles.statusText, { color: estadoColor }]}>
                    {ESTADO_LABEL[factura.estado].toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Bill to */}
            {cliente ? (
              <View style={styles.billTo}>
                <Text style={styles.secLabel}>FACTURAR A</Text>
                <Text style={styles.cliName}>{cliente.nombre}</Text>
                {cliente.empresa   ? <Text style={styles.cliDetail}>{cliente.empresa}</Text>   : null}
                {cliente.email     ? <Text style={styles.cliDetail}>{cliente.email}</Text>     : null}
                {cliente.telefono  ? <Text style={styles.cliDetail}>{cliente.telefono}</Text>  : null}
                {cliente.direccion ? <Text style={styles.cliDetail}>{cliente.direccion}</Text> : null}
              </View>
            ) : null}

            <View style={styles.dividerHeavy} />

            {/* Table header */}
            <View style={styles.tableHead}>
              <Text style={[styles.thCell, styles.thDesc]}>DESCRIPCIÓN</Text>
              <Text style={[styles.thCell, styles.thQty]}>CANT.</Text>
              <Text style={[styles.thCell, styles.thPrice]}>PRECIO</Text>
              <Text style={[styles.thCell, styles.thIsv]}>ISV</Text>
              <Text style={[styles.thCell, styles.thTotal]}>TOTAL</Text>
            </View>

            {/* Table rows */}
            {lineas.map((l, idx) => {
              const lineTotal = l.precio * l.cantidad * (1 + l.iva / 100);
              return (
                <View key={l.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowStripe]}>
                  <Text style={[styles.tdCell, styles.thDesc, styles.tdName]}>{l.descripcion}</Text>
                  <Text style={[styles.tdCell, styles.thQty, styles.tdCenter]}>{l.cantidad}</Text>
                  <Text style={[styles.tdCell, styles.thPrice, styles.tdRight]}>
                    {currency} {fmtNum(l.precio)}
                  </Text>
                  <Text style={[styles.tdCell, styles.thIsv, styles.tdCenter]}>{l.iva}%</Text>
                  <Text style={[styles.tdCell, styles.thTotal, styles.tdRight, styles.tdBold]}>
                    {currency} {fmtNum(lineTotal)}
                  </Text>
                </View>
              );
            })}

            {/* Totals */}
            <View style={styles.totalsWrap}>
              <View style={styles.totalsBox}>
                <View style={styles.dividerHeavy} />
                <View style={styles.totRow}>
                  <Text style={styles.totLabel}>Subtotal</Text>
                  <Text style={styles.totVal}>{currency} {fmtNum(totals.subtotal)}</Text>
                </View>
                <View style={styles.totRow}>
                  <Text style={styles.totLabel}>ISV</Text>
                  <Text style={styles.totVal}>{currency} {fmtNum(totals.totalVat)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.totRow}>
                  <Text style={styles.totFinalLabel}>Total</Text>
                  <Text style={styles.totFinalVal}>{currency} {fmtNum(totals.total)}</Text>
                </View>
              </View>
            </View>

            {/* Notes */}
            {factura.notas ? (
              <View style={styles.notesBox}>
                <Text style={styles.secLabel}>NOTAS</Text>
                <Text style={styles.notesText}>{factura.notas}</Text>
              </View>
            ) : null}

            {/* Footer */}
            <View style={styles.docFooter}>
              <Text style={styles.footerText}>Generado con Facturación App</Text>
              <Text style={styles.footerText}>{factura.numero}</Text>
            </View>
          </View>
        </View>

        {/* ── Actions ─────────────────────────────────────────── */}
        <View style={styles.actions}>

          {/* Borrador: [Editar] + [Compartir PDF] side by side */}
          {factura.estado === 'borrador' ? (
            <View style={styles.actRow}>
              <Pressable
                style={({ pressed }) => [styles.btn, styles.btnGhost, styles.flex, pressed && styles.btnPressed]}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/facturas/crear',
                    params: { clienteId: factura.cliente_id, facturaId: factura.id },
                  })
                }
              >
                <Text style={styles.btnGhostIcon}>✎</Text>
                <Text style={styles.btnGhostText}>Editar</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.btn, styles.btnPdf, styles.flex, pressed && styles.btnPressed]}
                onPress={handleExportPdf}
                disabled={exporting}
              >
                <Text style={styles.btnPdfIcon}>↑</Text>
                <Text style={styles.btnPdfText}>{exporting ? 'Generando…' : 'Compartir PDF'}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnPdf, pressed && styles.btnPressed]}
              onPress={handleExportPdf}
              disabled={exporting}
            >
              <Text style={styles.btnPdfIcon}>↑</Text>
              <Text style={styles.btnPdfText}>{exporting ? 'Generando PDF…' : 'Exportar / Compartir PDF'}</Text>
            </Pressable>
          )}

          {/* Quick contact: WhatsApp + Email */}
          {(!!cliente?.telefono || !!cliente?.email) && (
            <View style={styles.actRow}>
              {!!cliente?.telefono && (
                <Pressable
                  style={({ pressed }) => [styles.btn, styles.btnWA, styles.flex, pressed && styles.btnPressed]}
                  onPress={handleWhatsApp}
                >
                  <Text style={styles.btnWAText}>WhatsApp</Text>
                </Pressable>
              )}
              {!!cliente?.email && (
                <Pressable
                  style={({ pressed }) => [styles.btn, styles.btnMail, styles.flex, pressed && styles.btnPressed]}
                  onPress={handleEmail}
                >
                  <Text style={styles.btnMailText}>Correo</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Borrador → Enviada */}
          {factura.estado === 'borrador' && (
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnEnviada, pressed && styles.btnPressed]}
              onPress={() => handleEstado('enviada')}
            >
              <Text style={styles.btnEstadoText}>Marcar como Enviada ↗</Text>
            </Pressable>
          )}

          {/* Enviada → [Pagada] + [Borrador] */}
          {factura.estado === 'enviada' && (
            <View style={styles.actRow}>
              <Pressable
                style={({ pressed }) => [styles.btn, styles.btnPagada, styles.flex, pressed && styles.btnPressed]}
                onPress={() => handleEstado('pagada')}
              >
                <Text style={styles.btnEstadoText}>✓ Marcar Pagada</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.btn, styles.btnBorrador, styles.flex, pressed && styles.btnPressed]}
                onPress={() => handleEstado('borrador')}
              >
                <Text style={styles.btnBorradorText}>↩ Borrador</Text>
              </Pressable>
            </View>
          )}

          {/* Delete */}
          <Pressable
            style={({ pressed }) => [styles.btn, styles.btnDelete, pressed && styles.btnPressed]}
            onPress={handleDelete}
          >
            <Text style={styles.btnDeleteText}>Eliminar factura</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: 140 },
  flex: { flex: 1 },


  // Paper
  paper: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
  },
  accentBar: {
    height: 5,
    backgroundColor: DOC.blue,
  },
  paperInner: {
    padding: SPACING.md,
  },

  // Doc header
  docHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  coName: { fontSize: 15, fontWeight: FONT.bold, color: DOC.text },
  coDetail: { fontSize: 11, color: DOC.sub, marginTop: 2 },
  invBlock: { alignItems: 'flex-end', minWidth: 110 },
  invTitle: { fontSize: 22, fontWeight: FONT.bold, color: DOC.blue, letterSpacing: -0.5, lineHeight: 24 },
  invNum: { fontSize: 11, fontWeight: FONT.semibold, color: DOC.text, marginTop: 4 },
  invDate: { fontSize: 10, color: DOC.sub, marginTop: 2 },
  statusChip: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-end',
  },
  statusText: { fontSize: 9, fontWeight: FONT.bold, letterSpacing: 0.8 },

  divider: { height: 1, backgroundColor: DOC.border, marginVertical: 12 },
  dividerHeavy: { height: 1.5, backgroundColor: DOC.borderHeavy, marginVertical: 10 },

  // Bill to
  billTo: { marginBottom: 12 },
  secLabel: { fontSize: 8, fontWeight: FONT.bold, color: DOC.muted, letterSpacing: 1.2, marginBottom: 6 },
  cliName: { fontSize: 14, fontWeight: FONT.bold, color: DOC.text },
  cliDetail: { fontSize: 11, color: DOC.sub, marginTop: 2 },

  // Table
  tableHead: {
    flexDirection: 'row',
    backgroundColor: DOC.rowStripe,
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1.5,
    borderBottomColor: '#BFDBFE',
    marginHorizontal: -SPACING.md,
  },
  thCell: { fontSize: 8, fontWeight: FONT.bold, color: DOC.sub, letterSpacing: 0.6 },
  thDesc:  { flex: 1 },
  thQty:   { width: 32, textAlign: 'center' },
  thPrice: { width: 72, textAlign: 'right' },
  thIsv:   { width: 36, textAlign: 'center' },
  thTotal: { width: 80, textAlign: 'right' },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: DOC.border,
    alignItems: 'center',
    marginHorizontal: -SPACING.md,
  },
  tableRowStripe: { backgroundColor: '#FAFBFF' },
  tdCell: { fontSize: 12, color: DOC.sub },
  tdName: { fontWeight: FONT.semibold, color: DOC.text, fontSize: 13 },
  tdCenter: { textAlign: 'center' },
  tdRight: { textAlign: 'right' },
  tdBold: { fontWeight: FONT.bold, color: DOC.text },

  // Totals
  totalsWrap: { alignItems: 'flex-end', paddingTop: 4 },
  totalsBox: { width: '55%', minWidth: 180 },
  totRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  totLabel: { fontSize: 12, color: DOC.sub },
  totVal: { fontSize: 12, color: DOC.text, fontWeight: FONT.medium },
  totFinalLabel: { fontSize: 15, fontWeight: FONT.bold, color: DOC.text },
  totFinalVal: { fontSize: 18, fontWeight: FONT.bold, color: DOC.blue },

  // Notes
  notesBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: DOC.notesBg,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: DOC.notesBar,
  },
  notesText: { fontSize: 12, color: DOC.sub, lineHeight: 18, marginTop: 4 },

  // Doc footer
  docFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DOC.border,
  },
  footerText: { fontSize: 9, color: '#D1D5DB' },

  // Actions
  actions: { gap: SPACING.sm },
  actRow: { flexDirection: 'row', gap: SPACING.sm },

  btn: {
    height: 52,
    borderRadius: RADIUS.lg,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },

  btnPdf: {
    backgroundColor: DOC.blue,
    boxShadow: '0 4px 16px rgba(29,78,216,0.42)',
  },
  btnPdfIcon: { fontSize: 18, color: '#fff', fontWeight: FONT.bold, lineHeight: 22 },
  btnPdfText: { fontSize: 15, fontWeight: FONT.semibold, color: '#fff' },

  btnGhost: {
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnGhostIcon: { fontSize: 16, color: COLORS.text },
  btnGhostText: { fontSize: 15, fontWeight: FONT.semibold, color: COLORS.text },

  btnWA: {
    backgroundColor: '#128C7E',
    boxShadow: '0 4px 14px rgba(18,140,126,0.4)',
  },
  btnWAText: { fontSize: 15, fontWeight: FONT.semibold, color: '#fff' },

  btnMail: {
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnMailText: { fontSize: 15, fontWeight: FONT.semibold, color: COLORS.text },

  btnEnviada: {
    backgroundColor: COLORS.estadoEnviada,
    boxShadow: '0 4px 16px rgba(251,191,36,0.35)',
  },
  btnPagada: {
    backgroundColor: COLORS.estadoPagada,
    boxShadow: '0 4px 16px rgba(74,222,128,0.35)',
  },
  btnBorrador: {
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnBorradorText: { fontSize: 14, fontWeight: FONT.medium, color: COLORS.textSecondary },
  btnEstadoText: { fontSize: 15, fontWeight: FONT.semibold, color: '#111827' },

  btnDelete: {
    borderWidth: 1.5,
    borderColor: COLORS.danger + '55',
    backgroundColor: 'transparent',
  },
  btnDeleteText: { fontSize: 14, fontWeight: FONT.medium, color: COLORS.danger },
});
