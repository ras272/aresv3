'use client';

import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { MobileHeader, ConnectivityStatus, MobileFloatingNav } from '@/components/ui/mobile-header';
import { useFieldMode } from '@/hooks/useDevice';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { isFieldMode } = useFieldMode();

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar - oculto en modo campo */}
        {!isFieldMode && <Sidebar />}

        <div className="flex-1 flex flex-col min-h-0">
          {/* Header - condicional según modo */}
          {isFieldMode ? (
            <MobileHeader title={title || 'ARES'} subtitle={subtitle} />
          ) : (
            (title || subtitle) && (
              <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-7xl mx-auto"
                >
                  {title && (
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  )}
                  {subtitle && (
                    <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                  )}
                </motion.div>
              </header>
            )
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`${
                isFieldMode
                  ? 'py-4 px-4 min-h-full'
                  : 'max-w-7xl mx-auto py-6 px-6 min-h-full'
              }`}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>

      {/* Componentes móviles flotantes */}
      {isFieldMode && (
        <>
          <ConnectivityStatus />
          <MobileFloatingNav />
        </>
      )}
    </>
  );
}