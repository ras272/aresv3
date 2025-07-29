// Tipos para el sistema de facturación

export interface Cliente {
  id: string;
  ruc: string;
  razonSocial: string;
  nombreFantasia?: string;
  direccion: string;
  telefono?: string;
  email?: string;
  tipoContribuyente: 'persona_fisica' | 'persona_juridica';
}

export interface ProductoFactura {
  id: string;
  codigoInterno: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  impuesto: 'exento' | 'iva_5' | 'iva_10';
  subtotal: number;
}

export interface Factura {
  id: string;
  numero: string;
  serie: string;
  fecha: Date;
  cliente: Cliente;
  productos: ProductoFactura[];
  subtotal: number;
  totalDescuentos: number;
  totalImpuestos: number;
  total: number;
  estado: 'borrador' | 'emitida' | 'anulada';
  observaciones?: string;
  cdc?: string; // Código de Control Digital para facturas emitidas
}

