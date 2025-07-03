import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Equipo, Mantenimiento, ComponenteEquipo, CargaMercaderia, ProductoCarga, ComponenteDisponible, AsignacionComponente, PlanMantenimiento, Tecnico, AppState } from '@/types';
import { EquipoFormData, CargaMercaderiaFormData } from '@/lib/schemas';
import { 
  createCargaMercaderia, 
  getAllCargas, 
  generateCodigoCarga as dbGenerateCodigoCarga,
  getAllEquipos,
  createEquipo,
  createMantenimiento,
  getAllMantenimientos,
  getEstadisticasDashboard,
  updateComponente as dbUpdateComponente,
  updateMantenimiento as dbUpdateMantenimiento,
  deleteMantenimiento as dbDeleteMantenimiento,
  deleteCargaMercaderia,
  deleteEquipo,
  getAllComponentesDisponibles,
  asignarComponenteAEquipo,
  getHistorialAsignaciones as dbGetHistorialAsignaciones
} from '@/lib/database';

// Datos de ejemplo actualizados
const equiposEjemplo: Equipo[] = [
  {
    id: '1',
    cliente: 'Ares',
    ubicacion: 'Asuncion',
    nombreEquipo: 'KIT-ARES-001',
    tipoEquipo: 'Kit hydra',
    marca: 'Ares',
    modelo: 'MPT',
    numeroSerieBase: 'ARES-2024-001',
    componentes: [
      {
        id: 'comp-1-1',
        nombre: 'Unidad Principal',
        numeroSerie: 'ARES-2024-001-MAIN',
        estado: 'Operativo',
        observaciones: 'Unidad base del kit hydra'
      },
      {
        id: 'comp-1-2',
        nombre: 'Cable de Encendido',
        numeroSerie: 'ARES-2024-001-CABLE',
        estado: 'Operativo',
        observaciones: 'Cable de encendido principal'
      }
    ],
    accesorios: 'Cable de encendido, componentes adicionales',
    fechaEntrega: '2024-01-15',
    observaciones: 'Kit instalado en Asuncion',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    cliente: 'Ares',
    ubicacion: 'Asuncion',
    nombreEquipo: 'KIT-ARES-002',
    tipoEquipo: 'Kit hydra',
    marca: 'Ares',
    modelo: 'MPT',
    numeroSerieBase: 'ARES-2024-002',
    componentes: [
      {
        id: 'comp-2-1',
        nombre: 'Kit Principal',
        numeroSerie: 'ARES-2024-002-KIT',
        estado: 'Operativo',
        observaciones: 'Kit hydra modelo MPT'
      },
      {
        id: 'comp-2-2',
        nombre: 'Cable de Encendido',
        numeroSerie: 'ARES-2024-002-CABLE',
        estado: 'En reparacion',
        observaciones: 'Requiere revisión'
      },
      {
        id: 'comp-2-3',
        nombre: 'Componente Adicional',
        numeroSerie: 'ARES-2024-002-COMP',
        estado: 'Operativo',
        observaciones: 'Componente estándar'
      }
    ],
    accesorios: 'Cable de encendido, componentes adicionales MPT',
    fechaEntrega: '2024-02-10',
    observaciones: 'Kit para Ares Asuncion',
    createdAt: '2024-02-10T14:30:00Z',
  },
  {
    id: '3',
    cliente: 'Ares',
    ubicacion: 'Asuncion',
    nombreEquipo: 'KIT-ARES-003',
    tipoEquipo: 'Kit hydra',
    marca: 'Ares',
    modelo: 'MPT',
    numeroSerieBase: 'ARES-2024-003',
    componentes: [
      {
        id: 'comp-3-1',
        nombre: 'Unidad Principal',
        numeroSerie: 'ARES-2024-003-MAIN',
        estado: 'Operativo',
        observaciones: 'Unidad principal del kit hydra'
      },
      {
        id: 'comp-3-2',
        nombre: 'Cable de Encendido',
        numeroSerie: 'ARES-2024-003-CABLE1',
        estado: 'Operativo',
        observaciones: 'Cable de encendido primario'
      },
      {
        id: 'comp-3-3',
        nombre: 'Cable de Encendido',
        numeroSerie: 'ARES-2024-003-CABLE2',
        estado: 'Operativo',
        observaciones: 'Cable de encendido secundario'
      }
    ],
    accesorios: 'Cables de encendido, componentes MPT',
    fechaEntrega: '2024-03-05',
    observaciones: 'Kit hydra para Ares Asuncion',
    createdAt: '2024-03-05T09:15:00Z',
  },
];

