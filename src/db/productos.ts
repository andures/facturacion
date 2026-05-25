import { getDb } from '.';
import type { Producto } from '@/src/types';

export function getAllProductos(): Producto[] {
  return getDb().getAllSync<Producto>(
    'SELECT * FROM productos ORDER BY nombre ASC'
  );
}

export function getProductoById(id: string): Producto | null {
  return getDb().getFirstSync<Producto>(
    'SELECT * FROM productos WHERE id = ?', [id]
  ) ?? null;
}

export function createProducto(data: Omit<Producto, 'created_at'>): void {
  getDb().runSync(
    `INSERT INTO productos (id, nombre, descripcion, precio, iva, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.id, data.nombre, data.descripcion ?? null,
     data.precio, data.iva, Date.now()]
  );
}

export function updateProducto(data: Omit<Producto, 'created_at'>): void {
  getDb().runSync(
    `UPDATE productos
     SET nombre = ?, descripcion = ?, precio = ?, iva = ?
     WHERE id = ?`,
    [data.nombre, data.descripcion ?? null,
     data.precio, data.iva, data.id]
  );
}

export function deleteProducto(id: string): void {
  getDb().runSync('DELETE FROM productos WHERE id = ?', [id]);
}
