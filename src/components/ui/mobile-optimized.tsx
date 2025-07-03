'use client';

import { motion, PanInfo } from 'framer-motion';
import { useState, useRef } from 'react';
import { Card } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { useFieldMode } from '@/hooks/useDevice';
import { 
  MapPin, 
  ExternalLink, 
  Play, 
  CheckSquare, 
  AlertTriangle,
  Clock,
  ChevronRight,
  Phone,
  Navigation
} from 'lucide-react';

interface MobileMantenimientoCardProps {
  mantenimiento: {
    id: string;
    equipoId: string;
    fecha: string;
    descripcion: string;
    estado: 'Pendiente' | 'En proceso' | 'Finalizado';
    reporteGenerado?: boolean;
  };
  equipo?: {
    id: string;
    marca: string;
    modelo: string;
    cliente: string;
    ubicacion: string;
  };
  onEquipoClick: (equipoId: string) => void;
  onEstadoChange: (mantenimientoId: string, nuevoEstado: 'En proceso' | 'Finalizado', mantenimiento?: any) => Promise<void>;
  diasTranscurridos: string;
  esUrgente: boolean;
}

export function MobileMantenimientoCard({
  mantenimiento,
  equipo,
  onEquipoClick,
  onEstadoChange,
  diasTranscurridos,
  esUrgente
}: MobileMantenimientoCardProps) {
  const { isFieldMode, fieldConfig } = useFieldMode();
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePan = (event: any, info: PanInfo) => {
    const threshold = 100;
    
    if (Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0) {
        setSwipeDirection('right');
      } else {
        setSwipeDirection('left');
      }
    } else {
      setSwipeDirection(null);
    }
  };

  const handlePanEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold && mantenimiento.estado === 'Pendiente') {
      // Swipe right: Iniciar mantenimiento
      onEstadoChange(mantenimiento.id, 'En proceso');
    } else if (info.offset.x < -threshold && mantenimiento.estado === 'En proceso') {
      // Swipe left: Finalizar mantenimiento
      onEstadoChange(mantenimiento.id, 'Finalizado', mantenimiento);
    }
    
    setSwipeDirection(null);
  };

  if (!isFieldMode) {
    // Versión desktop normal
    return (
      <Card className={`${fieldConfig.cardPadding} hover:shadow-md transition-all cursor-pointer ${
        esUrgente ? 'border-red-200 bg-red-50' : 
        mantenimiento.estado === 'En proceso' ? 'border-yellow-200 bg-yellow-50' : 
        'border-gray-200 bg-white'
      }`}
      onClick={() => onEquipoClick(mantenimiento.equipoId)}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900">
                {equipo?.marca} {equipo?.modelo}
              </h4>
              {esUrgente && (
                <Badge variant="destructive" className="text-xs">
                  URGENTE
                </Badge>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="h-3 w-3 mr-1" />
              {equipo?.cliente}
            </div>
            <p className="text-sm text-gray-700">
              {mantenimiento.descripcion.length > 50 
                ? `${mantenimiento.descripcion.substring(0, 50)}...` 
                : mantenimiento.descripcion
              }
            </p>
          </div>
          <ExternalLink className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">
            {diasTranscurridos}
          </span>
          
          {mantenimiento.estado === 'Pendiente' && (
            <Button size="sm" variant="outline" className="text-xs h-7 px-3">
              <Play className="h-3 w-3 mr-1" />
              Iniciar
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Versión móvil optimizada para campo
  return (
    <motion.div
      ref={cardRef}
      drag="x"
      dragConstraints={{ left: -150, right: 150 }}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
      className="relative"
      whileTap={{ scale: 0.98 }}
    >
      {/* Indicadores de swipe */}
      {swipeDirection === 'right' && mantenimiento.estado === 'Pendiente' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute left-0 top-0 bottom-0 w-20 bg-green-500 rounded-l-lg flex items-center justify-center z-10"
        >
          <Play className="h-6 w-6 text-white" />
        </motion.div>
      )}
      
      {swipeDirection === 'left' && mantenimiento.estado === 'En proceso' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute right-0 top-0 bottom-0 w-20 bg-blue-500 rounded-r-lg flex items-center justify-center z-10"
        >
          <CheckSquare className="h-6 w-6 text-white" />
        </motion.div>
      )}

      <Card className={`${fieldConfig.cardPadding} ${fieldConfig.touchTargetSize} ${
        esUrgente ? 'border-red-200 bg-red-50' : 
        mantenimiento.estado === 'En proceso' ? 'border-yellow-200 bg-yellow-50' : 
        'border-gray-200 bg-white'
      } shadow-lg`}>
        
        {/* Header con estado prominente */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {mantenimiento.estado === 'Pendiente' && (
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
            {mantenimiento.estado === 'En proceso' && (
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
            )}
            
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {equipo?.marca} {equipo?.modelo}
              </h3>
              <div className="flex items-center text-gray-600 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="font-medium">{equipo?.cliente}</span>
              </div>
            </div>
          </div>
          
          {esUrgente && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              <AlertTriangle className="h-4 w-4 mr-1" />
              URGENTE
            </Badge>
          )}
        </div>

        {/* Descripción */}
        <p className="text-gray-700 mb-4 leading-relaxed">
          {mantenimiento.descripcion}
        </p>

        {/* Footer con acciones */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              {diasTranscurridos}
            </div>
            
            {/* Botón de llamada rápida */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3"
              onClick={(e) => {
                e.stopPropagation();
                // Aquí iría la lógica de llamada
                window.open(`tel:+595981234567`, '_self');
              }}
            >
              <Phone className="h-3 w-3 mr-1" />
              Llamar
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Botón de navegación */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3"
              onClick={(e) => {
                e.stopPropagation();
                // Aquí iría la integración con Google Maps
                const address = encodeURIComponent(equipo?.ubicacion || '');
                window.open(`https://maps.google.com/?q=${address}`, '_blank');
              }}
            >
              <Navigation className="h-3 w-3 mr-1" />
              Ir
            </Button>

            {/* Botón principal de acción */}
            <Button
              size="sm"
              className={`h-8 px-4 ${fieldConfig.touchTargetSize}`}
              onClick={() => onEquipoClick(mantenimiento.equipoId)}
            >
              Ver Detalles
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Instrucciones de swipe */}
        {mantenimiento.estado === 'Pendiente' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Desliza → para iniciar mantenimiento
            </p>
          </div>
        )}
        
        {mantenimiento.estado === 'En proceso' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Desliza ← para finalizar mantenimiento
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// Componente para stats cards optimizadas para móvil
export function MobileStatsCard({ 
  stat, 
  index 
}: { 
  stat: { name: string; value: number; icon: any; color: string; bgColor: string; textColor: string }, 
  index: number 
}) {
  const { isFieldMode } = useFieldMode();

  if (!isFieldMode) {
    return null; // Usar la versión desktop normal
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <Card className="p-4 hover:shadow-lg transition-all active:shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{stat.name}</p>
            <motion.p 
              className="text-2xl font-bold text-gray-900"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
            >
              {stat.value}
            </motion.p>
          </div>
          <motion.div 
            className={`p-3 rounded-full ${stat.bgColor}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
