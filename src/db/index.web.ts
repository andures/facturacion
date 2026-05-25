import { supabase } from '@/src/utils/supabase';

const _tables: Record<string, any[]> = {
  clientes:       [],
  productos:      [],
  facturas:       [],
  lineas_factura: [],
};

function _sb(fn: () => Promise<any>) {
  fn().catch((e) => console.warn('[supabase]', e));
}

function _calcTotal(facturaId: string): number {
  return _tables.lineas_factura
    .filter((l) => l.factura_id === facturaId)
    .reduce((s, l) => s + l.precio * l.cantidad * (1 + l.iva / 100), 0);
}

function _tableName(sql: string): string {
  return (sql.match(/(?:from|into|update|table)\s+(\w+)/i) ?? [])[1] ?? '';
}

function _extractCols(sql: string): string[] {
  const m = sql.match(/\(([^)]+)\)\s*values/i);
  return m ? m[1].split(',').map((c) => c.trim()) : [];
}

function _buildRow(sql: string, params: any[]): any {
  const row: any = {};
  _extractCols(sql).forEach((col, i) => { row[col] = params[i] ?? null; });
  return row;
}

function _updateRow(tbl: string, sql: string, params: any[]) {
  const id = params[params.length - 1];
  const idx = _tables[tbl].findIndex((r) => r.id === id);
  if (idx === -1) return;
  const setM = sql.match(/set\s+(.+?)\s+where/is);
  if (!setM) return;
  const cols = setM[1].split(',').map((p) => p.trim().split(/\s*=\s*/)[0].trim());
  const row = { ..._tables[tbl][idx] };
  cols.forEach((col, i) => { row[col] = params[i] ?? null; });
  _tables[tbl][idx] = row;
}

function _extractUpdateObj(sql: string, params: any[]): Record<string, any> {
  const setM = sql.match(/set\s+(.+?)\s+where/is);
  if (!setM) return {};
  const cols = setM[1].split(',').map((p) => p.trim().split(/\s*=\s*/)[0].trim());
  const obj: Record<string, any> = {};
  cols.forEach((col, i) => { obj[col] = params[i] ?? null; });
  return obj;
}

export interface IDb {
  getAllSync<T>(sql: string, params?: any[]): T[];
  getFirstSync<T>(sql: string, params?: any[]): T | null;
  runSync(sql: string, params?: any[]): void;
  withTransactionSync(fn: () => void): void;
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: any[]): Promise<void>;
  getFirstAsync<T>(sql: string, params?: any[]): Promise<T | null>;
}

const _db: IDb = {
  getAllSync<T>(sql: string, params: any[] = []): T[] {
    const s = sql.toLowerCase();
    if (s.includes('from facturas') && s.includes('join clientes')) {
      const cid = s.includes('where f.cliente_id') ? (params[0] as string) : null;
      let rows = cid ? _tables.facturas.filter((f) => f.cliente_id === cid) : [..._tables.facturas];
      rows.sort((a, b) => b.fecha - a.fecha);
      return rows.map((f) => {
        const c = _tables.clientes.find((cl) => cl.id === f.cliente_id) ?? {};
        return { ...f, cliente_nombre: c.nombre ?? '', cliente_empresa: c.empresa ?? null, total: _calcTotal(f.id) };
      }) as T[];
    }
    if (s.includes('from lineas_factura')) {
      return [..._tables.lineas_factura]
        .filter((l) => l.factura_id === params[0])
        .sort((a, b) => a.orden - b.orden) as T[];
    }
    if (s.includes('from clientes')) return [..._tables.clientes].sort((a, b) => a.nombre.localeCompare(b.nombre)) as T[];
    if (s.includes('from productos')) return [..._tables.productos].sort((a, b) => a.nombre.localeCompare(b.nombre)) as T[];
    return [];
  },

  getFirstSync<T>(sql: string, params: any[] = []): T | null {
    const s = sql.toLowerCase();
    if (s.includes('count(*)')) return { count: (_tables[_tableName(s)] ?? []).length } as T;
    if (s.includes('where id')) return (_tables[_tableName(s)]?.find((r) => r.id === params[0]) ?? null) as T | null;
    return null;
  },

  runSync(sql: string, params: any[] = []) {
    const s = sql.toLowerCase().trim();
    const tbl = _tableName(s);
    if (!tbl || !_tables[tbl]) return;

    if (s.startsWith('insert')) {
      const row = _buildRow(sql, params);
      if (!_tables[tbl].find((r) => r.id === params[0])) {
        _tables[tbl].push(row);
        _sb(async () => { const { error } = await supabase.from(tbl).upsert(row); if (error) throw error; });
      }
    } else if (s.startsWith('update')) {
      _updateRow(tbl, sql, params);
      const id = params[params.length - 1];
      const updateObj = _extractUpdateObj(sql, params);
      _sb(async () => { const { error } = await supabase.from(tbl).update(updateObj).eq('id', id); if (error) throw error; });
    } else if (s.startsWith('delete')) {
      if (s.includes('where id')) {
        _tables[tbl] = _tables[tbl].filter((r) => r.id !== params[0]);
        _sb(async () => { const { error } = await supabase.from(tbl).delete().eq('id', params[0]); if (error) throw error; });
      } else if (s.includes('where factura_id')) {
        _tables[tbl] = _tables[tbl].filter((r) => r.factura_id !== params[0]);
        _sb(async () => { const { error } = await supabase.from(tbl).delete().eq('factura_id', params[0]); if (error) throw error; });
      } else if (s.includes('where cliente_id')) {
        _tables[tbl] = _tables[tbl].filter((r) => r.cliente_id !== params[0]);
        _sb(async () => { const { error } = await supabase.from(tbl).delete().eq('cliente_id', params[0]); if (error) throw error; });
      } else {
        _tables[tbl] = [];
      }
    }
  },

  withTransactionSync(fn: () => void) { fn(); },

  async execAsync(sql: string) {
    const parts = sql.split(';').map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      const m = part.match(/^delete from (\w+)/i);
      if (m && _tables[m[1]]) {
        const tbl = m[1];
        _tables[tbl] = [];
        const { error } = await supabase.from(tbl).delete().gte('id', '');
        if (error) console.warn(`[supabase] delete all ${tbl}:`, error.message);
      }
    }
  },

  async runAsync(sql: string, params: any[] = []) {
    this.runSync(sql, params);
  },

  async getFirstAsync<T>(sql: string, params: any[] = []): Promise<T | null> {
    return this.getFirstSync<T>(sql, params);
  },
};

export function getDb(): IDb { return _db; }

export async function initDb(): Promise<void> {
  const [cl, pr, fa, li] = await Promise.all([
    supabase.from('clientes').select('*'),
    supabase.from('productos').select('*'),
    supabase.from('facturas').select('*'),
    supabase.from('lineas_factura').select('*').order('orden'),
  ]);
  _tables.clientes       = cl.data ?? [];
  _tables.productos      = pr.data ?? [];
  _tables.facturas       = fa.data ?? [];
  _tables.lineas_factura = li.data ?? [];
}
