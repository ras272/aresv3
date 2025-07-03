'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  CheckSquare, 
  Plus, 
  Search, 
  X, 
  Package, 
  MapPin, 
  User, 
  Calendar,
  Printer,
  Download,
  Share2,
  Trash2,
  ChevronRight
} from 'lucide-react'

interface StockItem {
  id: string
  codigo_item: string
  nombre: string
  marca: string
  modelo: string
  cantidad_actual: number
  estado: string
  fotos: string[]
  ubicacion?: {
    id: string
    nombre: string
    codigo: string
  }
}

interface PickListItem {
  item: StockItem
  cantidadRequerida: number
  cantidadRecolectada?: number
  recolectado: boolean
  notas?: string
}

interface PickList {
  id: string
  nombre: string
  descripcion?: string
  proposito: 'maintenance' | 'shipment' | 'inventory_check' | 'other'
  estado: 'draft' | 'active' | 'completed'
  asignado_a?: string
  fecha_creacion: string
  fecha_vencimiento?: string
  items: PickListItem[]
}

interface PickListModalProps {
  isOpen: boolean
  onClose: () => void
  pickList?: PickList | null
  availableItems: StockItem[]
  onSave?: (pickList: PickList) => void
}

export function PickListModal({ isOpen, onClose, pickList, availableItems, onSave }: PickListModalProps) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [proposito, setProposito] = useState<string>('other')
  const [asignadoA, setAsignadoA] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [items, setItems] = useState<PickListItem[]>([])
  const [busquedaItem, setBusquedaItem] = useState('')
  const [itemsFiltrados, setItemsFiltrados] = useState<StockItem[]>([])
  const [mostrarAgregarItem, setMostrarAgregarItem] = useState(false)

  useEffect(() => {
    if (pickList) {
      setNombre(pickList.nombre)
      setDescripcion(pickList.descripcion || '')
      setProposito(pickList.proposito)
      setAsignadoA(pickList.asignado_a || '')
      setFechaVencimiento(pickList.fecha_vencimiento?.split('T')[0] || '')
      setItems(pickList.items)
    } else {
      // Reset form for new pick list
      setNombre('')
      setDescripcion('')
      setProposito('other')
      setAsignadoA('')
      setFechaVencimiento('')
      setItems([])
    }
  }, [pickList])

  useEffect(() => {
    if (busquedaItem.trim()) {
      const filtrados = availableItems.filter(item =>
        item.nombre.toLowerCase().includes(busquedaItem.toLowerCase()) ||
        item.codigo_item.toLowerCase().includes(busquedaItem.toLowerCase()) ||
        item.marca.toLowerCase().includes(busquedaItem.toLowerCase())
      )
      setItemsFiltrados(filtrados)
    } else {
      setItemsFiltrados(availableItems.slice(0, 10))
    }
  }, [busquedaItem, availableItems])

  const agregarItem = (item: StockItem) => {
    const yaExiste = items.find(pickItem => pickItem.item.id === item.id)
    if (!yaExiste) {
      setItems([...items, {
        item,
        cantidadRequerida: 1,
        recolectado: false
      }])
    }
    setBusquedaItem('')
    setMostrarAgregarItem(false)
  }

  const removerItem = (itemId: string) => {
    setItems(items.filter(pickItem => pickItem.item.id !== itemId))
  }

  const actualizarCantidad = (itemId: string, cantidad: number) => {
    setItems(items.map(pickItem =>
      pickItem.item.id === itemId
        ? { ...pickItem, cantidadRequerida: cantidad }
        : pickItem
    ))
  }

  const toggleRecolectado = (itemId: string) => {
    setItems(items.map(pickItem =>
      pickItem.item.id === itemId
        ? { ...pickItem, recolectado: !pickItem.recolectado }
        : pickItem
    ))
  }

  const guardarPickList = () => {
    const nuevoPickList: PickList = {
      id: pickList?.id || `pick_${Date.now()}`,
      nombre,
      descripcion,
      proposito: proposito as any,
      estado: 'draft',
      asignado_a: asignadoA,
      fecha_creacion: pickList?.fecha_creacion || new Date().toISOString(),
      fecha_vencimiento: fechaVencimiento ? `${fechaVencimiento}T23:59:59Z` : undefined,
      items
    }
    
    onSave?.(nuevoPickList)
    onClose()
  }

  const getPropositoLabel = (prop: string) => {
    switch (prop) {
      case 'maintenance': return 'Mantenimiento'
      case 'shipment': return 'Envío'
      case 'inventory_check': return 'Verificación'
      default: return 'Otro'
    }
  }

  const itemsRecolectados = items.filter(item => item.recolectado).length
  const progreso = items.length > 0 ? (itemsRecolectados / items.length) * 100 : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <CheckSquare className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="text-xl font-bold">
                {pickList ? 'Edit Pick List' : 'Create Pick List'}
              </h3>
              <p className="text-sm text-gray-600">
                {items.length} items • {itemsRecolectados} collected ({Math.round(progreso)}%)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {pickList && (
              <>
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex h-96">
          {/* Panel izquierdo - Configuración */}
          <div className="w-1/3 p-6 border-r space-y-4">
            <div>
              <label className="text-sm font-medium">List Name</label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Enter pick list name..."
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Optional description..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Purpose</label>
              <Select value={proposito} onValueChange={setProposito}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="shipment">Envío a Cliente</SelectItem>
                  <SelectItem value="inventory_check">Verificación de Inventario</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Assigned To</label>
              <Input
                value={asignadoA}
                onChange={(e) => setAsignadoA(e.target.value)}
                placeholder="Assign to team member..."
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Progress */}
            <div className="pt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{Math.round(progreso)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>
          </div>

          {/* Panel derecho - Items */}
          <div className="flex-1 flex flex-col">
            {/* Header de items */}
            <div className="p-4 border-b flex items-center justify-between">
              <h4 className="font-medium">Items to Collect</h4>
              <Button 
                size="sm" 
                onClick={() => setMostrarAgregarItem(!mostrarAgregarItem)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {/* Add item section */}
            {mostrarAgregarItem && (
              <div className="p-4 bg-gray-50 border-b">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search items to add..."
                      value={busquedaItem}
                      onChange={(e) => setBusquedaItem(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {busquedaItem && (
                    <div className="max-h-40 overflow-y-auto border rounded">
                      {itemsFiltrados.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                          onClick={() => agregarItem(item)}
                        >
                          <div className="flex items-center gap-3">
                            {item.fotos[0] && (
                              <img 
                                src={item.fotos[0]} 
                                alt={item.nombre}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-sm">{item.nombre}</div>
                              <div className="text-xs text-gray-600">
                                {item.codigo_item} • {item.cantidad_actual} available
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lista de items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Package className="h-12 w-12 mb-3" />
                  <p>No items added yet</p>
                  <p className="text-sm">Click "Add Item" to get started</p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {items.map((pickItem) => (
                    <div
                      key={pickItem.item.id}
                      className={`flex items-center gap-4 p-3 border rounded-lg ${
                        pickItem.recolectado ? 'bg-green-50 border-green-200' : 'bg-white'
                      }`}
                    >
                      <Checkbox
                        checked={pickItem.recolectado}
                        onCheckedChange={() => toggleRecolectado(pickItem.item.id)}
                      />
                      
                      {pickItem.item.fotos[0] && (
                        <img 
                          src={pickItem.item.fotos[0]} 
                          alt={pickItem.item.nombre}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-sm ${
                            pickItem.recolectado ? 'line-through text-gray-500' : ''
                          }`}>
                            {pickItem.item.nombre}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {pickItem.item.codigo_item}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 flex items-center gap-3 mt-1">
                          <span>{pickItem.item.marca} {pickItem.item.modelo}</span>
                          {pickItem.item.ubicacion && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {pickItem.item.ubicacion.codigo}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={pickItem.cantidadRequerida}
                          onChange={(e) => actualizarCantidad(pickItem.item.id, parseInt(e.target.value) || 1)}
                          className="w-16 h-8 text-center text-sm"
                          min="1"
                          max={pickItem.item.cantidad_actual}
                        />
                        <span className="text-xs text-gray-500">qty</span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removerItem(pickItem.item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {items.length} items • {items.reduce((sum, item) => sum + item.cantidadRequerida, 0)} total quantity
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={guardarPickList} disabled={!nombre.trim() || items.length === 0}>
              {pickList ? 'Update Pick List' : 'Create Pick List'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 