const mantenimientosEjemplo: Mantenimiento[] = [
  {
    id: '1',
    equipoId: '1',
    componenteId: 'comp-1-1',
    fecha: '2024-03-15',
    descripcion: 'El equipo no enciende después de un corte de luz. Se reporta que no responde al botón de encendido.',
    estado: 'Finalizado',
    tipo: 'Correctivo',
    prioridad: 'Alta',
    comentarios: 'Se reemplazó el fusible interno. Equipo funcionando correctamente.',
    createdAt: '2024-03-15T08:00:00Z',
  },
  {
    id: '2',
    equipoId: '2',
    componenteId: 'comp-2-2',
    fecha: '2024-03-20',
    descripcion: 'Alarma de SpO2 se activa constantemente sin motivo aparente. Los valores parecen correctos.',
    estado: 'En proceso',
    tipo: 'Correctivo',
    prioridad: 'Media',
    comentarios: 'Se está calibrando el sensor. Pendiente de pruebas finales.',
    createdAt: '2024-03-20T11:30:00Z',
  },
  {
    id: '3',
    equipoId: '1',
    componenteId: 'comp-1-2',
    fecha: '2024-03-25',
    descripcion: 'Electrodos muestran lecturas inconsistentes en algunas derivaciones.',
    estado: 'Pendiente',
    tipo: 'Correctivo',
    prioridad: 'Crítica',
    comentarios: '',
    createdAt: '2024-03-25T16:45:00Z',
  },
];

