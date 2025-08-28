'use client';

import { motion } from 'framer-motion';
import { Card } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { useFieldMode } from '@/hooks/useDevice';
import { 
  ChevronRight,
  MapPin,
  Calendar,
  Eye,
  Trash2,
  Heart,
  CheckCircle,
  Wrench,
  AlertTriangle,
  History,
  Plus
} from 'lucide-react';

interface MobileTableColumn {
  key: string;
  label: string;
  mobile?: boolean; // Si se muestra en móvil
  desktop?: boolean; // Si se muestra en desktop
}

interface MobileTableProps {
  data: any[];
  columns: MobileTableColumn[];
  renderMobileCard: (item: any, index: number) => React.ReactNode;
  renderDesktopRow: (item: any, index: number) => React.ReactNode;
  emptyStateIcon?: React.ComponentType<any>;
  emptyStateTitle?: string;
  emptyStateMessage?: string;
}

export function MobileTable({
  data,
  columns,
  renderMobileCard,
  renderDesktopRow,
  emptyStateIcon: EmptyIcon = Heart,
  emptyStateTitle = "No hay datos",
  emptyStateMessage = "No se encontraron elementos"
}: MobileTableProps) {
  const { isFieldMode, screenWidth } = useFieldMode();
  
  // 🔧 MEJORADO: Detección más agresiva de móvil
  const shouldUseMobile = isFieldMode || screenWidth < 1024 || (typeof window !== 'undefined' && window.innerWidth < 1024);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <EmptyIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-2 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">{emptyStateTitle}</h3>
        <p className="text-sm text-gray-500">{emptyStateMessage}</p>
      </div>
    );
  }

  if (shouldUseMobile) {
    // Versión móvil: Cards apiladas
    return (
      <div className="space-y-2 sm:space-y-3 p-2 sm:p-3">
        {data.map((item, index) => (
          <motion.div
            key={item.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {renderMobileCard(item, index)}
          </motion.div>
        ))}
      </div>
    );
  }

  // Versión desktop: Tabla optimizada sin min-width fijo
  return (
    <div className="h-full flex flex-col">
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full table-auto">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-200">
              {columns.filter(col => col.desktop !== false).map((column, index) => {
                // Definir anchos flexibles para evitar scroll horizontal
                const getColumnWidth = (key: string) => {
                  switch (key) {
                    case 'equipo': return 'w-1/4 min-w-0'; // Equipo - 25%
                    case 'cliente': return 'w-1/4 min-w-0'; // Cliente - 25%
                    case 'estado': return 'w-1/6 min-w-0'; // Estado - 16.67%
                    case 'componentes': return 'w-1/12 min-w-0'; // Componentes - 8.33%
                    case 'mantenimientos': return 'w-1/12 min-w-0'; // Mantenimientos - 8.33%
                    case 'acciones': return 'w-1/6 min-w-0'; // Acciones - 16.67%
                    default: return 'min-w-0 flex-1';
                  }
                };
                
                return (
                  <th 
                    key={column.key} 
                    className={`text-left py-2 px-2 font-medium text-gray-600 bg-white text-xs ${getColumnWidth(column.key)}`}
                  >
                    {column.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <motion.tr
                key={item.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                {renderDesktopRow(item, index)}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Componente específico para equipos móviles
interface MobileEquipoCardProps {
  equipo: any;
  estadoGeneral: string;
  componentes: { operativos: number; total: number; enReparacion: number; fueraServicio: number };
  mantenimientosCount: number;
  ultimoMantenimiento: any;
  onVer: (id: string) => void;
  onEliminar: (equipo: { id: string; nombre: string }) => void;
}

export function MobileEquipoCard({
  equipo,
  estadoGeneral,
  componentes,
  mantenimientosCount,
  ultimoMantenimiento,
  onVer,
  onEliminar
}: MobileEquipoCardProps) {
  const getEstadoColor = () => {
    switch (estadoGeneral) {
      case 'CRITICO': return 'border-red-200 bg-red-50';
      case 'REPARACION': return 'border-yellow-200 bg-yellow-50';
      case 'OPERATIVO': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  const getEstadoBadge = () => {
    switch (estadoGeneral) {
      case 'CRITICO':
        return (
          <Badge variant="destructive" className="flex items-center space-x-1 text-xs px-2 py-1 whitespace-nowrap">
            <AlertTriangle className="w-2 h-2 flex-shrink-0" />
            <span>CRÍTICO</span>
          </Badge>
        );
      case 'REPARACION':
        return (
          <Badge variant="secondary" className="bg-yellow-600 text-white flex items-center space-x-1 text-xs px-2 py-1 whitespace-nowrap">
            <Wrench className="w-2 h-2 flex-shrink-0" />
            <span>REPARACIÓN</span>
          </Badge>
        );
      case 'OPERATIVO':
        return (
          <Badge variant="default" className="bg-green-600 flex items-center space-x-1 text-xs px-2 py-1 whitespace-nowrap">
            <CheckCircle className="w-2 h-2 flex-shrink-0" />
            <span>OK</span>
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-xs px-2 py-1 whitespace-nowrap">Sin datos</Badge>;
    }
  };

  return (
    <Card className={`${getEstadoColor()} shadow-sm hover:shadow-md transition-all w-full overflow-hidden`}>
      <div className="p-3 w-full">
        {/* Header compacto */}
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-gray-900 mb-1 truncate">
              {equipo.nombreEquipo}
            </h3>
            <div className="flex items-center text-gray-600 mb-1 min-w-0">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="text-sm font-medium truncate">{equipo.cliente}</span>
            </div>
            <p className="text-xs text-gray-500 truncate">{equipo.ubicacion}</p>
          </div>
          <div className="flex-shrink-0">
            {getEstadoBadge()}
          </div>
        </div>

        {/* Información en filas optimizadas */}
        <div className="space-y-2 mb-3">
          {/* Fila 1: Marca/Modelo */}
          <div className="flex items-center justify-between min-w-0">
            <div className="min-w-0 flex-1">
              <span className="text-xs text-gray-500">Marca: </span>
              <span className="text-sm font-medium text-gray-900 truncate">{equipo.marca}</span>
            </div>
            <Badge variant="outline" className="text-xs px-2 py-0.5 ml-2 flex-shrink-0 whitespace-nowrap">
              {equipo.tipoEquipo}
            </Badge>
          </div>

          {/* Fila 2: Serie */}
          <div className="w-full overflow-hidden">
            <span className="text-xs text-gray-500">Serie: </span>
            <code className="text-xs font-mono bg-gray-100 px-1 py-0.5 rounded truncate inline-block max-w-full">
              {equipo.numeroSerieBase}
            </code>
          </div>
        </div>

        {/* Sección de estadísticas compacta */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 mb-3">
          {/* Componentes */}
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-1">Componentes</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                {componentes.total}
              </Badge>
              {componentes.operativos > 0 && (
                <Badge variant="default" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800">
                  {componentes.operativos}✓
                </Badge>
              )}
              {componentes.enReparacion > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800">
                  {componentes.enReparacion}🔧
                </Badge>
              )}
              {componentes.fueraServicio > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                  {componentes.fueraServicio}❌
                </Badge>
              )}
            </div>
          </div>
          
          {/* Mantenimientos */}
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-1">Mantenimientos</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant={mantenimientosCount > 0 ? 'default' : 'secondary'} className="text-xs px-1.5 py-0.5">
                {mantenimientosCount}
              </Badge>
              {ultimoMantenimiento && (
                <Badge 
                  variant={
                    ultimoMantenimiento.estado === 'Finalizado' ? 'default' :
                    ultimoMantenimiento.estado === 'En proceso' ? 'secondary' : 'destructive'
                  }
                  className="text-xs px-1.5 py-0.5"
                >
                  {ultimoMantenimiento.estado === 'Finalizado' ? 'OK' : 
                   ultimoMantenimiento.estado === 'En proceso' ? 'Proc' : 'Pend'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Acciones compactas */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEliminar({ id: equipo.id, nombre: equipo.nombreEquipo })}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-8 px-2 text-xs flex-shrink-0"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Eliminar
          </Button>
          
          <Button
            size="sm"
            onClick={() => onVer(equipo.id)}
            className="flex items-center space-x-1 h-8 px-3 text-xs flex-shrink-0"
          >
            <Eye className="h-3 w-3" />
            <span>Ver</span>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Componente específico para componentes de inventario técnico móviles
interface MobileComponenteCardProps {
  componente: any;
  tipoColores: any;
  estadoColores: any;
  equipos: any[];
  formatearFecha: (fecha: string) => string;
  onAsignar: (componente: any) => void;
  onAsignarDirecto: (componente: any) => void;
  onHistorial: (componente: any) => void;
  asignando: boolean;
}

export function MobileComponenteCard({
  componente,
  tipoColores,
  estadoColores,
  equipos,
  formatearFecha,
  onAsignar,
  onAsignarDirecto,
  onHistorial,
  asignando
}: MobileComponenteCardProps) {
  // Detectar equipo padre
  let equipoPadreUnico = null;
  let tieneEquipoPadre = false;
  
  if (componente.equipoPadre) {
    equipoPadreUnico = equipos.find(e => e.id === componente.equipoPadre!.equipoId);
    tieneEquipoPadre = !!equipoPadreUnico;
  }
  
  if (!tieneEquipoPadre && componente.codigoCargaOrigen) {
    equipoPadreUnico = equipos.find(equipo => 
      equipo.nombreEquipo.includes(componente.codigoCargaOrigen!)
    );
    tieneEquipoPadre = !!equipoPadreUnico;
  }

  const nombreLimpio = equipoPadreUnico?.nombreEquipo
    .replace(/-ENTRADA-\d{8}-\d{3}/, '')
    .replace(/-\d{8}-\d{3}/, '') || 'Equipo';

  return (
    <Card className="p-4 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900 mb-1">
            {componente.nombre}
          </h3>
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-gray-700">{componente.marca}</span>
            <Badge variant="outline" className="text-xs">
              {componente.modelo}
            </Badge>
          </div>
          <Badge 
            className={`${tipoColores[componente.tipoComponente] || 'bg-gray-100 text-gray-800'}`}
            variant="secondary"
          >
            {componente.tipoComponente}
          </Badge>
        </div>
        
        {/* Estado y Stock */}
        <div className="text-right">
          <div className="mb-1">
            <span className="text-lg font-bold text-blue-600">
              {componente.cantidadDisponible}
            </span>
            <span className="text-sm text-gray-500">
              /{componente.cantidadOriginal}
            </span>
          </div>
          <Badge 
            className={`${estadoColores[componente.estado]} text-xs`}
            variant="secondary"
          >
            {componente.estado}
          </Badge>
        </div>
      </div>

      {/* Información del equipo padre */}
      {tieneEquipoPadre && equipoPadreUnico && (
        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs font-semibold text-blue-700">
            🏥 PARTE DEL EQUIPO {nombreLimpio}/{equipoPadreUnico.cliente.toUpperCase()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Serie base: {equipoPadreUnico.numeroSerieBase}
          </p>
        </div>
      )}

      {/* Información de la carga */}
      {!tieneEquipoPadre && componente.codigoCargaOrigen && (
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <p className="text-xs text-blue-600">
            📦 Ingresado desde {componente.codigoCargaOrigen}
          </p>
        </div>
      )}

      {/* Detalles técnicos */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        {componente.numeroSerie && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">N° Serie</p>
            <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
              {componente.numeroSerie}
            </code>
          </div>
        )}
        
        {componente.ubicacionFisica && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Ubicación</p>
            <div className="flex items-center">
              <MapPin className="w-3 h-3 text-gray-400 mr-1" />
              <span className="text-xs">{componente.ubicacionFisica}</span>
            </div>
          </div>
        )}
        
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha Ingreso</p>
          <div className="flex items-center">
            <Calendar className="w-3 h-3 text-gray-400 mr-1" />
            <span className="text-xs">{formatearFecha(componente.fechaIngreso)}</span>
          </div>
        </div>
      </div>

      {/* Observaciones */}
      {componente.observaciones && (
        <div className="mb-4 p-3 bg-gray-50 border-l-2 border-l-gray-300 rounded-r-sm">
          <p className="text-xs text-gray-700">
            {componente.observaciones}
          </p>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onHistorial(componente)}
          className="flex items-center space-x-1"
        >
          <History className="w-3 h-3" />
          <span>Historial</span>
        </Button>
        
        {componente.cantidadDisponible > 0 && (
          <div className="flex space-x-2">
            {tieneEquipoPadre && equipoPadreUnico ? (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onAsignarDirecto(componente)}
                  className="bg-blue-600 hover:bg-blue-700 text-xs"
                  disabled={asignando}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  → {nombreLimpio.substring(0, 10)}...
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAsignar(componente)}
                  className="text-xs"
                >
                  Otro
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAsignar(componente)}
                disabled={asignando}
              >
                <Plus className="w-3 h-3 mr-1" />
                Asignar
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// Componente específico para cargas de mercadería móviles
interface MobileCargaCardProps {
  carga: any;
  onVer: (id: string) => void;
  onEliminar?: (id: string) => void;
}

export function MobileCargaCard({ carga, onVer, onEliminar }: MobileCargaCardProps) {
  return (
    <Card className="p-4 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900 mb-1">
            {carga.codigoCarga}
          </h3>
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="font-medium">{carga.cliente}</span>
          </div>
          <p className="text-sm text-gray-500">{carga.destino}</p>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>{new Date(carga.fechaIngreso).toLocaleDateString('es-ES')}</span>
        </Badge>
      </div>

      {/* Detalles */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Productos</p>
        <Badge variant="default" className="text-xs">
          {carga.productos.length} productos
        </Badge>
      </div>

      {/* Observaciones */}
      {carga.observacionesGenerales && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Observaciones</p>
          <p className="text-sm text-gray-700">{carga.observacionesGenerales}</p>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        {onEliminar && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEliminar(carga.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Eliminar
          </Button>
        )}
        
        <Button
          size="sm"
          onClick={() => onVer(carga.id)}
          className="flex items-center space-x-2 ml-auto"
        >
          <Eye className="h-4 w-4" />
          <span>Ver Detalles</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
} 