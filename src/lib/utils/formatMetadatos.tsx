import React from 'react';

/**
 * 🎨 Utilidad para formatear metadatos JSON del sistema de fraccionamiento
 * Convierte JSON crudo en componentes React amigables para el usuario
 */

interface MetadataFraccionamiento {
  tipo_venta?: 'caja' | 'unidad';
  cantidad_solicitada?: number;
  unidades_vendidas?: number;
  cajas_abiertas?: number;
  productoNombre?: string;
  productoMarca?: string;
  productoModelo?: string;
  [key: string]: any;
}

/**
 * Formatea metadatos de fraccionamiento para mostrar de forma amigable
 */
export const formatearMetadatosFraccionamiento = (descripcion: string | undefined): React.ReactNode | string | null => {
  if (!descripcion) return null;
  
  try {
    const metadata: MetadataFraccionamiento = JSON.parse(descripcion);
    
    // Si contiene metadatos de fraccionamiento
    if (metadata.tipo_venta && metadata.cantidad_solicitada !== undefined) {
      return (
        <div className="mt-2 text-sm text-gray-700">
          <div className="font-medium text-gray-800 mb-1">
            📦 Venta Fraccionada: {metadata.tipo_venta === 'caja' ? 'Por Caja' : 'Por Unidad'}
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            <div>• Cantidad: {metadata.cantidad_solicitada} {metadata.tipo_venta === 'caja' ? 'caja(s)' : 'unidad(es)'}</div>
            <div>• Unidades vendidas: {metadata.unidades_vendidas}</div>
            {metadata.cajas_abiertas && metadata.cajas_abiertas > 0 && (
              <div>• Cajas abiertas: {metadata.cajas_abiertas}</div>
            )}
          </div>
        </div>
      );
    }
    
    // Si es otro tipo de metadata JSON, mostrar solo observaciones relevantes
    const entries = Object.entries(metadata);
    if (entries.length > 0) {
      // Solo mostrar observaciones importantes, no cliente ni factura (ya están en columnas dedicadas)
      const camposImportantes = ['observaciones'];
      const infoRelevante = entries.filter(([key]) => camposImportantes.includes(key));
      
      if (infoRelevante.length > 0) {
        return (
          <div className="mt-1 text-sm text-gray-700">
            {infoRelevante.map(([key, value]) => {
              if (key === 'observaciones') {
                return <div key={key} className="text-xs text-gray-500 mt-1">{String(value)}</div>;
              }
              return null;
            })}
          </div>
        );
      }
    }
    
    return null;
  } catch (e) {
    // Si no es JSON, devolver el texto tal como está
    return descripcion;
  }
};

/**
 * Versión simplificada para texto plano (útil para exportaciones CSV, etc.)
 */
export const formatearMetadatosTextoPlano = (descripcion: string | undefined): string => {
  if (!descripcion) return '';
  
  try {
    const metadata: MetadataFraccionamiento = JSON.parse(descripcion);
    
    // Si contiene metadatos de fraccionamiento
    if (metadata.tipo_venta && metadata.cantidad_solicitada !== undefined) {
      const tipoVenta = metadata.tipo_venta === 'caja' ? 'Por Caja' : 'Por Unidad';
      const cantidad = `${metadata.cantidad_solicitada} ${metadata.tipo_venta === 'caja' ? 'caja(s)' : 'unidad(es)'}`;
      const unidades = `${metadata.unidades_vendidas} unidades vendidas`;
      
      let resultado = `Venta Fraccionada: ${tipoVenta} - ${cantidad} - ${unidades}`;
      
      if (metadata.cajas_abiertas && metadata.cajas_abiertas > 0) {
        resultado += ` - ${metadata.cajas_abiertas} caja(s) abiertas`;
      }
      
      return resultado;
    }
    
    // Si es otro tipo de metadata JSON, mostrar solo observaciones relevantes
    const entries = Object.entries(metadata);
    if (entries.length > 0) {
      const camposImportantes = ['observaciones'];
      const infoRelevante = entries
        .filter(([key]) => camposImportantes.includes(key))
        .map(([key, value]) => {
          if (key === 'observaciones') return `${value}`;
          return `${key}: ${value}`;
        })
        .filter(Boolean);
      
      return infoRelevante.join(' | ');
    }
    
    return '';
  } catch (e) {
    // Si no es JSON, devolver el texto tal como está
    return descripcion;
  }
};

/**
 * Extrae información resumida para badges o indicadores
 */
export const extractarResumenMetadatos = (descripcion: string | undefined): {
  esFraccionamiento: boolean;
  tipoVenta?: 'caja' | 'unidad';
  cantidad?: number;
  resumen?: string;
} => {
  if (!descripcion) return { esFraccionamiento: false };
  
  try {
    const metadata: MetadataFraccionamiento = JSON.parse(descripcion);
    
    if (metadata.tipo_venta && metadata.cantidad_solicitada !== undefined) {
      return {
        esFraccionamiento: true,
        tipoVenta: metadata.tipo_venta,
        cantidad: metadata.cantidad_solicitada,
        resumen: `${metadata.cantidad_solicitada} ${metadata.tipo_venta === 'caja' ? 'caja(s)' : 'unidad(es)'}`
      };
    }
    
    return { esFraccionamiento: false };
  } catch (e) {
    return { esFraccionamiento: false };
  }
};