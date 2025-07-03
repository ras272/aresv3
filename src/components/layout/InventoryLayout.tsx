'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Package,
  LayoutDashboard, 
  Search, 
  Tags, 
  GitBranch, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Building,
  Users,
  Bell,
  HelpCircle,
  LogOut
} from 'lucide-react'

interface InventoryLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function InventoryLayout({ children, title, subtitle }: InventoryLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/inventory',
      icon: LayoutDashboard,
      current: pathname === '/inventory'
    },
    {
      name: 'Items',
      href: '/inventory/items',
      icon: Package,
      current: pathname.startsWith('/inventory/items')
    },
    {
      name: 'Search',
      href: '/inventory/search',
      icon: Search,
      current: pathname === '/inventory/search'
    },
    {
      name: 'Tags',
      href: '/inventory/tags',
      icon: Tags,
      current: pathname === '/inventory/tags'
    },
    {
      name: 'Workflows',
      href: '/inventory/workflows',
      icon: GitBranch,
      current: pathname === '/inventory/workflows'
    },
    {
      name: 'Reports',
      href: '/inventory/reports',
      icon: BarChart3,
      current: pathname === '/inventory/reports'
    }
  ]

  const bottomItems = [
    {
      name: 'Product News',
      href: '/inventory/news',
      icon: Bell,
      current: false
    },
    {
      name: 'Help',
      href: '/inventory/help',
      icon: HelpCircle,
      current: false
    },
    {
      name: 'Notifications',
      href: '/inventory/notifications',
      icon: Bell,
      current: false
    },
    {
      name: 'Settings',
      href: '/inventory/settings',
      icon: Settings,
      current: pathname === '/inventory/settings'
    }
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-72'} transition-all duration-300 bg-white text-gray-900 flex flex-col shadow-lg border-r border-gray-200`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          {!sidebarCollapsed ? (
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ARES</h1>
                <p className="text-xs text-gray-500 font-medium">Sistema de Inventario</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
              <Package className="h-6 w-6 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.name} href={item.href}>
                <div className={`group flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                  item.current 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105 ${
                    item.current ? 'text-white' : 'text-gray-500'
                  }`} />
                  {!sidebarCollapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}
                  {!sidebarCollapsed && item.current && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-200 space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.name} href={item.href}>
                <div className={`group flex items-center space-x-3 p-2.5 rounded-lg transition-all duration-200 ${
                  item.current 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <Icon className="h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-105" />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Toggle Button */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="font-medium">Contraer</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              )}
              {subtitle && (
                <p className="text-gray-600 mt-1 font-medium">{subtitle}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Switch to Service System */}
              <Link href="/">
                <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                  <Building className="h-4 w-4 mr-2" />
                  <span className="font-medium">Servicio Técnico</span>
                </Button>
              </Link>
              
              {/* User Menu */}
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700">ARES Paraguay</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
} 