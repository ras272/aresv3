'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Edit, 
  DollarSign,
  Package,
  TrendingUp
} from 'lucide-react';
import { PricingDefinitionForm } from '@/components/definicion-precios/PricingDefinitionForm';
import { PricingHistory } from '@/components/definicion-precios/PricingHistory';
import { supabase } from '@/lib/database/shared/supabase';
import { formatearPrecio } from '@/lib/utils/pricing-calculations';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

interface ProductoPrecio {
  id: string;
  marca: string;
  nombre: string;
  precio_final_lista: number;
  moneda_base: string;
  updated_at: string;
}

export default function DefinicionPreciosPage() {
  const [productos, setProductos] = useState<ProductoPrecio[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<ProductoPrecio[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducto, setSelectedProducto] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { catalogoProductos, loadCatalogoProductos } = useAppStore();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filtrar productos basados en el término de búsqueda
    const filtered = productos.filter(producto => 
      producto.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProductos(filtered);
  }, [searchTerm, productos]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar productos con información de precios
      const { data, error } = await supabase
        .from('catalogo_productos')
        .select('id, marca, nombre, precio_final_lista, moneda_base, updated_at')
        .eq('activo', true)
        .order('marca', { ascending: true })
        .order('nombre', { ascending: true });

      if (error) throw error;
      
      setProductos(data || []);
      setFilteredProductos(data || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPricing = async (productoId: string) => {
    try {
      const { data, error } = await supabase
        .from('catalogo_productos')
        .select('*')
        .eq('id', productoId)
        .single();

      if (error) throw error;
      
      setSelectedProducto(data);
      setIsEditing(true);
    } catch (error) {
      console.error('Error cargando producto:', error);
      toast.error('Error al cargar el producto');
    }
  };

  const handleSavePricing = async (updatedProducto: any) => {
    try {
      // Actualizar la lista de productos
      const updatedProductos = productos.map(p => 
        p.id === updatedProducto.id ? {
          ...p,
          precio_final_lista: updatedProducto.precio_final_lista,
          moneda_base: updatedProducto.moneda_base,
          updated_at: updatedProducto.updated_at
        } : p
      );
      
      setProductos(updatedProductos);
      setSelectedProducto(updatedProducto);
      setIsEditing(false);
      
      toast.success('Precios actualizados correctamente');
      
      // Recargar catálogo en el store
      await loadCatalogoProductos();
    } catch (error) {
      console.error('Error guardando precios:', error);
      toast.error('Error al guardar los precios');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedProducto(null);
  };

  if (isEditing && selectedProducto) {
    return (
      <DashboardLayout title="Definición de Precios" subtitle="Configuración de costos y precios de productos">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Definición de Precios</h1>
              <p className="text-gray-600">
                Configuración de precios para {selectedProducto.marca} - {selectedProducto.nombre}
              </p>
            </div>
            <Button variant="outline" onClick={handleCancelEdit}>
              ← Volver al listado
            </Button>
          </div>
          
          <PricingDefinitionForm 
            producto={selectedProducto} 
            onSave={handleSavePricing} 
          />
          
          <PricingHistory productoId={selectedProducto.id} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Definición de Precios" subtitle="Gestión de costos y precios de productos">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Definición de Precios</h1>
            <p className="text-gray-600">
              Gestión de costos y precios de productos
            </p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar productos..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProductos.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron productos</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay productos registrados en el catálogo'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProductos.map((producto) => (
                    <Card key={producto.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{producto.marca}</h3>
                            <p className="text-sm text-gray-600 truncate">{producto.nombre}</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditPricing(producto.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Precio Final</span>
                            <span className="font-semibold">
                              {producto.precio_final_lista ? (
                                formatearPrecio(producto.precio_final_lista, producto.moneda_base)
                              ) : (
                                <span className="text-gray-400">Sin definir</span>
                              )}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Última actualización</span>
                            <span className="text-gray-500">
                              {new Date(producto.updated_at).toLocaleDateString('es-PY')}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}