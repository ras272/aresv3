'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Tag,
  ShoppingCart,
  Building2,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/database/shared/supabase';

interface ProductoCatalogo {
  id: string;
  marca: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductosPorMarca {
  [marca: string]: ProductoCatalogo[];
}

export default function CatalogoProductosPage() {
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [productosPorMarca, setProductosPorMarca] = useState<ProductosPorMarca>({});
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // Estado para carpetas expandidas/colapsadas
  const [carpetasAbiertas, setCarpetasAbiertas] = useState<Set<string>>(new Set());
  
  // Estados para modales
  const [modalProductoOpen, setModalProductoOpen] = useState(false);
  const [modalMarcaOpen, setModalMarcaOpen] = useState(false);
  const [productoEditando, setProductoEditando] = useState<ProductoCatalogo | null>(null);
  
  // Estados para formularios
  const [formProducto, setFormProducto] = useState({
    marca: '',
    nombre: '',
    descripcion: ''
  });
  const [nuevaMarca, setNuevaMarca] = useState('');

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    organizarProductosPorMarca();
  }, [productos, busqueda]);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('catalogo_productos')
        .select('*')
        .eq('activo', true)
        .order('marca', { ascending: true })
        .order('nombre', { ascending: true });

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error al cargar el catálogo de productos');
    } finally {
      setLoading(false);
    }
  };

  const organizarProductosPorMarca = () => {
    const productosFiltrados = productos.filter(producto =>
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const agrupados = productosFiltrados.reduce((acc, producto) => {
      if (!acc[producto.marca]) {
        acc[producto.marca] = [];
      }
      acc[producto.marca].push(producto);
      return acc;
    }, {} as ProductosPorMarca);

    setProductosPorMarca(agrupados);
  };

  const abrirModalProducto = (marca?: string, producto?: ProductoCatalogo) => {
    if (producto) {
      setProductoEditando(producto);
      setFormProducto({
        marca: producto.marca,
        nombre: producto.nombre,
        descripcion: producto.descripcion || ''
      });
    } else {
      setProductoEditando(null);
      setFormProducto({
        marca: marca || '',
        nombre: '',
        descripcion: ''
      });
    }
    setModalProductoOpen(true);
  };

  const guardarProducto = async () => {
    if (!formProducto.marca.trim() || !formProducto.nombre.trim()) {
      toast.error('Marca y nombre son obligatorios');
      return;
    }

    try {
      if (productoEditando) {
        // Actualizar producto existente
        const { error } = await supabase
          .from('catalogo_productos')
          .update({
            marca: formProducto.marca.trim(),
            nombre: formProducto.nombre.trim(),
            descripcion: formProducto.descripcion.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', productoEditando.id);

        if (error) throw error;
        toast.success('Producto actualizado exitosamente');
      } else {
        // Crear nuevo producto
        const { error } = await supabase
          .from('catalogo_productos')
          .insert({
            marca: formProducto.marca.trim(),
            nombre: formProducto.nombre.trim(),
            descripcion: formProducto.descripcion.trim() || null
          });

        if (error) {
          if (error.code === '23505') {
            toast.error('Ya existe un producto con ese nombre en esta marca');
            return;
          }
          throw error;
        }
        toast.success('Producto agregado exitosamente');
      }

      setModalProductoOpen(false);
      cargarProductos();
    } catch (error) {
      console.error('Error guardando producto:', error);
      toast.error('Error al guardar el producto');
    }
  };

  const eliminarProducto = async (producto: ProductoCatalogo) => {
    if (!confirm(`¿Estás seguro de eliminar "${producto.nombre}" de ${producto.marca}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('catalogo_productos')
        .update({ activo: false })
        .eq('id', producto.id);

      if (error) throw error;
      toast.success('Producto eliminado exitosamente');
      cargarProductos();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const toggleCarpeta = (marca: string) => {
    const nuevasCarpetas = new Set(carpetasAbiertas);
    if (nuevasCarpetas.has(marca)) {
      nuevasCarpetas.delete(marca);
    } else {
      nuevasCarpetas.add(marca);
    }
    setCarpetasAbiertas(nuevasCarpetas);
  };

  const crearNuevaMarca = async () => {
    if (!nuevaMarca.trim()) {
      toast.error('El nombre de la marca es obligatorio');
      return;
    }

    // Verificar si la marca ya existe
    const marcaExiste = Object.keys(productosPorMarca).some(
      marca => marca.toLowerCase() === nuevaMarca.toLowerCase()
    );

    if (marcaExiste) {
      toast.error('Esta marca ya existe');
      return;
    }

    setModalMarcaOpen(false);
    setNuevaMarca('');
    abrirModalProducto(nuevaMarca);
  };

  const marcas = Object.keys(productosPorMarca).sort();
  const totalProductos = productos.length;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mx-4 mt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
                  <Package className="w-8 h-8 text-blue-500" />
                  Catálogo de Productos
                </h1>
                <p className="text-gray-600 mt-2">
                  Gestiona el catálogo maestro de productos organizados por marca
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setModalMarcaOpen(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Nueva Marca
                </Button>
                <Button
                  onClick={() => abrirModalProducto()}
                  className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Producto
                </Button>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{totalProductos}</div>
                <div className="text-blue-800 text-sm">Total Productos</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-600">{marcas.length}</div>
                <div className="text-green-800 text-sm">Marcas Activas</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">
                  {marcas.length > 0 ? Math.round(totalProductos / marcas.length) : 0}
                </div>
                <div className="text-purple-800 text-sm">Promedio por Marca</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Búsqueda */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar productos o marcas..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de productos por marca */}
          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="h-16 bg-gray-100 rounded"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : marcas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {busqueda ? 'No se encontraron productos' : 'No hay productos en el catálogo'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {busqueda 
                    ? 'Intenta ajustar tu búsqueda'
                    : 'Comienza agregando productos al catálogo'
                  }
                </p>
                {!busqueda && (
                  <Button onClick={() => abrirModalProducto()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Producto
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {marcas.map((marca) => {
                const estaAbierta = carpetasAbiertas.has(marca);
                
                return (
                  <motion.div
                    key={marca}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-sm border"
                  >
                    <div 
                      className="flex items-center justify-between p-6 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleCarpeta(marca)}
                    >
                      <div className="flex items-center gap-3">
                        {estaAbierta ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                        <Tag className="w-5 h-5 text-blue-500" />
                        <h2 className="text-xl font-semibold text-gray-900">{marca}</h2>
                        <Badge variant="outline" className="ml-2">
                          {productosPorMarca[marca].length} productos
                        </Badge>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirModalProducto(marca);
                        }}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar Producto
                      </Button>
                    </div>
                    
                    <AnimatePresence>
                      {estaAbierta && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6">
                            <div className="grid gap-4">
                              {productosPorMarca[marca].map((producto) => (
                                <motion.div
                                  key={producto.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                                >
                                  <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">{producto.nombre}</h3>
                                    {producto.descripcion && (
                                      <p className="text-sm text-gray-600 mt-1">{producto.descripcion}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                      Creado: {new Date(producto.created_at).toLocaleDateString('es-PY')}
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Button
                                      onClick={() => abrirModalProducto(marca, producto)}
                                      size="sm"
                                      variant="ghost"
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      onClick={() => eliminarProducto(producto)}
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal para agregar/editar producto */}
        <Dialog open={modalProductoOpen} onOpenChange={setModalProductoOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="marca">Marca *</Label>
                <Input
                  id="marca"
                  value={formProducto.marca}
                  onChange={(e) => setFormProducto(prev => ({ ...prev, marca: e.target.value }))}
                  placeholder="Ej: Hydrafacial, Intermedic..."
                />
              </div>
              
              <div>
                <Label htmlFor="nombre">Nombre del Producto *</Label>
                <Input
                  id="nombre"
                  value={formProducto.nombre}
                  onChange={(e) => setFormProducto(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Britenol, Kit Hydra..."
                />
              </div>
              
              <div>
                <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                <Textarea
                  id="descripcion"
                  value={formProducto.descripcion}
                  onChange={(e) => setFormProducto(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción adicional del producto..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setModalProductoOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={guardarProducto}>
                {productoEditando ? 'Actualizar' : 'Crear'} Producto
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para nueva marca */}
        <Dialog open={modalMarcaOpen} onOpenChange={setModalMarcaOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Nueva Marca
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="nuevaMarca">Nombre de la Marca *</Label>
                <Input
                  id="nuevaMarca"
                  value={nuevaMarca}
                  onChange={(e) => setNuevaMarca(e.target.value)}
                  placeholder="Ej: Hydrafacial, Intermedic..."
                  onKeyPress={(e) => e.key === 'Enter' && crearNuevaMarca()}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setModalMarcaOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={crearNuevaMarca}>
                Crear Marca
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}