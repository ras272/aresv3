'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Plus, Package, Wand2 } from 'lucide-react'

interface NewStockItem {
  codigo_item: string
  nombre: string
  marca: string
  modelo: string
  numero_serie?: string
  cantidad_actual: number
  cantidad_minima: number
  estado: string
  ubicacion: {
    nombre: string
    codigo: string
  }
  custom_fields: {
    proveedor?: string
    codigo_carga?: string
  }
  tags: string[]
}

interface NewItemModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (item: NewStockItem) => void
}

export function NewItemModal({ isOpen, onClose, onCreate }: NewItemModalProps) {
  const [newItem, setNewItem] = useState<NewStockItem>({
    codigo_item: '',
    nombre: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    cantidad_actual: 1,
    cantidad_minima: 1,
    estado: 'Disponible',
    ubicacion: {
      nombre: 'Almacén Principal',
      codigo: 'ALM-001'
    },
    custom_fields: {
      proveedor: '',
      codigo_carga: ''
    },
    tags: []
  })
  
  const [loading, setLoading] = useState(false)
  const [autoGenerate, setAutoGenerate] = useState(false)

  if (!isOpen) return null

  const generateCode = () => {
    const marcaPrefix = newItem.marca.substring(0, 3).toUpperCase()
    const modeloPrefix = newItem.modelo.substring(0, 3).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    
    const generatedCode = `${marcaPrefix}-${modeloPrefix}-${timestamp}`
    setNewItem(prev => ({
      ...prev,
      codigo_item: generatedCode
    }))
  }

  const handleCreate = async () => {
    // Validación básica
    if (!newItem.nombre.trim() || !newItem.marca.trim() || !newItem.codigo_item.trim()) {
      alert('❌ Por favor completa los campos obligatorios: Nombre, Marca y Código')
      return
    }

    setLoading(true)
    try {
      // Simular creación
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      onCreate(newItem)
      onClose()
      
      // Reset form
      setNewItem({
        codigo_item: '',
        nombre: '',
        marca: '',
        modelo: '',
        numero_serie: '',
        cantidad_actual: 1,
        cantidad_minima: 1,
        estado: 'Disponible',
        ubicacion: {
          nombre: 'Almacén Principal',
          codigo: 'ALM-001'
        },
        custom_fields: {
          proveedor: '',
          codigo_carga: ''
        },
        tags: []
      })
      
      alert(`✅ Producto creado exitosamente\n\n"${newItem.nombre}" ha sido agregado al inventario.`)
    } catch (error) {
      alert('❌ Error al crear el producto')
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setNewItem(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Auto-generar código si está habilitado
    if (autoGenerate && (field === 'marca' || field === 'modelo') && newItem.marca && newItem.modelo) {
      setTimeout(generateCode, 100)
    }
  }

  const updateNestedField = (path: string[], value: any) => {
    setNewItem(prev => {
      const updated = { ...prev }
      let current: any = updated
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {}
        current = current[path[i]]
      }
      
      current[path[path.length - 1]] = value
      return updated
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Crear Nuevo Producto</h3>
                <p className="text-sm text-gray-600">Agregar un nuevo item al inventario</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[calc(95vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2 text-blue-800">📦 Información Básica</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Nombre del Producto *
                  </label>
                  <Input
                    value={newItem.nombre}
                    onChange={(e) => updateField('nombre', e.target.value)}
                    placeholder="Ej: Kit hydra Ultrafomer MPT"
                    className="text-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Marca *</label>
                  <Input
                    value={newItem.marca}
                    onChange={(e) => updateField('marca', e.target.value)}
                    placeholder="Ej: Classys"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Modelo</label>
                  <Input
                    value={newItem.modelo}
                    onChange={(e) => updateField('modelo', e.target.value)}
                    placeholder="Ej: Ultrafomer MPT"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium">Código de Item *</label>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={autoGenerate}
                          onChange={(e) => setAutoGenerate(e.target.checked)}
                          className="w-3 h-3"
                        />
                        Auto-generar
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateCode}
                        disabled={!newItem.marca || !newItem.modelo}
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        Generar
                      </Button>
                    </div>
                  </div>
                  <Input
                    value={newItem.codigo_item}
                    onChange={(e) => updateField('codigo_item', e.target.value)}
                    placeholder="Ej: CLS-DS4-240115"
                    className="font-mono"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Número de Serie</label>
                  <Input
                    value={newItem.numero_serie}
                    onChange={(e) => updateField('numero_serie', e.target.value)}
                    placeholder="Ej: ULT-2024-001234"
                    className="font-mono"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Estado Inicial</label>
                  <Select 
                    value={newItem.estado} 
                    onValueChange={(value) => updateField('estado', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Disponible">Disponible</SelectItem>
                      <SelectItem value="Stock Bajo">Stock Bajo</SelectItem>
                      <SelectItem value="En uso">En uso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Control de Inventario */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2 text-green-800">📊 Control de Inventario</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cantidad Inicial *</label>
                  <Input
                    type="number"
                    value={newItem.cantidad_actual}
                    onChange={(e) => updateField('cantidad_actual', parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Cantidad Mínima *</label>
                  <Input
                    type="number"
                    value={newItem.cantidad_minima}
                    onChange={(e) => updateField('cantidad_minima', parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Ubicación</label>
                  <Select 
                    value={newItem.ubicacion.nombre}
                    onValueChange={(value) => updateNestedField(['ubicacion', 'nombre'], value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Almacén Principal">Almacén Principal</SelectItem>
                      <SelectItem value="Almacén Secundario">Almacén Secundario</SelectItem>
                      <SelectItem value="Showroom">Showroom</SelectItem>
                      <SelectItem value="En Tránsito">En Tránsito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2 text-purple-800">🏷️ Información Adicional</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Proveedor</label>
                  <Input
                    value={newItem.custom_fields.proveedor}
                    onChange={(e) => updateNestedField(['custom_fields', 'proveedor'], e.target.value)}
                    placeholder="Ej: Importador ABC"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Código de Carga</label>
                  <Input
                    value={newItem.custom_fields.codigo_carga}
                    onChange={(e) => updateNestedField(['custom_fields', 'codigo_carga'], e.target.value)}
                    placeholder="Ej: ENTRADA-20250115-001"
                    className="font-mono"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tags (separados por comas)</label>
                <Input
                  value={newItem.tags.join(', ')}
                  onChange={(e) => updateField('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                  placeholder="Ej: ultraformer, facial, cartucho, classys"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex gap-3 justify-between">
            <div className="text-xs text-gray-500 self-center">
              * Campos obligatorios
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? (
                  <>
                    <Package className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Producto
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 