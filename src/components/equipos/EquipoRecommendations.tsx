'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  CheckCircle,
  Info,
  Target,
  Zap,
  Shield,
  Clock
} from 'lucide-react';

interface Equipo {
  id: string;
  cliente: string;
  nombreEquipo: string;
  marca: string;
  modelo: string;
  fechaEntrega: string;
  componentes: Array<{
    id: string;
    nombre: string;
    estado: string;
  }>;
}

interface Mantenimiento {
  id: string;
  fecha: string;
  estado: string;
  descripcion: string;
  precioServicio?: number;
  componenteId?: string;
  tipo?: string;
}

interface Recommendation {
  id: string;
  type: 'preventivo' | 'correctivo' | 'optimizacion' | 'ahorro' | 'urgente';
  title: string;
  description: string;
  impact: 'alto' | 'medio' | 'bajo';
  estimatedCost?: number;
  estimatedTime?: string;
  priority: number;
}

interface EquipoRecommendationsProps {
  equipo: Equipo;
  mantenimientos: Mantenimiento[];
}

export function EquipoRecommendations({ equipo, mantenimientos }: EquipoRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    generateRecommendations();
  }, [equipo, mantenimientos]);

  const generateRecommendations = () => {
    setLoading(true);
    
    const recs: Recommendation[] = [];
    
    // Análisis de componentes críticos
    const componentesFueraServicio = equipo.componentes.filter(c => c.estado === 'Fuera de servicio');
    if (componentesFueraServicio.length > 0) {
      recs.push({
        id: 'componentes-criticos',
        type: 'urgente',
        title: 'Componentes Críticos Requieren Atención',
        description: `${componentesFueraServicio.length} componente(s) fuera de servicio. Esto puede afectar la operación del equipo.`,
        impact: 'alto',
        estimatedCost: 250000,
        estimatedTime: '2-4 horas',
        priority: 1
      });
    }

    // Análisis de mantenimientos pendientes
    const mantenimientosPendientes = mantenimientos.filter(m => m.estado === 'Pendiente');
    if (mantenimientosPendientes.length > 2) {
      recs.push({
        id: 'mantenimientos-acumulados',
        type: 'correctivo',
        title: 'Acumulación de Mantenimientos Pendientes',
        description: `${mantenimientosPendientes.length} mantenimientos pendientes. Considere priorizar la atención.`,
        impact: 'medio',
        estimatedTime: '1-2 días',
        priority: 2
      });
    }

    // Análisis de frecuencia de mantenimientos
    const mantenimientosUltimos6Meses = mantenimientos.filter(m => {
      const fechaMantenimiento = new Date(m.fecha);
      const hace6Meses = new Date();
      hace6Meses.setMonth(hace6Meses.getMonth() - 6);
      return fechaMantenimiento >= hace6Meses;
    });

    if (mantenimientosUltimos6Meses.length > 6) {
      recs.push({
        id: 'frecuencia-alta',
        type: 'preventivo',
        title: 'Frecuencia Alta de Mantenimientos',
        description: `${mantenimientosUltimos6Meses.length} mantenimientos en 6 meses. Considere mantenimiento preventivo programado.`,
        impact: 'medio',
        estimatedCost: 180000,
        estimatedTime: '4-6 horas',
        priority: 3
      });
    }

    // Análisis de antigüedad del equipo
    const añosEquipo = (new Date().getTime() - new Date(equipo.fechaEntrega).getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (añosEquipo > 5 && mantenimientos.filter(m => m.tipo === 'Preventivo').length === 0) {
      recs.push({
        id: 'mantenimiento-preventivo',
        type: 'preventivo',
        title: 'Mantenimiento Preventivo Recomendado',
        description: `Equipo de ${Math.floor(añosEquipo)} años sin mantenimiento preventivo registrado. Recomendamos inspección completa.`,
        impact: 'alto',
        estimatedCost: 320000,
        estimatedTime: '6-8 horas',
        priority: 2
      });
    }

    // Análisis de costos
    const costoPromedio = mantenimientos
      .filter(m => m.precioServicio)
      .reduce((sum, m) => sum + (m.precioServicio || 0), 0) / Math.max(1, mantenimientos.filter(m => m.precioServicio).length);

    if (costoPromedio > 300000) {
      recs.push({
        id: 'optimizacion-costos',
        type: 'ahorro',
        title: 'Oportunidad de Optimización de Costos',
        description: `Costo promedio de ₲${Math.round(costoPromedio).toLocaleString('es-PY')} por servicio. Considere contrato de mantenimiento preventivo.`,
        impact: 'medio',
        estimatedCost: -150000, // Ahorro potencial
        estimatedTime: 'Largo plazo',
        priority: 4
      });
    }

    // Análisis de tiempo sin mantenimiento
    const ultimoMantenimiento = mantenimientos
      .filter(m => m.estado === 'Finalizado')
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];

    if (ultimoMantenimiento) {
      const diasSinMantenimiento = Math.floor(
        (new Date().getTime() - new Date(ultimoMantenimiento.fecha).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diasSinMantenimiento > 180) {
        recs.push({
          id: 'revision-periodica',
          type: 'preventivo',
          title: 'Revisión Periódica Programada',
          description: `${diasSinMantenimiento} días sin mantenimiento. Recomendamos revisión de rutina.`,
          impact: 'bajo',
          estimatedCost: 150000,
          estimatedTime: '2-3 horas',
          priority: 5
        });
      }
    }

    // Análisis de eficiencia operativa
    const tasaExito = mantenimientos.length > 0 
      ? (mantenimientos.filter(m => m.estado === 'Finalizado').length / mantenimientos.length) * 100 
      : 100;

    if (tasaExito < 70) {
      recs.push({
        id: 'eficiencia-operativa',
        type: 'optimizacion',
        title: 'Mejora en Eficiencia Operativa',
        description: `Tasa de finalización del ${tasaExito.toFixed(0)}%. Identifique causas de demoras en servicios.`,
        impact: 'medio',
        estimatedTime: 'Evaluación requerida',
        priority: 3
      });
    }

    // Si no hay recomendaciones críticas, agregar una positiva
    if (recs.length === 0) {
      recs.push({
        id: 'estado-optimo',
        type: 'optimizacion',
        title: 'Equipo en Estado Óptimo',
        description: 'El equipo presenta un buen historial de mantenimiento. Continúe con el programa actual.',
        impact: 'bajo',
        priority: 6
      });
    }

    // Ordenar por prioridad
    setRecommendations(recs.sort((a, b) => a.priority - b.priority));
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgente':
        return <AlertTriangle className="h-4 w-4" />;
      case 'preventivo':
        return <Shield className="h-4 w-4" />;
      case 'correctivo':
        return <Zap className="h-4 w-4" />;
      case 'ahorro':
        return <DollarSign className="h-4 w-4" />;
      case 'optimizacion':
        return <Target className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgente':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'preventivo':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'correctivo':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'ahorro':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'optimizacion':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'alto':
        return <Badge variant="destructive" className="text-xs">Alto Impacto</Badge>;
      case 'medio':
        return <Badge variant="secondary" className="text-xs">Impacto Medio</Badge>;
      case 'bajo':
        return <Badge variant="outline" className="text-xs">Bajo Impacto</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          <h4 className="text-sm font-semibold text-gray-900">Recomendaciones Inteligentes</h4>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const displayedRecommendations = showAll ? recommendations : recommendations.slice(0, 3);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          <h4 className="text-sm font-semibold text-gray-900">Recomendaciones Inteligentes</h4>
          <Badge variant="outline" className="text-xs">{recommendations.length}</Badge>
        </div>
        
        {recommendations.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-xs h-6"
          >
            {showAll ? 'Ver menos' : `Ver todas (${recommendations.length})`}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {displayedRecommendations.map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border ${getTypeColor(rec.type)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getTypeIcon(rec.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="text-sm font-medium text-gray-900 truncate">{rec.title}</h5>
                    {getImpactBadge(rec.impact)}
                  </div>
                  
                  <p className="text-xs text-gray-700 mb-2">{rec.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    {rec.estimatedCost && (
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3" />
                        <span className={rec.estimatedCost < 0 ? 'text-green-600 font-medium' : ''}>
                          {rec.estimatedCost < 0 ? 'Ahorro: ' : ''}₲{Math.abs(rec.estimatedCost).toLocaleString('es-PY')}
                        </span>
                      </div>
                    )}
                    
                    {rec.estimatedTime && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{rec.estimatedTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {recommendations.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">No hay recomendaciones en este momento</p>
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <TrendingUp className="h-3 w-3" />
            <span>Análisis basado en historial de {mantenimientos.length} servicios</span>
          </div>
        </div>
      )}
    </Card>
  );
}