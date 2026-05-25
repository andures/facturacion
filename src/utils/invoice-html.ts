export interface InvoiceHtmlParams {
  businessName: string;
  taxId: string;
  address: string;
  currency: string;
  numero: string;
  fecha: number;
  estado: string;
  cliente: {
    nombre: string;
    empresa?: string | null;
    email?: string | null;
    telefono?: string | null;
    direccion?: string | null;
  };
  lineas: Array<{ descripcion: string; cantidad: number; precio: number; iva: number }>;
  notas: string | null;
}

function fmt(n: number, currency: string) {
  return `${currency} ${n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(ts: number) {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  enviada:  'Enviada',
  pagada:   'Pagada',
};
const STATUS_CHIP: Record<string, string> = {
  borrador: 'background:rgba(255,255,255,0.12);color:#CBD5E1;border:1px solid rgba(255,255,255,0.2)',
  enviada:  'background:#3B82F6;color:#fff;border:1px solid #2563EB',
  pagada:   'background:#22C55E;color:#fff;border:1px solid #16A34A',
};

export function buildInvoiceHtml(p: InvoiceHtmlParams): string {
  const subtotal = p.lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
  const totalVat = p.lineas.reduce((s, l) => s + l.precio * l.cantidad * (l.iva / 100), 0);
  const total    = subtotal + totalVat;

  const rows = p.lineas.map((l) => {
    const lineTotal = l.precio * l.cantidad * (1 + l.iva / 100);
    return `
      <tr>
        <td class="td-desc">
          <div class="item-name">${l.descripcion}</div>
          ${l.iva > 0 ? `<div class="item-isv">ISV ${l.iva}%</div>` : ''}
        </td>
        <td class="c">${l.cantidad}</td>
        <td class="r">${fmt(l.precio, p.currency)}</td>
        <td class="r bold">${fmt(lineTotal, p.currency)}</td>
      </tr>`;
  }).join('');

  const chipStyle  = STATUS_CHIP[p.estado]  || STATUS_CHIP.borrador;
  const chipLabel  = STATUS_LABEL[p.estado] || p.estado;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Factura ${p.numero}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;background:#E2E8F0;font-size:12px;line-height:1.45;color:#1E293B}
  .page{max-width:794px;margin:24px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 6px 32px rgba(0,0,0,0.15)}

  /* ── Header ─────────────────────────────────── */
  .hdr{background:linear-gradient(135deg,#0F172A 0%,#1D3461 100%);padding:22px 40px 18px}
  .hdr-inner{display:flex;justify-content:space-between;align-items:flex-start}
  .co-name{font-size:17px;font-weight:800;color:#F8FAFC;letter-spacing:-0.3px;margin-bottom:4px}
  .co-detail{font-size:10px;color:#94A3B8;margin-top:2px;line-height:1.6}
  .inv-right{text-align:right}
  .inv-eyebrow{font-size:8px;font-weight:700;color:#60A5FA;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:5px}
  .inv-num{font-size:20px;font-weight:800;color:#F8FAFC;letter-spacing:-0.5px;line-height:1}
  .inv-date{font-size:10px;color:#94A3B8;margin-top:5px}
  .status-chip{display:inline-block;margin-top:8px;padding:3px 11px;border-radius:20px;font-size:9px;font-weight:700;letter-spacing:0.8px;${chipStyle}}

  /* ── Blue accent line ────────────────────────── */
  .accent{height:3px;background:linear-gradient(90deg,#3B82F6,#60A5FA,#93C5FD)}

  /* ── Body ────────────────────────────────────── */
  .body{padding:24px 40px}

  /* ── Meta row ────────────────────────────────── */
  .meta{display:flex;gap:24px;margin-bottom:20px;padding-bottom:18px;border-bottom:1px solid #E2E8F0}
  .meta-col{flex:1}
  .sec-label{font-size:8px;font-weight:700;color:#94A3B8;letter-spacing:2px;text-transform:uppercase;margin-bottom:7px}
  .cli-name{font-size:14px;font-weight:700;color:#0F172A;margin-bottom:3px}
  .cli-detail{font-size:11px;color:#64748B;margin-top:2px;line-height:1.6}

  .info-box{background:#F8FAFC;border-radius:8px;padding:2px 0;border:1px solid #E2E8F0}
  .info-row{display:flex;justify-content:space-between;align-items:center;padding:7px 13px}
  .info-row+.info-row{border-top:1px solid #F1F5F9}
  .info-key{font-size:10px;color:#94A3B8;font-weight:500}
  .info-val{font-size:11px;color:#0F172A;font-weight:600}

  /* ── Table ───────────────────────────────────── */
  table{width:100%;border-collapse:collapse;margin-bottom:4px}
  thead tr{background:#0F172A}
  th{padding:8px 12px;font-size:8px;font-weight:600;color:#94A3B8;letter-spacing:1.2px;text-transform:uppercase;text-align:left}
  th.r{text-align:right} th.c{text-align:center}
  td{padding:9px 12px;vertical-align:top;border-bottom:1px solid #F1F5F9}
  .item-name{font-size:12px;font-weight:600;color:#0F172A}
  .item-isv{font-size:10px;color:#94A3B8;margin-top:2px}
  .c{text-align:center;color:#475569;font-size:12px}
  .r{text-align:right;color:#475569;font-size:12px}
  .bold{font-weight:700;color:#0F172A;font-size:12px}
  tbody tr:nth-child(even){background:#F8FAFC}
  tbody tr:last-child td{border-bottom:2px solid #E2E8F0}

  /* ── Totals ──────────────────────────────────── */
  .totals-wrap{display:flex;justify-content:flex-end;margin-top:10px}
  .totals-box{width:260px}
  .tot-row{display:flex;justify-content:space-between;align-items:center;padding:6px 13px}
  .tot-label{font-size:12px;color:#64748B}
  .tot-val{font-size:12px;color:#374151;font-weight:500}
  .tot-sep{height:1px;background:#E2E8F0;margin:3px 13px}
  .tot-final-wrap{background:#0F172A;border-radius:8px;margin-top:8px;padding:12px 13px}
  .tot-final{display:flex;justify-content:space-between;align-items:center}
  .tot-final-label{font-size:13px;font-weight:700;color:#F8FAFC}
  .tot-final-val{font-size:18px;font-weight:800;color:#60A5FA;letter-spacing:-0.5px}

  /* ── Notes ───────────────────────────────────── */
  .notes{margin-top:18px;padding:12px 16px;background:#F0F9FF;border-radius:7px;border-left:3px solid #3B82F6}
  .notes-text{font-size:11px;color:#475569;line-height:1.7;margin-top:4px}

  /* ── Footer ──────────────────────────────────── */
  .footer{margin-top:20px;padding:10px 16px;background:#F8FAFC;border-radius:7px;display:flex;justify-content:space-between;align-items:center;border:1px solid #E2E8F0}
  .footer-brand{font-size:10px;font-weight:600;color:#64748B}
  .footer-info{font-size:9px;color:#94A3B8}

  @media print{
    body{background:#fff}
    .page{margin:0;border-radius:0;box-shadow:none;max-width:100%}
    .body{padding:20px 36px}
    .hdr{padding:18px 36px 14px}
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  }
</style>
</head>
<body>
<div class="page">

  <div class="hdr">
    <div class="hdr-inner">
      <div>
        <div class="co-name">${p.businessName || 'Mi Empresa'}</div>
        ${p.taxId    ? `<div class="co-detail">RTN: ${p.taxId}</div>` : ''}
        ${p.address  ? `<div class="co-detail">${p.address.replace(/\n/g, '<br>')}</div>` : ''}
      </div>
      <div class="inv-right">
        <div class="inv-eyebrow">Factura</div>
        <div class="inv-num">${p.numero}</div>
        <div class="inv-date">${fmtDate(p.fecha)}</div>
        <div><span class="status-chip">${chipLabel}</span></div>
      </div>
    </div>
  </div>

  <div class="accent"></div>

  <div class="body">

    <div class="meta">
      <div class="meta-col">
        <div class="sec-label">Facturar a</div>
        <div class="cli-name">${p.cliente.nombre}</div>
        ${p.cliente.empresa   ? `<div class="cli-detail">${p.cliente.empresa}</div>`   : ''}
        ${p.cliente.email     ? `<div class="cli-detail">${p.cliente.email}</div>`     : ''}
        ${p.cliente.telefono  ? `<div class="cli-detail">${p.cliente.telefono}</div>`  : ''}
        ${p.cliente.direccion ? `<div class="cli-detail">${p.cliente.direccion}</div>` : ''}
      </div>
      <div class="meta-col">
        <div class="sec-label">Detalles</div>
        <div class="info-box">
          <div class="info-row">
            <span class="info-key">Número</span>
            <span class="info-val">${p.numero}</span>
          </div>
          <div class="info-row">
            <span class="info-key">Fecha</span>
            <span class="info-val">${fmtDate(p.fecha)}</span>
          </div>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:50%">Descripción</th>
          <th class="c" style="width:8%">Cant.</th>
          <th class="r" style="width:20%">Precio unit.</th>
          <th class="r" style="width:22%">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals-wrap">
      <div class="totals-box">
        <div class="tot-row">
          <span class="tot-label">Subtotal</span>
          <span class="tot-val">${fmt(subtotal, p.currency)}</span>
        </div>
        <div class="tot-sep"></div>
        <div class="tot-row">
          <span class="tot-label">ISV</span>
          <span class="tot-val">${fmt(totalVat, p.currency)}</span>
        </div>
        <div class="tot-final-wrap">
          <div class="tot-final">
            <span class="tot-final-label">Total</span>
            <span class="tot-final-val">${fmt(total, p.currency)}</span>
          </div>
        </div>
      </div>
    </div>

    ${p.notas ? `
    <div class="notes">
      <div class="sec-label">Notas</div>
      <div class="notes-text">${p.notas}</div>
    </div>` : ''}

    <div class="footer">
      <span class="footer-brand">Generado con Facturación App</span>
      <span class="footer-info">${p.numero} &nbsp;·&nbsp; ${fmtDate(p.fecha)}</span>
    </div>

  </div>
</div>
</body>
</html>`;
}
