'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/database/shared/supabase'
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  MapPin, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ArrowRight
} from 'lucide-react'

interface DashboardStockProps {
  onActualizarEstadisticas: () => void
}

interface StockItem {
  id: string
  codigo_item: string
  nombre: string
  marca: string
  modelo: string
  cantidad_actual: number
  cantidad_minima: number
  estado?: string
  ubicacion?: {
    nombre: string
    codigo: string
  }
}

interface MovimientoReciente {
  id: string
  fecha_movimiento: string
  tipo_movimiento: string
  item_nombre: string
  cantidad: number
  usuario_responsable: string
  ubicacion_origen?: string
  ubicacion_destino?: string
}

export function DashboardStock({ onActualizarEstadisticas }: DashboardStockProps) {
  const [cargando, setCargando] = useState(true)
  const [stockCritico, setStockCritico] = useState<StockItem[]>([])
  const [movimientosRecientes, setMovimientosRecientes] = useState<MovimientoReciente[]>([])
  const [resumenPorUbicacion, setResumenPorUbicacion] = useState<any[]>([])

  useEffect(() => {
    cargarDatosDashboard()
  }, [])

  const cargarDatosDashboard = async () => {
    try {
      setCargando(true)

      // Por ahora usar datos de ejemplo funcionales
      // Datos de stock crítico
      const stockCriticoEjemplo = [
        {
          id: '1',
          codigo_item: 'ULT-001',
          nombre: 'Cartucho Ultraformer DS-1.5',
          marca: 'Classys',
          modelo: 'DS-1.5',
          cantidad_actual: 2,
          cantidad_minima: 10,
          estado: 'Disponible',
          ubicacion: { nombre: 'Almacén Principal', codigo: 'A1-E1' }
        },
        {
          id: '2',
          codigo_item: 'ULT-002',
          nombre: 'Cartucho Ultraformer DS-4.5',
          marca: 'Classys',
          modelo: 'DS-4.5',
          cantidad_actual: 1,
          cantidad_minima: 8,
          estado: 'Disponible',
          ubicacion: { nombre: 'Almacén Principal', codigo: 'A1-E2' }
        },
        {
          id: '3',
          codigo_item: 'CM-001',
          nombre: 'Pieza de mano CM Slim 12mm',
          marca: 'ARES',
          modelo: 'CM-S12',
          cantidad_actual: 3,
          cantidad_minima: 15,
          estado: 'Disponible',
          ubicacion: { nombre: 'Taller Técnico', codigo: 'T1-G1' }
        }
      ]

      // Datos de movimientos recientes
      const movimientosEjemplo = [
        {
          id: '1',
          fecha_movimiento: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
          tipo_movimiento: 'Salida',
          cantidad: 2,
          usuario_responsable: 'Javier López',
          item_nombre: 'Cartucho Ultraformer DS-1.5'
        },
        {
          id: '2',
          fecha_movimiento: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
          tipo_movimiento: 'Entrada',
          cantidad: 5,
          usuario_responsable: 'Javier López',
          item_nombre: 'Pieza de mano CM Slim 12mm'
        },
        {
          id: '3',
          fecha_movimiento: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          tipo_movimiento: 'Transferencia',
          cantidad: 1,
          usuario_responsable: 'Javier López',
          item_nombre: 'Cartucho Ultraformer DS-4.5'
        },
        {
          id: '4',
          fecha_movimiento: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          tipo_movimiento: 'Salida',
          cantidad: 3,
          usuario_responsable: 'Javier López',
          item_nombre: 'Kit de mantenimiento Venus'
        }
      ]

      // Datos de ubicaciones
      const ubicacionesEjemplo = [
        {
          ubicacion_id: '1',
          codigo_ubicacion: 'A1-PRINCIPAL',
          nombre_ubicacion: 'Almacén Principal',
          tipo_ubicacion: 'Almacen',
          total_items: 45,
          items_disponibles: 38,
          items_stock_minimo: 3
        },
        {
          ubicacion_id: '2',
          codigo_ubicacion: 'T1-TALLER',
          nombre_ubicacion: 'Taller Técnico',
          tipo_ubicacion: 'Area',
          total_items: 28,
          items_disponibles: 22,
          items_stock_minimo: 2
        },
        {
          ubicacion_id: '3',
          codigo_ubicacion: 'R1-REPUESTOS',
          nombre_ubicacion: 'Área de Repuestos',
          tipo_ubicacion: 'Estante',
          total_items: 35,
          items_disponibles: 30,
          items_stock_minimo: 1
        }
      ]

      setStockCritico(stockCriticoEjemplo)
      setMovimientosRecientes(movimientosEjemplo)
      setResumenPorUbicacion(ubicacionesEjemplo)

    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setCargando(false)
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getIconoMovimiento = (tipo: string) => {
    switch (tipo) {
      case 'Entrada':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'Salida':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'Transferencia':
        return <ArrowRight className="h-4 w-4 text-blue-500" />
      default:
        return <Package className="h-4 w-4 text-gray-500" />
    }
  }

  const getColorEstado = (estado?: string) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-green-100 text-green-800'
      case 'En_uso':
        return 'bg-blue-100 text-blue-800'
      case 'Reservado':
        return 'bg-yellow-100 text-yellow-800'
      case 'Dañado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (cargando) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stock Crítico */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                ⚠️ Stock Crítico
              </CardTitle>
              <CardDescription>
                Items que están por debajo del stock mínimo
              </CardDescription>
            </div>
            <Badge variant="destructive">
              {stockCritico.length} items
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {stockCritico.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>¡Excelente! No hay items con stock crítico</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stockCritico.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getColorEstado(item.estado || 'Disponible')}>
                        {(item.estado || 'Disponible').replace('_', ' ')}
                      </Badge>
                      <span className="font-medium">{item.nombre}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {item.marca} {item.modelo} • {item.ubicacion?.codigo || 'Sin ubicación'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">
                      {item.cantidad_actual}
                    </div>
                    <div className="text-xs text-gray-500">
                      Min: {item.cantidad_minima}
                    </div>
                  </div>
                </div>
              ))}
              {stockCritico.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    Ver todos ({stockCritico.length - 5} más)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movimientos Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              📊 Movimientos Recientes
            </CardTitle>
            <CardDescription>
              Últimos movimientos de stock registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {movimientosRecientes.slice(0, 8).map((movimiento) => (
                <div key={movimiento.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  {getIconoMovimiento(movimiento.tipo_movimiento)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {movimiento.item_nombre}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {movimiento.tipo_movimiento}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatearFecha(movimiento.fecha_movimiento)} • {movimiento.usuario_responsable}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {movimiento.tipo_movimiento === 'Entrada' ? '+' : ''}
                      {movimiento.tipo_movimiento === 'Salida' ? '-' : ''}
                      {movimiento.cantidad}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resumen por Ubicación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-500" />
              📍 Stock por Ubicación
            </CardTitle>
            <CardDescription>
              Distribución de items por ubicación física
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resumenPorUbicacion.map((ubicacion) => (
                <div key={ubicacion.ubicacion_id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{ubicacion.nombre_ubicacion}</div>
                      <div className="text-sm text-gray-500">{ubicacion.codigo_ubicacion}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{ubicacion.total_items}</div>
                      <div className="text-xs text-gray-500">items</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-green-600">
                      ✅ {ubicacion.items_disponibles} disponibles
                    </span>
                    {ubicacion.items_stock_minimo > 0 && (
                      <span className="text-red-600">
                        ⚠️ {ubicacion.items_stock_minimo} críticos
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón de actualización */}
      <div className="text-center">
        <Button onClick={() => {
          cargarDatosDashboard()
          onActualizarEstadisticas()
        }}>
          🔄 Actualizar Dashboard
        </Button>
      </div>
    </div>
  )
} 