export const CREATE_CLIENTES = `
  CREATE TABLE IF NOT EXISTS clientes (
    id          TEXT PRIMARY KEY,
    nombre      TEXT NOT NULL,
    empresa     TEXT,
    email       TEXT,
    telefono    TEXT,
    direccion   TEXT,
    created_at  INTEGER NOT NULL
  )
`;

export const CREATE_PRODUCTOS = `
  CREATE TABLE IF NOT EXISTS productos (
    id          TEXT PRIMARY KEY,
    nombre      TEXT NOT NULL,
    descripcion TEXT,
    precio      REAL NOT NULL,
    iva         REAL NOT NULL DEFAULT 15,
    created_at  INTEGER NOT NULL
  )
`;

export const CREATE_FACTURAS = `
  CREATE TABLE IF NOT EXISTS facturas (
    id          TEXT PRIMARY KEY,
    numero      TEXT NOT NULL UNIQUE,
    cliente_id  TEXT NOT NULL,
    fecha       INTEGER NOT NULL,
    estado      TEXT NOT NULL DEFAULT 'borrador',
    notas       TEXT,
    created_at  INTEGER NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  )
`;

export const CREATE_LINEAS_FACTURA = `
  CREATE TABLE IF NOT EXISTS lineas_factura (
    id           TEXT PRIMARY KEY,
    factura_id   TEXT NOT NULL,
    descripcion  TEXT NOT NULL,
    precio       REAL NOT NULL,
    cantidad     REAL NOT NULL DEFAULT 1,
    iva          REAL NOT NULL DEFAULT 15,
    orden        INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
  )
`;
