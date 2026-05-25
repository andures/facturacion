export interface LineItem {
  precio: number;
  cantidad: number;
  iva: number; // porcentaje, ej: 21 para 21%
}

export interface InvoiceTotals {
  subtotal: number;
  totalVat: number;
  total: number;
}

export function calcInvoiceTotals(lines: LineItem[]): InvoiceTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.precio * l.cantidad, 0);
  const totalVat = lines.reduce(
    (sum, l) => sum + l.precio * l.cantidad * (l.iva / 100),
    0
  );
  return { subtotal, totalVat, total: subtotal + totalVat };
}

