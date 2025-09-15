/**
 * @fileoverview Pruebas para el módulo de definición de precios
 */

import { calcularPrecioProducto, formatearPrecio, validarPricingData } from '@/lib/utils/pricing-calculations';

describe('Pricing Calculations', () => {
  test('debería calcular correctamente el precio con todos los componentes', () => {
    const pricingData = {
      precioBase: 100,
      factorConversion: 1.1,
      costoFlete: 10,
      costoTransporte: 5,
      otrosCostos: 5,
      margenUtilidad: 20,
      ivaPercent: 10
    };

    const result = calcularPrecioProducto(pricingData);
    
    // Costo total = (100 * 1.1) + 10 + 5 + 5 = 130
    expect(result.costoTotal).toBe(130);
    
    // Precio venta neto = 130 * 1.2 = 156
    expect(result.precioVentaNeto).toBe(156);
    
    // Precio final = 156 * 1.1 = 171.6
    expect(result.precioFinalLista).toBe(171.6);
  });

  test('debería manejar correctamente valores por defecto', () => {
    const pricingData = {
      precioBase: 50
    };

    const result = calcularPrecioProducto(pricingData);
    
    // Costo total = 50 * 1 = 50
    expect(result.costoTotal).toBe(50);
    
    // Sin margen ni IVA, precio venta neto = 50
    expect(result.precioVentaNeto).toBe(50);
    
    // Sin IVA, precio final = 50
    expect(result.precioFinalLista).toBe(50);
  });

  test('debería formatear correctamente los precios', () => {
    expect(formatearPrecio(1234.56, 'USD')).toBe('$1,234.56');
    expect(formatearPrecio(1234.56, 'EUR')).toBe('€1,234.56');
    expect(formatearPrecio(1234567, 'GS')).toBe('₲1,234,567');
  });

  test('debería validar correctamente los datos de pricing', () => {
    // Datos válidos
    const validData = {
      precioBase: 100,
      factorConversion: 1.1,
      costoFlete: 10,
      margenUtilidad: 20,
      ivaPercent: 10
    };
    
    const validResult = validarPricingData(validData);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errores).toHaveLength(0);
    
    // Datos inválidos
    const invalidData = {
      precioBase: -100,
      factorConversion: 0,
      costoFlete: -10,
      margenUtilidad: -20,
      ivaPercent: -10
    };
    
    const invalidResult = validarPricingData(invalidData);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errores).toHaveLength(5);
  });
});