'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { 
  QrCode, 
  Download, 
  Eye,
  Package,
  MapPin,
  Search,
  Plus,
  Printer
} from 'lucide-react'

interface GeneradorQRProps {}

interface QRItem {
  id: string
  tipo: 'stock_item' | 'ubicacion'
  codigo: string
  nombre: string
  qr_data?: string
  estado?: string
  ubicacion?: string
}

export function GeneradorQR({}: GeneradorQRProps) {
  const [items, setItems] = useState<QRItem[]>([])
  const [itemsFiltrados, setItemsFiltrados] = useState<QRItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [itemsSeleccionados, setItemsSeleccionados] = useState<Set<string>>(new Set())
  const [qrPersonalizado, setQrPersonalizado] = useState({
    tipo: 'personalizado',
    titulo: '',
    contenido: '',
    mostrar: false
  })

  useEffect(() => {
    cargarItems()
  }, [])

  useEffect(() => {
    filtrarItems()
  }, [busqueda, filtroTipo, items])

  const cargarItems = async () => {
    try {
      setCargando(true)

      // Cargar items de stock
      const { data: stockItems, error: stockError } = await supabase
        .from('stock_items')
        .select('id, codigo_item, nombre, codigo_qr, estado')
        .order('nombre')

      if (stockError) throw stockError

      // Cargar ubicaciones
      const { data: ubicaciones, error: ubicacionesError } = await supabase
        .from('ubicaciones_stock')
        .select('id, codigo, nombre, codigo_qr, estado')
        .eq('estado', 'Activa')
        .order('nombre')

      if (ubicacionesError) throw ubicacionesError

      const itemsFormateados: QRItem[] = [
        ...(stockItems || []).map(item => ({
          id: item.id,
          tipo: 'stock_item' as const,
          codigo: item.codigo_item,
          nombre: item.nombre,
          qr_data: item.codigo_qr,
          estado: item.estado
        })),
        ...(ubicaciones || []).map(ubicacion => ({
          id: ubicacion.id,
          tipo: 'ubicacion' as const,
          codigo: ubicacion.codigo,
          nombre: ubicacion.nombre,
          qr_data: ubicacion.codigo_qr,
          estado: ubicacion.estado
        }))
      ]

      setItems(itemsFormateados)
    } catch (error) {
      console.error('Error cargando items:', error)
    } finally {
      setCargando(false)
    }
  }

  const filtrarItems = () => {
    let filtrados = items

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase()
      filtrados = filtrados.filter(item => 
        item.nombre.toLowerCase().includes(termino) ||
        item.codigo.toLowerCase().includes(termino)
      )
    }

    // Filtro por tipo
    if (filtroTipo !== 'todos') {
      filtrados = filtrados.filter(item => item.tipo === filtroTipo)
    }

    setItemsFiltrados(filtrados)
  }

  const generarQRPorLotes = async () => {
    if (itemsSeleccionados.size === 0) return

    try {
      const actualizaciones = Array.from(itemsSeleccionados).map(async (itemId) => {
        const item = items.find(i => i.id === itemId)
        if (!item) return

        const qrData = {
          tipo: item.tipo,
          id: item.id,
          codigo: item.codigo,
          nombre: item.nombre,
          timestamp: Date.now()
        }

        if (item.tipo === 'stock_item') {
          return supabase
            .from('stock_items')
            .update({ codigo_qr: JSON.stringify(qrData) })
            .eq('id', item.id)
        } else {
          return supabase
            .from('ubicaciones_stock')
            .update({ codigo_qr: JSON.stringify(qrData) })
            .eq('id', item.id)
        }
      })

      await Promise.all(actualizaciones)
      setItemsSeleccionados(new Set())
      cargarItems()
    } catch (error) {
      console.error('Error generando QRs:', error)
    }
  }

  const generarQRIndividual = async (item: QRItem) => {
    try {
      const qrData = {
        tipo: item.tipo,
        id: item.id,
        codigo: item.codigo,
        nombre: item.nombre,
        timestamp: Date.now()
      }

      if (item.tipo === 'stock_item') {
        const { error } = await supabase
          .from('stock_items')
          .update({ codigo_qr: JSON.stringify(qrData) })
          .eq('id', item.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('ubicaciones_stock')
          .update({ codigo_qr: JSON.stringify(qrData) })
          .eq('id', item.id)
        
        if (error) throw error
      }

      cargarItems()
    } catch (error) {
      console.error('Error generando QR:', error)
    }
  }

  const generarQRPersonalizado = () => {
    if (!qrPersonalizado.titulo || !qrPersonalizado.contenido) return

    const qrData = {
      tipo: 'personalizado',
      titulo: qrPersonalizado.titulo,
      contenido: qrPersonalizado.contenido,
      timestamp: Date.now()
    }

    // Mostrar el QR personalizado
    setQrPersonalizado(prev => ({ 
      ...prev, 
      mostrar: true
    }))

    console.log('QR Personalizado generado:', qrData)
  }

  const toggleSeleccion = (itemId: string) => {
    const nuevaSeleccion = new Set(itemsSeleccionados)
    if (nuevaSeleccion.has(itemId)) {
      nuevaSeleccion.delete(itemId)
    } else {
      nuevaSeleccion.add(itemId)
    }
    setItemsSeleccionados(nuevaSeleccion)
  }

  const seleccionarTodos = () => {
    if (itemsSeleccionados.size === itemsFiltrados.length) {
      setItemsSeleccionados(new Set())
    } else {
      setItemsSeleccionados(new Set(itemsFiltrados.map(item => item.id)))
    }
  }

  const exportarQRsSeleccionados = () => {
    const itemsExportar = itemsFiltrados.filter(item => 
      itemsSeleccionados.has(item.id) && item.qr_data
    )

    if (itemsExportar.length === 0) return

    // Crear contenido HTML para imprimir
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Códigos QR - ARES Stock</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .qr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .qr-item { text-align: center; border: 1px solid #ddd; padding: 15px; page-break-inside: avoid; }
          .qr-code { width: 150px; height: 150px; margin: 0 auto 10px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; }
          .qr-info { font-size: 12px; }
          .qr-title { font-weight: bold; margin-bottom: 5px; }
          .qr-code-text { font-family: monospace; font-size: 10px; }
        </style>
      </head>
      <body>
        <h1>Códigos QR - Sistema de Stock ARES</h1>
        <div class="qr-grid">
          ${itemsExportar.map(item => `
            <div class="qr-item">
              <div class="qr-code">[QR: ${item.codigo}]</div>
              <div class="qr-info">
                <div class="qr-title">${item.nombre}</div>
                <div class="qr-code-text">${item.codigo}</div>
                <div>${item.tipo === 'stock_item' ? '📦 Item' : '📍 Ubicación'}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `qr_codes_${new Date().toISOString().split('T')[0]}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getIconoTipo = (tipo?: string) => {
    return tipo === 'stock_item' 
      ? <Package className="h-4 w-4 text-blue-500" />
      : <MapPin className="h-4 w-4 text-green-500" />
  }

  const getColorEstado = (estado?: string) => {
    switch (estado) {
      case 'Disponible':
      case 'Activa':
        return 'bg-green-100 text-green-800'
      case 'En_uso':
        return 'bg-blue-100 text-blue-800'
      case 'Dañado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-purple-500" />
            🏷️ Generador de Códigos QR
          </CardTitle>
          <CardDescription>
            Genera códigos QR para items de stock y ubicaciones del almacén
          </CardDescription>
        </CardHeader>
      </Card>

      {/* QR Personalizado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            ✨ Crear QR Personalizado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={qrPersonalizado.titulo}
                onChange={(e) => setQrPersonalizado(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ej: Información de contacto"
              />
            </div>
            <div>
              <Button onClick={generarQRPersonalizado} className="mt-6">
                <QrCode className="h-4 w-4 mr-2" />
                Generar QR
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Contenido</label>
            <Textarea
              value={qrPersonalizado.contenido}
              onChange={(e) => setQrPersonalizado(prev => ({ ...prev, contenido: e.target.value }))}
              placeholder="Contenido del código QR (URL, texto, contacto, etc.)"
              rows={3}
            />
          </div>
          {qrPersonalizado.mostrar && (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="w-48 h-48 mx-auto bg-white border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
                <div className="text-center">
                  <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                  <div className="text-sm text-gray-600">QR Generado</div>
                  <div className="text-xs text-gray-500">{qrPersonalizado.titulo}</div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                En un sistema real, aquí se mostraría el código QR generado
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                📋 Items y Ubicaciones
              </CardTitle>
              <CardDescription>
                {itemsFiltrados.length} elementos disponibles
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {itemsSeleccionados.size > 0 && (
                <>
                  <Button variant="outline" onClick={exportarQRsSeleccionados}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar ({itemsSeleccionados.size})
                  </Button>
                  <Button onClick={generarQRPorLotes}>
                    <QrCode className="h-4 w-4 mr-2" />
                    Generar QRs ({itemsSeleccionados.size})
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar items..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="stock_item">Items de Stock</SelectItem>
                <SelectItem value="ubicacion">Ubicaciones</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={seleccionarTodos}>
              {itemsSeleccionados.size === itemsFiltrados.length ? 'Deseleccionar' : 'Seleccionar'} Todo
            </Button>

            <Button variant="outline" onClick={cargarItems}>
              🔄 Actualizar
            </Button>
          </div>

          {/* Lista de items */}
          {cargando ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {itemsFiltrados.map((item) => (
                <div 
                  key={item.id}
                  className={`p-4 border rounded-lg transition-all ${
                    itemsSeleccionados.has(item.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={itemsSeleccionados.has(item.id)}
                        onChange={() => toggleSeleccion(item.id)}
                        className="w-4 h-4"
                      />
                      
                      {getIconoTipo(item.tipo)}
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.nombre}</span>
                          <Badge className={getColorEstado(item.estado)}>
                            {item.estado || 'Activa'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.tipo === 'stock_item' ? 'Item' : 'Ubicación'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-xs mr-2">
                            {item.codigo}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.qr_data && (
                        <Badge variant="secondary" className="text-xs">
                          ✅ QR Generado
                        </Badge>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => generarQRIndividual(item)}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 