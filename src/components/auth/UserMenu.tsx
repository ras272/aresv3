'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { 
  User, 
  LogOut, 
  Settings, 
  ChevronDown,
  Shield,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export function UserMenu() {
  const router = useRouter();
  const { getCurrentUser, logout } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentUser = getCurrentUser();
  
  if (!currentUser) return null;
  
  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada exitosamente');
    router.push('/login');
  };
  
  const getRoleBadge = (rol: string) => {
    if (rol === 'admin') {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          <Shield className="w-3 h-3" />
          Administrador
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
          <User className="w-3 h-3" />
          Técnico
        </div>
      );
    }
  };
  
  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-gray-100"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {currentUser.nombre.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">
            {currentUser.nombre}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {currentUser.rol}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border z-20"
            >
              {/* User Info */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {currentUser.nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {currentUser.nombre}
                    </div>
                    <div className="text-sm text-gray-600">
                      {currentUser.email}
                    </div>
                    <div className="mt-1">
                      {getRoleBadge(currentUser.rol)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Last Access */}
              {currentUser.ultimoAcceso && (
                <div className="px-4 py-2 border-b bg-gray-50">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    Último acceso: {new Date(currentUser.ultimoAcceso).toLocaleString('es-PY')}
                  </div>
                </div>
              )}
              
              {/* Menu Items */}
              <div className="p-2">
                {currentUser.rol === 'admin' && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      setIsOpen(false);
                      // TODO: Implementar página de configuración
                      toast.info('Configuración próximamente');
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}