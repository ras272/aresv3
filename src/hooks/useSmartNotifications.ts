'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export type NotificationType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'loading'
  | 'predictive'
  | 'urgent'
  | 'achievement';

export interface SmartNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  context?: {
    equipoId?: string;
    mantenimientoId?: string;
    clienteId?: string;
    ubicacion?: string;
  };
  priority: 1 | 2 | 3 | 4 | 5; // 1=baja, 5=crítica
  timestamp: Date;
  isRead: boolean;
  isPredictive?: boolean;
}

export function useSmartNotifications() {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Crear notificación inteligente
  const notify = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      duration?: number;
      action?: { label: string; onClick: () => void };
      context?: SmartNotification['context'];
      priority?: SmartNotification['priority'];
      isPredictive?: boolean;
    }
  ) => {
    const notification: SmartNotification = {
      id: `notification-${Date.now()}-${Date.now().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      duration: options?.duration,
      action: options?.action,
      context: options?.context,
      priority: options?.priority || 3,
      timestamp: new Date(),
      isRead: false,
      isPredictive: options?.isPredictive || false
    };

    // Agregar a la lista de notificaciones
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Mostrar toast con estilo personalizado según tipo
    const toastOptions = {
      duration: notification.duration || getDefaultDuration(type),
      action: notification.action ? {
        label: notification.action.label,
        onClick: notification.action.onClick
      } : undefined,
      description: message,
      className: getToastClassName(type),
    };

    switch (type) {
      case 'success':
        toast.success(title, toastOptions);
        break;
      case 'error':
        toast.error(title, toastOptions);
        break;
      case 'warning':
        toast.warning(title, toastOptions);
        break;
      case 'loading':
        toast.loading(title, toastOptions);
        break;
      case 'predictive':
        toast.info(`🔮 ${title}`, { 
          ...toastOptions, 
          description: `Predicción: ${message}`,
          duration: 8000 
        });
        break;
      case 'urgent':
        toast.error(`🚨 ${title}`, { 
          ...toastOptions, 
          description: `URGENTE: ${message}`,
          duration: 10000 
        });
        break;
      case 'achievement':
        toast.success(`🎉 ${title}`, { 
          ...toastOptions, 
          description: `¡Logro desbloqueado! ${message}`,
          duration: 6000 
        });
        break;
      default:
        toast.info(title, toastOptions);
    }

    return notification.id;
  }, []);

  // Notificaciones específicas para ARES
  const notifyMantenimientoUrgente = useCallback((equipoNombre: string, cliente: string, diasVencido: number) => {
    return notify(
      'urgent',
      'Mantenimiento Vencido',
      `${equipoNombre} en ${cliente} lleva ${diasVencido} días sin mantenimiento`,
      {
        priority: 5,
        duration: 10000,
        action: {
          label: 'Ver Equipo',
          onClick: () => {
            // Navegar al equipo
            if (typeof window !== 'undefined') {
              window.location.href = '/equipos';
            }
          }
        },
        context: { cliente }
      }
    );
  }, [notify]);

  const notifyStockBajo = useCallback((componente: string, cantidadActual: number, cantidadMinima: number) => {
    return notify(
      'warning',
      'Stock Crítico',
      `${componente}: ${cantidadActual} unidades (mínimo: ${cantidadMinima})`,
      {
        priority: 4,
        duration: 8000,
        action: {
          label: 'Ver Inventario',
          onClick: () => {
            if (typeof window !== 'undefined') {
              window.location.href = '/inventory';
            }
          }
        }
      }
    );
  }, [notify]);

  const notifyPrediccionFalla = useCallback((equipoNombre: string, probabilidad: number, diasEstimados: number) => {
    return notify(
      'predictive',
      'Posible Falla Detectada',
      `${equipoNombre} tiene ${probabilidad}% probabilidad de falla en ${diasEstimados} días`,
      {
        priority: 3,
        isPredictive: true,
        action: {
          label: 'Programar Mantenimiento',
          onClick: () => {
            if (typeof window !== 'undefined') {
              window.location.href = '/calendario';
            }
          }
        }
      }
    );
  }, [notify]);

  const notifyLogro = useCallback((titulo: string, descripcion: string) => {
    return notify(
      'achievement',
      titulo,
      descripcion,
      {
        priority: 2,
        duration: 6000
      }
    );
  }, [notify]);

  const notifyOperacionExitosa = useCallback((operacion: string, detalles?: string) => {
    return notify(
      'success',
      `${operacion} Completado`,
      detalles || 'La operación se realizó correctamente',
      {
        priority: 2,
        duration: 4000
      }
    );
  }, [notify]);

  const notifyError = useCallback((operacion: string, error: string) => {
    return notify(
      'error',
      `Error en ${operacion}`,
      error,
      {
        priority: 4,
        duration: 8000,
        action: {
          label: 'Reintentar',
          onClick: () => {
            // Lógica de reintento
            console.log('Reintentando operación...');
          }
        }
      }
    );
  }, [notify]);

  // Marcar notificación como leída
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  // Limpiar notificaciones antiguas
  const clearOldNotifications = useCallback(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    setNotifications(prev => prev.filter(n => n.timestamp > oneDayAgo));
  }, []);

  // Sistema de notificaciones predictivas
  const checkPredictivePatterns = useCallback(() => {
    // Simular análisis de patrones (en producción sería ML real)
    const patterns = [
      {
        condition: () => new Date().getHours() === 8, // 8 AM
        notification: () => notifyLogro(
          'Buenos días, Javier!',
          'Tienes 3 mantenimientos programados para hoy'
        )
      },
      {
        condition: () => new Date().getDay() === 1, // Lunes
        notification: () => notify(
          'info',
          'Inicio de Semana',
          'Revisa los mantenimientos pendientes de la semana',
          { priority: 2 }
        )
      },
      {
        condition: () => (Date.now() % 100) < 10, // 10% probabilidad determinística
        notification: () => notifyPrediccionFalla(
          'HydraFacial Hospital Bautista',
          75,
          7
        )
      }
    ];

    patterns.forEach(pattern => {
      if (pattern.condition()) {
        pattern.notification();
      }
    });
  }, [notify, notifyLogro, notifyPrediccionFalla]);

  // Ejecutar análisis predictivo cada 30 minutos
  useEffect(() => {
    const predictiveInterval = setInterval(checkPredictivePatterns, 30 * 60 * 1000);
    return () => clearInterval(predictiveInterval);
  }, [checkPredictivePatterns]);

  // Limpiar automáticamente cada hora
  useEffect(() => {
    const interval = setInterval(clearOldNotifications, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [clearOldNotifications]);

  return {
    notifications,
    unreadCount,
    notify,
    // Notificaciones específicas de ARES
    notifyMantenimientoUrgente,
    notifyStockBajo,
    notifyPrediccionFalla,
    notifyLogro,
    notifyOperacionExitosa,
    notifyError,
    // Gestión
    markAsRead,
    markAllAsRead,
    clearOldNotifications
  };
}

// Funciones auxiliares
function getDefaultDuration(type: NotificationType): number {
  switch (type) {
    case 'success': return 4000;
    case 'error': return 8000;
    case 'warning': return 6000;
    case 'urgent': return 10000;
    case 'predictive': return 8000;
    case 'achievement': return 6000;
    case 'loading': return Infinity;
    default: return 5000;
  }
}

function getToastClassName(type: NotificationType): string {
  switch (type) {
    case 'urgent':
      return 'border-red-500 bg-red-50 text-red-900';
    case 'predictive':
      return 'border-purple-500 bg-purple-50 text-purple-900';
    case 'achievement':
      return 'border-green-500 bg-green-50 text-green-900';
    default:
      return '';
  }
}
