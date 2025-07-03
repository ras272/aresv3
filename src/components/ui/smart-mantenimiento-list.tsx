'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { MantenimientosListSkeleton, EmptyState } from './loading-states';
import { MobileMantenimientoCard } from './mobile-optimized';
import { useSmartLoading } from '@/hooks/useSmartLoading';
import { useFieldMode } from '@/hooks/useDevice';
import {
  MapPin,
  ExternalLink,
  Play,
  CheckSquare,
  AlertTriangle,
  CheckCircle,
  Wrench
} from 'lucide-react';

interface Mantenimiento {
  id: string;
  equipoId: string;
  fecha: string;
  descripcion: string;
  estado: 'Pendiente' | 'En proceso' | 'Finalizado';
  reporteGenerado?: boolean;
}

interface Equipo {
  id: string;
  marca: string;
  modelo: string;
  cliente: string;
  ubicacion: string;
}

interface SmartMantenimientoListProps {
  mantenimientos: Mantenimiento[];
  equipos: Equipo[];
  onEquipoClick: (equipoId: string) => void;
  onEstadoChange: (mantenimientoId: string, nuevoEstado: 'En proceso' | 'Finalizado', mantenimiento?: Mantenimiento) => Promise<void>;
  title: string;
  emptyIcon: React.ComponentType<{ className?: string }>;
  emptyTitle: string;
  emptyMessage: string;
  badgeVariant?: 'destructive' | 'secondary' | 'default';
  cardClassName?: string;
  itemsPerPage?: number;
}

export function SmartMantenimientoList({
  mantenimientos,
  equipos,
  onEquipoClick,
  onEstadoChange,
  title,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  badgeVariant = 'default',
  cardClassName = '',
  itemsPerPage = 5
}: SmartMantenimientoListProps) {
  const [visibleItems, setVisibleItems] = useState(itemsPerPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const { execute } = useSmartLoading();
  const { isFieldMode, fieldConfig } = useFieldMode();

  // Función para calcular días transcurridos
  const calcularDiasTranscurridos = useCallback((fecha: string) => {
    const fechaMantenimiento = new Date(fecha);
    const hoy = new Date();
    const diferencia = hoy.getTime() - fechaMantenimiento.getTime();
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    return `Hace ${dias} días`;
  }, []);

  // Función para obtener información del equipo
  const obtenerEquipo = useCallback((equipoId: string) => {
    return equipos.find(e => e.id === equipoId);
  }, [equipos]);

  // Determinar si es urgente
  const esUrgente = useCallback((fecha: string) => {
    const diasText = calcularDiasTranscurridos(fecha);
    return diasText.includes('Hace') && 
           parseInt(diasText.split(' ')[1]) > 2;
  }, [calcularDiasTranscurridos]);

  // Cargar más items
  const loadMore = useCallback(async () => {
    if (visibleItems >= mantenimientos.length) return;
    
    setIsLoadingMore(true);
    
    // Simular carga (en caso real sería una llamada a API)
    await execute(async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      setVisibleItems(prev => Math.min(prev + itemsPerPage, mantenimientos.length));
    });
    
    setIsLoadingMore(false);
  }, [visibleItems, mantenimientos.length, itemsPerPage, execute]);

  // Intersection Observer para lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && visibleItems < mantenimientos.length) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, isLoadingMore, visibleItems, mantenimientos.length]);

  // Manejar cambio de estado con loading
  const handleEstadoChange = async (mantenimientoId: string, nuevoEstado: 'En proceso' | 'Finalizado', mantenimiento?: Mantenimiento) => {
    await execute(async () => {
      await onEstadoChange(mantenimientoId, nuevoEstado, mantenimiento);
    });
  };

  // Ordenar mantenimientos por fecha
  const sortedMantenimientos = mantenimientos
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .slice(0, visibleItems);

  if (mantenimientos.length === 0) {
    return (
      <Card className={`p-6 ${cardClassName}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <EmptyState
          title={emptyTitle}
          message={emptyMessage}
          icon={emptyIcon}
        />
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${cardClassName}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
          {mantenimientos.length > 0 && (
            <Badge variant={badgeVariant} className="ml-2">
              {mantenimientos.length}
            </Badge>
          )}
        </h3>
        {title.includes('Pendientes') && <AlertTriangle className="h-5 w-5 text-red-500" />}
        {title.includes('Proceso') && <Wrench className="h-5 w-5 text-yellow-500" />}
        {title.includes('Finalizados') && <CheckCircle className="h-5 w-5 text-green-500" />}
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {sortedMantenimientos.map((mantenimiento, index) => {
            const equipo = obtenerEquipo(mantenimiento.equipoId);
            const diasTranscurridos = calcularDiasTranscurridos(mantenimiento.fecha);
            const urgente = esUrgente(mantenimiento.fecha);
            
            return (
              <motion.div
                key={mantenimiento.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <MobileMantenimientoCard
                  mantenimiento={mantenimiento}
                  equipo={equipo}
                  onEquipoClick={onEquipoClick}
                  onEstadoChange={handleEstadoChange}
                  diasTranscurridos={diasTranscurridos}
                  esUrgente={urgente}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="py-4">
            <MantenimientosListSkeleton count={2} />
          </div>
        )}
        
        {/* Intersection observer target */}
        {visibleItems < mantenimientos.length && (
          <div ref={observerRef} className="h-4" />
        )}
      </div>
    </Card>
  );
}
