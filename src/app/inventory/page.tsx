'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InventoryLayout } from '@/components/layout/InventoryLayout'
import { supabase } from '@/lib/supabase'
import { 
  Package, 
  FolderOpen,
  DollarSign,
  TrendingUp,
  Activity,
  Clock,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Filter
} from 'lucide-react'

interface InventoryMetrics {
  totalItems: number
  totalFolders: number
  totalValue: number
  totalQuantity: number
  recentActivity: ActivityItem[]
  recentItems: RecentItem[]
}

interface ActivityItem {
  id: string
  type: 'quantity_change' | 'item_update' | 'item_added' | 'item_moved'
  description: string
  user: string
  timestamp: string
  item?: string
}

interface RecentItem {
  id: string
  name: string
  image: string
  quantity: number
  value: number
  lastUpdated: string
}

export default function InventoryDashboard() {
  const [metrics, setMetrics] = useState<InventoryMetrics>({
    totalItems: 0,
    totalFolders: 0,
    totalValue: 0,
    totalQuantity: 0,
    recentActivity: [],
    recentItems: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Cargar datos de componentes
      const { data: componentes } = await supabase
        .from('componentes_disponibles')
        .select('*')
        .limit(100)

      // Calcular métricas
      const totalItems = componentes?.length || 0
      const totalQuantity = componentes?.reduce((sum, comp) => sum + (comp.cantidad_disponible || 0), 0) || 0
      
      // Estimar valor total (precio promedio por tipo)
      const estimatedValue = componentes?.reduce((sum, comp) => {
        let unitPrice = 1000 // Precio base
        if (comp.nombre?.toLowerCase().includes('ultraformer')) unitPrice = 1500
        if (comp.nombre?.toLowerCase().includes('hydrafacial')) unitPrice = 2000
        if (comp.nombre?.toLowerCase().includes('venus')) unitPrice = 1200
        if (comp.nombre?.toLowerCase().includes('cm')) unitPrice = 800
        
        return sum + (unitPrice * (comp.cantidad_disponible || 0))
      }, 0) || 0

      // Contar folders únicos (marcas)
      const marcasUnicas = new Set(componentes?.map(comp => comp.marca || 'Sin Marca') || [])
      const totalFolders = marcasUnicas.size

      // Actividad reciente simulada
      const recentActivity: ActivityItem[] = [
        {
          id: '1',
          type: 'quantity_change',
          description: 'ARES Paraguay decreased quantity of Pieza de mano - Elysion BID by 1 units to 0 units',
          user: 'ARES Paraguay',
          timestamp: '3:39 PM',
          item: 'Pieza de mano - Elysion BID'
        },
        {
          id: '2',
          type: 'item_update',
          description: 'ARES Paraguay updated Cavix - CAV101 (Usada) Name from Cavix - ECLERIS to Cavix - CAV101 (Usada)',
          user: 'ARES Paraguay',
          timestamp: '11:16 AM'
        },
        {
          id: '3',
          type: 'item_update',
          description: 'ARES Paraguay updated Cavix - ECLERIS Notes from S/N: BI44 Incluye pedal to S/N: BI44 OBS Incluye pedal Incluye pieza de mano (usada) Soporte (ver ServiTec)',
          user: 'ARES Paraguay',
          timestamp: '11:15 AM'
        },
        {
          id: '4',
          type: 'item_update',
          description: 'ARES Paraguay updated Name, Notes of Cavix - CAV101 (Nuevo)',
          user: 'ARES Paraguay',
          timestamp: '11:13 AM'
        },
        {
          id: '5',
          type: 'item_update',
          description: 'ARES Paraguay updated Pieza de mano - Cavix Name from Pieza de mano - Cavix (Usada) to Pieza de mano - Cavix',
          user: 'ARES Paraguay',
          timestamp: '11:06 AM'
        }
      ]

      // Items recientes
      const recentItems: RecentItem[] = (componentes?.slice(0, 6) || []).map(comp => ({
        id: comp.id,
        name: comp.nombre || 'Sin nombre',
        image: getItemImage(comp.nombre),
        quantity: comp.cantidad_disponible || 0,
        value: getEstimatedValue(comp.nombre, comp.cantidad_disponible || 0),
        lastUpdated: comp.fecha_ingreso || new Date().toISOString()
      }))

      setMetrics({
        totalItems,
        totalFolders,
        totalValue: estimatedValue,
        totalQuantity,
        recentActivity,
        recentItems
      })

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getItemImage = (nombre: string) => {
    if (nombre?.toLowerCase().includes('ultraformer')) {
      return 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop'
    } else if (nombre?.toLowerCase().includes('hydrafacial')) {
      return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'
    } else if (nombre?.toLowerCase().includes('venus')) {
      return 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop'
    } else {
      return 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=300&fit=crop'
    }
  }

  const getEstimatedValue = (nombre: string, quantity: number) => {
    let unitPrice = 1000
    if (nombre?.toLowerCase().includes('ultraformer')) unitPrice = 1500
    if (nombre?.toLowerCase().includes('hydrafacial')) unitPrice = 2000
    if (nombre?.toLowerCase().includes('venus')) unitPrice = 1200
    if (nombre?.toLowerCase().includes('cm')) unitPrice = 800
    
    return unitPrice * quantity
  }

  const formatCurrency = (value: number) => {
    return `USD ${(value / 1000).toFixed(1)}K`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quantity_change': return <ArrowDownRight className="h-4 w-4 text-orange-500" />
      case 'item_update': return <Activity className="h-4 w-4 text-blue-500" />
      case 'item_added': return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case 'item_moved': return <TrendingUp className="h-4 w-4 text-purple-500" />
      default: return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <InventoryLayout title="Dashboard" subtitle="Resumen del inventario">
        <div className="p-8 space-y-8">
          {/* Loading Inventory Summary */}
          <Card className="shadow-lg bg-white animate-pulse">
            <CardHeader className="bg-blue-50 border-b border-blue-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="h-6 w-40 bg-gray-200 rounded"></div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-6 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-5">
                      <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                      <div className="space-y-2">
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                        <div className="h-4 w-12 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>

          {/* Loading Activity and Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map(i => (
              <Card key={i} className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 overflow-hidden animate-pulse">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100/50 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                    <div className="h-6 w-32 bg-slate-200 rounded"></div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="flex items-start space-x-4 p-4 rounded-xl bg-slate-50">
                      <div className="w-4 h-4 bg-slate-200 rounded mt-1"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading Quick Actions */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 overflow-hidden animate-pulse">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100/50 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                <div className="h-6 w-32 bg-slate-200 rounded"></div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </InventoryLayout>
    )
  }

  return (
    <InventoryLayout title="Dashboard" subtitle="Resumen del inventario">
      <div className="p-8 space-y-8">
        {/* Inventory Summary */}
        <Card className="shadow-lg bg-white">
          <CardHeader className="bg-blue-50 border-b border-blue-100 pb-6">
            <CardTitle className="text-xl flex items-center gap-3 text-gray-800">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              Inventory Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group flex items-center space-x-5 p-6 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-200">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-800">{metrics.totalItems}</div>
                  <div className="text-sm font-medium text-gray-600">Items</div>
                </div>
              </div>
              
              <div className="group flex items-center space-x-5 p-6 bg-orange-50 rounded-xl border border-orange-200 hover:shadow-md transition-all duration-200">
                <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <FolderOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-800">{metrics.totalFolders}</div>
                  <div className="text-sm font-medium text-gray-600">Folders</div>
                </div>
              </div>
              
              <div className="group flex items-center space-x-5 p-6 bg-emerald-50 rounded-xl border border-emerald-200 hover:shadow-md transition-all duration-200">
                <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-800">{formatCurrency(metrics.totalValue)}</div>
                  <div className="text-sm font-medium text-gray-600">Total Value</div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-gray-700 font-medium bg-gray-50 rounded-lg p-4">
                <strong>Total Quantity:</strong> {metrics.totalQuantity.toLocaleString()} units
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card className="shadow-lg bg-white">
            <CardHeader className="bg-purple-50 border-b border-purple-100 pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-3 text-gray-800">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  Recent Activity
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200">
                    All Activity
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {metrics.recentActivity.map((activity) => (
                <div key={activity.id} className="group flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200">
                  <div className="mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-medium leading-relaxed break-words">{activity.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-500 text-sm font-medium">{activity.user}</span>
                      <span className="text-gray-400 text-sm">{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-center pt-6 border-t border-gray-100">
                <Button variant="link" className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200">
                  View all activity
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Items */}
          <Card className="shadow-lg bg-white">
            <CardHeader className="bg-emerald-50 border-b border-emerald-100 pb-6">
              <CardTitle className="text-xl flex items-center gap-3 text-gray-800">
                <div className="p-2 bg-emerald-600 rounded-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                Recent Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {metrics.recentItems.map((item) => (
                  <div key={item.id} className="group border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-gray-300">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2 leading-tight">{item.name}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-medium">{item.quantity} units</span>
                      <span className="text-emerald-600 font-bold">{formatCurrency(item.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-lg bg-white">
          <CardHeader className="bg-blue-50 border-b border-blue-100 pb-6">
            <CardTitle className="text-xl flex items-center gap-3 text-gray-800">
              <div className="p-2 bg-blue-600 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-24 flex flex-col space-y-3 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group">
                <Package className="h-8 w-8 text-gray-600 group-hover:text-blue-600 group-hover:scale-105 transition-all duration-200" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Add Item</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col space-y-3 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 group">
                <FolderOpen className="h-8 w-8 text-gray-600 group-hover:text-orange-600 group-hover:scale-105 transition-all duration-200" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">Add Folder</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col space-y-3 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group">
                <TrendingUp className="h-8 w-8 text-gray-600 group-hover:text-purple-600 group-hover:scale-105 transition-all duration-200" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Bulk Import</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col space-y-3 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 group">
                <Activity className="h-8 w-8 text-gray-600 group-hover:text-emerald-600 group-hover:scale-105 transition-all duration-200" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </InventoryLayout>
  )
} 