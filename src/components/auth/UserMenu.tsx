'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
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
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  if (!user) return null;
  
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada exitosamente');
      // AuthProvider already handles redirect to /login
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
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
            {user.nombre.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">
            {user.nombre}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {user.rol}
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
                      {user.nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {user.nombre}
                    </div>
                    <div className="text-sm text-gray-600">
                      {user.email}
                    </div>
                    <div className="mt-1">
                      {getRoleBadge(user.rol)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Last Access - Comentado temporalmente ya que el JWT no incluye ultimoAcceso */}
              {/* TODO: Implementar tracking de último acceso en JWT system */}
              
              {/* Menu Items */}
              <div className="p-2">
                {user.rol === 'super_admin' && (
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