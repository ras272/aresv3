'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { useSmartNotifications, SmartNotification } from '@/hooks/useSmartNotifications';
import { 
  Bell, 
  BellRing, 
  X, 
  Check, 
  CheckCheck, 
  Clock,
  AlertTriangle,
  Info,
  Zap,
  Trophy,
  Brain
} from 'lucide-react';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSmartNotifications();

  const getNotificationIcon = (type: SmartNotification['type']) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <Check className="h-4 w-4 text-green-500" />;
      case 'error': return <X className="h-4 w-4 text-red-500" />;
      case 'predictive': return <Brain className="h-4 w-4 text-purple-500" />;
      case 'achievement': return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'loading': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5: return 'border-l-red-500 bg-red-50';
      case 4: return 'border-l-orange-500 bg-orange-50';
      case 3: return 'border-l-yellow-500 bg-yellow-50';
      case 2: return 'border-l-blue-500 bg-blue-50';
      case 1: return 'border-l-gray-500 bg-gray-50';
      default: return 'border-l-gray-500 bg-white';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `hace ${days}d`;
    if (hours > 0) return `hace ${hours}h`;
    if (minutes > 0) return `hace ${minutes}m`;
    return 'ahora';
  };

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {unreadCount > 0 ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            <BellRing className="h-6 w-6" />
          </motion.div>
        ) : (
          <Bell className="h-6 w-6" />
        )}
        
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </motion.button>

      {/* Panel de notificaciones */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-12 w-96 z-50"
            >
              <Card className="shadow-2xl border-0 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                      <p className="text-sm text-gray-600">
                        {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {unreadCount > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={markAllAsRead}
                          className="text-xs"
                        >
                          <CheckCheck className="h-3 w-3 mr-1" />
                          Marcar todas
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lista de notificaciones */}
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No hay notificaciones</p>
                      <p className="text-sm">Te avisaremos cuando algo importante suceda</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          } hover:bg-gray-50 transition-colors cursor-pointer`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className={`text-sm font-medium ${
                                  !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {notification.title}
                                  {notification.isPredictive && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      <Brain className="h-3 w-3 mr-1" />
                                      IA
                                    </Badge>
                                  )}
                                </h4>
                                
                                <span className="text-xs text-gray-500">
                                  {formatTime(notification.timestamp)}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.message}
                              </p>
                              
                              {notification.action && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    notification.action!.onClick();
                                    setIsOpen(false);
                                  }}
                                  className="text-xs"
                                >
                                  {notification.action.label}
                                </Button>
                              )}
                              
                              {notification.context && (
                                <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                                  {notification.context.cliente && (
                                    <span>👤 {notification.context.cliente}</span>
                                  )}
                                  {notification.context.ubicacion && (
                                    <span>📍 {notification.context.ubicacion}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t bg-gray-50 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-gray-600"
                      onClick={() => {
                        // Ir a página de notificaciones completa
                        setIsOpen(false);
                      }}
                    >
                      Ver todas las notificaciones
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente para mostrar notificaciones flotantes en móvil
export function MobileNotificationBadge() {
  const { unreadCount } = useSmartNotifications();

  if (unreadCount === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed top-4 left-4 z-50"
    >
      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
        {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
      </div>
    </motion.div>
  );
}
