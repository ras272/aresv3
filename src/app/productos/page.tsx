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
  ChevronDown,
  DollarSign,
  Coins
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/database/shared/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProductoCatalogo {
  id: string;
  marca: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  codigo_producto?: string;
  precio: number;
  moneda: 'USD' | 'GS';
  precio_minimo?: number;
  precio_maximo?: number;
  margen_utilidad?: number;
  disponible_para_venta: boolean;
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
    descripcion: '',
    categoria: '',
    codigoProducto: '',
    precio: '',
    moneda: 'USD' as 'USD' | 'GS',
    precioMinimo: '',
    precioMaximo: '',
    margenUtilidad: '',
    disponibleParaVenta: true
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
        descripcion: producto.descripcion || '',
        categoria: producto.categoria || '',
        codigoProducto: producto.codigo_producto || '',
        precio: producto.precio.toString(),
        moneda: producto.moneda,
        precioMinimo: producto.precio_minimo?.toString() || '',
        precioMaximo: producto.precio_maximo?.toString() || '',
        margenUtilidad: producto.margen_utilidad?.toString() || '',
        disponibleParaVenta: producto.disponible_para_venta
      });
    } else {
      setProductoEditando(null);
      setFormProducto({
        marca: marca || '',
        nombre: '',
        descripcion: '',
        categoria: '',
        codigoProducto: '',
        precio: '',
        moneda: 'USD',
        precioMinimo: '',
        precioMaximo: '',
        margenUtilidad: '',
        disponibleParaVenta: true
      });
    }
    setModalProductoOpen(true);
  };

  const guardarProducto = async () => {
    if (!formProducto.marca.trim() || !formProducto.nombre.trim() || !formProducto.precio.trim()) {
      toast.error('Marca, nombre y precio son obligatorios');
      return;
    }

    const precio = parseFloat(formProducto.precio);
    if (isNaN(precio) || precio <= 0) {
      toast.error('El precio debe ser un número válido mayor a 0');
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
            categoria: formProducto.categoria.trim() || null,
            codigo_producto: formProducto.codigoProducto.trim() || null,
            precio: precio,
            moneda: formProducto.moneda,
            precio_minimo: formProducto.precioMinimo ? parseFloat(formProducto.precioMinimo) : null,
            precio_maximo: formProducto.precioMaximo ? parseFloat(formProducto.precioMaximo) : null,
            margen_utilidad: formProducto.margenUtilidad ? parseFloat(formProducto.margenUtilidad) : null,
            disponible_para_venta: formProducto.disponibleParaVenta,
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
            descripcion: formProducto.descripcion.trim() || null,
            categoria: formProducto.categoria.trim() || null,
            codigo_producto: formProducto.codigoProducto.trim() || null,
            precio: precio,
            moneda: formProducto.moneda,
            precio_minimo: formProducto.precioMinimo ? parseFloat(formProducto.precioMinimo) : null,
            precio_maximo: formProducto.precioMaximo ? parseFloat(formProducto.precioMaximo) : null,
            margen_utilidad: formProducto.margenUtilidad ? parseFloat(formProducto.margenUtilidad) : null,
            disponible_para_venta: formProducto.disponibleParaVenta,
            activo: true
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
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-medium text-gray-900">{producto.nombre}</h3>
                                      <div className="flex items-center gap-1 text-sm font-semibold">
                                        {producto.moneda === 'USD' ? (
                                          <div className="flex items-center gap-1 text-green-600">
                                            <DollarSign className="w-4 h-4" />
                                            <span>{producto.precio.toLocaleString('es-PY')}</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1 text-blue-600">
                                            <Coins className="w-4 h-4" />
                                            <span>₲ {producto.precio.toLocaleString('es-PY')}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {producto.descripcion && (
                                      <p className="text-sm text-gray-600 mt-1">{producto.descripcion}</p>
                                    )}
                                    {producto.categoria && (
                                      <p className="text-xs text-purple-600 mt-1">Categoría: {producto.categoria}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-1">
                                      <p className="text-xs text-gray-400">
                                        Creado: {new Date(producto.created_at).toLocaleDateString('es-PY')}
                                      </p>
                                      {producto.codigo_producto && (
                                        <p className="text-xs text-gray-500">Código: {producto.codigo_producto}</p>
                                      )}
                                      <Badge 
                                        variant={producto.disponible_para_venta ? "default" : "secondary"}
                                        className="text-xs"
                                      >
                                        {producto.disponible_para_venta ? 'Disponible' : 'No disponible'}
                                      </Badge>
                                    </div>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="categoria">Categoría</Label>
                  <Input
                    id="categoria"
                    value={formProducto.categoria}
                    onChange={(e) => setFormProducto(prev => ({ ...prev, categoria: e.target.value }))}
                    placeholder="Ej: Insumo, Repuesto..."
                  />
                </div>
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
                <Label htmlFor="codigoProducto">Código de Producto</Label>
                <Input
                  id="codigoProducto"
                  value={formProducto.codigoProducto}
                  onChange={(e) => setFormProducto(prev => ({ ...prev, codigoProducto: e.target.value }))}
                  placeholder="Código interno o SKU"
                />
              </div>
              
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formProducto.descripcion}
                  onChange={(e) => setFormProducto(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción adicional del producto..."
                  rows={3}
                />
              </div>

              {/* Información de precios */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Información de Precios
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="precio">Precio *</Label>
                    <Input
                      id="precio"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formProducto.precio}
                      onChange={(e) => setFormProducto(prev => ({ ...prev, precio: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="moneda">Moneda *</Label>
                    <Select
                      value={formProducto.moneda}
                      onValueChange={(value: 'USD' | 'GS') => setFormProducto(prev => ({ ...prev, moneda: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            USD - Dólares
                          </div>
                        </SelectItem>
                        <SelectItem value="GS">
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-blue-600" />
                            GS - Guaraníes
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="precioMinimo">Precio Mínimo</Label>
                    <Input
                      id="precioMinimo"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formProducto.precioMinimo}
                      onChange={(e) => setFormProducto(prev => ({ ...prev, precioMinimo: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="precioMaximo">Precio Máximo</Label>
                    <Input
                      id="precioMaximo"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formProducto.precioMaximo}
                      onChange={(e) => setFormProducto(prev => ({ ...prev, precioMaximo: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="margenUtilidad">Margen de Utilidad (%)</Label>
                  <Input
                    id="margenUtilidad"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formProducto.margenUtilidad}
                    onChange={(e) => setFormProducto(prev => ({ ...prev, margenUtilidad: e.target.value }))}
                    placeholder="Ej: 15.50"
                  />
                </div>
              </div>

              {/* Configuración adicional */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Configuración</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="disponibleParaVenta"
                    checked={formProducto.disponibleParaVenta}
                    onChange={(e) => setFormProducto(prev => ({ ...prev, disponibleParaVenta: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="disponibleParaVenta">Disponible para venta</Label>
                </div>
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