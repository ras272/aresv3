'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';
import { 
  Zap, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  Plus,
  Bot,
  Activity,
  TrendingUp,
  Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CartucheroIA } from '@/components/cartuchos/CartucheroIA';

interface CartuchoHIFU {
  id: string;
  numeroSerie: string;
  marca: string;
  modeloEquipo: 'Ultraformer MPT' | 'Ultraformer III';
  profundidad: '1.5mm' | '3.0mm' | '4.5mm' | '6.0mm' | '9.0mm' | '13.0mm';
  shotsTotales: number;
  shotsUtilizados: number;
  estado: 'Disponible' | 'En Uso' | 'Con Error' | 'Standby' | 'Agotado' | 'Vencido';
  clienteActual?: string;
  equipoAsignadoId?: string;
  fechaUltimoUso?: string;
  observacionesError?: string;
  fechaIngreso: string;
  codigoCargaOrigen?: string;
  createdAt: string;
}

export default function CartuchosPage() {
  const { componentesDisponibles, loadAllData } = useAppStore();
  const [cartuchos, setCartuchos] = useState<CartuchoHIFU[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroProfundidad, setFiltroProfundidad] = useState('todas');
  const [filtroModelo, setFiltroModelo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [showChatBot, setShowChatBot] = useState(false);

  useEffect(() => {
    loadAllData();
    cargarCartuchos();
  }, [loadAllData]);

  const cargarCartuchos = () => {
    // Filtrar solo cartuchos HIFU de los componentes disponibles
    const cartuchosHIFU = componentesDisponibles
      .filter(comp => 
        comp.nombre.toLowerCase().includes('cartucho') ||
        comp.tipoComponente.toLowerCase().includes('cartucho') ||
        comp.marca.toLowerCase() === 'classys'
      )
      .map(comp => ({
        id: comp.id,
        numeroSerie: comp.numeroSerie || 'SIN-SERIE',
        marca: comp.marca,
        modeloEquipo: comp.modelo.includes('MPT') ? 'Ultraformer MPT' as const : 'Ultraformer III' as const,
        profundidad: extraerProfundidad(comp.nombre) as any,
        shotsTotales: 10000, // Valor por defecto
        shotsUtilizados: Math.floor(Math.random() * 3000), // Simulado por ahora
        estado: determinarEstado(comp) as any,
        clienteActual: comp.equipoPadre?.cliente,
        equipoAsignadoId: comp.equipoPadre?.equipoId,
        fechaUltimoUso: comp.createdAt,
        observacionesError: comp.observaciones,
        fechaIngreso: comp.fechaIngreso,
        codigoCargaOrigen: comp.codigoCargaOrigen,
        createdAt: comp.createdAt
      }));

    setCartuchos(cartuchosHIFU);
  };

  const extraerProfundidad = (nombre: string): string => {
    const profundidades = ['1.5mm', '3.0mm', '4.5mm', '6.0mm', '9.0mm', '13.0mm'];
    const encontrada = profundidades.find(p => nombre.includes(p));
    return encontrada || '4.5mm'; // Por defecto
  };

  const determinarEstado = (comp: any): string => {
    if (comp.cantidadDisponible === 0) return 'Agotado';
    if (comp.estado === 'En reparación') return 'Con Error';
    if (comp.equipoPadre) return 'En Uso';
    return 'Disponible';
  };

  const filtrarCartuchos = () => {
    return cartuchos.filter(cartucho => {
      const matchEstado = filtroEstado === 'todos' || cartucho.estado === filtroEstado;
      const matchProfundidad = filtroProfundidad === 'todas' || cartucho.profundidad === filtroProfundidad;
      const matchModelo = filtroModelo === 'todos' || cartucho.modeloEquipo === filtroModelo;
      const matchBusqueda = busqueda === '' || 
        cartucho.numeroSerie.toLowerCase().includes(busqueda.toLowerCase()) ||
        cartucho.clienteActual?.toLowerCase().includes(busqueda.toLowerCase());
      
      return matchEstado && matchProfundidad && matchModelo && matchBusqueda;
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Disponible': return 'bg-green-100 text-green-700';
      case 'En Uso': return 'bg-blue-100 text-blue-700';
      case 'Con Error': return 'bg-red-100 text-red-700';
      case 'Standby': return 'bg-yellow-100 text-yellow-700';
      case 'Agotado': return 'bg-gray-100 text-gray-700';
      case 'Vencido': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Disponible': return CheckCircle;
      case 'En Uso': return Activity;
      case 'Con Error': return XCircle;
      case 'Standby': return Clock;
      case 'Agotado': return AlertTriangle;
      case 'Vencido': return XCircle;
      default: return Package;
    }
  };

  const calcularPorcentajeUso = (cartucho: CartuchoHIFU) => {
    return Math.round((cartucho.shotsUtilizados / cartucho.shotsTotales) * 100);
  };

  const estadisticas = {
    total: cartuchos.length,
    disponibles: cartuchos.filter(c => c.estado === 'Disponible').length,
    enUso: cartuchos.filter(c => c.estado === 'En Uso').length,
    conError: cartuchos.filter(c => c.estado === 'Con Error').length,
    standby: cartuchos.filter(c => c.estado === 'Standby').length,
    agotados: cartuchos.filter(c => c.estado === 'Agotado').length,
  };

  return (
    <DashboardLayout 
      title="Cartuchero HIFU" 
      subtitle="Control total de cartuchos Classys para Ultraformer MPT y III"
    >
      <div className="space-y-6">
        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.disponibles}</p>
                  <p className="text-xs text-gray-500">Disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.enUso}</p>
                  <p className="text-xs text-gray-500">En Uso</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.conError}</p>
                  <p className="text-xs text-gray-500">Con Error</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.standby}</p>
                  <p className="text-xs text-gray-500">Standby</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.agotados}</p>
                  <p className="text-xs text-gray-500">Agotados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y Búsqueda */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filtros y Búsqueda</span>
              </CardTitle>
              <Button
                onClick={() => setShowChatBot(!showChatBot)}
                className="flex items-center space-x-2"
                variant="outline"
              >
                <Bot className="h-4 w-4" />
                <span>IA Cartuchero</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por serie o cliente..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="Disponible">Disponible</SelectItem>
                  <SelectItem value="En Uso">En Uso</SelectItem>
                  <SelectItem value="Con Error">Con Error</SelectItem>
                  <SelectItem value="Standby">Standby</SelectItem>
                  <SelectItem value="Agotado">Agotado</SelectItem>
                  <SelectItem value="Vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroProfundidad} onValueChange={setFiltroProfundidad}>
                <SelectTrigger>
                  <SelectValue placeholder="Profundidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las profundidades</SelectItem>
                  <SelectItem value="1.5mm">1.5mm</SelectItem>
                  <SelectItem value="3.0mm">3.0mm</SelectItem>
                  <SelectItem value="4.5mm">4.5mm</SelectItem>
                  <SelectItem value="6.0mm">6.0mm</SelectItem>
                  <SelectItem value="9.0mm">9.0mm</SelectItem>
                  <SelectItem value="13.0mm">13.0mm</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroModelo} onValueChange={setFiltroModelo}>
                <SelectTrigger>
                  <SelectValue placeholder="Modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los modelos</SelectItem>
                  <SelectItem value="Ultraformer MPT">Ultraformer MPT</SelectItem>
                  <SelectItem value="Ultraformer III">Ultraformer III</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={cargarCartuchos} variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Cartuchos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrarCartuchos().map((cartucho, index) => {
            const IconoEstado = getEstadoIcon(cartucho.estado);
            const porcentajeUso = calcularPorcentajeUso(cartucho);
            
            return (
              <motion.div
                key={cartucho.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-purple-500" />
                        <span className="font-semibold">{cartucho.profundidad}</span>
                      </div>
                      <Badge className={getEstadoColor(cartucho.estado)}>
                        <IconoEstado className="h-3 w-3 mr-1" />
                        {cartucho.estado}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-mono text-gray-600">{cartucho.numeroSerie}</p>
                      <p className="text-xs text-gray-500">{cartucho.modeloEquipo}</p>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Barra de progreso de shots */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Shots utilizados</span>
                        <span>{porcentajeUso}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            porcentajeUso > 80 ? 'bg-red-500' : 
                            porcentajeUso > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${porcentajeUso}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {cartucho.shotsUtilizados.toLocaleString()} / {cartucho.shotsTotales.toLocaleString()} shots
                      </p>
                    </div>

                    {/* Información adicional */}
                    {cartucho.clienteActual && (
                      <div>
                        <p className="text-xs text-gray-500">Cliente actual:</p>
                        <p className="text-sm font-medium">{cartucho.clienteActual}</p>
                      </div>
                    )}

                    {cartucho.observacionesError && (
                      <div>
                        <p className="text-xs text-red-500">Error reportado:</p>
                        <p className="text-sm text-red-600">{cartucho.observacionesError}</p>
                      </div>
                    )}

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Ingreso: {new Date(cartucho.fechaIngreso).toLocaleDateString()}</span>
                      {cartucho.codigoCargaOrigen && (
                        <span>{cartucho.codigoCargaOrigen}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filtrarCartuchos().length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron cartuchos con los filtros aplicados</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* IA Cartuchero */}
      <CartucheroIA 
        isOpen={showChatBot} 
        onClose={() => setShowChatBot(false)} 
      />
    </DashboardLayout>
  );
}