// Datos de ejemplo para cargas de mercadería - REDISEÑADO
const cargasMercaderiaEjemplo: CargaMercaderia[] = [
  {
    id: '1',
    codigoCarga: 'ARES042025',
    fechaIngreso: '2024-12-01',
    tipoCarga: 'cliente',
    cliente: 'Ares',
    ubicacionServicio: 'Asuncion',
    destino: 'Ares - Asuncion',
    observacionesGenerales: 'Carga completa de kits hydra para Ares Paraguay',
    productos: [
      {
        id: 'prod-1-1',
        producto: 'Kit hydra',
        tipoProducto: 'Equipo Médico',
        marca: 'Ares',
        modelo: 'MPT',
        numeroSerie: 'ARES-KH-2024-001',
        cantidad: 1,
        observaciones: 'Kit hydra principal modelo MPT',
        subitems: [
          {
            id: 'sub-1-1-1',
            nombre: 'Cable de Encendido',
            numeroSerie: 'ARES-CE-2024-001-1',
            cantidad: 1
          },
          {
            id: 'sub-1-1-2',
            nombre: 'Cable de Encendido',
            numeroSerie: 'ARES-CE-2024-001-2',
            cantidad: 1
          }
        ]
      },
      {
        id: 'prod-1-2',
        producto: 'Componentes Kit hydra',
        tipoProducto: 'Insumo',
        marca: 'Ares',
        modelo: 'MPT',
        numeroSerie: 'ARES-COMP-MPT-001',
        cantidad: 5,
        observaciones: 'Componentes adicionales para kit hydra MPT'
      },
      {
        id: 'prod-1-3',
        producto: 'Manual Kit hydra',
        tipoProducto: 'Insumo',
        marca: 'Ares',
        modelo: 'MPT',
        cantidad: 1,
        observaciones: 'Manual de operación modelo MPT'
      }
    ],
    createdAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '2',
    codigoCarga: 'ARES042025-B',
    fechaIngreso: '2024-12-01',
    tipoCarga: 'cliente',
    cliente: 'Ares',
    ubicacionServicio: 'Asuncion',
    destino: 'Ares - Asuncion',
    observacionesGenerales: 'Carga adicional de repuestos y cables para kits hydra',
    productos: [
      {
        id: 'prod-2-1',
        producto: 'Cables de Repuesto',
        tipoProducto: 'Repuesto',
        marca: 'Ares',
        modelo: 'MPT',
        cantidad: 10,
        observaciones: 'Cables de encendido de repuesto para kit hydra'
      },
      {
        id: 'prod-2-2',
        producto: 'Kit hydra',
        tipoProducto: 'Equipo Médico',
        marca: 'Ares',
        modelo: 'MPT',
        cantidad: 1,
        observaciones: 'Kit hydra adicional modelo MPT'
      }
    ],
    createdAt: '2024-12-01T11:30:00Z',
  },
];

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  equipos: equiposEjemplo,
  mantenimientos: [
    ...mantenimientosEjemplo,
    // 🗓️ MANTENIMIENTOS PROGRAMADOS - Ahora se cargan desde la base de datos
    // Los mantenimientos programados se crean usando createMantenimiento() que genera UUIDs válidos
  ],
  cargasMercaderia: cargasMercaderiaEjemplo,
  componentesDisponibles: [],
  historialAsignaciones: [],
  
  // 🆕 NUEVOS ARRAYS INICIALES
  planesMantenimiento: [],
  tecnicos: [
    // Técnico único de ARES
    {
      id: 'tecnico-ares-javier-lopez', // ID único pero compatible
      nombre: 'Javier Lopez',
      especialidades: ['Equipos Médicos Generales', 'Equipos de Imagen', 'Electromedicina', 'Ultrasonido', 'Monitores', 'Desfibriladores'],
      disponibilidad: {
        lunes: { inicio: '08:00', fin: '17:00', disponible: true },
        martes: { inicio: '08:00', fin: '17:00', disponible: true },
        miercoles: { inicio: '08:00', fin: '17:00', disponible: true },
        jueves: { inicio: '08:00', fin: '17:00', disponible: true },
        viernes: { inicio: '08:00', fin: '17:00', disponible: true },
        sabado: { inicio: '08:00', fin: '12:00', disponible: false },
        domingo: { inicio: '08:00', fin: '12:00', disponible: false }
      },
      activo: true
    }
  ],

  // ===============================================
  // FUNCIONES DE EQUIPOS
  // ===============================================
  addEquipo: async (equipoData: any) => {
    try {
      console.log('🔄 Agregando equipo manual...', equipoData);
      
      // Crear equipo en la base de datos
      const equipoCreado = await createEquipo(equipoData);
      
      // Recargar todos los equipos para actualizar la lista
      const equipos = await getAllEquipos();
      set({ equipos });
      
      console.log('✅ Equipo agregado exitosamente y lista actualizada');
      
      return equipoCreado;
    } catch (error) {
      console.error('❌ Error adding equipo:', error);
      throw error;
    }
  },

  // ===============================================
  // FUNCIONES DE MANTENIMIENTOS
  // ===============================================
  addMantenimiento: async (mantenimientoData: any) => {
    try {
      await createMantenimiento({
        equipoId: mantenimientoData.equipoId,
        componenteId: mantenimientoData.componenteId,
        descripcion: mantenimientoData.descripcion,
        estado: mantenimientoData.estado,
        comentarios: mantenimientoData.comentarios,
        archivo: mantenimientoData.archivo
      })
      
      // Recargar mantenimientos
      const mantenimientos = await getAllMantenimientos()
      set({ mantenimientos })
    } catch (error) {
      console.error('Error adding mantenimiento:', error)
      throw error
    }
  },

  updateMantenimiento: async (id: string, updates: Partial<Mantenimiento>) => {
    try {
      await dbUpdateMantenimiento(id, updates)
      
      // Recargar mantenimientos para reflejar los cambios
      const mantenimientos = await getAllMantenimientos()
      set({ mantenimientos })
      
      console.log('✅ Mantenimiento actualizado exitosamente')
    } catch (error) {
      console.error('❌ Error updating mantenimiento:', error)
      throw error
    }
  },

  deleteMantenimiento: async (id: string) => {
    try {
      await dbDeleteMantenimiento(id)
      
      // Recargar mantenimientos para reflejar los cambios
      const mantenimientos = await getAllMantenimientos()
      set({ mantenimientos })
      
      console.log('✅ Mantenimiento eliminado exitosamente')
    } catch (error) {
      console.error('❌ Error deleting mantenimiento:', error)
      throw error
    }
  },

  updateComponente: async (equipoId: string, componenteId: string, updates: any) => {
    try {
      await dbUpdateComponente(componenteId, updates)
      
      // Recargar equipos para reflejar los cambios
      const equipos = await getAllEquipos()
      set({ equipos })
      
      console.log('✅ Componente actualizado exitosamente')
    } catch (error) {
      console.error('❌ Error updating componente:', error)
      throw error
    }
  },

  getMantenimientosByEquipo: (equipoId: string) => {
    const { mantenimientos } = get();
    return mantenimientos.filter((m) => m.equipoId === equipoId);
  },

  searchEquipos: (term: string) => {
    const { equipos } = get();
    if (!term.trim()) return equipos;
    
    const searchTerm = term.toLowerCase();
    return equipos.filter(
      (equipo) =>
        equipo.cliente.toLowerCase().includes(searchTerm) ||
        equipo.nombreEquipo.toLowerCase().includes(searchTerm) ||
        equipo.numeroSerieBase.toLowerCase().includes(searchTerm) ||
        equipo.marca.toLowerCase().includes(searchTerm) ||
        equipo.modelo.toLowerCase().includes(searchTerm) ||
        equipo.ubicacion.toLowerCase().includes(searchTerm) ||
        equipo.componentes.some(comp => 
          comp.nombre.toLowerCase().includes(searchTerm) ||
          comp.numeroSerie.toLowerCase().includes(searchTerm)
        )
    );
  },

  // ===============================================
  // FUNCIONES DE CARGAS DE MERCADERÍA
  // ===============================================
  generateCodigoCarga: async () => {
    try {
      return await dbGenerateCodigoCarga()
    } catch (error) {
      console.error('Error generating codigo carga:', error)
      // Fallback local en caso de error
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const random = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
      return `ENTRADA-${year}${month}${day}-${random}`;
    }
  },

  addCargaMercaderia: async (cargaData: CargaMercaderiaFormData) => {
    try {
      const nuevaCarga = await createCargaMercaderia(cargaData)
      
      // Actualizar estado local
      set((state) => ({
        cargasMercaderia: [nuevaCarga, ...state.cargasMercaderia]
      }))

      // Recargar equipos (porque pueden haberse creado nuevos)
      const equipos = await getAllEquipos()
      set({ equipos })

      return nuevaCarga
    } catch (error) {
      console.error('Error creating carga mercadería:', error)
      throw error
    }
  },

  getCargasMercaderia: () => {
    const { cargasMercaderia } = get();
    return cargasMercaderia.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  deleteCarga: async (cargaId: string) => {
    try {
      await deleteCargaMercaderia(cargaId)
      
      // Actualizar estado local
      set((state) => ({
        cargasMercaderia: state.cargasMercaderia.filter(carga => carga.id !== cargaId)
      }))

      console.log('✅ Carga eliminada del estado local')
    } catch (error) {
      console.error('❌ Error deleting carga:', error)
      throw error
    }
  },

  deleteEquipo: async (equipoId: string) => {
    try {
      await deleteEquipo(equipoId)
      
      // Actualizar estado local
      set((state) => ({
        equipos: state.equipos.filter(equipo => equipo.id !== equipoId),
        mantenimientos: state.mantenimientos.filter(m => m.equipoId !== equipoId)
      }))

      console.log('✅ Equipo eliminado del estado local')
    } catch (error) {
      console.error('❌ Error deleting equipo:', error)
      throw error
    }
  },

  // ===============================================
  // FUNCIONES DE INICIALIZACIÓN
  // ===============================================
  loadAllData: async () => {
    try {
      console.log('🔄 Cargando datos desde Supabase...')
      
      const [cargas, equipos, mantenimientos, componentes, historial] = await Promise.all([
        getAllCargas(),
        getAllEquipos(),
        getAllMantenimientos(),
        getAllComponentesDisponibles(),
        dbGetHistorialAsignaciones()
      ])

      set({
        cargasMercaderia: cargas,
        equipos: equipos,
        mantenimientos: mantenimientos,
        componentesDisponibles: componentes,
        historialAsignaciones: historial
      })

      console.log('✅ Datos cargados exitosamente:', {
        cargas: cargas.length,
        equipos: equipos.length,
        mantenimientos: mantenimientos.length,
        componentes: componentes.length,
        asignaciones: historial.length
      })
    } catch (error) {
      console.error('❌ Error loading data from Supabase:', error)
      // Mantener datos locales como fallback si fallan
    }
  },

  // ===============================================
  // ESTADÍSTICAS DASHBOARD
  // ===============================================
  getEstadisticas: async () => {
    try {
      return await getEstadisticasDashboard()
    } catch (error) {
      console.error('Error getting estadísticas:', error)
      // Fallback con datos locales
      const { cargasMercaderia } = get()
      const totalCargas = cargasMercaderia.length
      const cargasHoy = cargasMercaderia.filter(
        carga => carga.fechaIngreso === new Date().toISOString().split('T')[0]
      ).length
      const totalProductos = cargasMercaderia.reduce((acc, carga) => acc + carga.productos.length, 0)
      const equiposMedicos = cargasMercaderia.reduce((acc, carga) => {
        return acc + carga.productos.filter(producto => producto.tipoProducto === 'Equipo Médico').length
      }, 0)

      return {
        totalCargas,
        cargasHoy,
        totalProductos,
        equiposMedicos
      }
    }
  },

  // ===============================================
  // FUNCIONES DE INVENTARIO TÉCNICO
  // ===============================================
  loadInventarioTecnico: async () => {
    try {
      console.log('🔄 Cargando inventario técnico desde Supabase...')
      
      const [componentes, historial] = await Promise.all([
        getAllComponentesDisponibles(),
        dbGetHistorialAsignaciones()
      ])

      set({
        componentesDisponibles: componentes,
        historialAsignaciones: historial
      })

      console.log('✅ Inventario técnico cargado exitosamente:', {
        componentes: componentes.length,
        asignaciones: historial.length
      })
    } catch (error) {
      console.error('❌ Error loading inventario técnico:', error)
    }
  },

  asignarComponente: async (
    componenteId: string, 
    equipoId: string, 
    cantidadAsignada: number, 
    motivo: string, 
    tecnicoResponsable?: string, 
    observaciones?: string
  ) => {
    try {
      await asignarComponenteAEquipo(
        componenteId, 
        equipoId, 
        cantidadAsignada, 
        motivo, 
        tecnicoResponsable, 
        observaciones
      )
      
      // Recargar inventario técnico y equipos
      const [componentes, historial, equipos] = await Promise.all([
        getAllComponentesDisponibles(),
        dbGetHistorialAsignaciones(),
        getAllEquipos()
      ])

      set({
        componentesDisponibles: componentes,
        historialAsignaciones: historial,
        equipos: equipos
      })

      console.log('✅ Componente asignado exitosamente')
    } catch (error) {
      console.error('❌ Error asignando componente:', error)
      throw error
    }
  },

  getComponentesDisponibles: () => {
    const { componentesDisponibles } = get();
    return componentesDisponibles.filter(comp => comp.estado === 'Disponible' && comp.cantidadDisponible > 0);
  },

  getHistorialAsignaciones: (componenteId?: string, equipoId?: string) => {
    const { historialAsignaciones } = get();
    
    if (componenteId && equipoId) {
      return historialAsignaciones.filter(asig => 
        asig.componenteId === componenteId && asig.equipoId === equipoId
      );
    } else if (componenteId) {
      return historialAsignaciones.filter(asig => asig.componenteId === componenteId);
    } else if (equipoId) {
      return historialAsignaciones.filter(asig => asig.equipoId === equipoId);
    }
    
    return historialAsignaciones;
  },

  // 🆕 NUEVAS FUNCIONES PARA TÉCNICOS
  loadTecnicos: async () => {
    // En el futuro cargar desde Supabase
    // Por ahora usamos los datos por defecto del store
  },

  addTecnico: async (tecnico) => {
    const nuevoTecnico: Tecnico = {
      ...tecnico,
      id: `tecnico-${Date.now()}`
    };
    
    set((state) => ({
      tecnicos: [...state.tecnicos, nuevoTecnico]
    }));
  },

  updateTecnico: async (id, updates) => {
    set((state) => ({
      tecnicos: state.tecnicos.map(tecnico =>
        tecnico.id === id ? { ...tecnico, ...updates } : tecnico
      )
    }));
  },

  getTecnicosDisponibles: () => {
    return get().tecnicos.filter(tecnico => tecnico.activo);
  },

  // 🆕 FUNCIONES PARA PLANES DE MANTENIMIENTO
  loadPlanesMantenimiento: async () => {
    // En el futuro cargar desde Supabase
  },

  addPlanMantenimiento: async (plan) => {
    const nuevoPlan: PlanMantenimiento = {
      ...plan,
      id: `plan-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    set((state) => ({
      planesMantenimiento: [...state.planesMantenimiento, nuevoPlan]
    }));
  },

  // 🆕 FUNCIONES PARA MANTENIMIENTOS PROGRAMADOS
  addMantenimientoProgramado: async (mantenimiento) => {
    try {
      // Usar la función createMantenimiento para que Supabase genere el UUID
      await createMantenimiento({
        equipoId: mantenimiento.equipoId,
        descripcion: mantenimiento.descripcion,
        estado: 'Pendiente'
      });
      
      // Recargar mantenimientos desde la base de datos
      const mantenimientos = await getAllMantenimientos();
      set({ mantenimientos });
      
      console.log('✅ Mantenimiento programado creado exitosamente');
    } catch (error) {
      console.error('❌ Error creating mantenimiento programado:', error);
      throw error;
    }
  },

  getMantenimientosProgramados: () => {
    return get().mantenimientos.filter(m => 
      m.tipo === 'Preventivo' || m.esProgramado
    );
  },

  getMantenimientosByTecnico: (tecnico) => {
    return get().mantenimientos.filter(m => 
      m.tecnicoAsignado === tecnico
    );
  },

  getMantenimientosVencidos: () => {
    const hoy = new Date();
    return get().mantenimientos.filter(m => {
      if (m.estado === 'Finalizado') return false;
      const fechaMantenimiento = new Date(m.fechaProgramada || m.fecha);
      return fechaMantenimiento < hoy;
    });
  },
    }),
    {
      name: 'ares-app-store',
      partialize: (state) => ({
        equipos: state.equipos,
        mantenimientos: state.mantenimientos,
        cargasMercaderia: state.cargasMercaderia,
        componentesDisponibles: state.componentesDisponibles,
        historialAsignaciones: state.historialAsignaciones,
        planesMantenimiento: state.planesMantenimiento,
        tecnicos: state.tecnicos,
      }),
    }
  )
);

export { useAppStore };

// Hook para cargar datos al inicializar la app
export const useInitializeApp = () => {
  const loadAllData = useAppStore(state => state.loadAllData)
  
  return {
    loadAllData
  }
}

// 🎯 Función simple para filtrar componentes marcados manualmente para Servicio Técnico
const filtrarComponentesParaServicioTecnico = (subitems: any[] = []) => {
  // Simplemente filtrar los que están marcados como "paraServicioTecnico"
  return subitems.filter(subitem => subitem.paraServicioTecnico === true);
};

// 🎯 Función para verificar si un producto principal está marcado para servicio técnico
const esProductoParaServicioTecnico = (producto: ProductoCarga) => {
  return producto.paraServicioTecnico === true;
};

// Función actualizada para envío inteligente al módulo de Servicio Técnico
export const addEquipoAlServicioTecnico = (producto: ProductoCarga, carga: CargaMercaderia) => {
  // 🔧 CASO ESPECIAL: Si el tipo de carga es "reparacion", enviar directamente al inventario técnico como "En reparación"
  if (carga.tipoCarga === 'reparacion') {
    console.log('🔧 Procesando entrada de REPARACIÓN - enviando al inventario técnico con estado "En reparación"');
    // TODO: Implementar lógica para enviar directamente al inventario técnico
    // Por ahora, continuamos con la lógica normal pero marcamos que es reparación
  }
  
  // 🎯 NUEVO: Verificar si es equipo médico O producto marcado manualmente para servicio técnico
  if (producto.tipoProducto === 'Equipo Médico' || esProductoParaServicioTecnico(producto)) {
    // 🔧 Filtrar solo componentes que realmente necesitan servicio técnico
    const componentesParaServicio = filtrarComponentesParaServicioTecnico(producto.subitems);
    
    // Crear lista de accesorios no técnicos para información
    const accesoriosGenerales = producto.subitems?.filter(subitem => 
      !componentesParaServicio.some(comp => comp.id === subitem.id)
    ) || [];

    // Convertir el producto de la carga a formato de equipo para el módulo de servicio técnico
    const equipoParaServicio: EquipoFormData = {
      cliente: carga.destino.split(' - ')[0] || carga.destino,
      ubicacion: carga.destino,
      nombreEquipo: `${producto.producto}-${carga.codigoCarga}`,
      tipoEquipo: producto.producto,
      marca: producto.marca,
      modelo: producto.modelo,
      numeroSerieBase: producto.numeroSerie || 'SIN-SERIE',
      componentes: [
        {
          nombre: 'Equipo Principal',
          numeroSerie: producto.numeroSerie || 'SIN-SERIE',
          estado: 'Operativo' as const,
          observaciones: `Cantidad: ${producto.cantidad}. ${producto.observaciones || ''}. ${esProductoParaServicioTecnico(producto) ? '🎯 Marcado manualmente para servicio técnico' : ''}`
        },
        // 🎯 Solo componentes filtrados que necesitan mantenimiento
        ...componentesParaServicio.map(componente => ({
          nombre: componente.nombre,
          numeroSerie: componente.numeroSerie || 'SIN-SERIE', // 🔧 Manejar números de serie opcionales
          estado: 'Operativo' as const,
          observaciones: `Cantidad: ${componente.cantidad}. Componente técnico que requiere mantenimiento.`
        }))
      ],
      // Incluir todos los accesorios como información, pero no como componentes
      accesorios: [
        ...componentesParaServicio.map(c => c.nombre),
        ...(accesoriosGenerales.length > 0 ? [`📋 Accesorios adicionales: ${accesoriosGenerales.map(a => a.nombre).join(', ')}`] : [])
      ].join(', ') || 'Sin accesorios específicos',
      fechaEntrega: carga.fechaIngreso,
      observaciones: `${producto.tipoProducto === 'Equipo Médico' ? '🤖 Enviado automáticamente' : '🎯 Marcado manualmente'} desde Mercaderías. Código: ${carga.codigoCarga}. 
      🔧 Componentes técnicos: ${componentesParaServicio.length}
      📦 Accesorios generales: ${accesoriosGenerales.length}
      ${carga.observacionesGenerales || ''} ${producto.observaciones || ''}`,
    };

    // Simular el envío al store (en producción esto sería una API call)
    useAppStore.getState().addEquipo(equipoParaServicio);
    
    console.log('✅ Producto enviado al Servicio Técnico:', {
      tipo: producto.tipoProducto === 'Equipo Médico' ? 'Automático (Equipo Médico)' : 'Manual (Marcado)',
      codigoCarga: carga.codigoCarga,
      producto: producto.producto,
      destino: carga.destino,
      totalSubitems: producto.subitems?.length || 0,
      componentesMarcados: componentesParaServicio.length,
      accesoriosGenerales: accesoriosGenerales.length,
      componentesEnviados: componentesParaServicio.map(c => c.nombre)
    });
  }
}; 