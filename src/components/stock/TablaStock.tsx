'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/database/shared/supabase'
import { 
  Search, 
  Filter, 
  Package, 
  Edit, 
  Trash2, 
  Eye,
  Plus,
  Download,
  QrCode,
  MapPin,
  Calendar
} from 'lucide-react'

interface TablaStockProps {
  onActualizar: () => void
}

interface StockItem {
  id: string
  codigo_item: string
  nombre: string
  marca: string
  modelo: string
  numero_serie?: string
  cantidad_actual: number
  cantidad_minima: number
  cantidad_maxima?: number
  estado: string
  fecha_ingreso: string
  fecha_vencimiento?: string
  ubicacion?: {
    id: string
    nombre: string
    codigo: string
  }
  codigo_carga_origen?: string
}

export function TablaStock({ onActualizar }: TablaStockProps) {
  const [items, setItems] = useState<StockItem[]>([])
  const [itemsFiltrados, setItemsFiltrados] = useState<StockItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroUbicacion, setFiltroUbicacion] = useState('todas')
  const [ubicaciones, setUbicaciones] = useState<any[]>([])
  const [paginaActual, setPaginaActual] = useState(1)
  const itemsPorPagina = 20

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    filtrarItems()
  }, [busqueda, filtroEstado, filtroUbicacion, items])

  const cargarDatos = async () => {
    try {
      setCargando(true)

      // Datos de ejemplo para TablaStock - Items típicos de ARES
      const itemsEjemplo = [
        {
          id: '1',
          codigo_item: 'ULT-DS-1.5',
          nombre: 'Cartucho Ultraformer DS-1.5',
          marca: 'Classys',
          modelo: 'DS-1.5',
          numero_serie: 'ULT15-2024-001',
          cantidad_actual: 2,
          cantidad_minima: 10,
          estado: 'Disponible',
          fecha_ingreso: '2024-01-15T00:00:00Z',
          ubicacion: { id: '1', nombre: 'Almacén Principal', codigo: 'A1-E1' }
        },
        {
          id: '2',
          codigo_item: 'ULT-DS-4.5',
          nombre: 'Cartucho Ultraformer DS-4.5',
          marca: 'Classys',
          modelo: 'DS-4.5',
          numero_serie: 'ULT45-2024-002',
          cantidad_actual: 1,
          cantidad_minima: 8,
          estado: 'Disponible',
          fecha_ingreso: '2024-01-15T00:00:00Z',
          ubicacion: { id: '1', nombre: 'Almacén Principal', codigo: 'A1-E2' }
        },
        {
          id: '3',
          codigo_item: 'CM-SLIM-12',
          nombre: 'Pieza de mano CM Slim 12mm',
          marca: 'ARES',
          modelo: 'CM-S12',
          numero_serie: 'CMS12-2024-003',
          cantidad_actual: 3,
          cantidad_minima: 15,
          estado: 'Disponible',
          fecha_ingreso: '2024-02-01T00:00:00Z',
          ubicacion: { id: '2', nombre: 'Taller Técnico', codigo: 'T1-G1' }
        },
        {
          id: '4',
          codigo_item: 'VNS-KIT-MANT',
          nombre: 'Kit de mantenimiento Venus',
          marca: 'Venus Concept',
          modelo: 'MAINT-V1',
          numero_serie: 'VNS-2024-004',
          cantidad_actual: 8,
          cantidad_minima: 5,
          estado: 'Disponible',
          fecha_ingreso: '2024-02-10T00:00:00Z',
          ubicacion: { id: '3', nombre: 'Área de Repuestos', codigo: 'R1-A1' }
        },
        {
          id: '5',
          codigo_item: 'HIFU-TIP-7',
          nombre: 'Tip HIFU 7MHz',
          marca: 'HIFU Medical',
          modelo: 'TIP-7MHZ',
          numero_serie: 'HIFU7-2024-005',
          cantidad_actual: 12,
          cantidad_minima: 10,
          estado: 'Disponible',
          fecha_ingreso: '2024-02-15T00:00:00Z',
          ubicacion: { id: '1', nombre: 'Almacén Principal', codigo: 'A1-E3' }
        },
        {
          id: '6',
          codigo_item: 'CRYO-APP-L',
          nombre: 'Aplicador Criolipólisis Grande',
          marca: 'CoolTech',
          modelo: 'CRYO-L-V2',
          numero_serie: 'CRYO-2024-006',
          cantidad_actual: 4,
          cantidad_minima: 6,
          estado: 'En_uso',
          fecha_ingreso: '2024-01-20T00:00:00Z',
          ubicacion: { id: '4', nombre: 'Sala de Tratamientos', codigo: 'S1-T1' }
        }
      ];

      // Ubicaciones de ejemplo
      const ubicacionesEjemplo = [
        { id: '1', nombre: 'Almacén Principal', codigo: 'A1-PRINCIPAL' },
        { id: '2', nombre: 'Taller Técnico', codigo: 'T1-TALLER' },
        { id: '3', nombre: 'Área de Repuestos', codigo: 'R1-REPUESTOS' },
        { id: '4', nombre: 'Sala de Tratamientos', codigo: 'S1-TRATAMIENTOS' },
        { id: '5', nombre: 'Almacén Secundario', codigo: 'A2-SECUNDARIO' }
      ];

      setItems(itemsEjemplo)
      setUbicaciones(ubicacionesEjemplo)

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
        item.marca.toLowerCase().includes(termino) ||
        item.modelo.toLowerCase().includes(termino) ||
        item.codigo_item.toLowerCase().includes(termino) ||
        item.numero_serie?.toLowerCase().includes(termino)
      )
    }

    // Filtro por estado
    if (filtroEstado !== 'todos') {
      filtrados = filtrados.filter(item => item.estado === filtroEstado)
    }

    // Filtro por ubicación
    if (filtroUbicacion !== 'todas') {
      filtrados = filtrados.filter(item => item.ubicacion?.id === filtroUbicacion)
    }

    setItemsFiltrados(filtrados)
    setPaginaActual(1)
  }

  const getColorEstado = (estado?: string) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'En_uso':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Reservado':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Dañado':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Vencido':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const esStockCritico = (item: StockItem) => {
    return item.cantidad_actual <= item.cantidad_minima
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PY')
  }

  const exportarCSV = () => {
    const headers = ['Código', 'Nombre', 'Marca', 'Modelo', 'Serie', 'Cantidad', 'Estado', 'Ubicación', 'Fecha Ingreso']
    const csvContent = [
      headers.join(','),
      ...itemsFiltrados.map(item => [
        item.codigo_item,
        `"${item.nombre}"`,
        item.marca,
        item.modelo,
        item.numero_serie || '',
        item.cantidad_actual,
        item.estado,
        `"${item.ubicacion?.nombre || ''}"`,
        formatearFecha(item.fecha_ingreso)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `stock_ares_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Paginación
  const totalPaginas = Math.ceil(itemsFiltrados.length / itemsPorPagina)
  const indiceInicio = (paginaActual - 1) * itemsPorPagina
  const indiceFin = indiceInicio + itemsPorPagina
  const itemsPaginaActual = itemsFiltrados.slice(indiceInicio, indiceFin)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              📦 Inventario de Stock
            </CardTitle>
            <CardDescription>
              Gestiona todos los items del inventario - {itemsFiltrados.length} items encontrados
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportarCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Item
            </Button>
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
          
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="Disponible">Disponible</SelectItem>
              <SelectItem value="En_uso">En uso</SelectItem>
              <SelectItem value="Reservado">Reservado</SelectItem>
              <SelectItem value="Dañado">Dañado</SelectItem>
              <SelectItem value="Vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroUbicacion} onValueChange={setFiltroUbicacion}>
            <SelectTrigger>
              <SelectValue placeholder="Ubicación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las ubicaciones</SelectItem>
              {ubicaciones.map((ubicacion) => (
                <SelectItem key={ubicacion.id} value={ubicacion.id}>
                  {ubicacion.codigo} - {ubicacion.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => {
            setBusqueda('')
            setFiltroEstado('todos')
            setFiltroUbicacion('todas')
          }}>
            <Filter className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>

        {/* Tabla */}
        {cargando ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Fecha Ingreso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsPaginaActual.map((item) => (
                    <TableRow key={item.id} className={esStockCritico(item) ? 'bg-red-50 border-red-200' : ''}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="flex items-center gap-2">
                            {esStockCritico(item) && (
                              <span className="text-red-500 text-xs">⚠️</span>
                            )}
                            <span className="font-medium">{item.nombre}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.marca} {item.modelo}
                            {item.numero_serie && ` • S/N: ${item.numero_serie}`}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {item.codigo_item}
                        </code>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${esStockCritico(item) ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.cantidad_actual}
                          </div>
                          <div className="text-xs text-gray-500">
                            Min: {item.cantidad_minima}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={getColorEstado(item.estado)}>
                          {(item.estado || 'Disponible').replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>{item.ubicacion?.codigo}</span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {item.ubicacion?.nombre}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{formatearFecha(item.fecha_ingreso)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Mostrando {indiceInicio + 1} a {Math.min(indiceFin, itemsFiltrados.length)} de {itemsFiltrados.length} items
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                    disabled={paginaActual === 1}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                    disabled={paginaActual === totalPaginas}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
} 