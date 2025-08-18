'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { cargaMercaderiaSchema, CargaMercaderiaFormData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Trash2, Upload, AlertCircle, Package, Zap, ShoppingCart, Calendar, Copy, Rocket } from 'lucide-react';
import { toast } from 'sonner';

interface FormularioCargaProps {
  onClose: () => void;
}

// 🚀 PLANTILLAS PREDEFINIDAS PARA CARGA RÁPIDA 2025
const PLANTILLAS_CARGAS_2025 = {
  'carga-dermaskin-completa': {
    nombre: '🏥 Carga DermaSkin Completa',
    marca: 'DermaSkin',
    tipo: 'Insumo' as const,
    productos: [
      { nombre: 'Gel Conductor DermaSkin', cantidad: 50 },
      { nombre: 'Puntas de Aplicación', cantidad: 80 },
      { nombre: 'Filtros de Repuesto', cantidad: 30 },
      { nombre: 'Cables y Conectores', cantidad: 20 },
      { nombre: 'Kit de Calibración', cantidad: 5 }
    ]
  },
  'carga-hydrafacial-mensual': {
    nombre: '💧 Hydrafacial Mensual',
    marca: 'Hydrafacial',
    tipo: 'Insumo' as const,
    productos: [
      { nombre: 'Kit Hydra Clarify', cantidad: 20 },
      { nombre: 'Kit Hydra Purify', cantidad: 15 },
      { nombre: 'Tips Blue (Standard)', cantidad: 100 },
      { nombre: 'Booster Growth Factor', cantidad: 10 },
      { nombre: 'Suero Hydrating B5', cantidad: 25 }
    ]
  },
  'carga-equipos-nuevos': {
    nombre: '🎯 Equipos Venus/Candela',
    marca: 'Venus',
    tipo: 'Equipo Médico' as const,
    productos: [
      { nombre: 'Equipo Venus Legacy', cantidad: 1 },
      { nombre: 'Equipo de Radiofrecuencia', cantidad: 1 }
    ]
  },
  'carga-fotona-laser': {
    nombre: '✨ Carga Fotona Láser',
    marca: 'Fotona',
    tipo: 'Insumo' as const,
    productos: [
      { nombre: 'Tips Láser Fotona', cantidad: 40 },
      { nombre: 'Lentes de Protección', cantidad: 20 },
      { nombre: 'Gel Conductor', cantidad: 30 },
      { nombre: 'Cables de Fibra Óptica', cantidad: 15 },
      { nombre: 'Kit de Calibración', cantidad: 5 }
    ]
  },
  'carga-bodyhealth-mensual': {
    nombre: '💪 Carga BodyHealth Mensual',
    marca: 'BodyHealth',
    tipo: 'Insumo' as const,
    productos: [
      { nombre: 'Proteínas en Polvo', cantidad: 30 },
      { nombre: 'Vitaminas y Minerales', cantidad: 50 },
      { nombre: 'Omega 3', cantidad: 25 },
      { nombre: 'Probióticos', cantidad: 20 },
      { nombre: 'Colágeno Hidrolizado', cantidad: 15 },
      { nombre: 'Creatina', cantidad: 10 },
      { nombre: 'Glutamina', cantidad: 10 }
    ]
  },
  'carga-intermedic-basica': {
    nombre: '🏥 Carga Intermedic Básica',
    marca: 'Intermedic',
    tipo: 'Insumo' as const,
    productos: [
      { nombre: 'Electrodos Desechables', cantidad: 100 },
      { nombre: 'Gasas y Vendajes', cantidad: 50 },
      { nombre: 'Jeringas y Agujas', cantidad: 200 },
      { nombre: 'Guantes Médicos', cantidad: 500 },
      { nombre: 'Mascarillas Quirúrgicas', cantidad: 100 },
      { nombre: 'Desinfectantes', cantidad: 20 },
      { nombre: 'Material de Curación', cantidad: 30 }
    ]
  },
  'carga-servicio-tecnico': {
    nombre: '🔧 Carga Servicio Técnico Esencial',
    marca: 'Servicio Técnico',
    tipo: 'Repuesto' as const,
    productos: [
      { nombre: 'Cables de Repuesto', cantidad: 50 },
      { nombre: 'Fusibles y Componentes', cantidad: 100 },
      { nombre: 'Alcohol Isopropílico', cantidad: 20 },
      { nombre: 'Tornillos y Sujetadores', cantidad: 200 },
      { nombre: 'Filtros de Repuesto', cantidad: 30 },
      { nombre: 'Cintas Aislantes', cantidad: 25 },
      { nombre: 'Esponjas de Limpieza', cantidad: 40 },
      { nombre: 'Material de Mantenimiento', cantidad: 15 }
    ]
  },
  'carga-classys-hifu': {
    nombre: '⚡ Carga Classys HIFU Completa',
    marca: 'Classys',
    tipo: 'Insumo' as const,
    productos: [
      { nombre: 'Transductores HIFU 1.5mm', cantidad: 20 },
      { nombre: 'Transductores HIFU 3.0mm', cantidad: 25 },
      { nombre: 'Transductores HIFU 4.5mm', cantidad: 15 },
      { nombre: 'Gel Conductor Classys', cantidad: 30 },
      { nombre: 'Tips de Aplicación', cantidad: 40 },
      { nombre: 'Filtros de Aire', cantidad: 10 },
      { nombre: 'Kit de Limpieza Classys', cantidad: 5 }
    ]
  }
};

