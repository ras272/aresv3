'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Camera, 
  Edit, 
  QrCode, 
  MapPin, 
  Calendar, 
  User, 
  Package,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpDown,
  Printer,
  Share2,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface StockItem {
  id: string
  codigo_item: string
  nombre: string
  marca: string
  modelo: string
  numero_serie?: string
  cantidad_actual: number
  cantidad_minima: number
  estado: string
  fecha_ingreso: string
  fotos: string[]
  ubicacion?: {
    id: string
    nombre: string
    codigo: string
    path: string
  }
  custom_fields?: Record<string, any>
  tags?: string[]
}

interface ActivityItem {
  id: string
  tipo: 'created' | 'updated' | 'moved' | 'checked_out' | 'checked_in' | 'quantity_changed'
  descripcion: string
  usuario: string
  fecha: string
  detalles?: string
}

interface ItemDetailsModalProps {
  item: StockItem | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: (item: StockItem) => void
}

export function ItemDetailsModal({ item, isOpen, onClose, onUpdate }: ItemDetailsModalProps) {
  const [fotoActiva, setFotoActiva] = useState(0)
  const [editando, setEditando] = useState(false)
  const [cantidadTemporal, setCantidadTemporal] = useState('')
  const [ubicacionTemporal, setUbicacionTemporal] = useState('')
  const [notasCheckout, setNotasCheckout] = useState('')

  if (!item) return null

  // Datos de ejemplo de actividad
  const actividad: ActivityItem[] = [
    {
      id: '1',
      tipo: 'checked_out',
      descripcion: 'Item checked out',
      usuario: 'Javier López',
      fecha: '2024-01-15T10:30:00Z',
      detalles: 'Checked out for maintenance at Centro Estético Premium'
    },
    {
      id: '2',
      tipo: 'quantity_changed',
      descripcion: 'Quantity updated',
      usuario: 'Javier López',
      fecha: '2024-01-10T14:20:00Z',
      detalles: 'Quantity changed from 5 to 3'
    },
    {
      id: '3',
      tipo: 'updated',
      descripcion: 'Item details updated',
      usuario: 'Javier López',
      fecha: '2024-01-08T09:15:00Z',
      detalles: 'Updated minimum quantity threshold'
    }
  ]

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Disponible': return 'bg-green-100 text-green-800 border-green-200'
      case 'Stock Bajo': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'En uso': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Dañado': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'checked_out': return <ArrowUpDown className="h-4 w-4 text-orange-500" />
      case 'checked_in': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'quantity_changed': return <Package className="h-4 w-4 text-blue-500" />
      case 'moved': return <MapPin className="h-4 w-4 text-purple-500" />
      case 'updated': return <Edit className="h-4 w-4 text-gray-500" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const handleCheckOut = () => {
    console.log('Check out item:', item.id, 'Notes:', notasCheckout)
    setNotasCheckout('')
  }

  const handleQuantityUpdate = () => {
    console.log('Update quantity:', cantidadTemporal)
    setCantidadTemporal('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex">
        {/* Panel izquierdo - Fotos */}
        <div className="w-1/2 bg-gray-50 relative">
          {item.fotos.length > 0 ? (
            <>
              <img 
                src={item.fotos[fotoActiva]} 
                alt={item.nombre}
                className="w-full h-96 object-cover"
              />
              {item.fotos.length > 1 && (
                <>
                  <button 
                    onClick={() => setFotoActiva(Math.max(0, fotoActiva - 1))}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
                    disabled={fotoActiva === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setFotoActiva(Math.min(item.fotos.length - 1, fotoActiva + 1))}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
                    disabled={fotoActiva === item.fotos.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {item.fotos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setFotoActiva(index)}
                        className={`w-2 h-2 rounded-full ${
                          index === fotoActiva ? 'bg-white' : 'bg-white bg-opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-96 flex items-center justify-center bg-gray-200">
              <Camera className="h-16 w-16 text-gray-400" />
            </div>
          )}

          {/* Thumbnails */}
          {item.fotos.length > 1 && (
            <div className="p-4 flex gap-2 overflow-x-auto">
              {item.fotos.map((foto, index) => (
                <button
                  key={index}
                  onClick={() => setFotoActiva(index)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                    index === fotoActiva ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img src={foto} alt={`${item.nombre} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel derecho - Detalles */}
        <div className="w-1/2 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{item.nombre}</h3>
                <p className="text-sm text-gray-600">{item.marca} {item.modelo}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <QrCode className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Contenido con scroll */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="details" className="h-full">
              <TabsList className="w-full justify-start px-6 pt-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="px-6 pb-6 space-y-4">
                {/* Info básica */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge className={getEstadoColor(item.estado)}>
                      {item.estado}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Quantity</span>
                      <div className="text-2xl font-bold">{item.cantidad_actual}</div>
                      <div className="text-xs text-gray-500">Min: {item.cantidad_minima}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Item Code</span>
                      <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {item.codigo_item}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{item.ubicacion?.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Added {new Date(item.fecha_ingreso).toLocaleDateString()}</span>
                    </div>
                    {item.numero_serie && (
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">S/N: {item.numero_serie}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Fields */}
                {item.custom_fields && Object.keys(item.custom_fields).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Custom Fields</h4>
                    <div className="space-y-2">
                      {Object.entries(item.custom_fields).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                          <span className="text-sm font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity" className="px-6 pb-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Recent Activity</h4>
                  <div className="space-y-3">
                    {actividad.map((act) => (
                      <div key={act.id} className="flex gap-3 p-3 border rounded-lg">
                        {getActivityIcon(act.tipo)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{act.descripcion}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(act.fecha).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">by {act.usuario}</div>
                          {act.detalles && (
                            <div className="text-xs text-gray-500 mt-1">{act.detalles}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="actions" className="px-6 pb-6 space-y-4">
                {/* Check In/Out */}
                <div className="space-y-3">
                  <h4 className="font-medium">Check In/Out</h4>
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="Add notes for check-out..."
                      value={notasCheckout}
                      onChange={(e) => setNotasCheckout(e.target.value)}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleCheckOut} className="flex-1">
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        Check Out
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Check In
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Update Quantity */}
                <div className="space-y-3">
                  <h4 className="font-medium">Update Quantity</h4>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="New quantity..."
                      value={cantidadTemporal}
                      onChange={(e) => setCantidadTemporal(e.target.value)}
                      type="number"
                    />
                    <Button onClick={handleQuantityUpdate}>Update</Button>
                  </div>
                </div>

                {/* Move Item */}
                <div className="space-y-3">
                  <h4 className="font-medium">Move Item</h4>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="New location..."
                      value={ubicacionTemporal}
                      onChange={(e) => setUbicacionTemporal(e.target.value)}
                    />
                    <Button variant="outline">Move</Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h4 className="font-medium">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Add Photo
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <QrCode className="h-4 w-4 mr-2" />
                      Print QR
                    </Button>
                    <Button variant="outline" size="sm">
                      <Package className="h-4 w-4 mr-2" />
                      Duplicate
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
} 