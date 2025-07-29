'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Minus, FileText, Package, MapPin, User, Phone, Search, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ComponenteDisponible, ProductoRemision, Remision } from '@/types';

interface ModalRemisionProps {
    isOpen: boolean;
    onClose: () => void;
    componentePreseleccionado?: ComponenteDisponible;
    remisionParaEditar?: Remision | null;
}

const TIPOS_REMISION = [
    'Instalación',
    'Mantenimiento',
    'Reparación',
    'Entrega'
] as const;

const TECNICOS_PREDEFINIDOS = [
    'Jack Green',
    'William Green',
    'Carlos Rodriguez',
    'Otro (personalizar)'
] as const;

export default function ModalRemision({ isOpen, onClose, componentePreseleccionado, remisionParaEditar }: ModalRemisionProps) {
    const {
        componentesDisponibles,
        stockItems,
        loadInventarioTecnico,
        loadStock,
        addRemision,
        updateRemision,
        generateNumeroRemision,
        getClinicasActivas,
        procesarSalidaStock
    } = useAppStore();

    // Estados del formulario
    const [clienteSeleccionado, setClienteSeleccionado] = useState('');
    const [numeroFactura, setNumeroFactura] = useState('');
    const [tipoRemision, setTipoRemision] = useState<typeof TIPOS_REMISION[number]>('Entrega');
    const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<typeof TECNICOS_PREDEFINIDOS[number]>('Jack Green');
    const [tecnicoPersonalizado, setTecnicoPersonalizado] = useState('');
    const [descripcionGeneral, setDescripcionGeneral] = useState('');
    const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoRemision[]>([]);
    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [loading, setLoading] = useState(false);

    // Obtener clínicas activas
    const clinicasActivas = getClinicasActivas();

    // Cargar inventario al abrir modal
    useEffect(() => {
        if (isOpen) {
            loadInventarioTecnico();
            loadStock(); // Cargar también el stock general

            // Si hay remisión para editar, cargar sus datos
            if (remisionParaEditar) {
                setClienteSeleccionado(remisionParaEditar.cliente);
                setNumeroFactura(remisionParaEditar.numeroFactura || '');
                setTipoRemision(remisionParaEditar.tipoRemision);
                // Determinar si el técnico es predefinido o personalizado
                const tecnicoEditar = remisionParaEditar.tecnicoResponsable;
                const esPredefinido = TECNICOS_PREDEFINIDOS.includes(tecnicoEditar as any);
                
                if (esPredefinido) {
                    setTecnicoSeleccionado(tecnicoEditar as typeof TECNICOS_PREDEFINIDOS[number]);
                    setTecnicoPersonalizado('');
                } else {
                    setTecnicoSeleccionado('Otro (personalizar)');
                    setTecnicoPersonalizado(tecnicoEditar);
                }
                setDescripcionGeneral(remisionParaEditar.descripcionGeneral || '');
                // Validar que los productos tengan componenteId válidos
                const productosValidos = remisionParaEditar.productos.filter(producto => 
                    producto.componenteId && producto.componenteId !== 'undefined'
                );
                setProductosSeleccionados(productosValidos);
            } else {
                // Limpiar formulario para nueva remisión
                setClienteSeleccionado('');
                setNumeroFactura('');
                setTipoRemision('Entrega');
                setTecnicoSeleccionado('Jack Green');
                setTecnicoPersonalizado('');
                setDescripcionGeneral('');
                setProductosSeleccionados([]);
                setBusquedaProducto('');

                // Si hay componente preseleccionado, agregarlo automáticamente
                if (componentePreseleccionado) {
                    const productoPreseleccionado: ProductoRemision = {
                        id: Date.now().toString(),
                        componenteId: componentePreseleccionado.id,
                        nombre: componentePreseleccionado.nombre,
                        marca: componentePreseleccionado.marca,
                        modelo: componentePreseleccionado.modelo,
                        numeroSerie: componentePreseleccionado.numeroSerie,
                        cantidadSolicitada: 1,
                        cantidadDisponible: componentePreseleccionado.cantidadDisponible,
                        observaciones: ''
                    };
                    setProductosSeleccionados([productoPreseleccionado]);
                }
            }
        }
    }, [isOpen, componentePreseleccionado, remisionParaEditar, loadInventarioTecnico]);

    // Combinar productos del inventario técnico y stock general
    const todosLosProductos = React.useMemo(() => {
        const productosInventario = componentesDisponibles
            .filter(comp => comp.estado === 'Disponible' && comp.cantidadDisponible > 0)
            .map(comp => ({
                ...comp,
                origen: 'inventario' as const,
                origenLabel: 'Inventario Técnico'
            }));

        const productosStock = stockItems
            .filter(item => item.cantidadDisponible > 0)
            .map(item => ({
                id: item.id,
                nombre: item.nombre,
                marca: item.marca || 'N/A',
                modelo: item.modelo || 'N/A',
                numeroSerie: item.numeroSerie || undefined,
                cantidadDisponible: item.cantidadDisponible,
                estado: 'Disponible' as const,
                origen: 'stock' as const,
                origenLabel: 'Stock General'
            }));

        return [...productosInventario, ...productosStock];
    }, [componentesDisponibles, stockItems]);

    // Filtrar productos combinados para búsqueda
    const componentesFiltrados = todosLosProductos.filter(comp =>
        comp.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        comp.marca.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        comp.modelo.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        comp.numeroSerie?.toLowerCase().includes(busquedaProducto.toLowerCase())
    );

    // Agregar producto a la remisión
    const agregarProducto = (componente: any) => {
        const yaExiste = productosSeleccionados.find(p => 
            p.componenteId === componente.id && p.origen === componente.origen
        );
        if (yaExiste) {
            toast.error('Este producto ya está agregado a la remisión');
            return;
        }

        const nuevoProducto: ProductoRemision = {
            id: Date.now().toString(),
            componenteId: componente.origen === 'stock' ? null : componente.id, // null para stock general
            stockItemId: componente.origen === 'stock' ? componente.id : null, // ID del stock general
            origen: componente.origen, // 'inventario' o 'stock'
            nombre: componente.nombre,
            marca: componente.marca,
            modelo: componente.modelo,
            numeroSerie: componente.numeroSerie,
            cantidadSolicitada: 1,
            cantidadDisponible: componente.cantidadDisponible,
            observaciones: ''
        };

        setProductosSeleccionados([...productosSeleccionados, nuevoProducto]);
        setBusquedaProducto('');
        toast.success(`${componente.nombre} agregado a la remisión`);
    };

    // Actualizar cantidad de producto
    const actualizarCantidad = (productoId: string, nuevaCantidad: number) => {
        setProductosSeleccionados(productos =>
            productos.map(p =>
                p.id === productoId
                    ? { ...p, cantidadSolicitada: Math.max(1, Math.min(nuevaCantidad, p.cantidadDisponible)) }
                    : p
            )
        );
    };

    // Actualizar observaciones de producto
    const actualizarObservaciones = (productoId: string, observaciones: string) => {
        setProductosSeleccionados(productos =>
            productos.map(p =>
                p.id === productoId ? { ...p, observaciones } : p
            )
        );
    };

    // Remover producto
    const removerProducto = (productoId: string) => {
        setProductosSeleccionados(productos => productos.filter(p => p.id !== productoId));
    };

    // Obtener datos del cliente seleccionado
    const datosCliente = clinicasActivas.find(c => c.nombre === clienteSeleccionado);

    // Obtener el técnico responsable final
    const tecnicoResponsable = tecnicoSeleccionado === 'Otro (personalizar)' 
        ? tecnicoPersonalizado 
        : tecnicoSeleccionado;

    // Generar o actualizar remisión
    const generarRemision = async () => {
        if (!clienteSeleccionado) {
            toast.error('Selecciona un cliente');
            return;
        }

        if (productosSeleccionados.length === 0) {
            toast.error('Agrega al menos un producto');
            return;
        }

        // Validar que todos los productos tengan IDs válidos (componenteId o stockItemId)
        const productosInvalidos = productosSeleccionados.filter(producto => 
            (!producto.componenteId && !producto.stockItemId) || 
            producto.componenteId === 'undefined' || 
            producto.stockItemId === 'undefined'
        );
        
        if (productosInvalidos.length > 0) {
            toast.error('Algunos productos no tienen ID válido. Por favor, elimínalos y agrégalos nuevamente.');
            console.error('Productos con ID inválido:', productosInvalidos);
            return;
        }

        setLoading(true);
        
        // Debug: Log de productos seleccionados
        console.log('🔍 Productos seleccionados:', productosSeleccionados);
        console.log('🔍 Cliente seleccionado:', clienteSeleccionado);
        console.log('🔍 Técnico responsable:', tecnicoResponsable);
        
        try {
            if (remisionParaEditar) {
                // Modo edición
                const remisionActualizada: Partial<Remision> = {
                    numeroFactura: numeroFactura || undefined,
                    cliente: clienteSeleccionado,
                    direccionEntrega: datosCliente?.direccion || remisionParaEditar.direccionEntrega,
                    contacto: datosCliente?.contactoPrincipal || remisionParaEditar.contacto,
                    telefono: datosCliente?.telefono || remisionParaEditar.telefono,
                    tipoRemision,
                    tecnicoResponsable: tecnicoResponsable,
                    productos: productosSeleccionados,
                    descripcionGeneral: descripcionGeneral || undefined,
                };

                await updateRemision(remisionParaEditar.id, remisionActualizada);

                toast.success('Remisión actualizada exitosamente', {
                    description: `Se actualizó la remisión ${remisionParaEditar.numeroRemision}`
                });
            } else {
                // Modo creación
                const numeroRemisionGenerado = await generateNumeroRemision();

                const nuevaRemision: Omit<Remision, 'id' | 'numeroRemision' | 'createdAt' | 'updatedAt'> = {
                    fecha: new Date().toISOString(),
                    numeroFactura: numeroFactura || undefined,
                    cliente: clienteSeleccionado,
                    direccionEntrega: datosCliente?.direccion || '',
                    contacto: datosCliente?.contactoPrincipal,
                    telefono: datosCliente?.telefono,
                    tipoRemision,
                    tecnicoResponsable: tecnicoResponsable,
                    productos: productosSeleccionados,
                    descripcionGeneral: descripcionGeneral || undefined,
                    estado: 'Confirmada'
                };

                console.log('🔍 Nueva remisión a crear:', JSON.stringify(nuevaRemision, null, 2));

                // Crear la remisión (operación crítica)
                await addRemision(nuevaRemision);

                // 🚀 PROCESAR SALIDA DE STOCK AUTOMÁTICAMENTE (operación no crítica)
                let erroresStock = 0;
                for (const producto of productosSeleccionados) {
                    try {
                        await procesarSalidaStock(
                            producto.componenteId, // null para productos del stock general
                            producto.stockItemId || null, // ID del stock general si aplica
                            producto.cantidadSolicitada,
                            `REMISIÓN - ${clienteSeleccionado}`,
                            numeroRemisionGenerado,
                            numeroFactura || undefined,
                            clienteSeleccionado
                        );
                    } catch (error) {
                        erroresStock++;
                        console.error(`Error procesando stock para ${producto.nombre}:`, error);
                        // No mostrar toast individual para evitar spam de errores
                    }
                }

                // Mostrar mensaje de éxito con información sobre errores de stock si los hay
                if (erroresStock > 0) {
                    toast.success('Remisión generada exitosamente', {
                        description: `Se creó la remisión para ${clienteSeleccionado}. Nota: Algunos productos pueden requerir ajuste manual de stock.`
                    });
                } else {
                    toast.success('Remisión generada exitosamente', {
                        description: `Se creó la remisión para ${clienteSeleccionado}`
                    });
                }
            }

            // Limpiar formulario
            setClienteSeleccionado('');
            setNumeroFactura('');
            setTipoRemision('Entrega');
            setTecnicoSeleccionado('Jack Green');
            setTecnicoPersonalizado('');
            setDescripcionGeneral('');
            setProductosSeleccionados([]);
            setBusquedaProducto('');

            onClose();
        } catch (error) {
            console.error('Error al procesar remisión:', error);
            toast.error(remisionParaEditar ? 'Error al actualizar la remisión' : 'Error al generar la remisión');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6" />
                                <div>
                                    <h2 className="text-xl font-bold">
                                        {remisionParaEditar ? 'Editar Remisión Digital' : 'Nueva Remisión Digital'}
                                    </h2>
                                    <p className="text-blue-100 text-sm">
                                        {remisionParaEditar ? `Editando: ${remisionParaEditar.numeroRemision}` : 'Sistema de trazabilidad ARES'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="text-white hover:bg-white/20"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Información del Cliente */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        Información del Cliente
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="cliente">Cliente / Hospital</Label>
                                        <Select value={clienteSeleccionado} onValueChange={setClienteSeleccionado}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar cliente..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {clinicasActivas.length === 0 ? (
                                                    <SelectItem value="no-clinicas" disabled>
                                                        No hay clínicas registradas
                                                    </SelectItem>
                                                ) : (
                                                    clinicasActivas.map((clinica) => (
                                                        <SelectItem key={clinica.id} value={clinica.nombre}>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{clinica.nombre}</span>
                                                                <span className="text-xs text-gray-500">{clinica.contactoPrincipal || clinica.ciudad}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {datosCliente && (
                                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <MapPin className="w-4 h-4 text-gray-500" />
                                                <span>{datosCliente.direccion}</span>
                                            </div>
                                            {datosCliente.contactoPrincipal && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                    <span>{datosCliente.contactoPrincipal}</span>
                                                </div>
                                            )}
                                            {datosCliente.telefono && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="w-4 h-4 text-gray-500" />
                                                    <span>{datosCliente.telefono}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <Label htmlFor="tipoRemision">Tipo de Remisión</Label>
                                        <Select value={tipoRemision} onValueChange={(value: typeof TIPOS_REMISION[number]) => setTipoRemision(value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIPOS_REMISION.map((tipo) => (
                                                    <SelectItem key={tipo} value={tipo}>
                                                        {tipo}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="numeroFactura">Número de Factura</Label>
                                        <Input
                                            id="numeroFactura"
                                            placeholder="Ej: 001-001-0001234"
                                            value={numeroFactura}
                                            onChange={(e) => setNumeroFactura(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="tecnicoResponsable">¿Quién entrega?</Label>
                                        <Select value={tecnicoSeleccionado} onValueChange={(value: typeof TECNICOS_PREDEFINIDOS[number]) => setTecnicoSeleccionado(value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TECNICOS_PREDEFINIDOS.map((tecnico) => (
                                                    <SelectItem key={tecnico} value={tecnico}>
                                                        {tecnico}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        
                                        {/* Campo de texto personalizado cuando se selecciona "Otro" */}
                                        {tecnicoSeleccionado === 'Otro (personalizar)' && (
                                            <div className="mt-2">
                                                <Input
                                                    placeholder="Escribe el nombre del técnico..."
                                                    value={tecnicoPersonalizado}
                                                    onChange={(e) => setTecnicoPersonalizado(e.target.value)}
                                                    className="w-full"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="descripcion">Descripción General</Label>
                                        <Textarea
                                            id="descripcion"
                                            placeholder="Observaciones generales de la remisión..."
                                            value={descripcionGeneral}
                                            onChange={(e) => setDescripcionGeneral(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Selección de Productos */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="w-5 h-5" />
                                        Productos Disponibles
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                placeholder="Buscar productos por nombre, marca, modelo..."
                                                value={busquedaProducto}
                                                onChange={(e) => setBusquedaProducto(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>

                                        <div className="max-h-60 overflow-y-auto space-y-2">
                                            {componentesFiltrados.map((componente) => (
                                                <div
                                                    key={`${componente.origen}-${componente.id}`}
                                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                                    onClick={() => agregarProducto(componente)}
                                                >
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm">{componente.nombre}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {componente.marca} {componente.modelo}
                                                            {componente.numeroSerie && ` • S/N: ${componente.numeroSerie}`}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-xs">
                                                                Stock: {componente.cantidadDisponible}
                                                            </Badge>
                                                            <Badge 
                                                                variant={componente.origen === 'inventario' ? 'default' : 'secondary'} 
                                                                className="text-xs"
                                                            >
                                                                {componente.origenLabel}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <Plus className="w-4 h-4 text-blue-600" />
                                                </div>
                                            ))}

                                            {busquedaProducto && componentesFiltrados.length === 0 && (
                                                <div className="text-center py-8 text-gray-500">
                                                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                    <p>No se encontraron productos</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Productos Seleccionados */}
                        {productosSeleccionados.length > 0 && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShoppingCart className="w-5 h-5" />
                                        Productos en la Remisión ({productosSeleccionados.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {productosSeleccionados.map((producto) => (
                                            <div key={producto.id} className="border rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium">{producto.nombre}</h4>
                                                        <p className="text-sm text-gray-600">
                                                            {producto.marca} {producto.modelo}
                                                            {producto.numeroSerie && ` • S/N: ${producto.numeroSerie}`}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removerProducto(producto.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-xs">Cantidad</Label>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => actualizarCantidad(producto.id, producto.cantidadSolicitada - 1)}
                                                                disabled={producto.cantidadSolicitada <= 1}
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </Button>
                                                            <Input
                                                                type="number"
                                                                value={producto.cantidadSolicitada}
                                                                onChange={(e) => actualizarCantidad(producto.id, parseInt(e.target.value) || 1)}
                                                                className="w-20 text-center"
                                                                min={1}
                                                                max={producto.cantidadDisponible}
                                                            />
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => actualizarCantidad(producto.id, producto.cantidadSolicitada + 1)}
                                                                disabled={producto.cantidadSolicitada >= producto.cantidadDisponible}
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </Button>
                                                            <span className="text-xs text-gray-500 ml-2">
                                                                / {producto.cantidadDisponible} disponible
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <Label className="text-xs">Observaciones</Label>
                                                        <Input
                                                            placeholder="Observaciones específicas..."
                                                            value={producto.observaciones || ''}
                                                            onChange={(e) => actualizarObservaciones(producto.id, e.target.value)}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t bg-gray-50 p-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Técnico:</span> {tecnicoResponsable}
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={onClose}>
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={generarRemision}
                                    disabled={loading || !clienteSeleccionado || productosSeleccionados.length === 0}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {loading 
                                        ? (remisionParaEditar ? 'Actualizando...' : 'Generando...') 
                                        : (remisionParaEditar ? 'Actualizar Remisión' : 'Generar Remisión')
                                    }
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}