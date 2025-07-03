'use client';

import { motion } from 'framer-motion';
import { useFieldMode } from '@/hooks/useDevice';
import { 
  Smartphone, 
  Monitor, 
  MapPin, 
  Clock, 
  Battery,
  Signal,
  Wifi
} from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
}

export function MobileHeader({ title, subtitle }: MobileHeaderProps) {
  const { isFieldMode, isTablet, isMobile, orientation } = useFieldMode();

  if (!isFieldMode) {
    return null; // Usar header desktop normal
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg"
    >
      {/* Status bar móvil */}
      <div className="flex items-center justify-between text-xs mb-3">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Signal className="h-3 w-3" />
            <span>4G</span>
          </div>
          <div className="flex items-center space-x-1">
            <Wifi className="h-3 w-3" />
            <span>WiFi</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Clock className="h-3 w-3" />
          <span>{new Date().toLocaleTimeString('es-PY', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</span>
          <Battery className="h-3 w-3" />
          <span>85%</span>
        </div>
      </div>

      {/* Header principal */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <motion.div
              className="p-2 bg-white/20 rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isMobile ? (
                <Smartphone className="h-5 w-5" />
              ) : (
                <Monitor className="h-5 w-5" />
              )}
            </motion.div>
            
            <div>
              <h1 className="text-lg font-bold">{title}</h1>
              {subtitle && (
                <p className="text-blue-100 text-sm">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Indicador de modo campo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center space-x-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>Modo Campo Activo</span>
            <MapPin className="h-3 w-3" />
          </motion.div>
        </div>

        {/* Info de orientación */}
        <div className="text-right text-xs text-blue-100">
          <div>Orientación: {orientation}</div>
          <div>{isMobile ? 'Móvil' : isTablet ? 'Tablet' : 'Desktop'}</div>
        </div>
      </div>

      {/* Instrucciones rápidas para Javier */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 p-3 bg-white/10 rounded-lg"
      >
        <h3 className="text-sm font-semibold mb-2">🚀 Acciones Rápidas:</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>• Desliza → para iniciar</div>
          <div>• Desliza ← para finalizar</div>
          <div>• Toca "Llamar" para contactar</div>
          <div>• Toca "Ir" para navegar</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Componente para mostrar información de conectividad
export function ConnectivityStatus() {
  const { isFieldMode } = useFieldMode();

  if (!isFieldMode) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className="bg-white shadow-lg rounded-lg p-3 border">
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-gray-700 font-medium">Online</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Sincronizado hace 2 min
        </div>
      </div>
    </motion.div>
  );
}

// Componente para navegación flotante móvil
export function MobileFloatingNav() {
  const { isFieldMode } = useFieldMode();

  if (!isFieldMode) {
    return null;
  }

  const navItems = [
    { icon: '🏠', label: 'Dashboard', href: '/' },
    { icon: '🔧', label: 'Inventario', href: '/inventario-tecnico' },
    // { icon: '📦', label: 'Stock', href: '/inventory' },
    { icon: '📅', label: 'Calendario', href: '/calendario' },
  ];

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
    >
      <div className="bg-white shadow-2xl rounded-2xl p-2 border">
        <div className="flex items-center space-x-1">
          {navItems.map((item, index) => (
            <motion.a
              key={item.href}
              href={item.href}
              className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-100 transition-colors min-w-16"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <span className="text-lg mb-1">{item.icon}</span>
              <span className="text-xs font-medium text-gray-600">{item.label}</span>
            </motion.a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
