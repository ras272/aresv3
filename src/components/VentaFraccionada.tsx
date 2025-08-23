// components/VentaFraccionada.tsx
import React, { useState } from 'react';
import { ShoppingCart, Package, Search, Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface VentaFraccionadaProps {
  onVentaRealizada?: (venta: any) => void;
}

export const VentaFraccionada: React.FC<VentaFraccionadaProps> = ({
  onVentaRealizada
}) => {
  const [busqueda, setBusqueda] = useState('');

  const handleVentaEjemplo = () => {
    toast.success('Venta fraccionada procesada correctamente');
    onVentaRealizada?.({
      id: 'venta-' + Date.now(),
      tipo: 'fraccionada',
      cantidad: 5,
      producto: 'Producto de ejemplo',
      fecha: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShoppingCart className="h-8 w-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Venta Fraccionada</h2>
            <p className="text-sm text-gray-600">Vender productos por unidades individuales</p>
          </div>
        </div>
        <button
          onClick={handleVentaEjemplo}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Venta</span>
        </button>
      </div>

      {/* Búsqueda de productos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Buscar Productos</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar productos por nombre, marca o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Estado inicial - Sin productos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {busqueda ? 'No se encontraron productos' : 'Busca productos para vender'}
        </h3>
        <p className="text-gray-500 mb-6">
          {busqueda 
            ? 'Intenta con otros términos de búsqueda'
            : 'Utiliza el buscador para encontrar productos disponibles en stock'
          }
        </p>
        {!busqueda && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Funcionalidad de Venta Fraccionada</p>
                <p className="mt-1">
                  Permite vender productos por unidades individuales, 
                  ideal para medicamentos y productos que se fraccionan de sus empaques originales.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
