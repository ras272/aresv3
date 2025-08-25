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
  Activity, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown,
  Search,
  Filter,
  Calendar,
  User,
  Package,
  MapPin,
  Download,
  FileText  // 🆕 NUEVO: Icono para facturas
} from 'lucide-react'

interface Movimiento {
  id: string
  fecha_movimiento: string
  tipo_movimiento: string
  producto_nombre: string
  codigo_item: string
  numero_serie?: string
  cantidad: number
  cantidad_anterior: number
  cantidad_nueva: number
  ubicacion_origen?: string
  ubicacion_destino?: string
  motivo?: string
  usuario_responsable?: string
  referencia_externa?: string
  descripcion?: string
  cliente?: string
  codigo_carga_origen?: string
  carpeta_origen?: string
  carpeta_destino?: string
  numero_factura?: string  // 🆕 NUEVO: Campo para número de factura
}

export function MovimientosStock() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [movimientosFiltrados, setMovimientosFiltrados] = useState<Movimiento[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroFecha, setFiltroFecha] = useState('todas')
  const [paginaActual, setPaginaActual] = useState(1)
  const movimientosPorPagina = 25

  useEffect(() => {
    cargarMovimientos()
  }, [])

  useEffect(() => {
    filtrarMovimientos()
  }, [busqueda, filtroTipo, filtroFecha, movimientos])

  const cargarMovimientos = async () => {
    try {
      setCargando(true)
      
      const { data, error } = await supabase
        .from('movimientos_stock')
        .select(`
          id,
          fecha_movimiento,
          tipo_movimiento,
          cantidad,
          cantidad_anterior,
          cantidad_nueva,
          motivo,
          usuario_responsable,
          referencia_externa,
          descripcion,
          cliente,
          numero_serie,
          codigo_carga_origen,
          carpeta_origen,
          carpeta_destino
        `)
        .order('fecha_movimiento', { ascending: false })
        .limit(1000) // Limitar para performance

      if (error) throw error

      // Procesar los datos para extraer información del JSON en descripcion
      const movimientosProcesados = (data || []).map(mov => {
        let datosJSON: any = {};
        try {
          if (mov.descripcion) {
            datosJSON = JSON.parse(mov.descripcion);
          }
        } catch (e) {
          // Si no es JSON válido, continuar con datos vacíos
        }
        
        // 💰 EXTRAER NÚMERO DE FACTURA: Buscar en múltiples fuentes, evitar números de remisión
        let numeroFactura = null;
        
        // 1. Priorizar numeroFactura del JSON si no es un número de remisión
        if (datosJSON.numeroFactura && !datosJSON.numeroFactura.includes('REMISION-') && !datosJSON.numeroFactura.includes('REM-')) {
          numeroFactura = datosJSON.numeroFactura;
        }
        // 2. Buscar en referencia_externa si contiene FACT- pero no REMISION-
        else if (mov.referencia_externa && mov.referencia_externa.includes('FACT-') && !mov.referencia_externa.includes('REMISION-')) {
          numeroFactura = mov.referencia_externa;
        }
        // 3. Buscar en motivo si menciona Factura: pero no es remisión
        else if (mov.motivo && mov.motivo.includes('Factura:') && !mov.motivo.includes('REMISION-')) {
          const facturaMatch = mov.motivo.split('Factura:')[1]?.trim();
          if (facturaMatch && !facturaMatch.includes('REMISION-') && !facturaMatch.includes('REM-')) {
            numeroFactura = facturaMatch;
          }
        }
        
        // 👤 EXTRAER CLIENTE/DESTINO: Para salidas mostrar cliente, para entradas mostrar destino
        let cliente = null;
        
        // 🚛 CASO ESPECIAL: Si es ENTRADA, buscar destino de la carga
        if (mov.tipo_movimiento === 'Entrada') {
          // Buscar destino en el motivo (formato: "Entrada desde carga: XXX - Destino: Hospital")
          if (mov.motivo && mov.motivo.includes('Destino:')) {
            const destinoMatch = mov.motivo.split('Destino:')[1]?.trim();
            if (destinoMatch) {
              cliente = destinoMatch;
            }
          }
          // También buscar en observaciones del JSON
          else if (datosJSON.observaciones && datosJSON.observaciones.includes('destinada a:')) {
            const destinoMatch = datosJSON.observaciones.split('destinada a:')[1]?.trim();
            if (destinoMatch) {
              cliente = destinoMatch;
            }
          }
        }
        // 📤 CASO NORMAL: Para SALIDAS, buscar cliente real
        else {
          // 1. Priorizar cliente del JSON si no es un número de remisión
          if (datosJSON.cliente && !datosJSON.cliente.includes('REMISION-') && !datosJSON.cliente.includes('REM-')) {
            cliente = datosJSON.cliente;
          }
          // 2. Verificar campo cliente de la BD si no es remisión
          else if (mov.cliente && !mov.cliente.includes('REMISION-') && !mov.cliente.includes('REM-')) {
            cliente = mov.cliente;
          }
          // 3. Buscar en motivo si menciona cliente
          else if (mov.motivo && mov.motivo.includes('Cliente:') && !mov.motivo.includes('REMISION-')) {
            const clienteMatch = mov.motivo.split('Cliente:')[1]?.split(',')[0]?.trim();
            if (clienteMatch && !clienteMatch.includes('REMISION-') && !clienteMatch.includes('REM-')) {
              cliente = clienteMatch;
            }
          }
        }
        
        // 🔍 DEBUG: Log para identificar problemas de datos
        if (datosJSON.cliente && (datosJSON.cliente.includes('REMISION-') || datosJSON.cliente.includes('REM-'))) {
          console.warn('⚠️ Cliente contiene número de remisión:', {
            movimientoId: mov.id,
            clienteEnJSON: datosJSON.cliente,
            referenciaExterna: mov.referencia_externa,
            motivo: mov.motivo,
            descripcionCompleta: mov.descripcion
          });
        }
        
        // 🔍 DEBUG ADICIONAL: Log todos los datos para diagnóstico
        if (mov.descripcion && (mov.descripcion.includes('REMISION-') || mov.descripcion.includes('REM-'))) {
          console.log('🔍 Movimiento con referencia a remisión:', {
            movimientoId: mov.id,
            descripcionJSON: mov.descripcion,
            clienteExtraido: cliente,
            facturaExtraida: numeroFactura,
            referenciaExterna: mov.referencia_externa,
            motivo: mov.motivo
          });
        }
        
        // 👨‍💼 EXTRAER USUARIO RESPONSABLE: Determinar quién realizó el movimiento
        let usuarioResponsable = mov.usuario_responsable;
        
        // Si no hay usuario responsable o está vacío, usar valores por defecto según el tipo
        if (!usuarioResponsable || usuarioResponsable.trim() === '') {
          if (mov.tipo_movimiento === 'Entrada') {
            usuarioResponsable = 'Sistema';
          } else {
            // Buscar en el JSON si hay información de responsable
            usuarioResponsable = datosJSON.responsable || datosJSON.usuarioResponsable || 'Sistema';
          }
        }
        
        // 📝 LIMPIAR MOTIVO: Hacer el motivo más legible para la UI
        let motivoLimpio = mov.motivo;
        if (motivoLimpio && mov.tipo_movimiento === 'Entrada') {
          // Para entradas, mostrar solo "Ingreso de mercadería" en lugar del texto completo
          if (motivoLimpio.includes('Entrada desde carga:')) {
            motivoLimpio = 'Ingreso de mercadería';
          }
        }
        
        return {
          ...mov,
          producto_nombre: datosJSON.productoNombre || 'Producto no especificado',
          codigo_item: mov.codigo_carga_origen || datosJSON.codigoItem || 'N/A',
          ubicacion_origen: mov.carpeta_origen || datosJSON.carpetaOrigen || '',
          ubicacion_destino: mov.carpeta_destino || datosJSON.carpetaDestino || '',
          cliente: cliente,  // 🆕 USAR cliente mejorado (sin mostrar números de remisión)
          numero_factura: numeroFactura,  // 🆕 USAR número de factura extraído
          usuario_responsable: usuarioResponsable,  // 🆕 USAR usuario responsable limpio
          motivo: motivoLimpio  // 🆕 USAR motivo limpio y legible
        };
      });

      setMovimientos(movimientosProcesados)
    } catch (error) {
      console.error('Error cargando movimientos:', error)
    } finally {
      setCargando(false)
    }
  }

  const filtrarMovimientos = () => {
    let filtrados = movimientos

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase()
      filtrados = filtrados.filter(mov => 
        mov.producto_nombre?.toLowerCase().includes(termino) ||
        mov.codigo_item?.toLowerCase().includes(termino) ||
        mov.usuario_responsable?.toLowerCase().includes(termino) ||
        mov.motivo?.toLowerCase().includes(termino) ||
        mov.cliente?.toLowerCase().includes(termino) ||
        mov.numero_factura?.toLowerCase().includes(termino)  // 🆕 NUEVO: Búsqueda por número de factura
      )
    }

    // Filtro por tipo
    if (filtroTipo !== 'todos') {
      filtrados = filtrados.filter(mov => mov.tipo_movimiento === filtroTipo)
    }

    // Filtro por fecha
    const ahora = new Date()
    switch (filtroFecha) {
      case 'hoy':
        const hoy = new Date().toISOString().split('T')[0]
        filtrados = filtrados.filter(mov => 
          mov.fecha_movimiento.startsWith(hoy)
        )
        break
      case 'semana':
        const semanaAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)
        filtrados = filtrados.filter(mov => 
          new Date(mov.fecha_movimiento) >= semanaAtras
        )
        break
      case 'mes':
        const mesAtras = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000)
        filtrados = filtrados.filter(mov => 
          new Date(mov.fecha_movimiento) >= mesAtras
        )
        break
    }

    setMovimientosFiltrados(filtrados)
    setPaginaActual(1)
  }

  const getIconoTipoMovimiento = (tipo?: string) => {
    switch (tipo) {
      case 'Entrada':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'Salida':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'Transferencia':
        return <ArrowRight className="h-4 w-4 text-blue-500" />
      case 'Ajuste':
        return <Activity className="h-4 w-4 text-purple-500" />
      case 'Asignacion':
        return <Package className="h-4 w-4 text-orange-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getColorTipoMovimiento = (tipo?: string) => {
    switch (tipo) {
      case 'Entrada':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Salida':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Transferencia':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Ajuste':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Asignacion':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatearCantidad = (movimiento: Movimiento) => {
    const signo = movimiento.tipo_movimiento === 'Entrada' ? '+' : 
                  movimiento.tipo_movimiento === 'Salida' ? '-' : ''
    return `${signo}${movimiento.cantidad}`
  }

  const exportarCSV = () => {
    const headers = [
      'Fecha', 'Tipo', 'Item', 'Código', 'Cantidad', 'Stock Anterior', 
      'Stock Nuevo', 'Cliente/Destino', 'Factura', 'Usuario', 'Motivo'  // 🆕 NUEVO: Reorganizado sin ubicaciones
    ]
    
    const csvContent = [
      headers.join(','),
      ...movimientosFiltrados.map(mov => [
        formatearFecha(mov.fecha_movimiento),
        mov.tipo_movimiento,
        `"${mov.producto_nombre || ''}"`,
        `"${mov.codigo_item || ''}"`,
        mov.cantidad,
        mov.cantidad_anterior,
        mov.cantidad_nueva,
        `"${mov.cliente || ''}"`,  // 🆕 NUEVO: Incluir cliente en CSV
        `"${mov.numero_factura || ''}"`,
        `"${mov.usuario_responsable || 'Sistema'}"`,
        `"${mov.motivo || ''}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `movimientos_stock_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Paginación
  const totalPaginas = Math.ceil(movimientosFiltrados.length / movimientosPorPagina)
  const indiceInicio = (paginaActual - 1) * movimientosPorPagina
  const indiceFin = indiceInicio + movimientosPorPagina
  const movimientosPaginaActual = movimientosFiltrados.slice(indiceInicio, indiceFin)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Historial de Movimientos
            </CardTitle>
            <CardDescription>
              Trazabilidad completa de todos los movimientos de stock - {movimientosFiltrados.length} registros
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportarCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={cargarMovimientos}>
              Actualizar
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
              placeholder="Buscar movimientos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de movimiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="Entrada">Entrada</SelectItem>
              <SelectItem value="Salida">Salida</SelectItem>
              <SelectItem value="Transferencia">Transferencia</SelectItem>
              <SelectItem value="Ajuste">Ajuste</SelectItem>
              <SelectItem value="Asignacion">Asignación</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroFecha} onValueChange={setFiltroFecha}>
            <SelectTrigger>
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las fechas</SelectItem>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="semana">Última semana</SelectItem>
              <SelectItem value="mes">Último mes</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => {
            setBusqueda('')
            setFiltroTipo('todos')
            setFiltroFecha('todas')
          }}>
            <Filter className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>

        {/* Tabla de movimientos */}
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
                    <TableHead>Fecha & Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Cliente/Destino</TableHead> {/* 🆕 Columna de Cliente o Destino según tipo */}
                    <TableHead>Factura</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientosPaginaActual.map((movimiento) => (
                    <TableRow key={movimiento.id}>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{formatearFecha(movimiento.fecha_movimiento)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={`${getColorTipoMovimiento(movimiento.tipo_movimiento)} flex items-center gap-1 w-fit`}>
                          {getIconoTipoMovimiento(movimiento.tipo_movimiento)}
                          {movimiento.tipo_movimiento}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">{movimiento.producto_nombre}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                              {movimiento.codigo_item}
                            </code>
                            {movimiento.numero_serie && (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">
                                S/N: {movimiento.numero_serie}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className={`text-center font-bold ${
                          movimiento.tipo_movimiento === 'Entrada' ? 'text-green-600' :
                          movimiento.tipo_movimiento === 'Salida' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {formatearCantidad(movimiento)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-center text-sm">
                          <span className="text-gray-500">{movimiento.cantidad_anterior}</span>
                          <ArrowRight className="h-3 w-3 inline mx-1 text-gray-400" />
                          <span className="font-medium">{movimiento.cantidad_nueva}</span>
                        </div>
                      </TableCell>
                      
                      {/* 🆕 Celda de Cliente/Destino */}
                      <TableCell>
                        <div className="text-sm">
                          {movimiento.cliente ? (
                            <div className={`flex items-center gap-1 ${
                              movimiento.tipo_movimiento === 'Entrada' 
                                ? 'text-green-600' 
                                : 'text-blue-600'
                            }`}>
                              {movimiento.tipo_movimiento === 'Entrada' ? (
                                <MapPin className="h-3 w-3" />
                              ) : (
                                <User className="h-3 w-3" />
                              )}
                              <span className={`text-xs px-2 py-1 rounded ${
                                movimiento.tipo_movimiento === 'Entrada'
                                  ? 'bg-green-50'
                                  : 'bg-blue-50'
                              }`}>
                                {movimiento.cliente}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              {movimiento.tipo_movimiento === 'Entrada' ? 'Sin destino' : 'Sin cliente'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* 🆕 NUEVO: Celda de Factura */}
                      <TableCell>
                        <div className="text-sm">
                          {movimiento.numero_factura ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <FileText className="h-3 w-3" />
                              <span className="font-mono text-xs bg-green-50 px-2 py-1 rounded">
                                {movimiento.numero_factura}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Sin factura</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3 text-gray-400" />
                          <span>{movimiento.usuario_responsable || 'Sistema'}</span>
                        </div>
                        {movimiento.motivo && movimiento.motivo.length > 30 ? (
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]" title={movimiento.motivo}>
                            {movimiento.motivo.substring(0, 30)}...
                          </div>
                        ) : movimiento.motivo ? (
                          <div className="text-xs text-gray-500 mt-1" title={movimiento.motivo}>
                            {movimiento.motivo}
                          </div>
                        ) : null}
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
                  Mostrando {indiceInicio + 1} a {Math.min(indiceFin, movimientosFiltrados.length)} de {movimientosFiltrados.length} movimientos
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