// components/IngresoFraccionamiento.tsx
import React, { useState } from 'react';
import { Package, Box, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/lib/database/shared/supabase';
import { toast } from 'sonner';

interface IngresoFraccionamientoProps {
  productoCargaId: string;
  productoNombre: string;
  cantidadInicial: number;
  productoMarca?: string;
  productoModelo?: string;
  onSuccess?: () => void;
}

export const IngresoFraccionamiento: React.FC<IngresoFraccionamientoProps> = ({
  productoCargaId,
  productoNombre,
  cantidadInicial, // Este valor representa CAJAS, no unidades
  productoMarca = 'Sin marca',
  productoModelo = 'Sin modelo',
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cantidadCajas: cantidadInicial, // Usar directamente como cajas
    unidadesPorCaja: 1,
    permiteFraccionamiento: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Llamar a la función de base de datos para procesar el ingreso
      const { data, error } = await supabase.rpc('procesar_ingreso_fraccionado', {
        p_producto_carga_id: productoCargaId,
        p_cantidad_cajas: formData.cantidadCajas,
        p_unidades_por_caja: formData.unidadesPorCaja,
        p_permite_fraccionamiento: formData.permiteFraccionamiento,
        p_usuario: 'Usuario Actual', // Obtener del contexto de sesión
        p_producto_nombre: productoNombre,
        p_producto_marca: productoMarca,
        p_producto_modelo: productoModelo
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message || 'Ingreso procesado correctamente');
        onSuccess?.();
      } else {
        throw new Error(data?.error || 'Error al procesar ingreso');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al procesar el ingreso');
    } finally {
      setLoading(false);
    }
  };

  const unidadesTotales = formData.cantidadCajas * formData.unidadesPorCaja;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <Package className="h-6 w-6 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold">Configuración de Fraccionamiento</h3>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Producto:</strong> {productoNombre}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cantidad de Cajas/Paquetes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad de Cajas/Paquetes
            </label>
            <div className="relative">
              <Box className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                min="1"
                value={formData.cantidadCajas}
                onChange={(e) => setFormData({
                  ...formData,
                  cantidadCajas: parseInt(e.target.value) || 1
                })}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Unidades por Caja */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidades por Caja/Paquete
            </label>
            <input
              type="number"
              min="1"
              value={formData.unidadesPorCaja}
              onChange={(e) => setFormData({
                ...formData,
                unidadesPorCaja: parseInt(e.target.value) || 1
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Checkbox para permitir fraccionamiento */}
        <div className="flex items-start">
          <input
            type="checkbox"
            id="permiteFraccionamiento"
            checked={formData.permiteFraccionamiento}
            onChange={(e) => setFormData({
              ...formData,
              permiteFraccionamiento: e.target.checked
            })}
            className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="permiteFraccionamiento" className="ml-2">
            <span className="text-sm font-medium text-gray-700">
              Permitir venta fraccionada
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Marcar si este producto puede venderse por unidades individuales, no solo por cajas completas
            </p>
          </label>
        </div>

        {/* Resumen */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-gray-700 mb-2">Resumen del Ingreso:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• {formData.cantidadCajas} caja(s) × {formData.unidadesPorCaja} unidades = <strong>{unidadesTotales} unidades totales</strong></li>
                {formData.permiteFraccionamiento && (
                  <>
                    <li>• Stock inicial: <strong>{formData.cantidadCajas} cajas completas</strong></li>
                    <li>• Se podrá vender por: <strong>Cajas completas o Unidades individuales</strong></li>
                  </>
                )}
                {!formData.permiteFraccionamiento && (
                  <li>• Solo se podrá vender en unidades de {formData.unidadesPorCaja === 1 ? '1 unidad' : `${formData.unidadesPorCaja} unidades (caja completa)`}</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Advertencia si se configura fraccionamiento */}
        {formData.permiteFraccionamiento && formData.unidadesPorCaja > 1 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Importante:</strong> Al permitir fraccionamiento, el sistema podrá abrir cajas 
                  automáticamente cuando sea necesario para cumplir con ventas por unidades individuales.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => onSuccess?.()}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Procesando...' : 'Confirmar Ingreso'}
          </button>
        </div>
      </form>
    </div>
  );
};
