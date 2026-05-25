function daysAgo(n: number): number {
  return Date.now() - n * 24 * 60 * 60 * 1000;
}

const NOW = Date.now();

export const MOCK_CLIENTES = [
  { id: 'c-001', nombre: 'Karla Reyes',    empresa: 'Distribuidora Reyes',    email: 'karla@distribuidorareyes.hn', telefono: '+504 9812-3456', direccion: 'Col. Palmira, Tegucigalpa',            created_at: NOW },
  { id: 'c-002', nombre: 'Marco Andino',   empresa: 'TechHN Solutions',       email: 'marco@techhn.com',            telefono: '+504 9623-7890', direccion: 'Col. Las Colinas, San Pedro Sula',     created_at: NOW },
  { id: 'c-003', nombre: 'Sofía Mejía',    empresa: 'Eventos Sofía',          email: 'sofia@eventossofia.hn',       telefono: '+504 9734-5612', direccion: 'Col. Lomas del Guijarro, Tegucigalpa', created_at: NOW },
  { id: 'c-004', nombre: 'Diego Flores',   empresa: 'Constructora Flores',    email: 'dflores@cfhonduras.com',      telefono: '+504 9511-2233', direccion: 'Bo. El Centro, La Ceiba',              created_at: NOW },
  { id: 'c-005', nombre: 'Valeria Castro', empresa: null,                     email: 'valeriacastro@gmail.com',     telefono: '+504 9944-6677', direccion: 'Residencial Los Robles, Comayagüela',  created_at: NOW },
];

export const MOCK_PRODUCTOS = [
  { id: 'p-001', nombre: 'Consultoría por hora',      descripcion: 'Asesoría profesional por hora',            precio: 750.0,   iva: 15, created_at: NOW },
  { id: 'p-002', nombre: 'Diseño web completo',        descripcion: 'Diseño y desarrollo de sitio web',         precio: 12000.0, iva: 15, created_at: NOW },
  { id: 'p-003', nombre: 'Mantenimiento mensual',      descripcion: 'Soporte y mantenimiento técnico mensual',  precio: 2500.0,  iva: 15, created_at: NOW },
  { id: 'p-004', nombre: 'Capacitación online',        descripcion: 'Sesión de capacitación online (2 horas)',  precio: 1800.0,  iva: 15, created_at: NOW },
  { id: 'p-005', nombre: 'Redacción de contenido',     descripcion: 'Artículo o publicación optimizada',        precio: 600.0,   iva: 15, created_at: NOW },
  { id: 'p-006', nombre: 'Gestión de redes sociales',  descripcion: 'Plan mensual de redes sociales',           precio: 3500.0,  iva: 15, created_at: NOW },
  { id: 'p-007', nombre: 'Fotografía de producto',     descripcion: 'Sesión fotográfica (10 fotos editadas)',   precio: 1500.0,  iva: 15, created_at: NOW },
  { id: 'p-008', nombre: 'App móvil',                  descripcion: 'Desarrollo completo de aplicación móvil', precio: 45000.0, iva: 15, created_at: NOW },
];

export const MOCK_FACTURAS = [
  { id: 'f-001', numero: 'F-2026-001', cliente_id: 'c-001', fecha: daysAgo(40), estado: 'pagada',   notas: null,                                       created_at: NOW },
  { id: 'f-002', numero: 'F-2026-002', cliente_id: 'c-002', fecha: daysAgo(28), estado: 'pagada',   notas: 'Proyecto web corporativo TechHN.',          created_at: NOW },
  { id: 'f-003', numero: 'F-2026-003', cliente_id: 'c-003', fecha: daysAgo(14), estado: 'enviada',  notas: null,                                       created_at: NOW },
  { id: 'f-004', numero: 'F-2026-004', cliente_id: 'c-004', fecha: daysAgo(6),  estado: 'enviada',  notas: 'Pendiente aprobación.',                    created_at: NOW },
  { id: 'f-005', numero: 'F-2026-005', cliente_id: 'c-005', fecha: daysAgo(1),  estado: 'borrador', notas: 'Propuesta inicial pendiente de revisión.', created_at: NOW },
];

export const MOCK_LINEAS = [
  { id: 'l-001', factura_id: 'f-001', descripcion: 'Consultoría por hora',   precio: 750.0,  cantidad: 4, iva: 15, orden: 0 },
  { id: 'l-002', factura_id: 'f-001', descripcion: 'Redacción de contenido', precio: 600.0,  cantidad: 2, iva: 15, orden: 1 },
  { id: 'l-003', factura_id: 'f-002', descripcion: 'Diseño web completo',    precio: 12000.0,cantidad: 1, iva: 15, orden: 0 },
  { id: 'l-004', factura_id: 'f-003', descripcion: 'Gestión de redes',       precio: 3500.0, cantidad: 1, iva: 15, orden: 0 },
  { id: 'l-005', factura_id: 'f-003', descripcion: 'Fotografía de producto', precio: 1500.0, cantidad: 1, iva: 15, orden: 1 },
  { id: 'l-006', factura_id: 'f-004', descripcion: 'Consultoría por hora',   precio: 750.0,  cantidad: 6, iva: 15, orden: 0 },
  { id: 'l-007', factura_id: 'f-004', descripcion: 'Capacitación online',    precio: 1800.0, cantidad: 2, iva: 15, orden: 1 },
  { id: 'l-008', factura_id: 'f-005', descripcion: 'App móvil',              precio: 45000.0,cantidad: 1, iva: 15, orden: 0 },
];
