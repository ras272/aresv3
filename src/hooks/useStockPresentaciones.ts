import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/database/shared/supabase';
import { toast } from 'sonner';

export interface StockPresentacion {
  presentacion_id: string;
  nombre_presentacion: string;
  factor_conversion: number;
  precio_venta: number | null;
  unidades_disponibles: number;
  puede_vender_completa: boolean;
  es_default: boolean;
}

export interface ResumenProducto {
  producto: {
    id: string;
    codigo: string;
    nombre: string;
    marca: string;
    modelo: string;
    precio_base: number;
    moneda: string;
  };
  stock: {
    cajas_stock: number;
    unidades_sueltas: number;
    cajas_completas_disponibles: number;
    total_unidades_disponibles: number;
    factor_conversion: number;
  };
  presentaciones: StockPresentacion[];
  caja_abierta: {
    tiene_caja_abierta: boolean;
    unidades_restantes?: number;
    factor_original?: number;
    porcentaje_usado?: number;
  };
  alertas: {
    stock_bajo: boolean;
    requiere_reposicion: boolean;
  };
}

export interface SimulacionVenta {
  success: boolean;
  tipo_venta: 'caja_completa' | 'unidades';
  cantidad_solicitada: number;
  unidades_que_se_venderian?: number;
  stock_resultante: any;
  error?: string;
}

export function useStockPresentaciones() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener resumen completo de un producto
  const obtenerResumenProducto = useCallback(async (stockItemId: string): Promise<ResumenProducto | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .rpc('obtener_resumen_producto', { p_stock_item_id: stockItemId });

      if (error) throw error;
      
      return data as ResumenProducto;
    } catch (err: any) {
      const errorMsg = err.message || 'Error al obtener resumen del producto';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener presentaciones de un producto
  const obtenerPresentaciones = useCallback(async (stockItemId: string): Promise<StockPresentacion[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .rpc('obtener_stock_por_presentaciones', { p_stock_item_id: stockItemId });

      if (error) throw error;
      
      return data as StockPresentacion[];
    } catch (err: any) {
      const errorMsg = err.message || 'Error al obtener presentaciones';
      setError(errorMsg);
      toast.error(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Simular venta sin ejecutar
  const simularVenta = useCallback(async (
    stockItemId: string, 
    tipoVenta: 'caja_completa' | 'unidades', 
    cantidad: number,
    presentacionId?: string
  ): Promise<SimulacionVenta | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .rpc('simular_venta', { 
          p_stock_item_id: stockItemId,
          p_tipo_venta: tipoVenta,
          p_cantidad: cantidad,
          p_presentacion_id: presentacionId || null
        });

      if (error) throw error;
      
      return data as SimulacionVenta;
    } catch (err: any) {
      const errorMsg = err.message || 'Error al simular venta';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Vender caja completa
  const venderCajaCompleta = useCallback(async (
    stockItemId: string,
    presentacionId: string,
    cantidad: number,
    usuario?: string,
    referenciaExterna?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .rpc('vender_producto_caja_completa', {
          p_stock_item_id: stockItemId,
          p_presentacion_id: presentacionId,
          p_cantidad: cantidad,
          p_motivo: 'Venta',
          p_usuario: usuario || null,
          p_referencia_externa: referenciaExterna || null
        });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Error en la venta');
      }

      toast.success(`Venta exitosa: ${cantidad} caja${cantidad > 1 ? 's' : ''} completa${cantidad > 1 ? 's' : ''}`);
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error al procesar venta de caja completa';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Vender unidades individuales
  const venderUnidadesIndividuales = useCallback(async (
    stockItemId: string,
    cantidadUnidades: number,
    usuario?: string,
    referenciaExterna?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .rpc('vender_producto_unidades_individuales', {
          p_stock_item_id: stockItemId,
          p_cantidad_unidades: cantidadUnidades,
          p_motivo: 'Venta individual',
          p_usuario: usuario || null,
          p_referencia_externa: referenciaExterna || null
        });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Error en la venta');
      }

      toast.success(`Venta exitosa: ${cantidadUnidades} unidad${cantidadUnidades > 1 ? 'es' : ''} individual${cantidadUnidades > 1 ? 'es' : ''}`);
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error al procesar venta de unidades individuales';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener productos con stock crítico
  const obtenerProductosStockCritico = useCallback(async (limite: number = 5) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .rpc('obtener_productos_stock_critico', { p_limite: limite });

      if (error) throw error;
      
      return data || [];
    } catch (err: any) {
      const errorMsg = err.message || 'Error al obtener productos con stock crítico';
      setError(errorMsg);
      toast.error(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener vista optimizada de stock disponible
  const obtenerVistaStockDisponible = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('vista_stock_disponible')
        .select('*')
        .order('nombre');

      if (error) throw error;
      
      return data || [];
    } catch (err: any) {
      const errorMsg = err.message || 'Error al obtener vista de stock disponible';
      setError(errorMsg);
      toast.error(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    obtenerResumenProducto,
    obtenerPresentaciones,
    simularVenta,
    venderCajaCompleta,
    venderUnidadesIndividuales,
    obtenerProductosStockCritico,
    obtenerVistaStockDisponible
  };
}
