// components/StockFraccionadoView.tsx
import React, { useState, useEffect } from 'react';
import { Package, Box, AlertTriangle, TrendingDown, Eye, ShoppingCart, Split } from 'lucide-react';
import { supabase } from '@/lib/database/shared/supabase';
import { toast } from 'sonner';
import { VentaFraccionada } from './VentaFraccionada';

interface StockItem {
  id: string;
  codigo_item: string;
  nombre: string;
  marca: string;
  modelo: string;
  cajas_completas: number;
  unidades_sueltas: number;
  unidades_por_paquete: number;
  permite_fraccionamiento: boolean;
  unidades_totales: number;
  stock_formato_legible: string;
  estado: string;
  estado_caja: string;
  badge_estado_caja: string;
  precio: number;
  moneda: string;
  cantidad_minima: number;
}

export const StockFraccionadoView: React.FC = () => {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [itemSeleccionado, setItemSeleccionado] = useState<string | null>(null);
  const [mostrarModalVenta, setMostrarModalVenta] = useState(false);
  const [mostrarModalFraccionar, setMostrarModalFraccionar] = useState(false);
  const [itemParaFraccionar, setItemParaFraccionar] = useState<StockItem | null>(null);

  useEffect(() => {
    cargarStock();
  }, []);

  const cargarStock = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('v_stock_disponible_fraccionado')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error cargando stock:', error);
      toast.error('Error al cargar el stock');
    } finally {
      setLoading(false);
    }
  };

  const abrirCaja = async (item: StockItem) => {
    if (!item.permite_fraccionamiento) {
      toast.error('Este producto no permite fraccionamiento');
      return;
    }

    if (item.cajas_completas <= 0) {
      toast.error('No hay cajas disponibles para abrir');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('abrir_caja_para_fraccionamiento', {
        p_stock_item_id: item.id,
        p_usuario: 'Usuario Actual', // Obtener del contexto
        p_motivo: 'Apertura manual desde inventario'
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message || 'Caja abierta exitosamente');
        cargarStock();
      } else {
        throw new Error(data?.error || 'Error al abrir la caja');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al abrir la caja');
    }
  };

  const itemsFiltrados = items.filter(item => {
    // Filtro por búsqueda
    const coincideBusqueda = busqueda === '' || 
      item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.codigo_item.toLowerCase().includes(busqueda.toLowerCase());

    // Filtro por tipo
    let coincideFiltro = true;
    switch (filtro) {
      case 'fraccionables':
        coincideFiltro = item.permite_fraccionamiento;
        break;
      case 'con_cajas':
        coincideFiltro = item.cajas_completas > 0;
        break;
      case 'con_sueltas':
        coincideFiltro = item.unidades_sueltas > 0;
        break;
      case 'bajo_stock':
        coincideFiltro = item.unidades_totales <= (item.cantidad_minima || 5);
        break;
    }

    return coincideBusqueda && coincideFiltro;
  });

  const getEstadoColor = (item: StockItem) => {
    if (item.unidades_totales === 0) return 'text-red-600 bg-red-50';
    if (item.unidades_totales <= (item.cantidad_minima || 5)) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getEstadoIcono = (item: StockItem) => {
    if (item.unidades_totales === 0) return <AlertTriangle className="h-4 w-4" />;
    if (item.unidades_totales <= (item.cantidad_minima || 5)) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="p-6">
      {/* Header y Filtros */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Inventario con Fraccionamiento</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Filtros */}
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos los productos</option>
            <option value="fraccionables">Solo fraccionables</option>
            <option value="con_cajas">Con cajas completas</option>
            <option value="con_sueltas">Con unidades sueltas</option>
            <option value="bajo_stock">Stock bajo</option>
          </select>

          {/* Botón refrescar */}
          <button
            onClick={cargarStock}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Productos</div>
          <div className="text-2xl font-bold text-gray-800">{items.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Productos Fraccionables</div>
          <div className="text-2xl font-bold text-blue-600">
            {items.filter(i => i.permite_fraccionamiento).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Con Unidades Sueltas</div>
          <div className="text-2xl font-bold text-green-600">
            {items.filter(i => i.unidades_sueltas > 0).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Stock Bajo</div>
          <div className="text-2xl font-bold text-yellow-600">
            {items.filter(i => i.unidades_totales <= (i.cantidad_minima || 5)).length}
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : itemsFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron productos</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fraccionamiento
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {itemsFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.nombre}</div>
                        <div className="text-xs text-gray-500">
                          {item.marca} - {item.modelo}
                        </div>
                        <div className="text-xs text-gray-400">
                          Código: {item.codigo_item}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {item.permite_fraccionamiento ? (
                          <>
                            {/* Badge de Estado de Caja */}
                            <div className="mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.estado_caja === 'cajas_completas' ? 'bg-blue-100 text-blue-800' :
                                item.estado_caja === 'caja_abierta' ? 'bg-orange-100 text-orange-800' :
                                item.estado_caja === 'solo_unidades' ? 'bg-green-100 text-green-800' :
                                item.estado_caja === 'sin_stock' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {item.badge_estado_caja}
                              </span>
                            </div>
                            
                            {/* Detalles del Stock */}
                            <div className="flex items-center text-sm">
                              <Box className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-700">{item.cajas_completas} cajas</span>
                              {item.unidades_por_paquete > 1 && (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({item.unidades_por_paquete} u/caja)
                                </span>
                              )}
                            </div>
                            {item.unidades_sueltas > 0 && (
                              <div className="flex items-center text-sm">
                                <Package className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-gray-700">{item.unidades_sueltas} sueltas</span>
                              </div>
                            )}
                            <div className="text-sm font-semibold text-blue-600">
                              Total: {item.unidades_totales} unidades
                            </div>
                            
                            {/* Descripción legible */}
                            <div className="text-xs text-gray-500 italic">
                              {item.stock_formato_legible}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm font-medium text-gray-700">
                            {item.stock_formato_legible}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.permite_fraccionamiento ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Split className="h-3 w-3 mr-1" />
                          Fraccionable
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          No fraccionable
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(item)}`}>
                        {getEstadoIcono(item)}
                        {item.unidades_totales === 0 ? 'Sin stock' : 
                         item.unidades_totales <= (item.cantidad_minima || 5) ? 'Stock bajo' : 
                         'Disponible'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Botón Ver Detalles */}
                        <button
                          onClick={() => {
                            setItemSeleccionado(item.id);
                            // Aquí podrías abrir un modal con detalles
                          }}
                          className="text-gray-600 hover:text-gray-900"
                          title="Ver detalles"
                        >
                          <Eye className="h-5 w-5" />
                        </button>

                        {/* Botón Vender */}
                        {item.unidades_totales > 0 && (
                          <button
                            onClick={() => {
                              setItemSeleccionado(item.id);
                              setMostrarModalVenta(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Vender"
                          >
                            <ShoppingCart className="h-5 w-5" />
                          </button>
                        )}

                        {/* Botón Abrir Caja */}
                        {item.permite_fraccionamiento && item.cajas_completas > 0 && (
                          <button
                            onClick={() => {
                              setItemParaFraccionar(item);
                              setMostrarModalFraccionar(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Abrir caja"
                          >
                            <Split className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Venta */}
      {mostrarModalVenta && itemSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-2xl w-full mx-4">
            <VentaFraccionada
              stockItemId={itemSeleccionado}
              onSuccess={() => {
                setMostrarModalVenta(false);
                setItemSeleccionado(null);
                cargarStock();
              }}
              onCancel={() => {
                setMostrarModalVenta(false);
                setItemSeleccionado(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Abrir Caja */}
      {mostrarModalFraccionar && itemParaFraccionar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar Apertura de Caja</h3>
            <p className="text-gray-600 mb-4">
              ¿Desea abrir una caja de <strong>{itemParaFraccionar.nombre}</strong>?
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">
                Esta acción convertirá 1 caja en {itemParaFraccionar.unidades_por_paquete} unidades sueltas.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Stock actual: {itemParaFraccionar.cajas_completas} cajas + {itemParaFraccionar.unidades_sueltas} unidades sueltas
              </p>
              <p className="text-sm font-semibold text-blue-700 mt-2">
                Stock después: {itemParaFraccionar.cajas_completas - 1} cajas + {itemParaFraccionar.unidades_sueltas + itemParaFraccionar.unidades_por_paquete} unidades sueltas
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setMostrarModalFraccionar(false);
                  setItemParaFraccionar(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  abrirCaja(itemParaFraccionar);
                  setMostrarModalFraccionar(false);
                  setItemParaFraccionar(null);
                }}
                className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Confirmar Apertura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
