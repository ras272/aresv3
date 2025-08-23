'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { cargaMercaderiaSchema, CargaMercaderiaFormData } from '@/lib/schemas';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Zap, ShoppingCart, Trash2, Save, Heart, Plus, Upload, AlertCircle, Building, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ProductSelectorSimple as ProductSelector } from '@/components/mercaderias/ProductSelectorSimple';
import { createProductoCatalogo } from '@/lib/catalogo-productos';
import { supabase } from '@/lib/database/shared/supabase';
import EquipoIngresadoModal from '@/components/servtec/EquipoIngresadoModal';
import { IngresoFraccionamiento } from '@/components/IngresoFraccionamiento';

// Componente ClienteSelector para dropdown de clínicas
function ClienteSelector({ value, onChange, error }: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const { getClinicasActivas } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const clinicasActivas = getClinicasActivas();

  // Filtrar clínicas por término de búsqueda
  const clinicasFiltradas = clinicasActivas.filter(clinica =>
    clinica.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinica.ciudad.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Encontrar la clínica seleccionada
  const clinicaSeleccionada = clinicasActivas.find(c => c.nombre === value);

  return (
    <div className="relative">
      <Select
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger className="w-full">
          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4 text-gray-400" />
            <SelectValue placeholder="Seleccionar clínica/institución...">
              {clinicaSeleccionada ? (
                <div className="flex flex-col items-start">
                  <span className="font-medium">{clinicaSeleccionada.nombre}</span>
                  <span className="text-xs text-gray-500">{clinicaSeleccionada.ciudad}</span>
                </div>
              ) : (
                "Seleccionar clínica/institución..."
              )}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="w-full">
          {/* Lista de clínicas */}
          {clinicasFiltradas.length > 0 ? (
            clinicasFiltradas.map((clinica) => (
              <SelectItem key={clinica.id} value={clinica.nombre}>
                <div className="flex flex-col items-start py-1">
                  <span className="font-medium">{clinica.nombre}</span>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{clinica.ciudad}</span>
                    {clinica.telefono && (
                      <>
                        <span>•</span>
                        <span>{clinica.telefono}</span>
                      </>
                    )}
                  </div>
                  {clinica.contactoPrincipal && (
                    <span className="text-xs text-blue-600">{clinica.contactoPrincipal}</span>
                  )}
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              No hay clínicas disponibles
            </div>
          )}
        </SelectContent>
      </Select>

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

// Datos específicos para Ares Paraguay
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

// Insumos específicos por marca
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
    'Cartuchos HIFU 1.5mm',
    'Cartuchos HIFU 3.0mm',
    'Cartuchos HIFU 4.5mm',
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

const VOLTAJES_DISPONIBLES = ['110V', '220V', 'Dual (110V/220V)', 'USB/DC'];
const FRECUENCIAS_COMUNES = ['4.5MHz', '7MHz', '2MHz', '1MHz', 'Variable', 'N/A'];

// Función para generar código de carga
const generateCodigoCarga = async () => {
  const fecha = new Date();
  const año = fecha.getFullYear().toString().slice(-2);
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const dia = fecha.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CM-${año}${mes}${dia}-${random}`;
};

export default function NuevaCargaPage() {
  const router = useRouter();
  const { addCargaMercaderia, user, getClinicasActivas } = useAppStore();
  const [mostrarFraccionamiento, setMostrarFraccionamiento] = useState<{visible: boolean; producto: any}>({visible: false, producto: null});
  const [codigoCarga, setCodigoCarga] = useState<string>('Generando...');
  const [isLoading, setIsLoading] = useState(false);

  // Estados para modo de funcionamiento
  const [modoFormulario, setModoFormulario] = useState<'rapido' | 'equipo'>('rapido');

  // Estados para el flujo rápido (insumos)
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<string>('');
  const [tipoProductoComun, setTipoProductoComun] = useState<'Insumo' | 'Repuesto' | 'Equipo Médico'>('Insumo');
  const [productosRapidos, setProductosRapidos] = useState<Array<{
    id: string;
    nombre: string;
    numeroSerie?: string; // 🆕 NUEVO: Número de serie opcional
    cantidad: number;
    observaciones: string;
    paraServicioTecnico?: boolean; // 🎯 NUEVO: Control manual para servicio técnico
    imagen?: string; // 🖼️ NUEVO: Imagen del producto
  }>>([]);

  // Estados para el formulario de agregar producto manual
  const [nombreProducto, setNombreProducto] = useState('');
  const [numeroSerieProducto, setNumeroSerieProducto] = useState(''); // 🆕 NUEVO: Estado para número de serie
  const [cantidadProducto, setCantidadProducto] = useState(1);

  // Estado para número de carga general
  const [numeroCargaGeneral, setNumeroCargaGeneral] = useState('');

  // Estados para equipos médicos complejos
  const [imagenEquipo, setImagenEquipo] = useState<string>('');

  // Estado para marcas dinámicas del catálogo
  const [marcasDisponibles, setMarcasDisponibles] = useState<string[]>([]);
  const [cargandoMarcas, setCargandoMarcas] = useState(true);

  // Estado para modal de equipos ingresados
  const [equipoIngresadoModalOpen, setEquipoIngresadoModalOpen] = useState(false);

  // Función para cargar marcas desde el catálogo
  const cargarMarcasDelCatalogo = async () => {
    try {
      setCargandoMarcas(true);
      const { data, error } = await supabase
        .from('catalogo_productos')
        .select('marca')
        .eq('activo', true);

      if (error) throw error;

      // Obtener marcas únicas y ordenarlas
      const marcasUnicas = [...new Set(data?.map(item => item.marca) || [])].sort();
      setMarcasDisponibles(marcasUnicas);
      console.log('✅ Marcas cargadas desde catálogo:', marcasUnicas);
    } catch (error) {
      console.error('❌ Error cargando marcas del catálogo:', error);
      // Fallback a marcas estáticas si hay error
      setMarcasDisponibles(MARCAS_ESTETICAS);
      toast.error('Error cargando marcas del catálogo, usando marcas por defecto');
    } finally {
      setCargandoMarcas(false);
    }
  };

  // Generar código de carga y cargar clínicas al cargar el componente
  useEffect(() => {
    const inicializar = async () => {
      try {
        const codigo = await generateCodigoCarga();
        setCodigoCarga(codigo);
        await cargarMarcasDelCatalogo(); // Solo cargar marcas
      } catch (error) {
        setCodigoCarga('Error al generar código');
      }
    };
    inicializar();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors }
  } = useForm<CargaMercaderiaFormData>({
    resolver: zodResolver(cargaMercaderiaSchema),
    defaultValues: {
      tipoCarga: 'stock',
      cliente: '',
      ubicacionServicio: '',
      observacionesGenerales: '',
      productos: modoFormulario === 'equipo' ? [{
        producto: '',
        tipoProducto: 'Equipo Médico',
        marca: '',
        modelo: '',
        numeroSerie: '',
        cantidad: 1,
        observaciones: '',
        imagen: '',
        voltaje: '',
        frecuencia: '',
        tipoTratamiento: '',
        registroSanitario: '',
        documentosAduaneros: '',
        subitems: []
      }] : []
    }
  });

  const tipoCargaWatched = watch('tipoCarga');
  const productosWatched = watch('productos');

  // Field array para equipos complejos
  const { fields: productosEquipo, append: agregarProductoEquipo, remove: removerProductoEquipo } = useFieldArray({
    control,
    name: 'productos'
  });

  // 🔥 SINCRONIZAR productos cuando cambia marca o tipo en modo rápido
  useEffect(() => {
    if (modoFormulario === 'rapido' && productosRapidos.length > 0 && marcaSeleccionada) {
      const productosFormateados = productosRapidos.map(producto => ({
        producto: producto.nombre,
        tipoProducto: tipoProductoComun,
        marca: marcaSeleccionada,
        modelo: producto.nombre,
        numeroSerie: producto.numeroSerie || '', // 🆕 NUEVO: Usar número de serie real
        cantidad: producto.cantidad,
        observaciones: producto.observaciones,
        paraServicioTecnico: producto.paraServicioTecnico || false, // 🎯 NUEVO: Control manual
        imagen: '',
        voltaje: '',
        frecuencia: '',
        tipoTratamiento: '',
        registroSanitario: '',
        documentosAduaneros: '',
        subitems: []
      }));
      setValue('productos', productosFormateados);
      console.log('🔄 Productos resincronizados por cambio de marca/tipo:', productosFormateados);
    }
  }, [marcaSeleccionada, tipoProductoComun, productosRapidos, modoFormulario, setValue]);

  // 🔧 NUEVO: Abrir modal automáticamente cuando se selecciona reparación
  useEffect(() => {
    if (tipoCargaWatched === 'reparacion') {
      console.log('🔧 Tipo de carga "reparación" seleccionado, abriendo modal de equipos ingresados...');
      setEquipoIngresadoModalOpen(true);
    }
  }, [tipoCargaWatched]);

  const agregarProductoManual = () => {
    if (!nombreProducto.trim()) {
      toast.error('Ingresa el nombre del producto');
      return;
    }

    const nuevoId = `producto-${Date.now()}-${Math.random()}`;
    const nuevosProductos = [...productosRapidos, {
      id: nuevoId,
      nombre: nombreProducto.trim(),
      numeroSerie: numeroSerieProducto.trim(), // 🆕 NUEVO: Usar número de serie del formulario
      cantidad: cantidadProducto,
      observaciones: '',
      paraServicioTecnico: false // 🎯 NUEVO: Por defecto NO marcado
    }];

    setProductosRapidos(nuevosProductos);

    // 🔥 SINCRONIZAR con el formulario para que pase la validación
    if (modoFormulario === 'rapido') {
      const productosFormateados = nuevosProductos.map(producto => ({
        producto: producto.nombre,
        tipoProducto: tipoProductoComun,
        marca: marcaSeleccionada,
        modelo: producto.nombre,
        numeroSerie: producto.numeroSerie || '', // 🆕 NUEVO: Usar número de serie real
        cantidad: producto.cantidad,
        observaciones: producto.observaciones,
        paraServicioTecnico: producto.paraServicioTecnico || false, // 🎯 NUEVO: Control manual
        imagen: '',
        voltaje: '',
        frecuencia: '',
        tipoTratamiento: '',
        registroSanitario: '',
        documentosAduaneros: '',
        subitems: []
      }));
      setValue('productos', productosFormateados);
      console.log('🔄 Productos sincronizados con formulario:', productosFormateados);
    }

    // Limpiar formulario
    setNombreProducto('');
    setNumeroSerieProducto(''); // 🆕 NUEVO: Limpiar número de serie
    setCantidadProducto(1);

    toast.success(`Producto "${nombreProducto}" agregado`);
  };

  const actualizarProductoRapido = (id: string, campo: string, valor: any) => {
    const nuevosProductos = productosRapidos.map(p =>
      p.id === id ? { ...p, [campo]: valor } : p
    );

    setProductosRapidos(nuevosProductos);

    // 🔥 SINCRONIZAR con el formulario
    if (modoFormulario === 'rapido') {
      const productosFormateados = nuevosProductos.map(producto => ({
        producto: producto.nombre,
        tipoProducto: tipoProductoComun,
        marca: marcaSeleccionada,
        modelo: producto.nombre,
        numeroSerie: producto.numeroSerie || '', // 🆕 NUEVO: Usar número de serie real
        cantidad: producto.cantidad,
        observaciones: producto.observaciones,
        paraServicioTecnico: producto.paraServicioTecnico || false, // 🎯 NUEVO: Control manual
        imagen: '',
        voltaje: '',
        frecuencia: '',
        tipoTratamiento: '',
        registroSanitario: '',
        documentosAduaneros: '',
        subitems: []
      }));
      setValue('productos', productosFormateados);
    }
  };

  const eliminarProductoRapido = (id: string) => {
    const nuevosProductos = productosRapidos.filter(p => p.id !== id);
    setProductosRapidos(nuevosProductos);

    // 🔥 SINCRONIZAR con el formulario
    if (modoFormulario === 'rapido') {
      const productosFormateados = nuevosProductos.map(producto => ({
        producto: producto.nombre,
        tipoProducto: tipoProductoComun,
        marca: marcaSeleccionada,
        modelo: producto.nombre,
        numeroSerie: producto.numeroSerie || '', // 🆕 NUEVO: Usar número de serie real
        cantidad: producto.cantidad,
        observaciones: producto.observaciones,
        paraServicioTecnico: producto.paraServicioTecnico || false, // 🎯 NUEVO: Control manual
        imagen: '',
        voltaje: '',
        frecuencia: '',
        tipoTratamiento: '',
        registroSanitario: '',
        documentosAduaneros: '',
        subitems: []
      }));
      setValue('productos', productosFormateados);
    }
  };

  const agregarSubitem = (productoIndex: number) => {
    const currentSubitems = productosWatched[productoIndex]?.subitems || [];
    setValue(`productos.${productoIndex}.subitems`, [
      ...currentSubitems,
      {
        nombre: '',
        numeroSerie: '',
        cantidad: 1,
        paraServicioTecnico: false // 🎯 NUEVO: Por defecto NO marcado
      }
    ]);
  };

  const removerSubitem = (productoIndex: number, subitemIndex: number) => {
    const currentSubitems = productosWatched[productoIndex]?.subitems || [];
    const newSubitems = currentSubitems.filter((_, index) => index !== subitemIndex);
    setValue(`productos.${productoIndex}.subitems`, newSubitems);
  };

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagenEquipo(result);
        setValue('productos.0.imagen', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const agregarEquipoComplejo = () => {
    agregarProductoEquipo({
      producto: '',
      tipoProducto: 'Equipo Médico',
      marca: '',
      modelo: '',
      numeroSerie: '',
      cantidad: 1,
      observaciones: '',
      imagen: '',
      voltaje: '',
      frecuencia: '',
      tipoTratamiento: '',
      registroSanitario: '',
      documentosAduaneros: '',
      subitems: []
    });
  };

  const onSubmit = async (data: CargaMercaderiaFormData) => {
    console.log('🔄 Enviando formulario...', {
      modoFormulario,
      data,
      marcaSeleccionada,
      productosRapidos: productosRapidos.length
    });

    if (modoFormulario === 'rapido') {
      // Modo rápido - validaciones existentes
      if (!marcaSeleccionada) {
        toast.error('Selecciona una marca para la carga');
        return;
      }

      if (productosRapidos.length === 0) {
        toast.error('Agrega al menos un producto a la carga');
        return;
      }
    } else {
      // Modo equipo - validar que hay al menos un equipo
      if (data.productos.length === 0) {
        toast.error('Agrega al menos un equipo médico');
        return;
      }
    }

    setIsLoading(true);

    try {
      console.log('✅ Validaciones pasadas, procesando datos...');
      let cargaFinal;

      if (modoFormulario === 'rapido') {
        console.log('📦 Modo rápido - convirtiendo productos...');
        // Convertir productos rápidos al formato requerido
        const productosFormateados = productosRapidos.map(producto => ({
          producto: producto.nombre,
          tipoProducto: tipoProductoComun,
          marca: marcaSeleccionada,
          modelo: producto.nombre,
          cantidad: producto.cantidad,
          observaciones: producto.observaciones,
          paraServicioTecnico: producto.paraServicioTecnico || false, // 🎯 NUEVO: Control manual
          numeroSerie: producto.numeroSerie || '', // 🆕 NUEVO: Usar número de serie real
          imagen: '',
          voltaje: '',
          frecuencia: '',
          tipoTratamiento: '',
          registroSanitario: '',
          documentosAduaneros: '',
          subitems: []
        }));

        cargaFinal = {
          ...data,
          productos: productosFormateados,
          observacionesGenerales: data.observacionesGenerales,
          numeroCargaPersonalizado: numeroCargaGeneral || undefined
        };
        console.log('📦 Productos formateados:', productosFormateados);
      } else {
        console.log('🏥 Modo equipo - usando productos del formulario...');
        // Modo equipo - usar productos del formulario directamente
        cargaFinal = {
          ...data,
          observacionesGenerales: data.observacionesGenerales,
          numeroCargaPersonalizado: numeroCargaGeneral || undefined
        };
      }

      console.log('📋 Carga final preparada:', cargaFinal);
      console.log('🚀 Enviando a addCargaMercaderia...');

      const nuevaCarga = await addCargaMercaderia(cargaFinal);
      console.log('✅ Carga creada exitosamente:', nuevaCarga);

      // Determinar carpeta de destino según tipo de carga
      let carpetaDestino = '';
      let mensajeDestino = '';

      if (cargaFinal.tipoCarga === 'reparacion') {
        carpetaDestino = 'Servicio Técnico';
        mensajeDestino = 'Productos enviados a Servicio Técnico para reparación';
      } else if (cargaFinal.tipoCarga === 'cliente') {
        // Obtener la primera marca para determinar la carpeta
        const primeraMarca = modoFormulario === 'rapido' ? marcaSeleccionada : cargaFinal.productos[0]?.marca;
        carpetaDestino = `${primeraMarca}/Cliente Específico`;
        mensajeDestino = `Productos enviados a ${primeraMarca}/Cliente Específico`;
      } else {
        // Stock normal - usar la marca
        const primeraMarca = modoFormulario === 'rapido' ? marcaSeleccionada : cargaFinal.productos[0]?.marca;
        carpetaDestino = primeraMarca || 'Stock';
        mensajeDestino = `Productos enviados a Stock/${primeraMarca}`;
      }

      // Mensaje diferente según el modo
      if (modoFormulario === 'rapido') {
        toast.success(`¡Carga registrada exitosamente!`, {
          description: `Código: ${nuevaCarga.codigoCarga}. ${productosRapidos.length} productos de ${marcaSeleccionada} registrados. ${mensajeDestino}.`
        });
      } else {
        const equiposMedicos = data.productos.filter(p => p.tipoProducto === 'Equipo Médico').length;
        toast.success(`¡Carga registrada exitosamente!`, {
          description: `Código: ${nuevaCarga.codigoCarga}. ${data.productos.length} producto(s) registrado(s). ${mensajeDestino}.`
        });
      }

      // Navegar de vuelta a la lista de mercaderías
      console.log('🔄 Navegando de vuelta a mercaderías...');
      router.push('/mercaderias');
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Error desconocido');
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');

      toast.error('Error al registrar la carga', {
        description: error instanceof Error ? error.message : 'Error desconocido. Por favor, intenta nuevamente.'
      });
    } finally {
      console.log('🏁 Finalizando proceso, isLoading = false');
      setIsLoading(false);
    }
  };

  const insumosDisponibles = marcaSeleccionada && INSUMOS_POR_MARCA[marcaSeleccionada]
    ? INSUMOS_POR_MARCA[marcaSeleccionada]
    : [];

  return (
    <DashboardLayout
      title="Nueva Carga de Mercadería"
      subtitle={`Código: ${codigoCarga} - ${modoFormulario === 'rapido' ? 'Modo Rápido para Insumos' : 'Modo Equipo Médico Complejo'}`}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header con botón volver */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Mercaderías</span>
          </Button>

          {/* Selector de modo */}
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant={modoFormulario === 'rapido' ? 'default' : 'outline'}
              onClick={() => setModoFormulario('rapido')}
              className="flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>Modo Rápido</span>
            </Button>
            <Button
              type="button"
              variant={modoFormulario === 'equipo' ? 'default' : 'outline'}
              onClick={() => setModoFormulario('equipo')}
              className="flex items-center space-x-2"
            >
              <Heart className="h-4 w-4" />
              <span>Equipo Médico</span>
            </Button>
          </div>
        </div>

        <form onSubmit={(e) => {
          console.log('🔥 FORM SUBMIT EVENT!', e);
          console.log('🔥 Datos del formulario antes del submit:', watch());
          return handleSubmit(
            onSubmit,
            (errors) => {
              console.log('❌ ERRORES DE VALIDACIÓN:', errors);
              console.log('❌ Campos con errores:', Object.keys(errors));
              toast.error('Faltan campos obligatorios', {
                description: `Revisa: ${Object.keys(errors).join(', ')}`
              });
            }
          )(e);
        }} className="space-y-6">
          {/* Información general de la carga - COMPARTIDA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Información General de la Carga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {(tipoCargaWatched === 'cliente' || tipoCargaWatched === 'reparacion') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cliente">Cliente/Institución *</Label>
                      <ClienteSelector
                        value={watch('cliente')}
                        onChange={(value) => setValue('cliente', value)}
                        error={errors.cliente?.message}
                      />
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
                )}

                <div>
                  <Label htmlFor="numeroCargaGeneral">Número de Carga/Envío</Label>
                  <Input
                    id="numeroCargaGeneral"
                    value={numeroCargaGeneral}
                    onChange={(e) => setNumeroCargaGeneral(e.target.value)}
                    placeholder="Ej: ARES042025, ARES042026, ARES042027..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Número de tracking para toda esta carga (AWB, BL, número de envío, etc.)
                  </p>
                </div>

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
          </motion.div>

          {/* MODO RÁPIDO - Insumos de la misma marca */}
          {modoFormulario === 'rapido' && (
            <>
              {/* Configuración Rápida de Productos */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <span>Modo Rápido - Una Marca, Múltiples Insumos</span>
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
                            {cargandoMarcas ? (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                Cargando marcas...
                              </div>
                            ) : marcasDisponibles.length > 0 ? (
                              marcasDisponibles.map(marca => (
                                <SelectItem key={marca} value={marca}>
                                  {marca}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No hay marcas disponibles en el catálogo
                              </div>
                            )}
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

                    {marcaSeleccionada && (
                      <div className="p-4 bg-white rounded-lg border">
                        <p className="text-sm text-green-700 mb-2">
                          ✅ Perfecto! Ahora todos los productos serán de marca <strong>{marcaSeleccionada}</strong> tipo <strong>{tipoProductoComun}</strong>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Agregar Productos Manualmente */}
              {marcaSeleccionada && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <ShoppingCart className="w-5 h-5" />
                        <span>Agregar Productos de {marcaSeleccionada}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Formulario para agregar producto */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">
                          ✏️ Escribir Producto Manualmente
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          <div className="md:col-span-4">
                            <ProductSelector
                              marca={marcaSeleccionada}
                              value={nombreProducto}
                              onChange={setNombreProducto}
                              onCreateNew={async (nombre) => {
                                try {
                                  await createProductoCatalogo({
                                    marca: marcaSeleccionada,
                                    nombre: nombre,
                                    descripcion: `Creado desde ingreso de mercaderías - ${new Date().toLocaleDateString()}`
                                  });
                                  setNombreProducto(nombre);
                                  toast.success(`Producto "${nombre}" agregado al catálogo de ${marcaSeleccionada}`);
                                } catch (error) {
                                  console.error('Error creando producto:', error);
                                  toast.error('Error al agregar producto al catálogo');
                                }
                              }}
                              placeholder="Seleccionar producto de la marca..."
                            />
                          </div>
                          <div className="md:col-span-3">
                            <Label htmlFor="numeroSerieProducto" className="text-xs text-gray-600">
                              Número de Serie
                            </Label>
                            <Input
                              id="numeroSerieProducto"
                              value={numeroSerieProducto}
                              onChange={(e) => setNumeroSerieProducto(e.target.value)}
                              placeholder="SN123456..."
                              className="h-10"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  agregarProductoManual();
                                }
                              }}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="cantidadProducto" className="text-xs text-gray-600">
                              Cajas/Unidades
                            </Label>
                            <Input
                              id="cantidadProducto"
                              type="number"
                              min="1"
                              value={cantidadProducto}
                              onChange={(e) => setCantidadProducto(parseInt(e.target.value) || 1)}
                              className="h-10 text-center"
                              title="Si el producto viene en cajas, indica la cantidad de CAJAS. Si no, indica las unidades."
                            />
                          </div>
                          <div className="md:col-span-3">
                            <Button
                              type="button"
                              onClick={agregarProductoManual}
                              className="w-full h-10"
                              disabled={!nombreProducto.trim()}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Agregar
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Lista de productos agregados */}
                      {productosRapidos.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">
                              📦 Productos en esta Carga ({productosRapidos.length})
                            </Label>
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                              {marcaSeleccionada} - {tipoProductoComun}
                            </Badge>
                          </div>
                          {productosRapidos.map((producto, index) => (
                            <motion.div
                              key={producto.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 bg-white rounded-lg border shadow-sm"
                            >
                              <div className="md:col-span-1">
                                <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </span>
                              </div>

                              <div className="md:col-span-3">
                                <p className="font-medium text-gray-900">{producto.nombre}</p>
                              </div>

                              <div className="md:col-span-2">
                                <Label className="text-xs text-gray-600">Número de Serie:</Label>
                                <Input
                                  value={producto.numeroSerie || ''}
                                  onChange={(e) => actualizarProductoRapido(producto.id, 'numeroSerie', e.target.value)}
                                  placeholder="SN123456..."
                                  className="w-full h-8 text-xs"
                                />
                              </div>

                              <div className="md:col-span-1">
                                <Label className="text-xs text-gray-600">Cantidad:</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={producto.cantidad}
                                  onChange={(e) => actualizarProductoRapido(producto.id, 'cantidad', parseInt(e.target.value) || 1)}
                                  className="w-full h-8 text-center"
                                />
                              </div>

                              <div className="md:col-span-2">
                                <Label className="text-xs text-gray-600">Observaciones:</Label>
                                <Input
                                  value={producto.observaciones}
                                  onChange={(e) => actualizarProductoRapido(producto.id, 'observaciones', e.target.value)}
                                  placeholder="Notas..."
                                  className="w-full h-8 text-xs"
                                />
                              </div>

                              {/* 🎯 NUEVO: Checkbox para Servicio Técnico */}
                              <div className="md:col-span-1 flex flex-col items-center justify-center">
                                <Label className="text-xs text-center mb-1">
                                  🔧 Servicio
                                </Label>
                                <input
                                  type="checkbox"
                                  checked={producto.paraServicioTecnico || false}
                                  onChange={(e) => actualizarProductoRapido(producto.id, 'paraServicioTecnico', e.target.checked)}
                                  className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </div>

                              <div className="md:col-span-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarProductoRapido(producto.id)}
                                  className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              {/* Botón para configurar fraccionamiento si es un insumo */}
                              {tipoProductoComun === 'Insumo' && (
                                <div className="md:col-span-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setMostrarFraccionamiento({visible: true, producto})}
                                    className="text-blue-600 hover:bg-blue-50"
                                  >
                                    📦 Fraccionamiento
                                  </Button>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {productosRapidos.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          <p>No hay productos agregados aún</p>
                          <p className="text-sm">Escribe el nombre del producto arriba para agregarlo</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </>
          )}

          {/* MODO EQUIPO MÉDICO - Equipos complejos con subitems */}
          {modoFormulario === 'equipo' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-2 border-red-200 bg-red-50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    <span>Equipos Médicos Complejos → Servicio Técnico</span>
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={agregarEquipoComplejo}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Equipo
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-white rounded-lg border">
                    <p className="text-sm text-red-700">
                      🏥 <strong>Automatización:</strong> Los equipos médicos se enviarán automáticamente al módulo de Servicio Técnico con todos sus componentes y subitems.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {productosEquipo.map((producto, productoIndex) => (
                      <motion.div
                        key={producto.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-200 rounded-lg p-6 bg-white relative"
                      >
                        {/* Botón de eliminar equipo */}
                        {productosEquipo.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removerProductoEquipo(productoIndex)}
                            className="absolute top-2 right-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}

                        <div className="space-y-4">
                          <div className="flex items-center space-x-2 mb-4">
                            <span className="w-8 h-8 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-sm font-bold">
                              {productoIndex + 1}
                            </span>
                            <h4 className="font-semibold text-lg">Equipo Médico #{productoIndex + 1}</h4>
                          </div>

                          {/* Información básica del equipo */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`productos.${productoIndex}.producto`}>Nombre del Equipo *</Label>
                              <Input
                                {...register(`productos.${productoIndex}.producto`)}
                                placeholder="Ej: Ultraformer III, Hydrafacial MD..."
                              />
                              {errors.productos?.[productoIndex]?.producto && (
                                <p className="text-sm text-red-600 mt-1">
                                  {errors.productos[productoIndex]?.producto?.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor={`productos.${productoIndex}.marca`}>Marca *</Label>
                              <Select onValueChange={(value) => setValue(`productos.${productoIndex}.marca`, value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar marca..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {cargandoMarcas ? (
                                    <div className="px-3 py-2 text-sm text-gray-500">
                                      Cargando marcas...
                                    </div>
                                  ) : marcasDisponibles.length > 0 ? (
                                    marcasDisponibles.map(marca => (
                                      <SelectItem key={marca} value={marca}>
                                        {marca}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="px-3 py-2 text-sm text-gray-500">
                                      No hay marcas disponibles en el catálogo
                                    </div>
                                  )}
                                </SelectContent>
                              </Select>
                              {errors.productos?.[productoIndex]?.marca && (
                                <p className="text-sm text-red-600 mt-1">
                                  {errors.productos[productoIndex]?.marca?.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor={`productos.${productoIndex}.modelo`}>Modelo *</Label>
                              <Input
                                {...register(`productos.${productoIndex}.modelo`)}
                                placeholder="Ultrafomer MPT"
                              />
                              {errors.productos?.[productoIndex]?.modelo && (
                                <p className="text-sm text-red-600 mt-1">
                                  {errors.productos[productoIndex]?.modelo?.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor={`productos.${productoIndex}.numeroSerie`}>N° Serie *</Label>
                              <Input
                                {...register(`productos.${productoIndex}.numeroSerie`)}
                                placeholder="Número de serie del fabricante..."
                              />
                              {errors.productos?.[productoIndex]?.numeroSerie && (
                                <p className="text-sm text-red-600 mt-1">
                                  {errors.productos[productoIndex]?.numeroSerie?.message}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Especificaciones técnicas */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div>
                              <Label htmlFor={`productos.${productoIndex}.voltaje`}>Voltaje</Label>
                              <Select onValueChange={(value) => setValue(`productos.${productoIndex}.voltaje`, value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {VOLTAJES_DISPONIBLES.map(voltaje => (
                                    <SelectItem key={voltaje} value={voltaje}>
                                      {voltaje}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor={`productos.${productoIndex}.frecuencia`}>Frecuencia</Label>
                              <Select onValueChange={(value) => setValue(`productos.${productoIndex}.frecuencia`, value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {FRECUENCIAS_COMUNES.map(freq => (
                                    <SelectItem key={freq} value={freq}>
                                      {freq}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor={`productos.${productoIndex}.tipoTratamiento`}>Tipo de Tratamiento</Label>
                              <Input
                                {...register(`productos.${productoIndex}.tipoTratamiento`)}
                                placeholder="Ej: Facial, Corporal, Mixto..."
                              />
                            </div>
                          </div>

                          {/* Observaciones y documentación */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`productos.${productoIndex}.observaciones`}>Observaciones</Label>
                              <Textarea
                                {...register(`productos.${productoIndex}.observaciones`)}
                                placeholder="Detalles adicionales, condiciones especiales..."
                                className="min-h-[60px]"
                              />
                            </div>

                            <div>
                              <Label htmlFor={`productos.${productoIndex}.documentosAduaneros`}>Documentos Aduaneros</Label>
                              <Textarea
                                {...register(`productos.${productoIndex}.documentosAduaneros`)}
                                placeholder="BL, Factura comercial, Certificados..."
                                className="min-h-[60px]"
                              />
                            </div>
                          </div>

                          {/* Imagen del equipo */}
                          <div>
                            <Label>Imagen del Equipo</Label>
                            <div className="flex items-center space-x-4">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImagenChange}
                                className="hidden"
                                id={`imagen-upload-${productoIndex}`}
                              />
                              <Label
                                htmlFor={`imagen-upload-${productoIndex}`}
                                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Subir Imagen
                              </Label>

                              {imagenEquipo && (
                                <img
                                  src={imagenEquipo}
                                  alt="Preview"
                                  className="w-16 h-16 object-cover rounded border"
                                />
                              )}
                            </div>
                          </div>

                          {/* Subitems del equipo */}
                          <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-3">
                              <Label className="text-base font-medium">Componentes/Subitems del Equipo</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => agregarSubitem(productoIndex)}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Agregar Componente
                              </Button>
                            </div>

                            {(!productosWatched[productoIndex]?.subitems ||
                              productosWatched[productoIndex]?.subitems?.length === 0) ? (
                              <div className="text-center py-4 text-gray-500 text-sm">
                                <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                <p>No hay componentes agregados</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {productosWatched[productoIndex]?.subitems?.map((subitem, subitemIndex) => (
                                  <div
                                    key={subitemIndex}
                                    className="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 bg-gray-50 rounded border"
                                  >
                                    <div className="md:col-span-2">
                                      <Label>Nombre del Componente</Label>
                                      <Input
                                        {...register(`productos.${productoIndex}.subitems.${subitemIndex}.nombre`)}
                                        placeholder="Ej: Cable de Encendido, Componente..."
                                      />
                                    </div>
                                    <div>
                                      <Label>N° Serie</Label>
                                      <Input
                                        {...register(`productos.${productoIndex}.subitems.${subitemIndex}.numeroSerie`)}
                                        placeholder="Número de serie..."
                                      />
                                    </div>
                                    <div>
                                      <Label>Cantidad</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        {...register(`productos.${productoIndex}.subitems.${subitemIndex}.cantidad`, { valueAsNumber: true })}
                                      />
                                    </div>
                                    {/* 🎯 NUEVO: Checkbox para Servicio Técnico */}
                                    <div className="flex flex-col items-center justify-center">
                                      <Label className="text-xs text-center mb-2">
                                        🔧 Mantenimiento<br />Técnico
                                      </Label>
                                      <input
                                        type="checkbox"
                                        {...register(`productos.${productoIndex}.subitems.${subitemIndex}.paraServicioTecnico`)}
                                        className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                    </div>
                                    <div className="flex items-end">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removerSubitem(productoIndex, subitemIndex)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Indicador de envío automático */}
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <p className="text-green-800 text-sm font-medium">
                                ✅ Este equipo se enviará automáticamente al módulo de Servicio Técnico
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Botones de acción */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-end"
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={() => {
                console.log('🔥 BOTÓN CLICKEADO!');
                console.log('🔥 isLoading:', isLoading);
                console.log('🔥 modoFormulario:', modoFormulario);
                console.log('🔥 marcaSeleccionada:', marcaSeleccionada);
                console.log('🔥 productosRapidos.length:', productosRapidos.length);
                console.log('🔥 disabled condition:', isLoading ||
                  (modoFormulario === 'rapido' && (!marcaSeleccionada || productosRapidos.length === 0)) ||
                  (modoFormulario === 'equipo' && productosEquipo.length === 0)
                );
              }}
              disabled={isLoading ||
                (modoFormulario === 'rapido' && (!marcaSeleccionada || productosRapidos.length === 0)) ||
                (modoFormulario === 'equipo' && productosEquipo.length === 0)
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  <span>
                    {modoFormulario === 'rapido'
                      ? `Guardar Carga (${productosRapidos.length} productos)`
                      : `Guardar Equipos (${productosEquipo.length} equipos → Servicio Técnico)`
                    }
                  </span>
                </>
              )}
            </Button>
          </motion.div>
        </form>

        {/* 🔧 NUEVO: Modal de equipos ingresados para reparación */}
        <EquipoIngresadoModal
          open={equipoIngresadoModalOpen}
          onOpenChange={setEquipoIngresadoModalOpen}
          onSave={async (equipoData) => {
            console.log('🔧 Equipo ingresado guardado desde modal:', equipoData);
            toast.success('Equipo registrado para servicio técnico exitosamente');
            // Cerrar el modal después de guardar
            setEquipoIngresadoModalOpen(false);
          }}
        />
        
        {/* Modal de Fraccionamiento */}
        {mostrarFraccionamiento.visible && mostrarFraccionamiento.producto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="max-w-2xl w-full mx-4">
              <IngresoFraccionamiento
                productoCargaId={mostrarFraccionamiento.producto.id}
                productoNombre={mostrarFraccionamiento.producto.nombre}
                cantidadInicial={mostrarFraccionamiento.producto.cantidad}
                productoMarca={marcaSeleccionada}
                productoModelo={mostrarFraccionamiento.producto.nombre} // Usar el nombre como modelo por defecto
                onSuccess={() => {
                  setMostrarFraccionamiento({visible: false, producto: null});
                  toast.success('Configuración de fraccionamiento guardada');
                }}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
