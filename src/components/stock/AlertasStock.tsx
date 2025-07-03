'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  X,
  Eye,
  Trash2,
  AlertCircle,
  Package,
  Calendar
} from 'lucide-react'

interface AlertasStockProps {
  onActualizarEstadisticas: () => void
}

interface Alerta {
  id: string
  tipo_alerta: string
  titulo: string
  mensaje: string
  prioridad: string
  activa: boolean
  leida: boolean
  fecha_creacion: string
  fecha_limite?: string
  item_nombre: string
  codigo_item: string
  ubicacion?: string
}

export function AlertasStock({ onActualizarEstadisticas }: AlertasStockProps) {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroActivo, setFiltroActivo] = useState('todas')
  const [alertasFiltradas, setAlertasFiltradas] = useState<Alerta[]>([])

  useEffect(() => {
    cargarAlertas()
  }, [])

  useEffect(() => {
    filtrarAlertas()
  }, [alertas, filtroActivo])

  const cargarAlertas = async () => {
    try {
      setCargando(true)
      
      const { data, error } = await supabase
        .from('vista_alertas_activas')
        .select('*')
        .order('fecha_creacion', { ascending: false })

      if (error) throw error

      setAlertas(data || [])
    } catch (error) {
      console.error('Error cargando alertas:', error)
    } finally {
      setCargando(false)
    }
  }

  const filtrarAlertas = () => {
    let filtradas = alertas

    switch (filtroActivo) {
      case 'criticas':
        filtradas = alertas.filter(a => a.prioridad === 'Crítica')
        break
      case 'no_leidas':
        filtradas = alertas.filter(a => !a.leida)
        break
      case 'stock_minimo':
        filtradas = alertas.filter(a => a.tipo_alerta === 'stock_minimo')
        break
      case 'vencimiento':
        filtradas = alertas.filter(a => a.tipo_alerta === 'vencimiento')
        break
    }

    setAlertasFiltradas(filtradas)
  }

  const marcarComoLeida = async (alertaId: string) => {
    try {
      const { error } = await supabase
        .from('alertas_stock')
        .update({ 
          leida: true, 
          fecha_leida: new Date().toISOString(),
          usuario_que_leyo: 'Usuario Actual' // TODO: obtener del contexto de usuario
        })
        .eq('id', alertaId)

      if (error) throw error

      // Actualizar estado local
      setAlertas(prev => prev.map(alerta => 
        alerta.id === alertaId 
          ? { ...alerta, leida: true }
          : alerta
      ))

      onActualizarEstadisticas()
    } catch (error) {
      console.error('Error marcando alerta como leída:', error)
    }
  }

  const desactivarAlerta = async (alertaId: string) => {
    try {
      const { error } = await supabase
        .from('alertas_stock')
        .update({ activa: false })
        .eq('id', alertaId)

      if (error) throw error

      // Remover de la lista
      setAlertas(prev => prev.filter(alerta => alerta.id !== alertaId))
      onActualizarEstadisticas()
    } catch (error) {
      console.error('Error desactivando alerta:', error)
    }
  }

  const getIconoTipoAlerta = (tipo: string) => {
    switch (tipo) {
      case 'stock_minimo':
        return <Package className="h-4 w-4" />
      case 'vencimiento':
        return <Calendar className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getColorPrioridad = (prioridad?: string) => {
    switch (prioridad) {
      case 'Crítica':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Alta':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Baja':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatearFecha = (fecha: string) => {
    const ahora = new Date()
    const fechaAlerta = new Date(fecha)
    const diferencia = ahora.getTime() - fechaAlerta.getTime()
    const minutos = Math.floor(diferencia / (1000 * 60))
    const horas = Math.floor(minutos / 60)
    const dias = Math.floor(horas / 24)

    if (minutos < 60) return `Hace ${minutos}m`
    if (horas < 24) return `Hace ${horas}h`
    return `Hace ${dias}d`
  }

  const ejecutarVerificacionAlertas = async () => {
    try {
      const { data, error } = await supabase.rpc('ejecutar_verificacion_alertas')
      if (error) throw error
      
      console.log('Verificación ejecutada, nuevas alertas:', data)
      cargarAlertas()
      onActualizarEstadisticas()
    } catch (error) {
      console.error('Error ejecutando verificación:', error)
    }
  }

  const conteoFiltros = {
    todas: alertas.length,
    criticas: alertas.filter(a => a.prioridad === 'Crítica').length,
    no_leidas: alertas.filter(a => !a.leida).length,
    stock_minimo: alertas.filter(a => a.tipo_alerta === 'stock_minimo').length,
    vencimiento: alertas.filter(a => a.tipo_alerta === 'vencimiento').length
  }

  if (cargando) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                🚨 Centro de Alertas
              </CardTitle>
              <CardDescription>
                Gestiona alertas automáticas del sistema de stock
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={ejecutarVerificacionAlertas}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Verificar Alertas
              </Button>
              <Button onClick={cargarAlertas}>
                <Clock className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Filtros */}
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'todas', label: 'Todas', count: conteoFiltros.todas },
              { key: 'criticas', label: 'Críticas', count: conteoFiltros.criticas },
              { key: 'no_leidas', label: 'No Leídas', count: conteoFiltros.no_leidas },
              { key: 'stock_minimo', label: 'Stock Mínimo', count: conteoFiltros.stock_minimo },
              { key: 'vencimiento', label: 'Vencimientos', count: conteoFiltros.vencimiento }
            ].map((filtro) => (
              <Button
                key={filtro.key}
                variant={filtroActivo === filtro.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroActivo(filtro.key)}
                className="gap-2"
              >
                {filtro.label}
                {filtro.count > 0 && (
                  <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 text-xs">
                    {filtro.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de alertas */}
      {alertasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filtroActivo === 'todas' ? '¡Sin alertas!' : `No hay alertas ${(filtroActivo || '').replace('_', ' ')}`}
            </h3>
            <p className="text-gray-500">
              {filtroActivo === 'todas' 
                ? 'Tu sistema de stock está funcionando perfectamente.'
                : 'Cambia el filtro para ver otras alertas.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alertasFiltradas.map((alerta) => (
            <Card 
              key={alerta.id} 
              className={`${!alerta.leida ? 'border-l-4 border-l-red-500 bg-red-50' : 'bg-white'} transition-all hover:shadow-md`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Icono de tipo */}
                    <div className={`p-2 rounded-full ${getColorPrioridad(alerta.prioridad)}`}>
                      {getIconoTipoAlerta(alerta.tipo_alerta)}
                    </div>

                    {/* Contenido de la alerta */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {alerta.titulo}
                        </h4>
                        <Badge className={getColorPrioridad(alerta.prioridad)}>
                          {alerta.prioridad}
                        </Badge>
                        {!alerta.leida && (
                          <Badge variant="secondary" className="text-xs">
                            Nuevo
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {alerta.mensaje}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {alerta.item_nombre}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatearFecha(alerta.fecha_creacion)}
                        </span>
                        {alerta.ubicacion && (
                          <span className="flex items-center gap-1">
                            📍 {alerta.ubicacion}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-1 ml-2">
                    {!alerta.leida && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => marcarComoLeida(alerta.id)}
                        title="Marcar como leída"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => desactivarAlerta(alerta.id)}
                      title="Desactivar alerta"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 