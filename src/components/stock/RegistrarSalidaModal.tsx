'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';
import { 
  X, 
  ArrowDownCircle, 
  Package, 
  User, 
  MapPin,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ProductoAgrupado {
  id: string;
  nombre: string;
  marca: string;
  modelo: string;
  tipoComponente: string;
  cantidadTotal: number;
  ubicaciones: Array<{
    ubicacion: string;
    cantidad: number;
    componenteIds: string[];
  }>;
  detallesNumerosSerie: {
    sinNumeroSerie: number;
    conNumeroSerie: Array<{
      numeroSerie: string;
      cantidad: number;
      componenteId: string;
    }>;
  };
  imagen?: string;
  observaciones?: string;
}

interface RegistrarSalidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoAgrupado | null;
  carpeta: string;
  onRegistrarSalida: (salidaData: {
    itemId: string;
    productoNombre: string;
    productoMarca?: string;
    productoModelo?: string;
    numeroSerie?: string;
    cantidad: number;
    cantidadAnterior: number;
    motivo: string;
    destino: string;
    responsable: string;
    cliente?: string;
    numeroFactura?: string;
    observaciones?: string;
    carpetaOrigen?: string;
  }) => Promise<void>;
}

export function RegistrarSalidaModal({
  isOpen,
  onClose,
  producto,
  carpeta,
  onRegistrarSalida
}: RegistrarSalidaModalProps) {
  const [cantidad, setCantidad] = useState<number>(1);
  const [motivo, setMotivo] = useState<string>('');
  const [destino, setDestino] = useState<string>('');
  const [responsable, setResponsable] = useState<string>('');
  const [cliente, setCliente] = useState<string>('');
  const [clientePersonalizado, setClientePersonalizado] = useState<string>('');
  const [numeroFactura, setNumeroFactura] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 🆕 NUEVO: Estados para números de serie
  const [numerosSerieDisponibles, setNumerosSerieDisponibles] = useState<string[]>([]);
  const [numerosSerieSeleccionados, setNumerosSerieSeleccionados] = useState<string[]>([]);
  const [loadingNumerosSerie, setLoadingNumerosSerie] = useState(false);

  const { clinicas, getNumerosSerie, loadAllData } = useAppStore();

  // 🆕 NUEVO: Cargar datos cuando se abre el modal
  useEffect(() => {
    const cargarDatos = async () => {
      if (!isOpen || !producto) return;

      // Cargar todas las clínicas si no están cargadas
      if (clinicas.length === 0) {
        console.log('🔄 Cargando clínicas...');
        await loadAllData();
      }

      // Solo cargar números de serie si el producto los tiene
      const tieneNumerosSerie = producto.detallesNumerosSerie.conNumeroSerie.length > 0;
      if (!tieneNumerosSerie) {
        setNumerosSerieDisponibles([]);
        return;
      }

      try {
        setLoadingNumerosSerie(true);
        const numerosDisponibles = await getNumerosSerie(
          producto.nombre,
          producto.marca,
          producto.modelo
        );
        setNumerosSerieDisponibles(numerosDisponibles);
        console.log('✅ Números de serie cargados:', numerosDisponibles);
      } catch (error) {
        console.error('❌ Error cargando números de serie:', error);
        setNumerosSerieDisponibles([]);
      } finally {
        setLoadingNumerosSerie(false);
      }
    };

    cargarDatos();
  }, [isOpen, producto, getNumerosSerie, clinicas.length, loadAllData]);

  // 🆕 NUEVO: Manejar selección de números de serie
  const toggleNumeroSerie = (numeroSerie: string) => {
    setNumerosSerieSeleccionados(prev => {
      const isSelected = prev.includes(numeroSerie);
      if (isSelected) {
        // Deseleccionar
        const nuevaSeleccion = prev.filter(sn => sn !== numeroSerie);
        setCantidad(nuevaSeleccion.length || 1);
        return nuevaSeleccion;
      } else {
        // Seleccionar
        const nuevaSeleccion = [...prev, numeroSerie];
        setCantidad(nuevaSeleccion.length);
        return nuevaSeleccion;
      }
    });
  };

  const motivosComunes = [
    'Venta a cliente',
    'Asignación a equipo',
    'Transferencia a técnico',
    'Reparación externa',
    'Devolución a proveedor',
    'Producto defectuoso',
    'Uso interno',
    'Otro'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!producto) return;

    // Validaciones
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (cantidad > producto.cantidadTotal) {
      toast.error(`No hay suficiente stock. Disponible: ${producto.cantidadTotal}`);
      return;
    }

    // 🆕 NUEVO: Validar números de serie si están disponibles
    if (numerosSerieDisponibles.length > 0 && numerosSerieSeleccionados.length === 0) {
      toast.error('Debes seleccionar los números de serie específicos para este producto');
      return;
    }

    if (numerosSerieSeleccionados.length > 0 && numerosSerieSeleccionados.length !== cantidad) {
      toast.error(`Debes seleccionar exactamente ${cantidad} número(s) de serie`);
      return;
    }

    if (!motivo.trim()) {
      toast.error('El motivo es requerido');
      return;
    }

    if (!destino.trim()) {
      toast.error('El destino es requerido');
      return;
    }

    if (!responsable.trim()) {
      toast.error('El responsable es requerido');
      return;
    }

    try {
      setIsLoading(true);

      // 🔧 CORRECCIÓN: Obtener el ID del componente específico por número de serie
      let itemId: string;
      
      if (numerosSerieSeleccionados.length > 0) {
        // Si hay número de serie seleccionado, buscar el componente específico
        const numeroSerieSeleccionado = numerosSerieSeleccionados[0];
        const componenteConNumeroSerie = producto.detallesNumerosSerie.conNumeroSerie.find(
          detalle => detalle.numeroSerie === numeroSerieSeleccionado
        );
        
        if (componenteConNumeroSerie) {
          itemId = componenteConNumeroSerie.componenteId;
          console.log('✅ Usando ID específico para número de serie:', {
            numeroSerie: numeroSerieSeleccionado,
            componenteId: itemId
          });
        } else {
          throw new Error(`No se encontró el componente con número de serie ${numeroSerieSeleccionado}`);
        }
      } else {
        // Si no hay número de serie, usar el primer componente disponible
        itemId = producto.ubicaciones[0]?.componenteIds[0] || producto.id;
        console.log('✅ Usando primer componente disponible:', itemId);
      }

      // Determinar el cliente final
      const clienteFinal = cliente === 'Otro' ? clientePersonalizado.trim() : cliente.trim();

      // 🆕 NUEVO: Incluir números de serie en las observaciones
      let observacionesFinales = observaciones.trim();
      if (numerosSerieSeleccionados.length > 0) {
        const numerosSerieTexto = `Números de serie: ${numerosSerieSeleccionados.join(', ')}`;
        observacionesFinales = observacionesFinales 
          ? `${observacionesFinales}\n\n${numerosSerieTexto}`
          : numerosSerieTexto;
      }

      // 🔧 CORRECCIÓN: Calcular cantidad anterior correcta
      let cantidadAnteriorCorrecta: number;
      
      if (numerosSerieSeleccionados.length > 0) {
        // Para productos con número de serie, cada componente individual tiene cantidad 1
        cantidadAnteriorCorrecta = 1;
        console.log('✅ Usando cantidad individual para producto con S/N:', {
          numeroSerie: numerosSerieSeleccionados[0],
          cantidadAnterior: cantidadAnteriorCorrecta
        });
      } else {
        // Para productos sin número de serie, usar la cantidad total agrupada
        cantidadAnteriorCorrecta = producto.cantidadTotal;
        console.log('✅ Usando cantidad total para producto sin S/N:', {
          cantidadAnterior: cantidadAnteriorCorrecta
        });
      }

      await onRegistrarSalida({
        itemId,
        productoNombre: producto.nombre,
        productoMarca: producto.marca,
        productoModelo: producto.modelo,
        numeroSerie: numerosSerieSeleccionados[0] || undefined,
        cantidad,
        cantidadAnterior: cantidadAnteriorCorrecta,
        motivo,
        destino,
        responsable,
        cliente: clienteFinal || undefined,
        numeroFactura: numeroFactura.trim() || undefined,
        observaciones: observacionesFinales || undefined,
        carpetaOrigen: carpeta
      });

      toast.success('Salida registrada exitosamente');
      handleClose();

    } catch (error) {
      console.error('Error registrando salida:', error);
      toast.error('Error al registrar la salida');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCantidad(1);
    setMotivo('');
    setDestino('');
    setResponsable('');
    setCliente('');
    setClientePersonalizado('');
    setNumeroFactura('');
    setObservaciones('');
    // 🆕 NUEVO: Limpiar estados de números de serie
    setNumerosSerieDisponibles([]);
    setNumerosSerieSeleccionados([]);
    setLoadingNumerosSerie(false);
    onClose();
  };

  if (!isOpen || !producto) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center space-x-3">
                <ArrowDownCircle className="h-6 w-6 text-red-500" />
                <div>
                  <CardTitle className="text-xl">Registrar Salida de Stock</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {producto.nombre} - {producto.marca} {producto.modelo}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Información del producto */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Package className="h-5 w-5 text-blue-500 mt-1" />
                    <div>
                      <h4 className="font-medium">{producto.nombre}</h4>
                      <p className="text-sm text-muted-foreground">
                        {producto.marca} - {producto.modelo}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {producto.tipoComponente}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {producto.cantidadTotal}
                    </div>
                    <p className="text-sm text-muted-foreground">Disponible</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Cantidad */}
                <div>
                  <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad a Retirar *
                  </label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    max={producto.cantidadTotal}
                    value={cantidad}
                    onChange={(e) => {
                      const nuevaCantidad = parseInt(e.target.value) || 1;
                      setCantidad(nuevaCantidad);
                      // Si hay números de serie, limpiar selección si la cantidad cambia manualmente
                      if (numerosSerieDisponibles.length > 0 && numerosSerieSeleccionados.length !== nuevaCantidad) {
                        setNumerosSerieSeleccionados([]);
                      }
                    }}
                    className="w-full"
                    required
                    disabled={numerosSerieSeleccionados.length > 0} // Deshabilitar si se están seleccionando números de serie
                  />
                  {cantidad > producto.cantidadTotal && (
                    <div className="flex items-center space-x-2 mt-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">No hay suficiente stock disponible</span>
                    </div>
                  )}
                </div>

                {/* 🆕 NUEVO: Dropdown de números de serie */}
                {numerosSerieDisponibles.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Números de Serie Disponibles
                      </label>
                      {loadingNumerosSerie && (
                        <div className="flex items-center space-x-2 text-xs text-blue-600">
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                          <span>Cargando...</span>
                        </div>
                      )}
                    </div>
                    
                    <Select 
                      value={numerosSerieSeleccionados[0] || ""} 
                      onValueChange={(value) => {
                        if (value) {
                          setNumerosSerieSeleccionados([value]);
                          setCantidad(1);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar número de serie específico...">
                          {numerosSerieSeleccionados[0] && (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="font-mono text-sm">{numerosSerieSeleccionados[0]}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {numerosSerieDisponibles.map((numeroSerie) => (
                          <SelectItem key={numeroSerie} value={numeroSerie}>
                            <div className="flex items-center space-x-3 py-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <div className="flex flex-col">
                                <span className="font-mono text-sm font-medium text-gray-900">
                                  {numeroSerie}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Disponible para retiro
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <p className="text-xs text-gray-600 mt-2">
                      Este producto requiere selección de número de serie específico para trazabilidad completa.
                    </p>

                    {/* Mostrar selección actual */}
                    {numerosSerieSeleccionados.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-blue-800">
                            Número de serie seleccionado:
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-sm text-blue-900 bg-white px-2 py-1 rounded border">
                          {numerosSerieSeleccionados[0]}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Motivo */}
                <div>
                  <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de la Salida *
                  </label>
                  <Select value={motivo} onValueChange={setMotivo}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar motivo de salida..." />
                    </SelectTrigger>
                    <SelectContent>
                      {motivosComunes.map((motivoComun) => (
                        <SelectItem key={motivoComun} value={motivoComun}>
                          {motivoComun}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {motivo === 'Otro' && (
                    <Input
                      className="mt-2"
                      placeholder="Especificar otro motivo..."
                      onChange={(e) => setMotivo(e.target.value)}
                    />
                  )}
                </div>

                {/* Destino */}
                <div>
                  <label htmlFor="destino" className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Destino *
                  </label>
                  <Input
                    id="destino"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    placeholder="Ej: Cliente ABC, Técnico Juan, Almacén Central..."
                    className="w-full"
                    required
                  />
                </div>

                {/* Responsable */}
                <div>
                  <label htmlFor="responsable" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Responsable de la Salida *
                  </label>
                  <Input
                    id="responsable"
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    placeholder="Nombre del responsable..."
                    className="w-full"
                    required
                  />
                </div>

                {/* Cliente (opcional) */}
                <div>
                  <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente (opcional)
                  </label>
                  <Select value={cliente} onValueChange={setCliente}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clinicas.map((clinica) => (
                        <SelectItem key={clinica.id} value={clinica.nombre}>
                          {clinica.nombre}
                        </SelectItem>
                      ))}
                      <SelectItem value="Otro">
                        Otro cliente
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {cliente === 'Otro' && (
                    <Input
                      className="mt-2"
                      placeholder="Especificar nombre del cliente..."
                      value={clientePersonalizado}
                      onChange={(e) => setClientePersonalizado(e.target.value)}
                    />
                  )}
                </div>

                {/* Número de factura (opcional) */}
                <div>
                  <label htmlFor="numeroFactura" className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="inline h-4 w-4 mr-1" />
                    Número de Factura (opcional)
                  </label>
                  <Input
                    id="numeroFactura"
                    value={numeroFactura}
                    onChange={(e) => setNumeroFactura(e.target.value)}
                    placeholder="Ej: FAC-001-2024..."
                    className="w-full"
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones (opcional)
                  </label>
                  <Textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas adicionales sobre la salida..."
                    rows={3}
                    className="w-full"
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || cantidad > producto.cantidadTotal}
                    className="flex items-center space-x-2"
                  >
                    <ArrowDownCircle className="h-4 w-4" />
                    <span>{isLoading ? 'Registrando...' : 'Registrar Salida'}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}