// Datos específicos para Ares Paraguay - Equipos Estéticos
const MARCAS_ESTETICAS = [
  'DermaSkin',
  'Venus',
  'Endymed',
  'Cosmetica',
  'Candela',
  'Ecleris',
  'Fotona',
  'Hydrafacial',
  'Fine',
  'Brera',
  'Cocoon',
  'Thermage',
  'Viora',
  'Lumenis',
  'Daeyang',
  'BodyHealth',
  'Intermedic',
  'Servicio Técnico',
  'Classys'
];

const TIPOS_EQUIPOS_ESTETICOS = [
  'Equipo de Radiofrecuencia',
  'Equipo de Ultrasonido Focalizado (HIFU)',
  'Láser de Depilación',
  'Láser de Rejuvenecimiento',
  'Equipo de Cavitación',
  'Equipo de Presoterapia',
  'Equipo de Criolipólisis',
  'Equipo de Mesoterapia',
  'Equipo de Microdermoabrasión',
  'Equipo IPL (Luz Pulsada)',
  'Equipo de Hydrafacial',
  'Equipo de Plasma Pen',
  'Equipo de Electroporación',
  'Otro equipo estético'
];

// Insumos específicos por marca - ACTUALIZADO
const INSUMOS_POR_MARCA: { [key: string]: string[] } = {
  'Hydrafacial': [
    'Kit Hydra Clarify',
    'Kit Hydra Purify', 
    'Kit Hydra Nourish',
    'Tips Blue (Standard)',
    'Tips Teal (Sensitive)',
    'Tips Red (Resurfacing)',
    'Booster Growth Factor',
    'Booster Vitamin C',
    'Booster Hyaluronic Acid',
    'Filtros de Repuesto',
    'Suero Hydrating B5',
    'Gel Conductor Hydrafacial',
    'Manual de Usuario',
    'Otro insumo Hydrafacial'
  ],
  'Endymed': [
    'Puntas Radiofrecuencia 3DEEP',
    'Puntas VelaShape',
    'Gel Conductor RF',
    'Máscaras Faciales RF',
    'Cables de Aplicadores',
    'Filtros HEPA',
    'Manual Endymed Pro',
    'Kit de Calibración',
    'Cremas Post-RF',
    'Otro insumo Endymed'
  ],
  'Cocoon': [
    'Tips Aplicadores',
    'Gel Conductor Cocoon',
    'Filtros de Repuesto',
    'Cables de Conexión',
    'Manual de Usuario',
    'Otro insumo Cocoon'
  ],
  'DermaSkin': [
    'Gel Conductor DermaSkin',
    'Puntas de Aplicación',
    'Filtros de Repuesto',
    'Cables y Conectores',
    'Manual Técnico',
    'Kit de Calibración',
    'Otro insumo DermaSkin'
  ],
  'Venus': [
    'Aplicadores Venus',
    'Gel Conductor',
    'Tips de Tratamiento',
    'Cables de Conexión',
    'Manual de Usuario Venus',
    'Kit de Mantenimiento',
    'Otro insumo Venus'
  ],
  'Candela': [
    'Puntas Láser Candela',
    'Filtros de Protección',
    'Gel Conductor',
    'Cables Específicos',
    'Manual Técnico Candela',
    'Kit de Limpieza',
    'Otro insumo Candela'
  ],
  'Fotona': [
    'Tips Láser Fotona',
    'Lentes de Protección',
    'Gel Conductor',
    'Cables de Fibra Óptica',
    'Manual Fotona',
    'Kit de Calibración',
    'Otro insumo Fotona'
  ],
  'Thermage': [
    'Tips de Radiofrecuencia',
    'Gel Conductor Thermage',
    'Máscaras de Protección',
    'Cables de Aplicación',
    'Manual Thermage',
    'Kit de Mantenimiento',
    'Otro insumo Thermage'
  ],
  'Viora': [
    'Aplicadores Viora',
    'Gel Conductor',
    'Tips de Tratamiento',
    'Cables de Conexión',
    'Manual de Usuario',
    'Kit de Calibración',
    'Otro insumo Viora'
  ],
  'Cosmetica': [
    'Productos Cosméticos',
    'Cremas de Tratamiento',
    'Sueros Faciales',
    'Máscaras de Belleza',
    'Ampollas de Colágeno',
    'Kit de Limpieza Facial',
    'Otro producto Cosmetica'
  ],
  'Ecleris': [
    'Aplicadores Ecleris',
    'Gel Conductor',
    'Tips de Aplicación',
    'Cables de Conexión',
    'Manual Técnico',
    'Kit de Mantenimiento',
    'Otro insumo Ecleris'
  ],
  'Fine': [
    'Agujas Fine',
    'Tips de Precisión',
    'Gel Conductor',
    'Cables Especializados',
    'Manual de Usuario',
    'Kit de Calibración',
    'Otro insumo Fine'
  ],
  'Brera': [
    'Aplicadores Brera',
    'Gel Conductor',
    'Tips de Tratamiento',
    'Cables de Conexión',
    'Manual Técnico Brera',
    'Kit de Mantenimiento',
    'Otro insumo Brera'
  ],
  'Lumenis': [
    'Tips Láser Lumenis',
    'Fibras Ópticas',
    'Lentes de Protección',
    'Gel Conductor',
    'Cables de Conexión',
    'Manual Técnico Lumenis',
    'Kit de Calibración',
    'Filtros de Protección',
    'Otro insumo Lumenis'
  ],
  'Daeyang': [
    'Aplicadores Daeyang',
    'Gel Conductor',
    'Tips de Aplicación',
    'Cables de Conexión',
    'Manual Técnico Daeyang',
    'Kit de Mantenimiento',
    'Filtros de Repuesto',
    'Repuestos Generales',
    'Otro insumo Daeyang'
  ],
  'BodyHealth': [
    'Suplementos Nutricionales',
    'Vitaminas y Minerales',
    'Proteínas en Polvo',
    'Aminoácidos',
    'Omega 3',
    'Probióticos',
    'Colágeno Hidrolizado',
    'Quemadores de Grasa',
    'Pre-entrenos',
    'Post-entrenos',
    'Creatina',
    'Glutamina',
    'Manual de Nutrición',
    'Otro producto BodyHealth'
  ],
  'Intermedic': [
    'Dispositivos Médicos',
    'Electrodos Desechables',
    'Sondas y Catéteres',
    'Material Quirúrgico',
    'Gasas y Vendajes',
    'Jeringas y Agujas',
    'Equipos de Diagnóstico',
    'Instrumentos Médicos',
    'Sueros y Soluciones',
    'Guantes Médicos',
    'Mascarillas Quirúrgicas',
    'Desinfectantes',
    'Material de Curación',
    'Equipos de Monitoreo',
    'Cables y Sensores',
    'Manual Técnico Intermedic',
    'Otro producto Intermedic'
  ],
  'Servicio Técnico': [
    'Herramientas de Calibración',
    'Multímetros y Osciloscopios',
    'Destornilladores Especializados',
    'Cables de Repuesto',
    'Fusibles y Componentes',
    'Lubricantes Técnicos',
    'Alcohol Isopropílico',
    'Soldadura y Estaño',
    'Tornillos y Sujetadores',
    'Filtros de Repuesto',
    'Piezas de Repuesto Genéricas',
    'Sondas de Prueba',
    'Cintas Aislantes',
    'Resistencias y Capacitores',
    'Conectores y Terminales',
    'Esponjas de Limpieza',
    'Documentación Técnica',
    'Software de Diagnóstico',
    'Equipos de Medición',
    'Material de Mantenimiento',
    'Otro insumo Servicio Técnico'
  ],
  'Classys': [
    'Transductores HIFU 1.5mm',
    'Transductores HIFU 3.0mm',
    'Transductores HIFU 4.5mm',
    'Transductores Doublo',
    'Transductores Ultraformer',
    'Gel Conductor Classys',
    'Tips de Aplicación',
    'Cables de Conexión',
    'Filtros de Aire',
    'Máscaras de Protección',
    'Kit de Limpieza Classys',
    'Manual de Usuario Classys',
    'Software de Actualización',
    'Puntas de Radiofrecuencia',
    'Aplicadores Corporales',
    'Aplicadores Faciales',
    'Repuestos Originales',
    'Kit de Calibración Classys',
    'Documentación Técnica',
    'Otro insumo Classys'
  ]
};

