export interface Cliente {
  id: string;
  nombre: string;
  empresa: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  created_at: number;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  iva: number;
  created_at: number;
}

export interface Factura {
  id: string;
  numero: string;
  cliente_id: string;
  fecha: number;
  estado: 'borrador' | 'enviada' | 'pagada';
  notas: string | null;
  created_at: number;
}

export interface LineaFactura {
  id: string;
  factura_id: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  iva: number;
  orden: number;
}

// Factura con datos del cliente y líneas calculadas (para mostrar en listas)
export interface FacturaConCliente extends Factura {
  cliente_nombre: string;
  cliente_empresa: string | null;
  total: number;
}
