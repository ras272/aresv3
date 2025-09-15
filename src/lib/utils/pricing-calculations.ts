/**
 * 💰 UTILIDADES PARA CÁLCULO DE PRECIOS DE DEFINICIÓN DE PRECIOS
 * Maneja cálculos de costos, márgenes e impuestos para definición de precios
 */

export interface PricingComponents {
  precioBase: number;
  monedaBase: string;
  factorConversion: number;
  costoFlete: number;
  costoTransporte: number;
  otrosCostos: number;
  costoTotal: number;
  margenUtilidad: number;
  precioVentaNeto: number;
  ivaPercent: number;
  precioFinalLista: number;
}

/**
 * Calcula todos los componentes de precio basados en los datos de entrada
 */
export const calcularPrecioProducto = (
  pricingData: {
    precioBase: number;
    factorConversion: number;
    costoFlete: number;
    costoTransporte: number;
    otrosCostos: number;
    margenUtilidad: number;
    ivaPercent: number;
  }
): PricingComponents => {
  const {
    precioBase = 0,
    factorConversion = 1,
    costoFlete = 0,
    costoTransporte = 0,
    otrosCostos = 0,
    margenUtilidad = 0,
    ivaPercent = 0
  } = pricingData;

  // Calcular costo total
  const costoTotal = (precioBase * factorConversion) + costoFlete + costoTransporte + otrosCostos;
  
  // Aplicar margen de utilidad
  const precioVentaNeto = costoTotal * (1 + margenUtilidad / 100);
  
  // Aplicar IVA
  const precioFinalLista = precioVentaNeto * (1 + ivaPercent / 100);

  return {
    precioBase,
    monedaBase: 'USD', // Valor por defecto, se puede sobrescribir
    factorConversion,
    costoFlete,
    costoTransporte,
    otrosCostos,
    costoTotal,
    margenUtilidad,
    precioVentaNeto,
    ivaPercent,
    precioFinalLista
  };
};

/**
 * Formatea precio según la moneda
 */
export const formatearPrecio = (precio: number | null | undefined, moneda: string): string => {
  // Manejar casos donde el precio es null o undefined
  if (precio === null || precio === undefined) {
    return 'Sin definir';
  }
  
  if (moneda === 'USD') {
    return `$${precio.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (moneda === 'EUR') {
    return `€${precio.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (moneda === 'GS') {
    return `₲${precio.toLocaleString('es-PY', { maximumFractionDigits: 0 })}`;
  } else {
    return `${precio.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${moneda}`;
  }
};

/**
 * Valida si los datos de pricing son válidos
 */
export const validarPricingData = (
  pricingData: Partial<{
    precioBase: number;
    factorConversion: number;
    costoFlete: number;
    costoTransporte: number;
    otrosCostos: number;
    margenUtilidad: number;
    ivaPercent: number;
  }>
): { isValid: boolean; errores: string[] } => {
  const errores: string[] = [];

  if (pricingData.precioBase !== undefined && pricingData.precioBase < 0) {
    errores.push('El precio base no puede ser negativo');
  }

  if (pricingData.factorConversion !== undefined && pricingData.factorConversion <= 0) {
    errores.push('El factor de conversión debe ser mayor que cero');
  }

  if (pricingData.costoFlete !== undefined && pricingData.costoFlete < 0) {
    errores.push('El costo de flete no puede ser negativo');
  }

  if (pricingData.costoTransporte !== undefined && pricingData.costoTransporte < 0) {
    errores.push('El costo de transporte no puede ser negativo');
  }

  if (pricingData.otrosCostos !== undefined && pricingData.otrosCostos < 0) {
    errores.push('Otros costos no puede ser negativo');
  }

  if (pricingData.margenUtilidad !== undefined && pricingData.margenUtilidad < 0) {
    errores.push('El margen de utilidad no puede ser negativo');
  }

  if (pricingData.ivaPercent !== undefined && pricingData.ivaPercent < 0) {
    errores.push('El porcentaje de IVA no puede ser negativo');
  }

  return {
    isValid: errores.length === 0,
    errores
  };
};