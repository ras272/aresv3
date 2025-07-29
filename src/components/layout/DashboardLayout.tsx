'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/store/useAppStore';
import { LogOut, Menu } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { getCurrentUser, logout, loadAllData } = useAppStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 🎯 Cargar todos los datos al inicializar la aplicación (solo una vez)
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🔄 Cargando datos de la aplicación...');
        await loadAllData();
        console.log('✅ Datos cargados exitosamente');
      } catch (error) {
        console.error('❌ Error cargando datos:', error);
        toast.error('Error al cargar los datos de la aplicación');
      }
    };

    // Solo cargar datos si hay un usuario autenticado y no estamos en login
    const currentUser = getCurrentUser();
    if (currentUser && pathname !== '/login') {
      initializeData();
    }
  }, []); // 🔧 Array vacío para ejecutar solo una vez al montar

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada correctamente');
    router.push('/login');
  };

  // No mostrar el layout en la página de login
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // No mostrar el layout si no hay usuario autenticado
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Mobile Sidebar */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-64 z-50 lg:hidden"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:max-w-7xl lg:mx-auto flex items-center justify-between"
          >
            {/* Left side - Mobile menu button + Title */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              {/* Mobile menu button - Only visible on mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              {/* Title - Responsive sizing */}
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 lg:mt-1 truncate">{subtitle}</p>
                )}
              </div>
            </div>

            {/* User info in header - Responsive */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
              {/* User info - Hidden on very small screens, shown on sm+ */}
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-medium text-foreground truncate max-w-24 sm:max-w-none">{currentUser.nombre}</p>
                <p className="text-xs text-muted-foreground truncate max-w-24 sm:max-w-none">{currentUser.email}</p>
              </div>
              
              {/* Role badge - Responsive sizing and text */}
              <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${currentUser.rol === 'super_admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                currentUser.rol === 'contabilidad' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                <span className="sm:hidden">
                  {currentUser.rol === 'super_admin' && 'Admin'}
                  {currentUser.rol === 'contabilidad' && 'Conta'}
                  {currentUser.rol === 'tecnico' && 'Téc'}
                </span>
                <span className="hidden sm:inline lg:hidden">
                  {currentUser.rol === 'super_admin' && 'Admin'}
                  {currentUser.rol === 'contabilidad' && 'Contabilidad'}
                  {currentUser.rol === 'tecnico' && 'Técnico'}
                </span>
                <span className="hidden lg:inline">
                  {currentUser.rol === 'super_admin' && 'Super Admin'}
                  {currentUser.rol === 'contabilidad' && 'Contabilidad'}
                  {currentUser.rol === 'tecnico' && 'Técnico'}
                </span>
              </div>
              
              {/* Logout button - Responsive sizing */}
              <button
                onClick={handleLogout}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </motion.div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full lg:max-w-7xl lg:mx-auto py-2 sm:py-4 lg:py-6 px-2 sm:px-4 lg:px-6 min-h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}