'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFieldMode } from '@/hooks/useDevice';
import { 
  Smartphone, 
  Monitor, 
  MapPin, 
  Clock, 
  Battery,
  Signal,
  Wifi,
  Menu,
  X,
  Home,
  Wrench,
  Calendar,
  Package,
  FileText,
  Truck,
  ChevronRight
} from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
}

export function MobileHeader({ title, subtitle }: MobileHeaderProps) {
  const { isFieldMode, isTablet, isMobile, orientation } = useFieldMode();
  const [isNavOpen, setIsNavOpen] = useState(false);

  if (!isFieldMode) {
    return null; // Usar header desktop normal
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg relative"
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
          {/* Botón hamburger */}
          <motion.button
            onClick={() => setIsNavOpen(true)}
            className="p-2 bg-white/20 rounded-lg mr-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="h-5 w-5" />
          </motion.button>

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
              <span>Modo Campo</span>
              <MapPin className="h-3 w-3" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Drawer de navegación */}
      <MobileNavDrawer isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
    </>
  );
}

// Componente de navegación drawer móvil
interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { 
      icon: Home, 
      label: 'Dashboard', 
      href: '/',
      description: 'Vista general del sistema'
    },
    { 
      icon: Wrench, 
      label: 'Equipos', 
      href: '/equipos',
      description: 'Gestión de equipos médicos'
    },
    { 
      icon: Package, 
      label: 'Inventario Técnico', 
      href: '/inventario-tecnico',
      description: 'Componentes y repuestos'
    },
    { 
      icon: Calendar, 
      label: 'Calendario', 
      href: '/calendario',
      description: 'Mantenimientos programados'
    },
    { 
      icon: Truck, 
      label: 'Mercaderías', 
      href: '/mercaderias',
      description: 'Cargas y envíos'
    },
    { 
      icon: FileText, 
      label: 'Reportes', 
      href: '/reportes',
      description: 'Estadísticas y análisis'
    },
  ];

  const handleNavigate = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header del drawer */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Ares Sistema</h2>
                  <p className="text-blue-100 text-sm">Navegación principal</p>
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-2 bg-white/20 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Status indicator */}
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Sistema conectado</span>
              </div>
            </div>

            {/* Navigation items */}
            <div className="p-4 space-y-2">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <motion.button
                    key={item.href}
                    onClick={() => handleNavigate(item.href)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      isActive 
                        ? 'bg-blue-50 border-2 border-blue-200 text-blue-900' 
                        : 'hover:bg-gray-50 border-2 border-transparent text-gray-700'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        isActive ? 'bg-blue-200' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          isActive ? 'text-blue-700' : 'text-gray-600'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className={`font-semibold ${
                          isActive ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {item.label}
                        </h3>
                        <p className={`text-sm ${
                          isActive ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                      
                      <ChevronRight className={`h-4 w-4 ${
                        isActive ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer del drawer */}
            <div className="p-4 border-t border-gray-200 mt-auto">
              <div className="text-center text-sm text-gray-500">
                <p className="font-medium">Ares Paraguay</p>
                <p>Sistema de Gestión Médica</p>
                <p className="text-xs mt-2">Versión 1.0.0</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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