const TIPOS_INSUMOS_ESTETICOS = [
  // Insumos específicos
  'Transductores HIFU',
  'Tips de Ultrasonido',
  'Puntas de Radiofrecuencia',
  'Gel Conductor',
  'Suero para Hydrafacial',
  'Máscaras Faciales',
  'Ampollas de Tratamiento',
  'Cremas Post-Tratamiento',
  'Filtros de Repuesto',
  'Cables y Conectores',
  'Otro insumo'
];

const VOLTAJES_DISPONIBLES = ['110V', '220V', 'Dual (110V/220V)', 'USB/DC'];
const FRECUENCIAS_COMUNES = ['4.5MHz', '7MHz', '2MHz', '1MHz', 'Variable', 'N/A'];

export function FormularioCarga({ onClose }: FormularioCargaProps) {
  const { addCargaMercaderia, generateCodigoCarga } = useAppStore();
  const [codigoCarga, setCodigoCarga] = useState<string>('Generando...');
  
  // Estados para el nuevo flujo optimizado
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<string>('');
  const [tipoProductoComun, setTipoProductoComun] = useState<'Insumo' | 'Repuesto' | 'Equipo Médico'>('Insumo');
  const [productosRapidos, setProductosRapidos] = useState<Array<{
    id: string;
    nombre: string;
    cantidad: number;
    observaciones: string;
  }>>([]);
  
  // 🚀 NUEVOS ESTADOS PARA CARGA MASIVA 2025
  const [fechaPersonalizada, setFechaPersonalizada] = useState<string>('');
  const [modoRapido2025, setModoRapido2025] = useState<boolean>(false);
  const [enviarAServicioTecnico, setEnviarAServicioTecnico] = useState<boolean>(false);

  // Generar código de carga al cargar el componente
  useEffect(() => {
    const generarCodigo = async () => {
      try {
        const codigo = await generateCodigoCarga();
        setCodigoCarga(codigo);
      } catch (error) {
        setCodigoCarga('Error al generar código');
      }
    };
    generarCodigo();
  }, [generateCodigoCarga]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CargaMercaderiaFormData>({
    resolver: zodResolver(cargaMercaderiaSchema),
    defaultValues: {
      tipoCarga: 'stock',
      cliente: '',
      ubicacionServicio: '',
      observacionesGenerales: '',
      productos: []
    }
  });

  const tipoCargaWatched = watch('tipoCarga');

  const agregarProductoRapido = (nombreProducto: string) => {
    const nuevoId = `producto-${Date.now()}-${Math.random()}`;
    setProductosRapidos([...productosRapidos, {
      id: nuevoId,
      nombre: nombreProducto,
      cantidad: 1,
      observaciones: ''
    }]);
  };

  const actualizarProductoRapido = (id: string, campo: string, valor: any) => {
    setProductosRapidos(productos => 
      productos.map(p => 
        p.id === id ? { ...p, [campo]: valor } : p
      )
    );
  };

  const eliminarProductoRapido = (id: string) => {
    setProductosRapidos(productos => productos.filter(p => p.id !== id));
  };

  // 🚀 FUNCIONES PARA CARGA MASIVA 2025
  const cargarPlantilla = (plantillaKey: string) => {
    const plantilla = PLANTILLAS_CARGAS_2025[plantillaKey as keyof typeof PLANTILLAS_CARGAS_2025];
    if (!plantilla) return;
    
    setMarcaSeleccionada(plantilla.marca);
    setTipoProductoComun(plantilla.tipo);
    
    const productosConIds = plantilla.productos.map(producto => ({
      id: `producto-${Date.now()}-${Math.random()}`,
      nombre: producto.nombre,
      cantidad: producto.cantidad,
      observaciones: ''
    }));
    
    setProductosRapidos(productosConIds);
    
    toast.success(`Plantilla "${plantilla.nombre}" cargada`, {
      description: `${plantilla.productos.length} productos agregados automáticamente`
    });
  };

  const duplicarCargaConFecha = () => {
    if (productosRapidos.length === 0) {
      toast.error('No hay productos para duplicar');
      return;
    }
    
    // Lógica para duplicar manteniendo productos pero generando nuevo código
    toast.info('Duplicando carga...', {
      description: 'Se mantendrán los productos y se generará nuevo código'
    });
  };

  const onSubmit = async (data: CargaMercaderiaFormData) => {
    try {
      // Convertir productos rápidos al formato requerido
      const productosFormateados = productosRapidos.map(producto => ({
        id: producto.id, // ✅ Agregar ID requerido
        producto: producto.nombre,
        tipoProducto: tipoProductoComun,
        marca: marcaSeleccionada,
        modelo: producto.nombre, // Usar el nombre como modelo por defecto
        cantidad: producto.cantidad,
        observaciones: producto.observaciones,
        paraServicioTecnico: enviarAServicioTecnico, // ✅ Agregar flag para servicio técnico
        // Campos opcionales
        numeroSerie: '',
        imagen: '',
        voltaje: '',
        frecuencia: '',
        tipoTratamiento: '',
        registroSanitario: '',
        documentosAduaneros: '',
        subitems: []
      }));

      const cargaFinal = {
        ...data,
        productos: productosFormateados,
        // 🚀 Usar fecha personalizada si está configurada
        ...(fechaPersonalizada && { fechaIngreso: fechaPersonalizada })
      };

      const nuevaCarga = await addCargaMercaderia(cargaFinal);
      
             // 🚀 ENVÍO AUTOMÁTICO AL SERVICIO TÉCNICO (MEJORADO)
       let equiposEnviados = 0;
       for (const producto of productosFormateados) {
         // ✅ ENVIAR SI: Es equipo médico O está marcado manualmente para servicio técnico
         if (producto.tipoProducto === 'Equipo Médico' || producto.paraServicioTecnico === true) {
           try {
             const { addEquipoAlServicioTecnico } = await import('@/store/useAppStore');
             addEquipoAlServicioTecnico(producto, nuevaCarga);
             equiposEnviados++;
             const tipoEnvio = producto.tipoProducto === 'Equipo Médico' ? 'automático (Equipo Médico)' : 'manual (marcado para servicio)';
             console.log(`✅ Equipo enviado ${tipoEnvio} al servicio técnico:`, producto.producto);
           } catch (error) {
             console.error('❌ Error enviando equipo al servicio técnico:', error);
           }
         }
       }
      
      toast.success(`¡Carga registrada exitosamente!`, {
        description: `Código: ${nuevaCarga.codigoCarga}. ${productosRapidos.length} productos de ${marcaSeleccionada} registrados.${equiposEnviados > 0 ? ` ${equiposEnviados} equipo(s) enviado(s) automáticamente al servicio técnico.` : ''}`
      });
      
      onClose();
    } catch (error) {
      toast.error('Error al registrar la carga', {
        description: 'Por favor, intenta nuevamente.'
      });
    }
  };

  const insumosDisponibles = marcaSeleccionada && INSUMOS_POR_MARCA[marcaSeleccionada] 
    ? INSUMOS_POR_MARCA[marcaSeleccionada] 
    : [];

  return (
    <div className="p-6">
              {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nueva Carga de Mercadería</h2>
            <p className="text-gray-600">Código de carga: {codigoCarga}</p>
            <p className="text-sm text-blue-600 font-medium">⚡ Modo Rápido para Cargas de la Misma Marca</p>
            {fechaPersonalizada && (
              <p className="text-sm text-green-600 font-medium">📅 Fecha personalizada: {fechaPersonalizada}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModoRapido2025(!modoRapido2025)}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <Rocket className="w-4 h-4 mr-1" />
              {modoRapido2025 ? 'Modo Normal' : 'Modo 2025'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información general de la carga */}
        <Card>
          <CardHeader>
            <CardTitle>Información General de la Carga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selector de tipo de carga */}
            <div>
              <Label htmlFor="tipoCarga">Tipo de Carga *</Label>
              <Select 
                value={tipoCargaWatched}
                onValueChange={(value: 'stock' | 'cliente' | 'reparacion') => setValue('tipoCarga', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">📦 Stock/Inventario - Para vender</SelectItem>
                  <SelectItem value="cliente">🏥 Cliente Específico - Con destino</SelectItem>
                  <SelectItem value="reparacion">🔧 Reparación - Equipos que regresan</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipoCarga && (
                <p className="text-sm text-red-600 mt-1">{errors.tipoCarga.message}</p>
              )}
            </div>

            {/* Campos condicionales para cliente específico */}
            {(tipoCargaWatched === 'cliente' || tipoCargaWatched === 'reparacion') && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cliente">Cliente/Institución *</Label>
                    <Input
                      id="cliente"
                      {...register('cliente')}
                      placeholder="Ej: Ares, Dr. García..."
                    />
                    {errors.cliente && (
                      <p className="text-sm text-red-600 mt-1">{errors.cliente.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="ubicacionServicio">Ubicación/Servicio *</Label>
                    <Input
                      id="ubicacionServicio"
                      {...register('ubicacionServicio')}
                      placeholder="Ej: Asuncion, Sala Principal..."
                    />
                    {errors.ubicacionServicio && (
                      <p className="text-sm text-red-600 mt-1">{errors.ubicacionServicio.message}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Observaciones generales */}
            <div>
              <Label htmlFor="observacionesGenerales">Observaciones Generales</Label>
              <Textarea
                id="observacionesGenerales"
                {...register('observacionesGenerales')}
                placeholder="Información adicional sobre esta carga..."
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* 🚀 NUEVA SECCIÓN: MODO CARGA MASIVA 2025 */}
        {modoRapido2025 && (
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-800">
                <Rocket className="w-5 h-5" />
                <span>Modo Carga Masiva 2025 - Plantillas y Opciones Avanzadas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fecha personalizada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fechaPersonalizada">📅 Fecha Personalizada (para cargas históricas)</Label>
                  <Input
                    id="fechaPersonalizada"
                    type="date"
                    value={fechaPersonalizada}
                    onChange={(e) => setFechaPersonalizada(e.target.value)}
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Útil para registrar cargas de fechas anteriores de 2025
                  </p>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={duplicarCargaConFecha}
                    disabled={productosRapidos.length === 0}
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicar Carga con Nueva Fecha
                  </Button>
                </div>
              </div>

              {/* Plantillas predefinidas */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  🎯 Plantillas Predefinidas - Click para Cargar Automáticamente:
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(PLANTILLAS_CARGAS_2025).map(([key, plantilla]) => (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      onClick={() => cargarPlantilla(key)}
                      className="h-auto py-3 px-4 text-left"
                    >
                      <div>
                        <p className="font-medium">{plantilla.nombre}</p>
                        <p className="text-xs text-gray-600">{plantilla.marca} • {plantilla.productos.length} productos</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-orange-200">
                <p className="text-sm text-orange-700">
                  💡 <strong>Tip para carga masiva:</strong> Usa plantillas para cargas repetitivas, 
                  configura fechas personalizadas para datos históricos, y duplica cargas similares para ahorrar tiempo.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* NUEVA SECCIÓN: Configuración Rápida de Productos */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <span>Configuración Rápida - Una Marca, Múltiples Productos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Marca de esta Carga *</Label>
                <Select 
                  value={marcaSeleccionada}
                  onValueChange={setMarcaSeleccionada}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar marca..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MARCAS_ESTETICAS.map(marca => (
                      <SelectItem key={marca} value={marca}>
                        {marca}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Productos *</Label>
                <Select 
                  value={tipoProductoComun}
                  onValueChange={(value: 'Insumo' | 'Repuesto' | 'Equipo Médico') => setTipoProductoComun(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Insumo">📦 Insumos/Consumibles</SelectItem>
                    <SelectItem value="Repuesto">🔧 Repuestos/Accesorios</SelectItem>
                    <SelectItem value="Equipo Médico">🏥 Equipos Estéticos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 🔧 NUEVA OPCIÓN: Enviar al Servicio Técnico */}
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="enviarServicioTecnico"
                checked={enviarAServicioTecnico}
                onChange={(e) => setEnviarAServicioTecnico(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="enviarServicioTecnico" className="text-sm font-medium text-blue-900 cursor-pointer">
                🔧 Enviar TODOS los productos de esta carga automáticamente al Servicio Técnico
              </Label>
            </div>

            <div className="grid grid-cols-1 gap-4">
            </div>

            {marcaSeleccionada && (
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-sm text-green-700 mb-2">
                  ✅ Perfecto! Ahora todos los productos serán de marca <strong>{marcaSeleccionada}</strong> tipo <strong>{tipoProductoComun}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* NUEVA SECCIÓN: Agregar Productos Rápidamente */}
        {marcaSeleccionada && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <span>Productos de {marcaSeleccionada} ({productosRapidos.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Lista de insumos disponibles para agregar rápidamente */}
              {insumosDisponibles.length > 0 && (
                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    💡 Productos Comunes de {marcaSeleccionada} - Click para Agregar:
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {insumosDisponibles.map(insumo => (
                      <Button
                        key={insumo}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => agregarProductoRapido(insumo)}
                        className="text-xs h-auto py-2 px-3 text-left whitespace-normal"
                        disabled={productosRapidos.some(p => p.nombre === insumo)}
                      >
                        {productosRapidos.some(p => p.nombre === insumo) ? '✅' : '+'} {insumo}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de productos agregados */}
              {productosRapidos.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    📦 Productos en esta Carga:
                  </Label>
                  {productosRapidos.map((producto, index) => (
                    <motion.div
                      key={producto.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border"
                    >
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      
                      <div className="flex-1 font-medium text-gray-900">
                        {producto.nombre}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Label className="text-xs text-gray-600">Cant:</Label>
                        <Input
                          type="number"
                          min="1"
                          value={producto.cantidad}
                          onChange={(e) => actualizarProductoRapido(producto.id, 'cantidad', parseInt(e.target.value) || 1)}
                          className="w-16 h-8 text-center"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Observaciones..."
                          value={producto.observaciones}
                          onChange={(e) => actualizarProductoRapido(producto.id, 'observaciones', e.target.value)}
                          className="w-32 h-8 text-xs"
                        />
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarProductoRapido(producto.id)}
                        className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}

              {productosRapidos.length === 0 && marcaSeleccionada && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p>No hay productos agregados aún</p>
                  <p className="text-sm">Click en los productos de arriba para agregarlos rápidamente</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !marcaSeleccionada || productosRapidos.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Guardando...' : `Guardar Carga (${productosRapidos.length} productos)`}
          </Button>
        </div>
      </form>
    </div>
  );
} 