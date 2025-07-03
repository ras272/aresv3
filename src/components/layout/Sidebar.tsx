'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Settings, 
  FileText, 
  Home,
  Search,
  Plus,
  Package,
  GraduationCap,
  Wrench,
  Calendar,
  Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    name: 'Equipos',
    href: '/equipos',
    icon: Heart,
  },
  {
    name: 'Nuevo Equipo',
    href: '/equipos/nuevo',
    icon: Plus,
  },
  {
    name: 'Inventario Técnico',
    href: '/inventario-tecnico',
    icon: Wrench,
  },
  // {
  //   name: 'Sistema de Stock',
  //   href: '/stock',
  //   icon: Package,
  // },
  {
    name: 'Calendario',
    href: '/calendario',
    icon: Calendar,
  },
  {
    name: 'Ingreso de Mercaderías',
    href: '/mercaderias',
    icon: Truck,
  },
  // {
  //   name: 'Capacitaciones',
  //   href: '/capacitaciones',
  //   icon: GraduationCap,
  // },
  {
    name: 'Reportes',
    href: '/reportes',
    icon: FileText,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <div>
                          <h1 className="text-lg font-bold text-gray-900">Ares</h1>
            <p className="text-xs text-gray-500">DEMO</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item, index) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive
                      ? 'text-blue-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.name}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500">
          <p className="font-semibold">Ares Paraguay</p>
          <p>Sistema de Servicio Técnico</p>
          <p className="mt-1">v1.0.0 DEMO</p>
        </div>
      </div>
    </div>
  );
} 