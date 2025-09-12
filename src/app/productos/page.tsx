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
import { PreciosDuales } from '@/components/productos/PreciosDuales';
import { formatearPrecio } from '@/lib/utils/precios';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/database/shared/supabase';
import { CatalogoProducto } from '@/types';
import useAppStore from '@/store/useAppStore';

interface ProductosPorMarca {
  [marca: string]: CatalogoProducto[];
}

export default function CatalogoProductosPage() {
  const { 
    catalogoProductos, 
    loadCatalogoProductos, 
    addCatalogoProducto, 
    updateCatalogoProducto,
    deleteCatalogoProducto 
  } = useAppStore();
  
  const [productosPorMarca, setProductosPorMarca] = useState<ProductosPorMarca>({});
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // Estado para carpetas expandidas/colapsadas
  const [carpetasAbiertas, setCarpetasAbiertas] = useState<Set<string>>(new Set());
  
  // Estados para modales
  const [modalProductoOpen, setModalProductoOpen] = useState(false);
  const [modalMarcaOpen, setModalMarcaOpen] = useState(false);
  const [productoEditando, setProductoEditando] = useState<CatalogoProducto | null>(null);
  const [contextoRepuestos, setContextoRepuestos] = useState(false); // 🔧 NUEVO: Controlar contexto de repuestos
  
  // Estados para formularios
  const [formProducto, setFormProducto] = useState<Partial<CatalogoProducto>>({
    marca: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    codigoProducto: '',
    precio: 0,
    moneda: 'USD',
    disponibleParaVenta: true,
    activo: true,
    // Nuevos campos de precios duales
    permiteFraccionamiento: false,
    unidadesPorCaja: 1,
    precioPorCaja: 0,
    precioPorUnidad: 0,
    monedaCaja: 'USD',
    monedaUnidad: 'USD'
  });
  const [nuevaMarca, setNuevaMarca] = useState('');

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    organizarProductosPorMarca();
  }, [catalogoProductos, busqueda]);

  // 🔧 NUEVO: Detectar parámetros URL para contexto de repuestos
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const contexto = urlParams.get('contexto');
    const marca = urlParams.get('marca');
    const nombre = urlParams.get('nombre');
    
    if (contexto && marca) {
      console.log(`🔧 Detectado contexto "${contexto}" desde URL:`, { marca, nombre });
      
      // Determinar categoría según el contexto
      let categoriaDefecto = '';
      let esContextoEspecifico = false;
      
      switch (contexto) {
        case 'repuestos':
          categoriaDefecto = 'Repuesto';
          esContextoEspecifico = true;
          break;
        case 'insumos':
          categoriaDefecto = 'Insumo';
          esContextoEspecifico = true;
          break;
        case 'equipos':
          categoriaDefecto = 'Equipo Médico';
          esContextoEspecifico = true;
          break;
        default:
          break;
      }
      
      // Abrir modal automáticamente con datos precompletados
      setTimeout(() => {
        abrirModalProducto(marca, undefined, esContextoEspecifico);
        if (nombre) {
          setFormProducto(prev => ({ 
            ...prev, 
            nombre: decodeURIComponent(nombre),
            categoria: categoriaDefecto
          }));
        }
      }, 500); // Pequeña demora para que se carguen los datos
    }
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      await loadCatalogoProductos();
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error al cargar el catálogo de productos');
    } finally {
      setLoading(false);
    }
  };

  const organizarProductosPorMarca = () => {
    const productosFiltrados = catalogoProductos.filter(producto =>
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

  // Función para generar código automático de producto
  const generarCodigoProducto = (marca: string, nombre: string) => {
    const marcaLimpia = marca.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3);
    const nombreLimpio = nombre.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3);
    const timestamp = Date.now().toString().substring(-4); // Últimos 4 dígitos
    return `${marcaLimpia}${nombreLimpio}${timestamp}`;
  };

  const abrirModalProducto = (marca?: string, producto?: CatalogoProducto, contextoEspecifico?: boolean) => {
    // 🔧 NUEVO: Determinar categoría según el contexto URL
    let categoriaDefecto = '';
    
    if (contextoEspecifico) {
      const urlParams = new URLSearchParams(window.location.search);
      const contexto = urlParams.get('contexto');
      
      switch (contexto) {
        case 'repuestos':
          categoriaDefecto = 'Repuesto';
          setContextoRepuestos(true);
          break;
        case 'insumos':
          categoriaDefecto = 'Insumo';
          setContextoRepuestos(false);
          break;
        case 'equipos':
          categoriaDefecto = 'Equipo Médico';
          setContextoRepuestos(false);
          break;
        default:
          setContextoRepuestos(false);
          break;
      }
    } else {
      setContextoRepuestos(false);
    }
    
    if (producto) {
      setProductoEditando(producto);
      setFormProducto({
        marca: producto.marca,
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        categoria: producto.categoria || '',
        codigoProducto: producto.codigoProducto || '',
        precio: producto.precio || 0,
        moneda: producto.moneda || 'USD',
        disponibleParaVenta: producto.disponibleParaVenta || true,
        activo: producto.activo || true,
        // Campos de precios duales
        permiteFraccionamiento: producto.permiteFraccionamiento || false,
        unidadesPorCaja: producto.unidadesPorCaja || 1,
        precioPorCaja: producto.precioPorCaja || 0,
        precioPorUnidad: producto.precioPorUnidad || 0,
        monedaCaja: producto.monedaCaja || 'USD',
        monedaUnidad: producto.monedaUnidad || 'USD'
      });
    } else {
      setProductoEditando(null);
      setFormProducto({
        marca: marca || '',
        nombre: '',
        descripcion: '',
        categoria: categoriaDefecto, // 🔧 NUEVO: Pre-configurar categoría según contexto
        codigoProducto: '',
        precio: 0,
        moneda: 'USD',
        disponibleParaVenta: true,
        activo: true,
        permiteFraccionamiento: false,
        unidadesPorCaja: 1,
        precioPorCaja: 0,
        precioPorUnidad: 0,
        monedaCaja: 'USD',
        monedaUnidad: 'USD'
      });
    }
    setModalProductoOpen(true);
  };

  const guardarProducto = async () => {
    if (!formProducto.marca?.trim() || !formProducto.nombre?.trim()) {
      toast.error('Marca y nombre son obligatorios');
      return;
    }

    // Validar código de producto único si se proporciona
    if (formProducto.codigoProducto?.trim()) {
      const codigoExiste = catalogoProductos.some(p => 
        p.codigoProducto === formProducto.codigoProducto?.trim() && 
        p.id !== productoEditando?.id
      );
      if (codigoExiste) {
        toast.error(`El código "${formProducto.codigoProducto}" ya está en uso. Usa un código diferente.`);
        return;
      }
    }

    // Validar precios: debe tener al menos un precio configurado
    const tienePrecioCaja = formProducto.precioPorCaja && formProducto.precioPorCaja > 0;
    const tienePrecioUnidad = formProducto.precioPorUnidad && formProducto.precioPorUnidad > 0;
    const tienePrecioLegacy = formProducto.precio && formProducto.precio > 0;
    
    if (!tienePrecioCaja && !tienePrecioUnidad && !tienePrecioLegacy) {
      toast.error('Debe configurar al menos un precio válido (por caja, por unidad, o precio general)');
      return;
    }

    try {
      console.log('🔄 Preparando datos del producto:', formProducto);
      
      // Generar código automático si no se proporciona uno
      let codigoProducto = formProducto.codigoProducto?.trim();
      if (!codigoProducto) {
        codigoProducto = generarCodigoProducto(formProducto.marca!.trim(), formProducto.nombre!.trim());
        console.log('🏷️ Código generado automáticamente:', codigoProducto);
      }
      
      // Sincronizar precio legacy: usar precio por caja como principal, luego por unidad
      let precioLegacy = formProducto.precio || 0;
      let monedaLegacy = formProducto.moneda || 'USD';
      
      if (tienePrecioCaja) {
        precioLegacy = formProducto.precioPorCaja!;
        monedaLegacy = formProducto.monedaCaja || 'USD';
      } else if (tienePrecioUnidad) {
        precioLegacy = formProducto.precioPorUnidad!;
        monedaLegacy = formProducto.monedaUnidad || 'USD';
      }
      
      const productoData: Omit<CatalogoProducto, 'id' | 'createdAt' | 'updatedAt'> = {
        marca: formProducto.marca.trim(),
        nombre: formProducto.nombre.trim(),
        descripcion: formProducto.descripcion?.trim(),
        categoria: formProducto.categoria?.trim(),
        codigoProducto: codigoProducto,
        precio: precioLegacy, // Sincronizado con precios duales
        moneda: monedaLegacy,
        
        // Precios duales
        precioPorCaja: formProducto.precioPorCaja,
        precioPorUnidad: formProducto.precioPorUnidad,
        monedaCaja: formProducto.monedaCaja,
        monedaUnidad: formProducto.monedaUnidad,
        
        // Fraccionamiento
        permiteFraccionamiento: formProducto.permiteFraccionamiento || false,
        unidadesPorCaja: formProducto.unidadesPorCaja || 1,
        
        // Configuración
        disponibleParaVenta: formProducto.disponibleParaVenta || true,
        activo: formProducto.activo || true
      };
      
      console.log('📦 Datos preparados para guardar:', productoData);

      if (productoEditando) {
        console.log('🔄 Actualizando producto existente:', productoEditando.id);
        
        // 🔍 Detectar cambios importantes para mostrar toast apropiado
        const huboCambiosImportantes = 
          formProducto.nombre !== productoEditando.nombre ||
          formProducto.marca !== productoEditando.marca;
          
        if (huboCambiosImportantes) {
          // Toast especial para cambios que activan sincronización
          toast.loading('Actualizando producto y sincronizando en todas las tablas...', {
            id: 'sync-toast',
            duration: Infinity // Se cierra manualmente
          });
        }
        
        await updateCatalogoProducto(productoEditando.id, productoData);
        
        if (huboCambiosImportantes) {
          toast.success('✅ Producto actualizado y sincronizado en todo el sistema', {
            id: 'sync-toast',
            description: 'Los cambios se han aplicado automáticamente al stock, remisiones y todas las demás tablas relacionadas.',
            duration: 6000
          });
        } else {
          toast.success('Producto actualizado exitosamente');
        }
      } else {
        console.log('🆕 Creando nuevo producto');
        await addCatalogoProducto(productoData);
        
        if (contextoEspecifico) {
          // 🔧 NUEVO: Mensajes dinámicos según el contexto
          const urlParams = new URLSearchParams(window.location.search);
          const contexto = urlParams.get('contexto');
          
          let mensaje = '';
          
          switch (contexto) {
            case 'repuestos':
              mensaje = '🔧 Repuesto agregado al catálogo exitosamente';
              break;
            case 'insumos':
              mensaje = '📦 Insumo agregado al catálogo exitosamente';
              break;
            case 'equipos':
              mensaje = '🏥 Equipo Médico agregado al catálogo exitosamente';
              break;
            default:
              mensaje = 'Producto agregado exitosamente';
              break;
          }
          
          toast.success(mensaje, {
            description: 'Ahora aparecerá en el filtrado correspondiente. Puedes regresar a la página de mercaderías y actualizar.',
            duration: 6000
          });
        } else {
          toast.success('Producto agregado exitosamente');
        }
      }

      setModalProductoOpen(false);
    } catch (error) {
      console.error('❌ Error guardando producto:', error);
      
      // Cerrar toast de loading si existe
      toast.dismiss('sync-toast');
      
      // Manejo específico de errores de base de datos
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as any).message || '';
        
        if (errorMessage.includes('duplicate key value violates unique constraint "catalogo_productos_codigo_producto_key"')) {
          toast.error('Error: El código de producto ya existe. Por favor usa un código diferente.');
        } else if (errorMessage.includes('duplicate')) {
          toast.error('Error: Ya existe un producto con esos datos. Verifica la información.');
        } else {
          toast.error(`Error al guardar el producto: ${errorMessage}`);
        }
      } else {
        toast.error('Error inesperado al guardar el producto. Inténtalo de nuevo.');
      }
    }
  };

  const eliminarProducto = async (producto: CatalogoProducto) => {
    if (!confirm(`¿Estás seguro de eliminar "${producto.nombre}" de ${producto.marca}?`)) {
      return;
    }

    try {
      await deleteCatalogoProducto(producto.id);
      toast.success('Producto eliminado exitosamente');
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
  const totalProductos = catalogoProductos.length;

  // Función para obtener el precio más relevante de un producto
  const obtenerPrecioInteligente = (producto: CatalogoProducto): { precio: number; moneda: 'USD' | 'GS'; tipo: string } => {
    // Prioridad: precio_por_caja > precio_por_unidad > precio
    if (producto.precioPorCaja && producto.precioPorCaja > 0) {
      return {
        precio: producto.precioPorCaja,
        moneda: producto.monedaCaja || 'USD',
        tipo: producto.permiteFraccionamiento ? 'por caja' : 'precio'
      };
    }
    
    if (producto.precioPorUnidad && producto.precioPorUnidad > 0) {
      return {
        precio: producto.precioPorUnidad,
        moneda: producto.monedaUnidad || 'USD',
        tipo: 'por unidad'
      };
    }
    
    if (producto.precio && producto.precio > 0) {
      return {
        precio: producto.precio,
        moneda: producto.moneda || 'USD',
        tipo: 'precio'
      };
    }
    
    return {
      precio: 0,
      moneda: 'USD',
      tipo: 'sin precio'
    };
  };

  // Función para mostrar precios múltiples
  const renderizarPrecios = (producto: CatalogoProducto) => {
    const precios = [];
    
    // Precio por caja
    if (producto.precioPorCaja && producto.precioPorCaja > 0) {
      precios.push({
        valor: producto.precioPorCaja,
        moneda: producto.monedaCaja || 'USD',
        tipo: 'Caja',
        principal: true
      });
    }
    
    // Precio por unidad (solo si permite fraccionamiento)
    if (producto.permiteFraccionamiento && producto.precioPorUnidad && producto.precioPorUnidad > 0) {
      precios.push({
        valor: producto.precioPorUnidad,
        moneda: producto.monedaUnidad || 'USD',
        tipo: 'Unidad',
        principal: false
      });
    }
    
    // Precio legacy (solo si no hay otros precios)
    if (precios.length === 0 && producto.precio && producto.precio > 0) {
      precios.push({
        valor: producto.precio,
        moneda: producto.moneda || 'USD',
        tipo: 'Precio',
        principal: true
      });
    }
    
    if (precios.length === 0) {
      return (
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <AlertTriangle className="w-4 h-4" />
          <span>Sin precio</span>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col gap-1">
        {precios.map((precio, index) => (
          <div key={index} className={`flex items-center gap-1 text-sm ${
            precio.principal ? 'font-semibold' : 'font-normal text-gray-600'
          }`}>
            {precio.moneda === 'USD' ? (
              <div className="flex items-center gap-1 text-green-600">
                <DollarSign className="w-4 h-4" />
                <span>{formatearPrecio(precio.valor, precio.moneda)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-blue-600">
                <Coins className="w-4 h-4" />
                <span>{formatearPrecio(precio.valor, precio.moneda)}</span>
              </div>
            )}
            <span className="text-xs text-gray-500">({precio.tipo})</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* 🔧 NUEVO: Banner informativo para contextos específicos */}
        {(() => {
          const urlParams = new URLSearchParams(window.location.search);
          const contexto = urlParams.get('contexto');
          
          if (contexto) {
            let mensaje = '';
            let icono = '';
            let colorClase = '';
            
            switch (contexto) {
              case 'repuestos':
                mensaje = 'Los productos creados aquí se configurarán automáticamente con categoría "Repuesto" para aparecer en el filtrado de ingreso de repuestos.';
                icono = '🔧';
                colorClase = 'orange';
                break;
              case 'insumos':
                mensaje = 'Los productos creados aquí se configurarán automáticamente con categoría "Insumo" para el flujo de insumos.';
                icono = '📦';
                colorClase = 'blue';
                break;
              case 'equipos':
                mensaje = 'Los productos creados aquí se configurarán automáticamente con categoría "Equipo Médico" para el flujo de equipos.';
                icono = '🏥';
                colorClase = 'green';
                break;
              default:
                return null;
            }
            
            return (
              <div className={`bg-${colorClase}-100 border-l-4 border-${colorClase}-500 p-4 mx-4 mt-4 rounded-r-lg`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className={`text-${colorClase}-500 text-lg`}>{icono}</span>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm text-${colorClase}-700`}>
                      <strong>Modo {contexto.charAt(0).toUpperCase() + contexto.slice(1)} Activo:</strong> {mensaje}
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}
        
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
                  onClick={() => {
                    // 🔧 NUEVO: Detectar si viene de un contexto específico desde URL
                    const urlParams = new URLSearchParams(window.location.search);
                    const contexto = urlParams.get('contexto');
                    const esContextoEspecifico = ['repuestos', 'insumos', 'equipos'].includes(contexto || '');
                    abrirModalProducto(undefined, undefined, esContextoEspecifico);
                  }}
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
                  <Button onClick={() => {
                    // 🔧 NUEVO: Detectar si viene de un contexto específico desde URL
                    const urlParams = new URLSearchParams(window.location.search);
                    const contexto = urlParams.get('contexto');
                    const esContextoEspecifico = ['repuestos', 'insumos', 'equipos'].includes(contexto || '');
                    abrirModalProducto(undefined, undefined, esContextoEspecifico);
                  }}>
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
                          // 🔧 NUEVO: Detectar si viene de un contexto específico desde URL
                          const urlParams = new URLSearchParams(window.location.search);
                          const contexto = urlParams.get('contexto');
                          const esContextoEspecifico = ['repuestos', 'insumos', 'equipos'].includes(contexto || '');
                          abrirModalProducto(marca, undefined, esContextoEspecifico);
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
                                    <div className="flex items-center gap-3 mb-1">
                                      <h3 className="font-medium text-gray-900">{producto.nombre}</h3>
                                      <div className="flex-1">
                                        {renderizarPrecios(producto)}
                                      </div>
                                    </div>
                                    {producto.descripcion && (
                                      <p className="text-sm text-gray-600 mt-1">{producto.descripcion}</p>
                                    )}
                                    {producto.categoria && (
                                      <p className="text-xs text-purple-600 mt-1">Categoría: {producto.categoria}</p>
                                    )}
                                    {producto.permiteFraccionamiento && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                          Fraccionable
                                        </Badge>
                                        {producto.unidadesPorCaja && producto.unidadesPorCaja > 1 && (
                                          <span className="text-xs text-gray-500">
                                            {producto.unidadesPorCaja} unidades/caja
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-4 mt-1">
                                      <p className="text-xs text-gray-400">
                                        Creado: {new Date(producto.createdAt).toLocaleDateString('es-PY')}
                                      </p>
                                      {producto.codigoProducto && (
                                        <p className="text-xs text-gray-500">Código: {producto.codigoProducto}</p>
                                      )}
                                      <Badge 
                                        variant={producto.disponibleParaVenta ? "default" : "secondary"}
                                        className="text-xs"
                                      >
                                        {producto.disponibleParaVenta ? 'Disponible' : 'No disponible'}
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
              {productoEditando && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">🔄 Sincronización Automática</p>
                      <p className="text-xs">
                        Si cambias el <strong>nombre</strong> o <strong>marca</strong>, 
                        los cambios se aplicarán automáticamente al stock, remisiones y todas las tablas relacionadas.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* 🔧 NUEVO: Alertas para contextos específicos */}
              {(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const contexto = urlParams.get('contexto');
                
                if (contexto && !productoEditando) {
                  let mensaje = '';
                  let categoria = '';
                  let icono = '';
                  let colorClase = '';
                  
                  switch (contexto) {
                    case 'repuestos':
                      mensaje = 'El producto se agregará con categoría "Repuesto" automáticamente. Esto permite que aparezca en el filtrado de repuestos.';
                      categoria = 'Repuesto';
                      icono = '🔧';
                      colorClase = 'orange';
                      break;
                    case 'insumos':
                      mensaje = 'El producto se agregará con categoría "Insumo" automáticamente. Esto permite que aparezca en el filtrado de insumos.';
                      categoria = 'Insumo';
                      icono = '📦';
                      colorClase = 'blue';
                      break;
                    case 'equipos':
                      mensaje = 'El producto se agregará con categoría "Equipo Médico" automáticamente. Esto permite que aparezca en el filtrado de equipos.';
                      categoria = 'Equipo Médico';
                      icono = '🏥';
                      colorClase = 'green';
                      break;
                    default:
                      return null;
                  }
                  
                  return (
                    <div className={`bg-${colorClase}-50 border border-${colorClase}-200 rounded-lg p-3 mt-2`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-4 h-4 rounded-full bg-${colorClase}-500 flex items-center justify-center mt-0.5`}>
                          <span className="text-white text-xs font-bold">{icono}</span>
                        </div>
                        <div className={`text-sm text-${colorClase}-800`}>
                          <p className="font-medium mb-1">{icono} Agregando {categoria} al Catálogo</p>
                          <p className="text-xs">
                            {mensaje}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Información básica */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información Básica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="marca">Marca *</Label>
                      <Input
                        id="marca"
                        value={formProducto.marca || ''}
                        onChange={(e) => setFormProducto(prev => ({ ...prev, marca: e.target.value }))}
                        placeholder="Ej: Hydrafacial, Intermedic..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="categoria">Categoría</Label>
                      {(() => {
                        const urlParams = new URLSearchParams(window.location.search);
                        const contexto = urlParams.get('contexto');
                        const esContextoEspecifico = ['repuestos', 'insumos', 'equipos'].includes(contexto || '');
                        
                        if (esContextoEspecifico) {
                          // 🔧 NUEVO: Select con opciones específicas para contextos
                          return (
                            <Select
                              value={formProducto.categoria || ''}
                              onValueChange={(value) => setFormProducto(prev => ({ ...prev, categoria: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Repuesto">🔧 Repuesto</SelectItem>
                                <SelectItem value="Insumo">📦 Insumo</SelectItem>
                                <SelectItem value="Equipo Médico">🏥 Equipo Médico</SelectItem>
                                <SelectItem value="Accesorio">🔌 Accesorio</SelectItem>
                                <SelectItem value="Consumible">🧀 Consumible</SelectItem>
                                <SelectItem value="Cosmético">💄 Cosmético</SelectItem>
                              </SelectContent>
                            </Select>
                          );
                        } else {
                          // Input normal para otros contextos
                          return (
                            <Input
                              id="categoria"
                              value={formProducto.categoria || ''}
                              onChange={(e) => setFormProducto(prev => ({ ...prev, categoria: e.target.value }))}
                              placeholder="Ej: Insumo, Repuesto, Equipo Médico..."
                            />
                          );
                        }
                      })()}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="nombre">Nombre del Producto *</Label>
                    <Input
                      id="nombre"
                      value={formProducto.nombre || ''}
                      onChange={(e) => setFormProducto(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Ej: Britenol, Kit Hydra..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="codigoProducto">Código de Producto</Label>
                    <div className="flex gap-2">
                      <Input
                        id="codigoProducto"
                        value={formProducto.codigoProducto || ''}
                        onChange={(e) => setFormProducto(prev => ({ ...prev, codigoProducto: e.target.value }))}
                        placeholder="Código interno o SKU (opcional)"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (formProducto.marca?.trim() && formProducto.nombre?.trim()) {
                            const nuevoCodigo = generarCodigoProducto(formProducto.marca.trim(), formProducto.nombre.trim());
                            setFormProducto(prev => ({ ...prev, codigoProducto: nuevoCodigo }));
                            toast.success(`Código generado: ${nuevoCodigo}`);
                          } else {
                            toast.error('Completa marca y nombre primero');
                          }
                        }}
                        disabled={!formProducto.marca?.trim() || !formProducto.nombre?.trim()}
                        className="whitespace-nowrap"
                      >
                        <Tag className="w-4 h-4 mr-1" />
                        Generar
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Se generará automáticamente si se deja vacío
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formProducto.descripcion || ''}
                      onChange={(e) => setFormProducto(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Descripción adicional del producto..."
                      rows={3}
                    />
                  </div>
                  
                  {/* Configuración básica */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="disponibleParaVenta"
                      checked={formProducto.disponibleParaVenta || false}
                      onChange={(e) => setFormProducto(prev => ({ ...prev, disponibleParaVenta: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="disponibleParaVenta">Disponible para venta</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Componente de Precios Duales */}
              <PreciosDuales
                producto={formProducto}
                onChange={(updates) => setFormProducto(prev => ({ ...prev, ...updates }))}
                readonly={false}
              />
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