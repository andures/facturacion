import { getDb } from '.';
import type { Cliente } from '@/src/types';

export function getAllClientes(): Cliente[] {
  return getDb().getAllSync<Cliente>(
    'SELECT * FROM clientes ORDER BY nombre ASC'
  );
}

export function getClienteById(id: string): Cliente | null {
  return getDb().getFirstSync<Cliente>(
    'SELECT * FROM clientes WHERE id = ?', [id]
  );
}

export function createCliente(data: Omit<Cliente, 'created_at'>): void {
  getDb().runSync(
    `INSERT INTO clientes (id, nombre, empresa, email, telefono, direccion, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.id, data.nombre, data.empresa ?? null, data.email ?? null,
     data.telefono ?? null, data.direccion ?? null, Date.now()]
  );
}

export function updateCliente(data: Omit<Cliente, 'created_at'>): void {
  getDb().runSync(
    `UPDATE clientes
     SET nombre = ?, empresa = ?, email = ?, telefono = ?, direccion = ?
     WHERE id = ?`,
    [data.nombre, data.empresa ?? null, data.email ?? null,
     data.telefono ?? null, data.direccion ?? null, data.id]
  );
}

export function deleteCliente(id: string): void {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM facturas WHERE cliente_id = ?', [id]);
    db.runSync('DELETE FROM clientes WHERE id = ?', [id]);
  });
}
