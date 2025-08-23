/**
 * 💰 UTILIDADES PARA CÁLCULO DE PRECIOS DE FRACCIONAMIENTO
 * Maneja precios duales: por caja vs por unidad, en USD y Guaraníes
 */

import { CatalogoProducto } from '@/types';

export interface PrecioCalculado {
  precio: number;
  moneda: 'USD' | 'GS';
  descripcion: string;
  precioOriginal?: number;
  descuento?: number;
  ahorro?: string;
}

export interface CalculoVenta {
  tipoVenta: 'caja' | 'unidad';
  cantidad: number;
  precioUnitario: PrecioCalculado;
  precioTotal: PrecioCalculado;
  unidadesTotales: number;
  equivalencia?: string;
}

/**
 * Calcula el precio según el tipo de venta (caja o unidad)
 */
export const calcularPrecio = (
  producto: CatalogoProducto,
  tipoVenta: 'caja' | 'unidad',
  cantidad: number = 1
): CalculoVenta => {
  const unidadesPorCaja = producto.unidadesPorCaja || 1;
  
  if (tipoVenta === 'caja') {
    const precio = producto.precioPorCaja || producto.precio || 0;
    const moneda = producto.monedaCaja || producto.moneda || 'USD';
    const unidadesTotales = cantidad * unidadesPorCaja;
    
    // Calcular ahorro si existe precio por unidad
    let ahorro: string | undefined;
    if (producto.precioPorUnidad && producto.precioPorUnidad > 0) {
      const costoIndividual = producto.precioPorUnidad * unidadesTotales;
      const ahorroMonto = costoIndividual - (precio * cantidad);
      if (ahorroMonto > 0) {
        ahorro = formatearPrecio(ahorroMonto, moneda);
      }
    }
    
    return {
      tipoVenta: 'caja',
      cantidad,
      precioUnitario: {
        precio,
        moneda,
        descripcion: `${formatearPrecio(precio, moneda)} por caja`,
        ahorro
      },
      precioTotal: {
        precio: precio * cantidad,
        moneda,
        descripcion: `${formatearPrecio(precio * cantidad, moneda)} total`
      },
      unidadesTotales,
      equivalencia: `${cantidad} caja(s) = ${unidadesTotales} unidades`
    };
  } else {
    const precio = producto.precioPorUnidad || (producto.precio / unidadesPorCaja) || 0;
    const moneda = producto.monedaUnidad || producto.moneda || 'USD';
    
    return {
      tipoVenta: 'unidad',
      cantidad,
      precioUnitario: {
        precio,
        moneda,
        descripcion: `${formatearPrecio(precio, moneda)} por unidad`
      },
      precioTotal: {
        precio: precio * cantidad,
        moneda,
        descripcion: `${formatearPrecio(precio * cantidad, moneda)} total`
      },
      unidadesTotales: cantidad,
      equivalencia: `${cantidad} unidad(es)`
    };
  }
};

/**
 * Formatea precio según la moneda
 */
export const formatearPrecio = (precio: number, moneda: 'USD' | 'GS'): string => {
  if (moneda === 'USD') {
    return `$${precio.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    return `₲${precio.toLocaleString('es-PY', { maximumFractionDigits: 0 })}`;
  }
};

/**
 * Obtiene la mejor opción de precio (más económica)
 */
export const obtenerMejorPrecio = (
  producto: CatalogoProducto,
  cantidadDeseada: number
): { tipoVenta: 'caja' | 'unidad'; calculoOptimo: CalculoVenta; ahorro?: string } => {
  if (!producto.permiteFraccionamiento) {
    return {
      tipoVenta: 'caja',
      calculoOptimo: calcularPrecio(producto, 'caja', Math.ceil(cantidadDeseada / (producto.unidadesPorCaja || 1)))
    };
  }

  const unidadesPorCaja = producto.unidadesPorCaja || 1;
  const cajasCompletas = Math.floor(cantidadDeseada / unidadesPorCaja);
  const unidadesSueltas = cantidadDeseada % unidadesPorCaja;

  // Calcular costo comprando solo cajas completas vs mixto
  const calculoCajas = calcularPrecio(producto, 'caja', Math.ceil(cantidadDeseada / unidadesPorCaja));
  const calculoMixto = {
    cajas: cajasCompletas > 0 ? calcularPrecio(producto, 'caja', cajasCompletas) : null,
    unidades: unidadesSueltas > 0 ? calcularPrecio(producto, 'unidad', unidadesSueltas) : null
  };

  // Calcular costo total mixto
  const costoMixto = (calculoMixto.cajas?.precioTotal.precio || 0) + (calculoMixto.unidades?.precioTotal.precio || 0);
  
  if (costoMixto < calculoCajas.precioTotal.precio && cajasCompletas > 0) {
    const ahorro = formatearPrecio(calculoCajas.precioTotal.precio - costoMixto, calculoCajas.precioTotal.moneda);
    
    return {
      tipoVenta: 'caja', // Técnicamente es mixto, pero usamos 'caja' como referencia
      calculoOptimo: {
        tipoVenta: 'caja',
        cantidad: cantidadDeseada,
        precioUnitario: calculoCajas.precioUnitario,
        precioTotal: {
          precio: costoMixto,
          moneda: calculoCajas.precioTotal.moneda,
          descripcion: `${formatearPrecio(costoMixto, calculoCajas.precioTotal.moneda)} total (mixto)`
        },
        unidadesTotales: cantidadDeseada,
        equivalencia: `${cajasCompletas} caja(s) + ${unidadesSueltas} unidad(es)`
      },
      ahorro
    };
  }

  return {
    tipoVenta: 'caja',
    calculoOptimo: calculoCajas
  };
};

/**
 * Valida si el producto tiene precios configurados correctamente
 */
export const validarPreciosProducto = (producto: CatalogoProducto): {
  valido: boolean;
  errores: string[];
  advertencias: string[];
} => {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validar que tenga al menos un precio
  const tienePrecioCaja = producto.precioPorCaja && producto.precioPorCaja > 0;
  const tienePrecioUnidad = producto.precioPorUnidad && producto.precioPorUnidad > 0;
  const tienePrecioOriginal = producto.precio && producto.precio > 0;

  if (!tienePrecioCaja && !tienePrecioUnidad && !tienePrecioOriginal) {
    errores.push('El producto debe tener al menos un precio configurado');
  }

  // Validar fraccionamiento
  if (producto.permiteFraccionamiento) {
    if (!producto.unidadesPorCaja || producto.unidadesPorCaja <= 1) {
      advertencias.push('Los productos fraccionables deberían tener más de 1 unidad por caja');
    }
    
    if (!tienePrecioUnidad) {
      advertencias.push('Los productos fraccionables deberían tener precio por unidad');
    }
  }

  // Validar coherencia de monedas
  if (producto.monedaCaja && producto.monedaUnidad && producto.monedaCaja !== producto.monedaUnidad) {
    advertencias.push('Las monedas para caja y unidad son diferentes - podría generar confusión');
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias
  };
};

/**
 * Convierte precios entre monedas (requiere tasa de cambio)
 */
export const convertirMoneda = (
  precio: number,
  monedaOrigen: 'USD' | 'GS',
  monedaDestino: 'USD' | 'GS',
  tasaCambio: number = 7300 // Tasa por defecto USD a GS
): number => {
  if (monedaOrigen === monedaDestino) return precio;
  
  if (monedaOrigen === 'USD' && monedaDestino === 'GS') {
    return precio * tasaCambio;
  } else if (monedaOrigen === 'GS' && monedaDestino === 'USD') {
    return precio / tasaCambio;
  }
  
  return precio;
};