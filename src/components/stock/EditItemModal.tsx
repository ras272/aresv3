'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Save, Package } from 'lucide-react'

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

interface EditItemModalProps {
  item: StockItem | null
  isOpen: boolean
  onClose: () => void
  onSave: (item: StockItem) => void
}

export function EditItemModal({ item, isOpen, onClose, onSave }: EditItemModalProps) {
  const [editedItem, setEditedItem] = useState<StockItem | null>(item)
  const [loading, setLoading] = useState(false)

  if (!item || !isOpen) return null

  // Inicializar el estado cuando se abre el modal
  if (editedItem?.id !== item.id) {
    setEditedItem(item)
  }

  const handleSave = async () => {
    if (!editedItem) return

    setLoading(true)
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSave(editedItem)
      onClose()
      
      // Mostrar confirmación
      alert(`✅ Producto actualizado exitosamente\n\n${editedItem.nombre} ha sido guardado con los nuevos datos.`)
    } catch (error) {
      alert('❌ Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: any) => {
    if (!editedItem) return
    setEditedItem({
      ...editedItem,
      [field]: value
    })
  }

  const updateNestedField = (path: string[], value: any) => {
    if (!editedItem) return
    const updated = { ...editedItem }
    let current: any = updated
    
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {}
      current = current[path[i]]
    }
    
    current[path[path.length - 1]] = value
    setEditedItem(updated)
  }

  if (!editedItem) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-blue-500" />
              <div>
                <h3 className="text-xl font-bold">Editar Producto</h3>
                <p className="text-sm text-gray-600">Código: {editedItem.codigo_item}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[calc(90vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Información Básica</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre del Producto *</label>
                  <Input
                    value={editedItem.nombre}
                    onChange={(e) => updateField('nombre', e.target.value)}
                    placeholder="Ej: Kit hydra Ultrafomer MPT"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Código de Item</label>
                  <Input
                    value={editedItem.codigo_item}
                    onChange={(e) => updateField('codigo_item', e.target.value)}
                    placeholder="Ej: ULT-DS45-001"
                    className="font-mono"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Marca *</label>
                  <Input
                    value={editedItem.marca}
                    onChange={(e) => updateField('marca', e.target.value)}
                    placeholder="Ej: Classys"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Modelo</label>
                  <Input
                    value={editedItem.modelo}
                    onChange={(e) => updateField('modelo', e.target.value)}
                    placeholder="Ej: Ultrafomer MPT"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Número de Serie</label>
                  <Input
                    value={editedItem.numero_serie || ''}
                    onChange={(e) => updateField('numero_serie', e.target.value)}
                    placeholder="Ej: ULT-2024-001234"
                    className="font-mono"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <Select 
                    value={editedItem.estado} 
                    onValueChange={(value) => updateField('estado', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Disponible">Disponible</SelectItem>
                      <SelectItem value="Stock Bajo">Stock Bajo</SelectItem>
                      <SelectItem value="En uso">En uso</SelectItem>
                      <SelectItem value="Dañado">Dañado</SelectItem>
                      <SelectItem value="Vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Inventario */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Control de Inventario</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cantidad Actual *</label>
                  <Input
                    type="number"
                    value={editedItem.cantidad_actual}
                    onChange={(e) => updateField('cantidad_actual', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Cantidad Mínima *</label>
                  <Input
                    type="number"
                    value={editedItem.cantidad_minima}
                    onChange={(e) => updateField('cantidad_minima', parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Ubicación</label>
                  <Input
                    value={editedItem.ubicacion?.nombre || ''}
                    onChange={(e) => updateNestedField(['ubicacion', 'nombre'], e.target.value)}
                    placeholder="Ej: Almacén Principal"
                  />
                </div>
              </div>
            </div>

            {/* Campos Personalizados */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Información Adicional</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Proveedor</label>
                  <Input
                    value={editedItem.custom_fields?.proveedor || ''}
                    onChange={(e) => updateNestedField(['custom_fields', 'proveedor'], e.target.value)}
                    placeholder="Ej: Importador ABC"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Código de Carga</label>
                  <Input
                    value={editedItem.custom_fields?.codigo_carga || ''}
                    onChange={(e) => updateNestedField(['custom_fields', 'codigo_carga'], e.target.value)}
                    placeholder="Ej: ENTRADA-20250115-001"
                    className="font-mono"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tags (separados por comas)</label>
                <Input
                  value={editedItem.tags?.join(', ') || ''}
                  onChange={(e) => updateField('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                  placeholder="Ej: ultraformer, facial, cartucho"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Package className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 