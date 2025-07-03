'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Building,
  Package,
  Search,
  QrCode
} from 'lucide-react'

interface GestorUbicacionesProps {
  onActualizar: () => void
}

interface Ubicacion {
  id?: string
  ubicacion_id: string
  codigo_ubicacion: string
  nombre_ubicacion: string
  tipo_ubicacion: string
  descripcion?: string
  ubicacion_padre_id?: string
  direccion_fisica?: string
  capacidad_max?: number
  estado?: string
  total_items?: number
  items_disponibles?: number
  items_stock_minimo?: number
  children?: Ubicacion[]
}

export function GestorUbicaciones({ onActualizar }: GestorUbicacionesProps) {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [ubicacionesJerarquicas, setUbicacionesJerarquicas] = useState<Ubicacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState<Ubicacion | null>(null)

  useEffect(() => {
    cargarUbicaciones()
  }, [])

  useEffect(() => {
    organizarJerarquia()
  }, [ubicaciones])

  const cargarUbicaciones = async () => {
    try {
      setCargando(true)

      // Cargar ubicaciones con estadísticas
      const { data, error } = await supabase
        .from('vista_stock_por_ubicacion')
        .select('*')
        .order('codigo_ubicacion')

      if (error) throw error

      setUbicaciones(data || [])
    } catch (error) {
      console.error('Error cargando ubicaciones:', error)
    } finally {
      setCargando(false)
    }
  }

  const organizarJerarquia = () => {
    const ubicacionesMap = new Map()
    const raices: Ubicacion[] = []

    // Crear mapa de ubicaciones
    ubicaciones.forEach(ubicacion => {
      ubicacionesMap.set(ubicacion.ubicacion_id, {
        ...ubicacion,
        children: []
      })
    })

    // Organizar jerarquía
    ubicaciones.forEach(ubicacion => {
      const ubicacionCompleta = ubicacionesMap.get(ubicacion.ubicacion_id)
      
      if (ubicacion.ubicacion_padre_id) {
        const padre = ubicacionesMap.get(ubicacion.ubicacion_padre_id)
        if (padre) {
          padre.children.push(ubicacionCompleta)
        }
      } else {
        raices.push(ubicacionCompleta)
      }
    })

    setUbicacionesJerarquicas(raices)
  }

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'Almacen':
        return <Building className="h-4 w-4 text-blue-500" />
      case 'Area':
        return <MapPin className="h-4 w-4 text-green-500" />
      case 'Estante':
        return <Package className="h-4 w-4 text-purple-500" />
      case 'Contenedor':
        return <Package className="h-4 w-4 text-orange-500" />
      default:
        return <MapPin className="h-4 w-4 text-gray-500" />
    }
  }

  const getColorEstado = (estado?: string) => {
    switch (estado) {
      case 'Activa':
        return 'bg-green-100 text-green-800'
      case 'Inactiva':
        return 'bg-gray-100 text-gray-800'
      case 'Mantenimiento':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const generarCodigoQR = async (ubicacion: Ubicacion) => {
    try {
             const qrData = {
         tipo: 'ubicacion',
         id: ubicacion.ubicacion_id,
         codigo: ubicacion.codigo_ubicacion,
         nombre: ubicacion.nombre_ubicacion,
         timestamp: Date.now()
       }

       const { error } = await supabase
         .from('ubicaciones_stock')
         .update({ codigo_qr: JSON.stringify(qrData) })
         .eq('id', ubicacion.ubicacion_id)

      if (error) throw error

             console.log('Código QR generado para:', ubicacion.nombre_ubicacion)
      cargarUbicaciones()
    } catch (error) {
      console.error('Error generando QR:', error)
    }
  }

  const UbicacionItem = ({ ubicacion, nivel = 0 }: { ubicacion: Ubicacion, nivel?: number }) => (
    <div className={`ml-${nivel * 4}`}>
      <Card className="mb-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {getIconoTipo(ubicacion.tipo_ubicacion)}
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{ubicacion.nombre_ubicacion}</h4>
                  <Badge className={getColorEstado(ubicacion.estado || 'Activa')}>
                    {ubicacion.estado || 'Activa'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {ubicacion.tipo_ubicacion}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-600 mt-1">
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs mr-2">
                    {ubicacion.codigo_ubicacion}
                  </code>
                  {ubicacion.descripcion}
                </div>

                {/* Estadísticas de stock */}
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-blue-600">
                    📦 {ubicacion.total_items || 0} items
                  </span>
                  <span className="text-green-600">
                    ✅ {ubicacion.items_disponibles || 0} disponibles
                  </span>
                  {(ubicacion.items_stock_minimo || 0) > 0 && (
                    <span className="text-red-600">
                      ⚠️ {ubicacion.items_stock_minimo} críticos
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => generarCodigoQR(ubicacion)}>
                <QrCode className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditando(ubicacion)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ubicaciones hijas */}
      {ubicacion.children && ubicacion.children.map((child) => (
        <UbicacionItem key={child.ubicacion_id} ubicacion={child} nivel={nivel + 1} />
      ))}
    </div>
  )

  const FormularioUbicacion = () => {
    const [formData, setFormData] = useState({
      codigo: '',
      nombre: '',
      tipo: 'Estante',
      descripcion: '',
      ubicacion_padre_id: '',
      direccion_fisica: '',
      capacidad_max: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      
      try {
        const datos = {
          ...formData,
          capacidad_max: formData.capacidad_max ? parseInt(formData.capacidad_max) : null,
          ubicacion_padre_id: formData.ubicacion_padre_id || null
        }

        if (editando) {
          const { error } = await supabase
            .from('ubicaciones_stock')
            .update(datos)
            .eq('id', editando.ubicacion_id)
          
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('ubicaciones_stock')
            .insert([datos])
          
          if (error) throw error
        }

        setMostrarFormulario(false)
        setEditando(null)
        cargarUbicaciones()
        onActualizar()
      } catch (error) {
        console.error('Error guardando ubicación:', error)
      }
    }

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {editando ? 'Editar Ubicación' : 'Nueva Ubicación'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Código *</label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                  placeholder="Ej: ALM-A1-E3"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Estante A1-E3"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tipo *</label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Almacen">Almacén</SelectItem>
                    <SelectItem value="Area">Área</SelectItem>
                    <SelectItem value="Estante">Estante</SelectItem>
                    <SelectItem value="Contenedor">Contenedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Capacidad Máxima</label>
                <Input
                  type="number"
                  value={formData.capacidad_max}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacidad_max: e.target.value }))}
                  placeholder="Número máximo de items"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Input
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Descripción de la ubicación"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editando ? 'Actualizar' : 'Crear'} Ubicación
              </Button>
              <Button type="button" variant="outline" onClick={() => {
                setMostrarFormulario(false)
                setEditando(null)
              }}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
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
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-500" />
                📍 Gestor de Ubicaciones
              </CardTitle>
              <CardDescription>
                Administra las ubicaciones físicas del almacén
              </CardDescription>
            </div>
            <Button onClick={() => setMostrarFormulario(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Ubicación
            </Button>
          </div>
        </CardHeader>

        {/* Filtros */}
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar ubicaciones..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="Almacen">Almacén</SelectItem>
                <SelectItem value="Area">Área</SelectItem>
                <SelectItem value="Estante">Estante</SelectItem>
                <SelectItem value="Contenedor">Contenedor</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={cargarUbicaciones}>
              🔄 Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Formulario */}
      {(mostrarFormulario || editando) && <FormularioUbicacion />}

      {/* Lista jerarquizada de ubicaciones */}
      <div className="space-y-2">
        {ubicacionesJerarquicas.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay ubicaciones configuradas
              </h3>
              <p className="text-gray-500 mb-4">
                Crea la primera ubicación para empezar a organizar tu inventario
              </p>
              <Button onClick={() => setMostrarFormulario(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Ubicación
              </Button>
            </CardContent>
          </Card>
        ) : (
          ubicacionesJerarquicas.map((ubicacion) => (
            <UbicacionItem key={ubicacion.ubicacion_id} ubicacion={ubicacion} />
          ))
        )}
      </div>
    </div>
  )
} 