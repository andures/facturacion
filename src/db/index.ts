import {
  CREATE_CLIENTES,
  CREATE_PRODUCTOS,
  CREATE_FACTURAS,
  CREATE_LINEAS_FACTURA,
} from './schema';
import { seedDb } from './seed';

export interface IDb {
  getAllSync<T>(sql: string, params?: any[]): T[];
  getFirstSync<T>(sql: string, params?: any[]): T | null;
  runSync(sql: string, params?: any[]): void;
  withTransactionSync(fn: () => void): void;
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: any[]): Promise<void>;
  getFirstAsync<T>(sql: string, params?: any[]): Promise<T | null>;
}

let _nativeDb: any = null;

function getNativeDb(): IDb {
  if (!_nativeDb) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SQLite = require('expo-sqlite') as typeof import('expo-sqlite');
    _nativeDb = SQLite.openDatabaseSync('facturacion.db');
  }
  return _nativeDb;
}

export function getDb(): IDb {
  return getNativeDb();
}

export async function initDb(): Promise<void> {
  const database = getNativeDb();
  await database.execAsync(CREATE_CLIENTES);
  await database.execAsync(CREATE_PRODUCTOS);
  await database.execAsync(CREATE_FACTURAS);
  await database.execAsync(CREATE_LINEAS_FACTURA);
  await seedDb(database as any);
}
