import { getDb } from '.';
import type { Factura, FacturaConCliente, LineaFactura } from '@/src/types';

export function getAllFacturas(): FacturaConCliente[] {
  return getDb().getAllSync<FacturaConCliente>(`
    SELECT f.*,
           c.nombre  AS cliente_nombre,
           c.empresa AS cliente_empresa,
           COALESCE((
             SELECT SUM(l.precio * l.cantidad * (1 + l.iva / 100.0))
             FROM lineas_factura l WHERE l.factura_id = f.id
           ), 0) AS total
    FROM facturas f
    JOIN clientes c ON c.id = f.cliente_id
    ORDER BY f.fecha DESC
  `);
}

export function getFacturasByCliente(clienteId: string): FacturaConCliente[] {
  return getDb().getAllSync<FacturaConCliente>(`
    SELECT f.*,
           c.nombre  AS cliente_nombre,
           c.empresa AS cliente_empresa,
           COALESCE((
             SELECT SUM(l.precio * l.cantidad * (1 + l.iva / 100.0))
             FROM lineas_factura l WHERE l.factura_id = f.id
           ), 0) AS total
    FROM facturas f
    JOIN clientes c ON c.id = f.cliente_id
    WHERE f.cliente_id = ?
    ORDER BY f.fecha DESC
  `, [clienteId]);
}

export function getFacturaById(id: string): Factura | null {
  return getDb().getFirstSync<Factura>(
    'SELECT * FROM facturas WHERE id = ?', [id]
  ) ?? null;
}

export function getLineasByFactura(facturaId: string): LineaFactura[] {
  return getDb().getAllSync<LineaFactura>(
    'SELECT * FROM lineas_factura WHERE factura_id = ? ORDER BY orden ASC',
    [facturaId]
  );
}

export interface CreateFacturaInput {
  id: string;
  numero: string;
  cliente_id: string;
  fecha: number;
  estado: Factura['estado'];
  notas: string | null;
  lineas: Omit<LineaFactura, 'factura_id'>[];
}

export function createFactura(data: CreateFacturaInput): void {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO facturas (id, numero, cliente_id, fecha, estado, notas, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.id, data.numero, data.cliente_id, data.fecha, data.estado, data.notas, Date.now()]
    );
    for (const l of data.lineas) {
      db.runSync(
        `INSERT INTO lineas_factura (id, factura_id, descripcion, precio, cantidad, iva, orden)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [l.id, data.id, l.descripcion, l.precio, l.cantidad, l.iva, l.orden]
      );
    }
  });
}

export function updateFactura(
  data: Pick<Factura, 'id' | 'cliente_id' | 'fecha' | 'notas'>,
  lineas: Omit<LineaFactura, 'factura_id'>[]
): void {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync(
      'UPDATE facturas SET cliente_id = ?, fecha = ?, notas = ? WHERE id = ?',
      [data.cliente_id, data.fecha, data.notas, data.id]
    );
    db.runSync('DELETE FROM lineas_factura WHERE factura_id = ?', [data.id]);
    for (const l of lineas) {
      db.runSync(
        `INSERT INTO lineas_factura (id, factura_id, descripcion, precio, cantidad, iva, orden)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [l.id, data.id, l.descripcion, l.precio, l.cantidad, l.iva, l.orden]
      );
    }
  });
}

export function updateEstado(id: string, estado: Factura['estado']): void {
  getDb().runSync('UPDATE facturas SET estado = ? WHERE id = ?', [estado, id]);
}

export function deleteFactura(id: string): void {
  getDb().runSync('DELETE FROM facturas WHERE id = ?', [id]);
}
